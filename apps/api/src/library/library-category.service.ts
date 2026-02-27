import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LibraryCategory } from './entities/library-category.entity';
import { CreateLibraryCategoryDto } from './dto/create-library-category.dto';
import { UpdateLibraryCategoryDto } from './dto/update-library-category.dto';

@Injectable()
export class LibraryCategoryService {
	constructor(@InjectRepository(LibraryCategory) private repo: Repository<LibraryCategory>) {}

	async create(dto: CreateLibraryCategoryDto): Promise<LibraryCategory> {
		const existing = await this.repo.findOne({ where: { name: dto.name } });
		if (existing) {
			throw new ConflictException(`Категория с именем "${dto.name}" уже существует`);
		}

		const category = this.repo.create(dto);
		return this.repo.save(category);
	}

	findAll(): Promise<LibraryCategory[]> {
		return this.repo.find({ order: { createdAt: 'ASC' } });
	}

	async findOne(id: number): Promise<LibraryCategory> {
		const category = await this.repo.findOne({ where: { id } });
		if (!category) {
			throw new NotFoundException(`Категория с ID ${id} не найдена`);
		}
		return category;
	}

	async update(id: number, dto: UpdateLibraryCategoryDto): Promise<LibraryCategory> {
		const category = await this.findOne(id);

		if (dto.name && dto.name !== category.name) {
			const existing = await this.repo.findOne({ where: { name: dto.name } });
			if (existing) {
				throw new ConflictException(`Категория с именем "${dto.name}" уже существует`);
			}
		}

		Object.assign(category, dto);
		return this.repo.save(category);
	}

	async remove(id: number): Promise<void> {
		const category = await this.findOne(id);
		await this.repo.remove(category);
	}
}

