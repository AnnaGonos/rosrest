import { Inject, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, TreeRepository, IsNull, In } from 'typeorm';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { CreateDocumentCategoryDto } from './dto/create-document-category.dto';
import { UpdateDocumentCategoryDto } from './dto/update-document-category.dto';
import { Document } from './entities/document.entity';
import { DocumentType as DocumentTypeEnum } from './enums/document-type.enum';
import { DocumentCategory } from './entities/document-category.entity';
import { FileUploadService } from '../file-upload/file-upload.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

interface UploadFile {
	buffer: Buffer
	originalname: string
	mimetype: string
	size: number
}

@Injectable()
export class DocumentService {
	constructor(
		@InjectRepository(Document)
		private readonly documentRepo: Repository<Document>,
		@InjectRepository(DocumentCategory)
		private readonly categoryTreeRepo: TreeRepository<DocumentCategory>,
		@Inject(CACHE_MANAGER)
		private readonly cacheManager: Cache,
	) { }

	private readonly DOCUMENT_CACHE_PREFIX = 'documents_list_'
	private readonly documentCacheKeys = new Set<string>()
	private readonly CATEGORY_TREE_CACHE_KEY = 'document_categories_tree'

	private async getNextOrderIndex(
		type: DocumentTypeEnum,
		categoryId: number | null,
		subcategoryId: number | null,
	) {
		const qb = this.documentRepo
			.createQueryBuilder('document')
			.select('COALESCE(MAX(document.orderIndex), -1)', 'maxOrder')
			.where('document.type = :type', { type })

		if (categoryId === null) {
			qb.andWhere('document.category_id IS NULL')
		} else {
			qb.andWhere('document.category_id = :categoryId', { categoryId })
		}

		if (subcategoryId === null) {
			qb.andWhere('document.subcategory_id IS NULL')
		} else {
			qb.andWhere('document.subcategory_id = :subcategoryId', { subcategoryId })
		}

		const row = await qb.getRawOne<{ maxOrder: string }>()
		const maxOrder = row?.maxOrder !== undefined ? Number(row.maxOrder) : -1
		return Number.isFinite(maxOrder) ? maxOrder + 1 : 0
	}

	private async shiftOrderIndexesForInsert(
		type: DocumentTypeEnum,
		categoryId: number | null,
		subcategoryId: number | null,
		fromOrder: number,
		excludedId?: string,
	) {
		const qb = this.documentRepo
			.createQueryBuilder()
			.update(Document)
			.set({ orderIndex: () => '"orderIndex" + 1' })
			.where('type = :type', { type })
			.andWhere('"orderIndex" >= :fromOrder', { fromOrder })

		if (categoryId === null) {
			qb.andWhere('category_id IS NULL')
		} else {
			qb.andWhere('category_id = :categoryId', { categoryId })
		}

		if (subcategoryId === null) {
			qb.andWhere('subcategory_id IS NULL')
		} else {
			qb.andWhere('subcategory_id = :subcategoryId', { subcategoryId })
		}

		if (excludedId) {
			qb.andWhere('id != :excludedId', { excludedId })
		}

		await qb.execute()
	}

	private async normalizeOrderIndexesForScope(
		type: DocumentTypeEnum,
		categoryId: number | null,
		subcategoryId: number | null,
	) {
		const parameters: Array<string | number> = [type]
		const conditions: string[] = ['type = $1']

		if (categoryId === null) {
			conditions.push('category_id IS NULL')
		} else {
			parameters.push(categoryId)
			conditions.push(`category_id = $${parameters.length}`)
		}

		if (subcategoryId === null) {
			conditions.push('subcategory_id IS NULL')
		} else {
			parameters.push(subcategoryId)
			conditions.push(`subcategory_id = $${parameters.length}`)
		}

		await this.documentRepo.query(
			`
				WITH ranked AS (
					SELECT
						id,
						ROW_NUMBER() OVER (
							PARTITION BY type, category_id, subcategory_id
							ORDER BY
								COALESCE("orderIndex", 2147483647) ASC,
								"createdAt" ASC,
								id ASC
						) - 1 AS rn
					FROM documents
					WHERE ${conditions.join(' AND ')}
				)
				UPDATE documents d
				SET "orderIndex" = ranked.rn
				FROM ranked
				WHERE d.id = ranked.id
			`,
			parameters,
		)
	}

