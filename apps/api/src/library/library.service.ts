import { Inject, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LibraryItem } from './entities/library-item.entity';
import { CreateLibraryItemDto } from './dto/create-library-item.dto';
import { UpdateLibraryItemDto } from './dto/update-library-item.dto';
import { LibraryItemType } from './enums/library-item-type.enum';
import { FileUploadService } from '../file-upload/file-upload.service';
import { LibraryCategoryService } from './library-category.service';
import { Page } from '../page/entities/page.entity';
import { Block } from '../page/entities/block.entity';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

interface UploadFile {
	buffer: Buffer;
	originalname: string;
	mimetype: string;
	size: number;
}

@Injectable()
export class LibraryService {
	constructor(
		@InjectRepository(LibraryItem) private repo: Repository<LibraryItem>,
		@InjectRepository(Page) private pageRepo: Repository<Page>,
		@InjectRepository(Block) private blockRepo: Repository<Block>,
		private categorySvc: LibraryCategoryService,
		@Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
	) { }

	private readonly LIBRARY_CACHE_PREFIX = 'library_list_';
	private readonly LIBRARY_ADMIN_CACHE_PREFIX = 'library_admin_list_';
	private readonly LIBRARY_BY_CATEGORY_PREFIX = 'library_by_category_';
	private readonly libraryCacheKeys = new Set<string>();

	private getLibraryCacheKey(type?: LibraryItemType, categoryName?: string, limit?: number) {
		const typePart = type ?? 'any';
		const categoryPart = categoryName ?? 'any';
		const limitPart = limit ?? 'any';
		return `${this.LIBRARY_CACHE_PREFIX}t:${typePart}_c:${categoryPart}_l:${limitPart}`;
	}

	private getLibraryAdminCacheKey(type?: LibraryItemType, categoryName?: string, limit?: number) {
		const typePart = type ?? 'any';
		const categoryPart = categoryName ?? 'any';
		const limitPart = limit ?? 'any';
		return `${this.LIBRARY_ADMIN_CACHE_PREFIX}t:${typePart}_c:${categoryPart}_l:${limitPart}`;
	}

	private getByCategoryCacheKey(limit?: number, type?: LibraryItemType) {
		const limitPart = limit ?? 'any';
		const typePart = type ?? 'any';
		return `${this.LIBRARY_BY_CATEGORY_PREFIX}l:${limitPart}_t:${typePart}`;
	}

	private async invalidateCache() {
		for (const key of this.libraryCacheKeys) {
			await this.cacheManager.del(key);
		}
		this.libraryCacheKeys.clear();
	}

	async create(
		dto: CreateLibraryItemDto,
		files?: {
			previewImage?: UploadFile[];
			pdfFile?: UploadFile[];
		},
		fileUploadService?: FileUploadService,
	) {
		const itemData: any = {
			type: dto.type,
			title: dto.title,
			description: dto.description,
			isPublished: dto.isPublished,
		};

		if (dto.categoryId) {
			await this.categorySvc.findOne(dto.categoryId);
			itemData.categoryId = dto.categoryId;
		} else if (dto.createNewCategory) {
			const category = await this.categorySvc.create({ name: dto.createNewCategory });
			itemData.categoryId = category.id;
		}

		// Превью изображение необязательно для статей, но обязательно для книг
		if (dto.type === LibraryItemType.BOOK && !files?.previewImage?.[0]) {
			throw new BadRequestException('Превью изображение обязательно для книг');
		}

		if (files?.previewImage?.[0] && fileUploadService) {
			itemData.previewImage = await fileUploadService.upload(files.previewImage[0], 'image', 'library/images');
		}


		if (dto.type === LibraryItemType.BOOK) {
			if (files?.pdfFile?.[0]) {
				if (fileUploadService) {
					itemData.contentUrl = await fileUploadService.upload(files.pdfFile[0], 'pdf', 'library/pdfs');
				}
			} else if (dto.contentUrl) {
				itemData.contentUrl = dto.contentUrl;
			} else {
				throw new BadRequestException('Для книг необходимо загрузить PDF файл или указать ссылку на контент');
			}
		}

		if (dto.type === LibraryItemType.ARTICLE) {
			let slug = dto.slug ? dto.slug : `library-article-${Date.now()}`;
			if (!slug.startsWith('library/')) {
				slug = `library/${slug}`;
			}

			let blocks: Block[] = [];
			if (Array.isArray(dto.blocks)) {
				blocks = dto.blocks.map((b: any, idx: number) => {
					const block = new Block();
					block.type = b.type;
					block.content = b.content;
					block.order = typeof b.order === 'number' ? b.order : idx;
					block.parentBlock = null;
					return block;
				});
			}

			let isDraft: boolean = false;
			if (typeof dto.isDraft === 'string') {
				isDraft = dto.isDraft.toLowerCase() === 'true' || dto.isDraft === '1';
			} else if (typeof dto.isDraft === 'boolean') {
				isDraft = dto.isDraft;
			}

			const page = this.pageRepo.create({
				title: dto.title || 'Новая статья',
				slug,
				isDraft,
				publishedAt: dto.publishedAt ? new Date(dto.publishedAt) : null,
				blocks,
			});

			await this.pageRepo.save(page);
			itemData.page = page;
		}

		const item = this.repo.create(itemData);
		const saved = await this.repo.save(item);
		await this.invalidateCache();
		return saved;
	}

