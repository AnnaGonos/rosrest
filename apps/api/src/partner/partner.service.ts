import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreatePartnerDto } from './dto/create-partner.dto';
import { UpdatePartnerDto } from './dto/update-partner.dto';
import { Partner } from './entities/partner.entity';
import { FileUploadService } from '../file-upload/file-upload.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

interface UploadFile {
	buffer: Buffer;
	originalname: string;
	mimetype: string;
	size: number;
}

@Injectable()
export class PartnerService {
	constructor(
		@InjectRepository(Partner)
		private readonly partnerRepo: Repository<Partner>,
		@Inject(CACHE_MANAGER)
		private readonly cacheManager: Cache,
	) { }

	private readonly PARTNERS_CACHE_KEY = 'partners_all';

	private async invalidateCache() {
		await this.cacheManager.del(this.PARTNERS_CACHE_KEY);
	}

	private async getNextOrderIndex(): Promise<number> {
		const row = await this.partnerRepo
			.createQueryBuilder('partner')
			.select('COALESCE(MAX(partner.orderIndex), -1)', 'maxOrder')
			.getRawOne<{ maxOrder: string }>()

		const maxOrder = row?.maxOrder !== undefined ? Number(row.maxOrder) : -1
		return Number.isFinite(maxOrder) ? maxOrder + 1 : 0
	}

	private async normalizeInitialOrderIndexes(partners: Partner[]): Promise<Partner[]> {
		if (!partners.length) return partners

		const orderIndexes = partners.map((partner) => {
			const value = Number(partner.orderIndex)
			return Number.isFinite(value) ? value : -1
		})
		const uniqueOrderIndexes = new Set(orderIndexes)
		const needsNormalization =
			uniqueOrderIndexes.size !== partners.length ||
			orderIndexes.some((value) => value < 0) ||
			Math.max(...orderIndexes) !== partners.length - 1

		if (!needsNormalization) {
			return partners
		}

		const normalized = [...partners].sort((a, b) => {
			const dateA = new Date(a.createdAt).getTime()
			const dateB = new Date(b.createdAt).getTime()
			return dateA - dateB
		})

		for (let index = 0; index < normalized.length; index += 1) {
			normalized[index].orderIndex = index
			await this.partnerRepo.update(normalized[index].id, { orderIndex: index })
		}

		await this.invalidateCache()
		return normalized
	}

	private async movePartnerOrder(id: string, direction: 'up' | 'down') {
		let partners = await this.partnerRepo
			.createQueryBuilder('partner')
			.orderBy('partner.orderIndex', 'ASC')
			.addOrderBy('partner.createdAt', 'ASC')
			.addOrderBy('partner.id', 'ASC')
			.getMany()

		partners = await this.normalizeInitialOrderIndexes(partners)

		const currentIndex = partners.findIndex((partner) => partner.id === id)
		if (currentIndex === -1) {
			throw new NotFoundException(`Partner with ID ${id} not found`)
		}

		const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
		if (targetIndex < 0 || targetIndex >= partners.length) {
			return partners[currentIndex]
		}

		const currentPartner = partners[currentIndex]
		const targetPartner = partners[targetIndex]
		const currentOrderIndex = currentPartner.orderIndex
		const targetOrderIndex = targetPartner.orderIndex

		await this.partnerRepo.manager.transaction(async (manager) => {
			await manager.getRepository(Partner).update(currentPartner.id, { orderIndex: targetOrderIndex })
			await manager.getRepository(Partner).update(targetPartner.id, { orderIndex: currentOrderIndex })
		})

		currentPartner.orderIndex = targetOrderIndex
		await this.invalidateCache()
		return currentPartner
	}

	async create(dto: CreatePartnerDto, file?: UploadFile, fileUploadService?: FileUploadService) {
		if (!file && !dto.imageUrl) {
			throw new BadRequestException('Нужно загрузить логотип партнёра или указать ссылку на изображение');
		}

		let imageUrl = '';
		if (file && fileUploadService) {
			imageUrl = await fileUploadService.upload(file, 'image', 'partners/images');
		} else if (dto.imageUrl) {
			imageUrl = dto.imageUrl;
		}

		const partner = this.partnerRepo.create({
			name: dto.name,
			imageUrl,
			link: dto.link,
			orderIndex: await this.getNextOrderIndex(),
		});

		const saved = await this.partnerRepo.save(partner);
		await this.invalidateCache();
		return saved;
	}

	async findAll(limit?: number, useCache = true) {
		const cached = await this.cacheManager.get<Partner[]>(this.PARTNERS_CACHE_KEY);
		if (useCache && cached && Array.isArray(cached)) {
			return limit ? cached.slice(0, limit) : cached;
		}

		const query = this.partnerRepo
			.createQueryBuilder('partner')
			.orderBy('partner.orderIndex', 'ASC')
			.addOrderBy('partner.createdAt', 'ASC')
			.addOrderBy('partner.id', 'ASC');

		let list = await query.getMany();
		list = await this.normalizeInitialOrderIndexes(list)

		if (useCache) {
			await this.cacheManager.set(this.PARTNERS_CACHE_KEY, list);
		}
		return limit ? list.slice(0, limit) : list;
	}

	async findOne(id: string) {
		const partner = await this.partnerRepo.findOne({ where: { id } });
		if (!partner) {
			throw new NotFoundException({
				message: `Partner with ID ${id} not found`,
				detail: `Partner with ID ${id} not found`,
			});
		}
		return partner;
	}

	async update(id: string, dto: UpdatePartnerDto, file?: UploadFile, fileUploadService?: FileUploadService) {
		const partner = await this.findOne(id);

		if (file && fileUploadService) {
			const imageUrl = await fileUploadService.upload(file, 'image', 'partners/images');
			partner.imageUrl = imageUrl;
		} else if (dto.imageUrl !== undefined) {
			partner.imageUrl = dto.imageUrl;
		}

		if (dto.name !== undefined) partner.name = dto.name;
		if (dto.link !== undefined) partner.link = dto.link;

		const saved = await this.partnerRepo.save(partner);
		await this.invalidateCache();
		return saved;
	}

	async remove(id: string) {
		const partner = await this.findOne(id);
		await this.partnerRepo.remove(partner);
		await this.invalidateCache();
		return { deleted: true };
	}

	async moveOrder(id: string, direction: 'up' | 'down') {
		if (direction !== 'up' && direction !== 'down') {
			throw new BadRequestException('Direction must be "up" or "down"')
		}

		return await this.movePartnerOrder(id, direction)
	}
}