	private getCacheKey(
		type?: DocumentTypeEnum,
		categoryId?: number,
		subcategoryId?: number,
		isPublished?: boolean,
	) {
		const typePart = type ?? 'any'
		const catPart = categoryId ?? 'any'
		const subPart = subcategoryId ?? 'any'
		const pubPart =
			isPublished === undefined ? 'any' : isPublished ? 'published' : 'unpublished'

		return `${this.DOCUMENT_CACHE_PREFIX}t:${typePart}_c:${catPart}_s:${subPart}_p:${pubPart}`
	}

	private async invalidateCache() {
		try {
			const store: any = (this.cacheManager as any).store
			if (store && typeof store.getClient === 'function') {
				const client = store.getClient()
				if (typeof client.keys === 'function') {
					const keys: string[] = await client.keys(`${this.DOCUMENT_CACHE_PREFIX}*`)
					if (keys && keys.length) {
						await Promise.all(keys.map((k: string) => this.cacheManager.del(k)))
					}
				} else if (typeof client.scan === 'function') {
					let cursor = '0'
					const foundKeys: string[] = []
					do {
						const res = await client.scan(cursor, 'MATCH', `${this.DOCUMENT_CACHE_PREFIX}*`, 'COUNT', 100)
						cursor = res[0]
						const batch: string[] = res[1] || []
						foundKeys.push(...batch)
					} while (cursor !== '0')
					if (foundKeys.length) {
						await Promise.all(foundKeys.map((k: string) => this.cacheManager.del(k)))
					}
				}
			} else {
				for (const key of this.documentCacheKeys) {
					await this.cacheManager.del(key)
				}
			}
			this.documentCacheKeys.clear()
			await this.cacheManager.del(this.CATEGORY_TREE_CACHE_KEY)
		} catch (e) {
			for (const key of this.documentCacheKeys) {
				try { await this.cacheManager.del(key) } catch (_) { }
			}
			this.documentCacheKeys.clear()
			try { await this.cacheManager.del(this.CATEGORY_TREE_CACHE_KEY) } catch (_) { }
		}
	}

	async create(
		dto: CreateDocumentDto,
		file?: UploadFile,
		fileUploadService?: FileUploadService,
		previewFile?: UploadFile,
	) {
		let fileUrl: string | undefined = undefined;
		if (file) {
			if (!fileUploadService) throw new BadRequestException('FileUploadService is required');

			let type: 'pdf' | 'doc' = 'pdf';
			if (file.mimetype === 'application/msword' || file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
				type = 'doc';
			}
			fileUrl = await fileUploadService.upload(file, type, 'documents/files');
		} else if (dto.fileUrl) {
			fileUrl = dto.fileUrl;
		}
		if (!fileUrl) {
			throw new BadRequestException('Необходимо загрузить файл документа или указать ссылку');
		}

		let previewUrl: string | undefined;
		if (previewFile) {
			if (!fileUploadService) throw new BadRequestException('FileUploadService is required');
			previewUrl = await fileUploadService.upload(previewFile, 'image', 'documents/preview');
		} else if (dto.previewUrl) {
			previewUrl = dto.previewUrl;
		}

		let category: DocumentCategory | null = null;
		let subcategory: DocumentCategory | null = null;

		if (dto.subcategoryId) {
			subcategory = await this.categoryTreeRepo.findOne({ where: { id: dto.subcategoryId }, relations: ['parent'] });
			if (!subcategory) throw new BadRequestException(`Subcategory with ID ${dto.subcategoryId} not found`);
			if (!subcategory.parent) throw new BadRequestException('У подкатегории должен быть родитель (категория)');
			category = subcategory.parent;
		} else if (dto.categoryId) {
			category = await this.categoryTreeRepo.findOne({ where: { id: dto.categoryId } });
			if (!category) throw new BadRequestException(`Category with ID ${dto.categoryId} not found`);
		}

		const document = this.documentRepo.create({
			title: dto.title,
			type: dto.type,
			fileUrl,
			previewUrl,
			category,
			subcategory,
			isPublished: dto.isPublished ?? true,
			orderIndex: 0,
		});

		const categoryId = category?.id ?? null
		const subcategoryId = subcategory?.id ?? null

		if (dto.orderIndex !== undefined && dto.orderIndex >= 0) {
			document.orderIndex = dto.orderIndex
			await this.shiftOrderIndexesForInsert(dto.type, categoryId, subcategoryId, dto.orderIndex)
		} else {
			document.orderIndex = await this.getNextOrderIndex(dto.type, categoryId, subcategoryId)
		}

		const saved = await this.documentRepo.save(document);
		await this.invalidateCache();
		return saved;
	}