	async findAll(type?: LibraryItemType, categoryName?: string, limit?: number) {
		const useCache = false;
		const cacheKey = this.getLibraryCacheKey(type, categoryName, limit);
		if (useCache) {
			const cached = await this.cacheManager.get<LibraryItem[]>(cacheKey);
			if (cached && Array.isArray(cached)) {
				return cached;
			}
		}

		const query = this.repo
			.createQueryBuilder('item')
			.leftJoinAndSelect('item.category', 'category')
			.leftJoinAndSelect('item.page', 'page')
			.leftJoinAndSelect('page.blocks', 'blocks')
			.leftJoinAndSelect('blocks.children', 'children')
			.where('item.isPublished = :isPublished', { isPublished: true });

		if (type) {
			query.andWhere('item.type = :type', { type });
		}

		if (categoryName) {
			query.andWhere('category.name = :categoryName', { categoryName });

			if (limit) {
				query.limit(limit);
			}
		}

		query.orderBy('item.createdAt', 'DESC').addOrderBy('item.id', 'DESC');

		const list = await query.getMany();
		if (useCache) {
			await this.cacheManager.set(cacheKey, list);
			this.libraryCacheKeys.add(cacheKey);
		}
		return list;
	}

	async findAllForAdmin(type?: LibraryItemType, categoryName?: string, limit?: number) {
		const useCache = false;
		const cacheKey = this.getLibraryAdminCacheKey(type, categoryName, limit);
		if (useCache) {
			const cached = await this.cacheManager.get<LibraryItem[]>(cacheKey);
			if (cached && Array.isArray(cached)) {
				return cached;
			}
		}

		const query = this.repo
			.createQueryBuilder('item')
			.leftJoinAndSelect('item.category', 'category')
			.leftJoinAndSelect('item.page', 'page')
			.leftJoinAndSelect('page.blocks', 'blocks')
			.leftJoinAndSelect('blocks.children', 'children');

		if (type) {
			query.andWhere('item.type = :type', { type });
		}

		if (categoryName) {
			query.andWhere('category.name = :categoryName', { categoryName });

			if (limit) {
				query.limit(limit);
			}
		}

		query.orderBy('item.createdAt', 'DESC').addOrderBy('item.id', 'DESC');

		const list = await query.getMany();
		if (useCache) {
			await this.cacheManager.set(cacheKey, list);
			this.libraryCacheKeys.add(cacheKey);
		}
		return list;
	}

	async findOne(id: number) {
		const itemLibrary = await this.repo.findOne({
			where: { id, isPublished: true },
			relations: ['category', 'page', 'page.blocks', 'page.blocks.children'],
		});
		if (!itemLibrary) {
			throw new NotFoundException({
				statusCode: 404,
				message: `Library item with ID ${id} not found`,
				error: 'Not Found',
			});
		}
		return itemLibrary;
	}

	async findByCategories(limit: number = 6, type?: LibraryItemType) {
		const cacheKey = this.getByCategoryCacheKey(limit, type);
		const cached = await this.cacheManager.get<any[]>(cacheKey);
		if (cached && Array.isArray(cached)) {
			return cached;
		}

		const categories = await this.categorySvc.findAll();

		const result = await Promise.all(
			categories.map(async (category) => {
				const itemsQuery = this.repo
					.createQueryBuilder('item')
					.where('item.isPublished = :isPublished', { isPublished: true })
					.andWhere('item.categoryId = :categoryId', { categoryId: category.id })
					.orderBy('item.createdAt', 'DESC')
					.limit(limit);

				if (type) {
					itemsQuery.andWhere('item.type = :type', { type });
				}

				const items = await itemsQuery.getMany();

				return {
					category: category.name,
					categoryId: category.id,
					items,
					totalCount: items.length,
				};
			}),
		);

		const filtered = result.filter((r) => r.totalCount > 0);
		await this.cacheManager.set(cacheKey, filtered);
		this.libraryCacheKeys.add(cacheKey);
		return filtered;
	}

