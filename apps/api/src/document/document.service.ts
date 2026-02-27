import { Inject, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, TreeRepository } from 'typeorm';
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
		for (const key of this.documentCacheKeys) {
			await this.cacheManager.del(key)
		}
		this.documentCacheKeys.clear()

		await this.cacheManager.del(this.CATEGORY_TREE_CACHE_KEY)
	}

	async create(
		dto: CreateDocumentDto,
		file?: UploadFile,
		fileUploadService?: FileUploadService,
		previewFile?: UploadFile,
	) {
		if (!file && !dto.pdfUrl) {
			throw new BadRequestException('Необходимо либо загрузить PDF файл, либо указать pdfUrl')
		}

		if (file && dto.pdfUrl) {
			throw new BadRequestException('Укажите либо pdfFile (загрузка), либо pdfUrl, но не оба одновременно')
		}

		let pdfUrl: string
		if (file) {
			if (!fileUploadService) {
				throw new BadRequestException('FileUploadService is required')
			}
			pdfUrl = await fileUploadService.upload(file, 'pdf', 'documents/pdfs')
		} else {
			pdfUrl = dto.pdfUrl as string
		}

		let previewUrl: string | undefined
		if (previewFile) {
			if (!fileUploadService) {
				throw new BadRequestException('FileUploadService is required')
			}
			previewUrl = await fileUploadService.upload(previewFile, 'image', 'documents/preview')
		} else if (dto.previewUrl) {
			previewUrl = dto.previewUrl
		}

		let category: DocumentCategory | null = null
		let subcategory: DocumentCategory | null = null

		if (dto.subcategoryId) {
			subcategory = await this.categoryTreeRepo.findOne({ where: { id: dto.subcategoryId }, relations: ['parent'] })
			if (!subcategory) {
				throw new BadRequestException(`Subcategory with ID ${dto.subcategoryId} not found`)
			}
			if (!subcategory.parent) {
				throw new BadRequestException('У подкатегории должен быть родитель (категория)')
			}
			category = subcategory.parent
		} else if (dto.categoryId) {
			category = await this.categoryTreeRepo.findOne({ where: { id: dto.categoryId } })
			if (!category) {
				throw new BadRequestException(`Category with ID ${dto.categoryId} not found`)
			}
		}

		const document = this.documentRepo.create({
			title: dto.title,
			type: dto.type,
			pdfUrl,
			previewUrl,
			category,
			subcategory,
			isPublished: dto.isPublished ?? true,
		})

		const saved = await this.documentRepo.save(document)
		await this.invalidateCache()
		return saved
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
			order: { createdAt: 'DESC' },
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

	async updateDocument(id: string, dto: UpdateDocumentDto) {
		const document = await this.documentRepo.findOne({ where: { id } })
		if (!document) {
			throw new NotFoundException(`Document with ID ${id} not found`)
		}

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

		if (dto.pdfUrl !== undefined) {
			document.pdfUrl = dto.pdfUrl
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

		const existingByName = await this.categoryTreeRepo.findOne({ where: { name: dto.name } })
		if (existingByName) {
			throw new BadRequestException(`Category with name "${dto.name}" already exists`)
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
			category.name = dto.name.trim()
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

		await this.categoryTreeRepo.update(id, {
			name: category.name,
			slug: category.slug,
			icon: category.icon,
		})

		const result = await this.categoryTreeRepo.findOne({ where: { id } })
		await this.invalidateCache()
		return result
	}

	async removeCategory(id: number) {
		const category = await this.categoryTreeRepo.findOne({ where: { id } })
		if (!category) {
			throw new NotFoundException(`Category with ID ${id} not found`)
		}
		await this.categoryTreeRepo.delete(id)
		await this.invalidateCache()
		return { deleted: true }
	}
}