	async findAllDocuments(
		type?: DocumentTypeEnum,
		categoryId?: number,
		subcategoryId?: number,
		isPublished?: boolean,
	) {
		const cacheKey = this.getCacheKey(type, categoryId, subcategoryId, isPublished)
		const cached = await this.cacheManager.get<Document[]>(cacheKey)
		if (cached && Array.isArray(cached)) {
			return cached
		}

		const where: any = {}
		if (type) where.type = type
		if (categoryId) where.category = { id: categoryId }
		if (subcategoryId) where.subcategory = { id: subcategoryId }
		if (isPublished !== undefined) where.isPublished = isPublished

		const list = await this.documentRepo.find({
			where,
			relations: ['category', 'subcategory'],
			order: { orderIndex: 'ASC', createdAt: 'DESC' },
		})

		await this.cacheManager.set(cacheKey, list)
		this.documentCacheKeys.add(cacheKey)
		return list
	}

	async findOneDocument(id: string) {
		const document = await this.documentRepo.findOne({
			where: { id },
			relations: ['category', 'subcategory'],
		})
		if (!document) {
			throw new NotFoundException(`Document with ID ${id} not found`)
		}
		return document
	}

	async updateDocument(
		id: string,
		dto: UpdateDocumentDto,
		file?: UploadFile,
		fileUploadService?: FileUploadService,
		previewFile?: UploadFile,
	) {
		const document = await this.documentRepo.findOne({
			where: { id },
			relations: ['category', 'subcategory'],
		})
		if (!document) {
			throw new NotFoundException(`Document with ID ${id} not found`)
		}

		const oldType = document.type
		const oldCategoryId = document.category?.id ?? null
		const oldSubcategoryId = document.subcategory?.id ?? null

		if (dto.type) {
			document.type = dto.type
		}

		if (dto.subcategoryId !== undefined) {
			if (dto.subcategoryId === null) {
				document.category = null
				document.subcategory = null
			} else {
				const subcategory = await this.categoryTreeRepo.findOne({ where: { id: dto.subcategoryId }, relations: ['parent'] })
				if (!subcategory) {
					throw new BadRequestException(`Subcategory with ID ${dto.subcategoryId} not found`)
				}
				if (!subcategory.parent) {
					throw new BadRequestException('У подкатегории должен быть родитель (категория)')
				}
				document.subcategory = subcategory
				document.category = subcategory.parent
			}
		}

		if (dto.title !== undefined) {
			document.title = dto.title
		}

		if (dto.isPublished !== undefined) {
			document.isPublished = dto.isPublished
		}

		if (file && fileUploadService) {
			let type: 'pdf' | 'doc' = 'pdf';
			if (file.mimetype === 'application/msword' || file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
				type = 'doc';
			}
			document.fileUrl = await fileUploadService.upload(file, type, 'documents/files');
		} else if (dto.fileUrl !== undefined) {
			document.fileUrl = dto.fileUrl;
		}

		const newType = document.type
		const newCategoryId = document.category?.id ?? null
		const newSubcategoryId = document.subcategory?.id ?? null
		const scopeChanged =
			oldType !== newType ||
			oldCategoryId !== newCategoryId ||
			oldSubcategoryId !== newSubcategoryId

		if (dto.orderIndex !== undefined && dto.orderIndex >= 0) {
			await this.normalizeOrderIndexesForScope(newType, newCategoryId, newSubcategoryId)

			if (!scopeChanged) {
				const refreshed = await this.documentRepo
					.createQueryBuilder('document')
					.select('document.orderIndex', 'orderIndex')
					.where('document.id = :id', { id })
					.getRawOne<{ orderIndex: string }>()

				if (refreshed?.orderIndex !== undefined) {
					document.orderIndex = Number(refreshed.orderIndex)
				}
			}
		}

		if (scopeChanged) {
			if (dto.orderIndex !== undefined && dto.orderIndex >= 0) {
				document.orderIndex = dto.orderIndex
				await this.shiftOrderIndexesForInsert(
					newType,
					newCategoryId,
					newSubcategoryId,
					dto.orderIndex,
					document.id,
				)
			} else {
				document.orderIndex = await this.getNextOrderIndex(newType, newCategoryId, newSubcategoryId)
			}
		} else if (dto.orderIndex !== undefined && dto.orderIndex >= 0 && dto.orderIndex !== document.orderIndex) {
			const targetOrder = dto.orderIndex
			const previousOrder = document.orderIndex

			if (targetOrder > previousOrder) {
				await this.documentRepo
					.createQueryBuilder()
					.update(Document)
					.set({ orderIndex: () => '"orderIndex" - 1' })
					.where('type = :type', { type: newType })
					.andWhere('id != :id', { id: document.id })
					.andWhere('"orderIndex" > :previousOrder', { previousOrder })
					.andWhere('"orderIndex" <= :targetOrder', { targetOrder })
					.andWhere(newCategoryId === null ? 'category_id IS NULL' : 'category_id = :categoryId', { categoryId: newCategoryId ?? undefined })
					.andWhere(newSubcategoryId === null ? 'subcategory_id IS NULL' : 'subcategory_id = :subcategoryId', { subcategoryId: newSubcategoryId ?? undefined })
					.execute()
			} else {
				await this.documentRepo
					.createQueryBuilder()
					.update(Document)
					.set({ orderIndex: () => '"orderIndex" + 1' })
					.where('type = :type', { type: newType })
					.andWhere('id != :id', { id: document.id })
					.andWhere('"orderIndex" >= :targetOrder', { targetOrder })
					.andWhere('"orderIndex" < :previousOrder', { previousOrder })
					.andWhere(newCategoryId === null ? 'category_id IS NULL' : 'category_id = :categoryId', { categoryId: newCategoryId ?? undefined })
					.andWhere(newSubcategoryId === null ? 'subcategory_id IS NULL' : 'subcategory_id = :subcategoryId', { subcategoryId: newSubcategoryId ?? undefined })
					.execute()
			}

			document.orderIndex = targetOrder
		}

		const saved = await this.documentRepo.save(document)
		await this.invalidateCache()
		return saved
	}