	async update(
		id: number,
		dto: UpdateLibraryItemDto,
		files?: {
			previewImage?: UploadFile[];
			pdfFile?: UploadFile[];
		},
		fileUploadService?: FileUploadService,
	) {
		const item = await this.repo.findOne({ where: { id }, relations: ['page'] });
		if (!item) {
			throw new NotFoundException(`Library item with ID ${id} not found`);
		}

		const updateData: any = {};

		if (dto.type !== undefined) updateData.type = dto.type;
		if (dto.title !== undefined) updateData.title = dto.title;
		if (dto.description !== undefined) updateData.description = dto.description;
		if (dto.isPublished !== undefined) updateData.isPublished = dto.isPublished;

		if (dto.categoryId) {
			await this.categorySvc.findOne(dto.categoryId);
			updateData.categoryId = dto.categoryId;
		} else if (dto.createNewCategory) {
			const category = await this.categorySvc.create({ name: dto.createNewCategory });
			updateData.categoryId = category.id;
		}

		if (files?.previewImage?.[0] && fileUploadService) {
			if (item.previewImage) {
				fileUploadService.delete(item.previewImage);
			}
			updateData.previewImage = await fileUploadService.upload(files.previewImage[0], 'image', 'library/images');
		}

		if (files?.pdfFile?.[0] && fileUploadService) {
			updateData.contentUrl = await fileUploadService.upload(files.pdfFile[0], 'pdf', 'library/pdfs');
		} else if (dto.contentUrl !== undefined) {
			updateData.contentUrl = dto.contentUrl;
		}

		if (item.type === LibraryItemType.ARTICLE && item.page) {
			let pageModified = false;

			if (dto.title !== undefined) {
				item.page.title = dto.title;
				pageModified = true;
			}

			if (dto.slug !== undefined) {
				item.page.slug = dto.slug.startsWith('library/') ? dto.slug : `library/${dto.slug}`;
				pageModified = true;
			}

			if (dto.publishedAt !== undefined) {
				item.page.publishedAt = dto.publishedAt ? new Date(dto.publishedAt) : null;
				pageModified = true;
			}

			if (dto.isDraft !== undefined) {
				let isDraftValue: boolean = false;
				if (typeof dto.isDraft === 'string') {
					isDraftValue = dto.isDraft.toLowerCase() === 'true' || dto.isDraft === '1';
				} else if (typeof dto.isDraft === 'boolean') {
					isDraftValue = dto.isDraft;
				}
				if (item.page.isDraft !== isDraftValue) {
					item.page.isDraft = isDraftValue;
					pageModified = true;
				}
			}

			if (pageModified) {
				await this.pageRepo.save(item.page);
			}

			if (dto.blocks) {
				let blocksArr: any[] = [];
				if (typeof dto.blocks === 'string') {
					try {
						blocksArr = JSON.parse(dto.blocks);
					} catch {
						blocksArr = [];
					}
				} else if (Array.isArray(dto.blocks)) {
					blocksArr = dto.blocks;
				}

				await this.blockRepo.delete({ page: { id: item.page.id } });

				if (blocksArr.length > 0) {
					const blocks = blocksArr.map((b: any, idx: number) => {
						const block = new Block();
						block.type = b.type;
						block.content = b.content;
						block.order = typeof b.order === 'number' ? b.order : idx;
						block.parentBlock = null;
						block.page = item.page!;
						return block;
					});

					await this.blockRepo.save(blocks);
				}
			}
		}

		Object.assign(item, updateData);
		const saved = await this.repo.save(item);
		await this.invalidateCache();
		return saved;
	}

	async remove(id: number, fileUploadService?: FileUploadService) {
		const item = await this.repo.findOne({ where: { id } });
		if (!item) {
			throw new NotFoundException(`Library item with ID ${id} not found`);
		}

		if (fileUploadService) {
			if (item.contentUrl && item.contentUrl.startsWith('/uploads/')) {
				fileUploadService.delete(item.contentUrl);
			}
			if (item.previewImage) {
				fileUploadService.delete(item.previewImage);
			}
		}

		await this.repo.remove(item);
		await this.invalidateCache();
	}
}

