import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateAwardDto } from './dto/create-award.dto';
import { UpdateAwardDto } from './dto/update-award.dto';
import { Award } from './entities/award.entity';
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
export class AwardService {
	constructor(
		@InjectRepository(Award)
		private readonly awardRepo: Repository<Award>,
		@Inject(CACHE_MANAGER)
		private readonly cacheManager: Cache,
	) {}

	private readonly AWARDS_CACHE_KEY = 'awards_all';

	private async invalidateCache() {
		await this.cacheManager.del(this.AWARDS_CACHE_KEY);
	}

	async create(dto: CreateAwardDto, file?: UploadFile, fileUploadService?: FileUploadService) {
		if (!file && !dto.imageUrl) {
			throw new BadRequestException('Нужно загрузить изображение награды или указать ссылку на изображение');
		}

		let imageUrl = '';
		if (file && fileUploadService) {
			imageUrl = await fileUploadService.upload(file, 'image', 'awards/images');
		} else if (dto.imageUrl) {
			imageUrl = dto.imageUrl;
		}

		const award = this.awardRepo.create({
			imageUrl,
			caption: dto.caption,
		});

		const saved = await this.awardRepo.save(award);
		await this.invalidateCache();
		return saved;
	}

	async findAll() {
		const cached = await this.cacheManager.get<Award[]>(this.AWARDS_CACHE_KEY);
		if (cached && Array.isArray(cached)) {
			return cached;
		}

		const list = await this.awardRepo.find({ order: { createdAt: 'DESC' } });
		await this.cacheManager.set(this.AWARDS_CACHE_KEY, list);
		return list;
	}

	async findOne(id: string) {
		const award = await this.awardRepo.findOne({ where: { id } });
		if (!award) {
			throw new NotFoundException({
				statusCode: 404,
				message: `Award with ID ${id} not found`,
				error: 'Not Found',
			});
		}
		return award;
	}

	async update(id: string, dto: UpdateAwardDto) {
		const award = await this.findOne(id);
		Object.assign(award, dto);
		const saved = await this.awardRepo.save(award);
		await this.invalidateCache();
		return saved;
	}

	async remove(id: string) {
		await this.findOne(id);
		await this.awardRepo.delete(id);
		await this.invalidateCache();
		return { deleted: true };
	}
}