	async removeDocument(id: string) {
		const document = await this.documentRepo.findOne({ where: { id } })
		if (!document) {
			throw new NotFoundException(`Document with ID ${id} not found`)
		}
		await this.documentRepo.delete(id)
		await this.invalidateCache()
		return { deleted: true }
	}

	async createCategory(dto: CreateDocumentCategoryDto) {
		let parent: DocumentCategory | null = null
		if (dto.parentId) {
			parent = await this.categoryTreeRepo.findOne({ where: { id: dto.parentId } })
			if (!parent) {
				throw new BadRequestException(`Parent category with ID ${dto.parentId} not found`)
			}
		}

		let existingByName: DocumentCategory | null = null
		if (parent) {
			existingByName = await this.categoryTreeRepo.findOne({ where: { name: dto.name, parent: { id: parent.id } }, relations: ['parent'] })
		} else {
			existingByName = await this.categoryTreeRepo.findOne({ where: { name: dto.name, parent: IsNull() } })
		}
		if (existingByName) {
			throw new BadRequestException(`Category with name "${dto.name}" already exists in the same parent`)
		}

		let slug: string | null = null
		if (dto.slug && dto.slug.trim()) {
			slug = dto.slug.trim()
			const existingSlug = await this.categoryTreeRepo.findOne({ where: { slug } })
			if (existingSlug) {
				throw new BadRequestException(`Category with slug "${slug}" already exists`)
			}
		}

		let icon: string | null = null
		if (dto.icon && !parent) {
			icon = dto.icon.trim() || null
		}

		const category = this.categoryTreeRepo.create({ name: dto.name, parent, slug, icon })
		if (dto.blocks) {
			(category as any).blocks = dto.blocks;
		}
		const saved = await this.categoryTreeRepo.save(category)
		await this.invalidateCache()
		return saved
	}

