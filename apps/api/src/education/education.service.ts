import { BadRequestException, Injectable, NotFoundException, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateEducationDto } from './dto/create-education.dto';
import { UpdateEducationDto } from './dto/update-education.dto';
import { EducationInstitution } from './entities/education-institution.entity';
import { EducationType } from './enums/education-type.enum';
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
export class EducationService {
	constructor(
		@InjectRepository(EducationInstitution)
		private readonly educationRepo: Repository<EducationInstitution>,
		@Inject(CACHE_MANAGER)
		private readonly cacheManager: Cache,
	) {}

	private readonly EDUCATION_CACHE_KEYS = [
		'education_all',
		'education_type_higher',
		'education_type_secondary',
		'education_type_professional_development',
	];

	private getCacheKey(type?: EducationType) {
		if (!type) return 'education_all';
		return `education_type_${type}`;
	}

	private async invalidateCache() {
		for (const key of this.EDUCATION_CACHE_KEYS) {
			await this.cacheManager.del(key);
		}
	}

	async create(dto: CreateEducationDto, file?: UploadFile, fileUploadService?: FileUploadService) {
		let imageUrl: string | undefined = dto.imageUrl;
		if (file && fileUploadService) {
			imageUrl = await fileUploadService.upload(file, 'image', 'education/images');
		}

		if (!imageUrl) {
			throw new BadRequestException('Логотип обязателен: загрузите файл или укажите URL изображения');
		}

		const { imageUrl: _ignored, ...rest } = dto as any;
		const institution = this.educationRepo.create({
			...rest,
			imageUrl,
		});
		const saved = await this.educationRepo.save(institution);
		await this.invalidateCache();
		return saved;
	}

	async findAll(type?: EducationType) {
		const cacheKey = this.getCacheKey(type);
		const cached = await this.cacheManager.get<EducationInstitution[]>(cacheKey);
		if (cached && Array.isArray(cached)) {
			return cached;
		}

		const where = type ? { type } : {};
		const list = await this.educationRepo.find({ where, order: { createdAt: 'DESC' } });
		await this.cacheManager.set(cacheKey, list);
		return list;
	}

	async findOne(id: number) {
		const institution = await this.educationRepo.findOne({ where: { id } });
		if (!institution) {
			throw new NotFoundException({
				statusCode: 404,
				message: `Education institution with ID ${id} not found`,
				error: 'Not Found',
			});
		}
		return institution;
	}

	async update(id: number, dto: UpdateEducationDto, file?: UploadFile, fileUploadService?: FileUploadService) {
		const institution = await this.findOne(id);

		if (file && fileUploadService) {
			institution.imageUrl = await fileUploadService.upload(file, 'image', 'education/images');
		} else if (dto.imageUrl !== undefined) {
			// Если передали imageUrl (включая пустую строку), обновляем поле. Пустое значение очищает логотип.
			institution.imageUrl = dto.imageUrl || undefined;
		}

		const { imageUrl: _ignored, ...rest } = dto as any;
		Object.assign(institution, rest);
		const saved = await this.educationRepo.save(institution);
		await this.invalidateCache();
		return saved;
	}

	async remove(id: number) {
		await this.findOne(id);
		await this.educationRepo.delete(id);
		await this.invalidateCache();
		return { deleted: true };
	}
}

