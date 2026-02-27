import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HomeSlide } from './entities/home-slide.entity';
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
export class HomeSliderService {
	constructor(
		@InjectRepository(HomeSlide)
		private readonly slideRepo: Repository<HomeSlide>,
		@Inject(CACHE_MANAGER)
		private readonly cacheManager: Cache,
	) {}

	private readonly SLIDES_CACHE_KEY = 'home_slides_all';

	private async invalidateCache() {
		await this.cacheManager.del(this.SLIDES_CACHE_KEY);
	}

	async createFromFile(file: UploadFile, fileUploadService: FileUploadService) {
		if (!file) {
			throw new BadRequestException('Изображение обязательно для загрузки');
		}

		if (!fileUploadService) {
			throw new BadRequestException('FileUploadService is required');
		}

		const imageUrl = await fileUploadService.upload(file, 'image', 'home-slider');

		const slide = this.slideRepo.create({ imageUrl });
		const saved = await this.slideRepo.save(slide);
		await this.invalidateCache();
		return saved;
	}

	async createFromUrl(imageUrl?: string) {
		if (!imageUrl || !imageUrl.trim()) {
			throw new BadRequestException('Ссылка на изображение обязательна');
		}

		const slide = this.slideRepo.create({ imageUrl: imageUrl.trim() });
		const saved = await this.slideRepo.save(slide);
		await this.invalidateCache();
		return saved;
	}

	async findAll() {
		const cached = await this.cacheManager.get<HomeSlide[]>(this.SLIDES_CACHE_KEY);
		if (cached && Array.isArray(cached)) {
			return cached;
		}

		const slides = await this.slideRepo.find({ order: { createdAt: 'DESC' } });
		await this.cacheManager.set(this.SLIDES_CACHE_KEY, slides);
		return slides;
	}

	async remove(id: number) {
		const slide = await this.slideRepo.findOne({ where: { id } });
		if (!slide) {
			throw new NotFoundException(`Slide with ID ${id} not found`);
		}
		await this.slideRepo.delete(id);
		await this.invalidateCache();
		return { deleted: true };
	}
}