	async getCategoryTree() {
		const cached = await this.cacheManager.get<DocumentCategory[]>(this.CATEGORY_TREE_CACHE_KEY)
		if (cached && Array.isArray(cached)) {
			return cached
		}

		const trees = await this.categoryTreeRepo.findTrees()
		await this.cacheManager.set(this.CATEGORY_TREE_CACHE_KEY, trees)
		return trees
	}

	async findOneCategory(id: number) {
		const category = await this.categoryTreeRepo.findOne({ where: { id } })
		if (!category) {
			throw new NotFoundException(`Category with ID ${id} not found`)
		}
		return category
	}

	async updateCategory(id: number, dto: UpdateDocumentCategoryDto) {
		const category = await this.categoryTreeRepo.findOne({ where: { id } })
		if (!category) {
			throw new NotFoundException(`Category with ID ${id} not found`)
		}

		if (dto.parentId !== undefined) {
			if (dto.parentId === null) {
				category.parent = null
			} else {
				const parent = await this.categoryTreeRepo.findOne({ where: { id: dto.parentId } })
				if (!parent) {
					throw new BadRequestException(`Parent category with ID ${dto.parentId} not found`)
				}
				category.parent = parent
			}
		}

		if (dto.name !== undefined && dto.name.trim()) {
			const newName = dto.name.trim()
			// Ensure no sibling has the same name
			let siblingConflict: DocumentCategory | null = null
			if (category.parent) {
				siblingConflict = await this.categoryTreeRepo.findOne({ where: { name: newName, parent: { id: category.parent.id } } })
			} else {
				siblingConflict = await this.categoryTreeRepo.findOne({ where: { name: newName, parent: IsNull() } })
			}
			if (siblingConflict && siblingConflict.id !== category.id) {
				throw new BadRequestException(`Category with name "${newName}" already exists in the same parent`)
			}
			category.name = newName
		}

		if (dto.blocks !== undefined) {
			(category as any).blocks = dto.blocks;
		}

		if (dto.slug !== undefined) {
			if (!dto.slug.trim()) {
				throw new BadRequestException(`Slug cannot be empty`)
			}
			const newSlug = dto.slug.trim()

			if (newSlug !== category.slug) {
				const existing = await this.categoryTreeRepo.findOne({ where: { slug: newSlug } })
				if (existing) {
					throw new BadRequestException(`Slug "${newSlug}" already exists in category "${existing.name}"`)
				}
			}
			category.slug = newSlug
		}

		if (dto.icon !== undefined) {
			if (category.parent) {
				category.icon = null
			} else {
				category.icon = dto.icon && dto.icon.trim() ? dto.icon.trim() : null
			}
		}

		const updatePayload: any = {
			name: category.name,
			slug: category.slug,
			icon: category.icon,
		}
		if ((dto as any).blocks !== undefined) {
			updatePayload.blocks = (category as any).blocks
		}
		await this.categoryTreeRepo.update(id, updatePayload)

		const result = await this.categoryTreeRepo.findOne({ where: { id } })
		await this.invalidateCache()
		return result
	}

	async removeCategory(id: number) {
		const category = await this.categoryTreeRepo.findOne({ where: { id } })
		if (!category) {
			throw new NotFoundException(`Category with ID ${id} not found`)
		}

		const descendants = await this.categoryTreeRepo.findDescendants(category)
		const categoryIds = descendants.map((item) => item.id)

		const linkedDocumentsCount = await this.documentRepo.count({
			where: [
				{ category: { id: In(categoryIds) } },
				{ subcategory: { id: In(categoryIds) } },
			],
		})

		if (linkedDocumentsCount > 0) {
			throw new BadRequestException(
				`Нельзя удалить категорию, пока в ней или её подкатегориях есть документы (${linkedDocumentsCount}). Сначала удалите или перенесите документы.`,
			)
		}

		await this.categoryTreeRepo.delete(id)
		await this.invalidateCache()
		return { deleted: true }
	}
}

