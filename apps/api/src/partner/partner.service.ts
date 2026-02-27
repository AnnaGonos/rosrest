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
		});

		const saved = await this.partnerRepo.save(partner);
		this.invalidateCache();
		return saved;
	}

	async findAll(limit?: number) {
		const cached = await this.cacheManager.get<Partner[]>(this.PARTNERS_CACHE_KEY);
		if (cached && Array.isArray(cached)) {
			return limit ? cached.slice(0, limit) : cached;
		}

		const query = this.partnerRepo
			.createQueryBuilder('partner')
			.orderBy('partner.createdAt', 'ASC');

		const list = await query.getMany();
		await this.cacheManager.set(this.PARTNERS_CACHE_KEY, list);
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
		this.invalidateCache();
		return saved;
	}

	async remove(id: string) {
		const partner = await this.findOne(id);
		await this.partnerRepo.remove(partner);
		this.invalidateCache();
		return { deleted: true };
	}
}

