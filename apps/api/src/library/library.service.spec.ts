import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LibraryService } from './library.service';
import { LibraryCategoryService } from './library-category.service';
import { LibraryItem } from './entities/library-item.entity';
import { LibraryCategory } from './entities/library-category.entity';
import { LibraryItemType } from './enums/library-item-type.enum';
import { BadRequestException } from '@nestjs/common';

describe('LibraryService', () => {
	let libraryService: LibraryService;
	let categoryService: LibraryCategoryService;
	let libraryRepo: Repository<LibraryItem>;
	let categoryRepo: Repository<LibraryCategory>;

	const mockLibraryItemRepository = {
		create: jest.fn(),
		save: jest.fn(),
		find: jest.fn(),
		findOne: jest.fn(),
		createQueryBuilder: jest.fn(),
	};

	const mockLibraryCategoryRepository = {
		create: jest.fn(),
		save: jest.fn(),
		find: jest.fn(),
		findOne: jest.fn(),
		remove: jest.fn(),
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				LibraryService,
				LibraryCategoryService,
				{
					provide: getRepositoryToken(LibraryItem),
					useValue: mockLibraryItemRepository,
				},
				{
					provide: getRepositoryToken(LibraryCategory),
					useValue: mockLibraryCategoryRepository,
				},
			],
		}).compile();

		libraryService = module.get<LibraryService>(LibraryService);
		categoryService = module.get<LibraryCategoryService>(LibraryCategoryService);
		libraryRepo = module.get<Repository<LibraryItem>>(getRepositoryToken(LibraryItem));
		categoryRepo = module.get<Repository<LibraryCategory>>(getRepositoryToken(LibraryCategory));
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('Категории', () => {
		it('должна создать новую категорию', async () => {
			const categoryDto = { name: 'Журнал «Охраняется государством»' };
			const createdCategory = {
				id: 2,
				name: categoryDto.name,
				items: [],
				createdAt: new Date(),
			};

			mockLibraryCategoryRepository.findOne.mockResolvedValueOnce(null);
			mockLibraryCategoryRepository.create.mockReturnValueOnce(createdCategory);
			mockLibraryCategoryRepository.save.mockResolvedValueOnce(createdCategory);

			const result = await categoryService.create(categoryDto);

			expect(result).toEqual(createdCategory);
			expect(result.id).toBe(2);
			expect(result.name).toBe('Журнал «Охраняется государством»');
		});

		it('должна получить список всех категорий отсортированных по дате', async () => {
			const categories = [
				{ id: 1, name: 'Старая категория', items: [], createdAt: new Date('2026-01-01') },
				{ id: 2, name: 'Журнал «Охраняется государством»', items: [], createdAt: new Date('2026-01-04') },
			];

			mockLibraryCategoryRepository.find.mockResolvedValueOnce(categories);

			const result = await categoryService.findAll();

			expect(result).toEqual(categories);
			expect(result.length).toBe(2);
			expect(mockLibraryCategoryRepository.find).toHaveBeenCalledWith({ order: { createdAt: 'ASC' } });
		});

		it('должна получить категорию по ID', async () => {
			const category = {
				id: 2,
				name: 'Журнал «Охраняется государством»',
				items: [],
				createdAt: new Date(),
			};

			mockLibraryCategoryRepository.findOne.mockResolvedValueOnce(category);

			const result = await categoryService.findOne(2);

			expect(result).toEqual(category);
			expect(result.id).toBe(2);
		});
	});

	describe('Элементы библиотеки', () => {
		it('должна создать книгу с contentUrl и изображением', async () => {
			const createDto = {
				type: LibraryItemType.BOOK,
				title: 'Журнал «Охраняется государством», №1, 2014',
				contentUrl: 'https://cloud.mail.ru/public/Lfb7/45FCEs456',
				description: undefined,
				categoryId: 2,
				isPublished: true,
			};

			const mockFile = {
				buffer: Buffer.from('image data'),
				originalname: 'cover.png',
				mimetype: 'image/png',
				size: 1024,
			};

			const mockFileUploadService = {
				upload: jest.fn().mockReturnValue('/uploads/library/images/cover.png'),
				delete: jest.fn(),
				listFiles: jest.fn(),
				uploadDir: '/uploads',
				uploadImage: jest.fn(),
				uploadPdf: jest.fn(),
				saveFile: jest.fn(),
				deleteMultiple: jest.fn(),
			} as any;

			const createdItem = {
				id: 1,
				...createDto,
				previewImage: '/uploads/library/images/cover.png',
				category: { id: 2, name: 'Журнал «Охраняется государством»' },
				createdAt: new Date(),
			};

			mockLibraryCategoryRepository.findOne.mockResolvedValueOnce({ id: 2, name: 'Журнал' });
			mockLibraryItemRepository.create.mockReturnValueOnce(createdItem);
			mockLibraryItemRepository.save.mockResolvedValueOnce(createdItem);

			const result = await libraryService.create(
				createDto,
				{
					previewImage: [mockFile],
				},
				mockFileUploadService,
			);

			expect(result).toBeDefined();
			expect((result as any).type).toBe(LibraryItemType.BOOK);
			expect((result as any).title).toBe('Журнал «Охраняется государством», №1, 2014');
			expect((result as any).contentUrl).toBe('https://cloud.mail.ru/public/Lfb7/45FCEs456');
			expect((result as any).categoryId).toBe(2);
			expect((result as any).isPublished).toBe(true);
			expect(mockFileUploadService.upload).toHaveBeenCalled();
		});

		it('должна выбросить ошибку если нет previewImage', async () => {
			const createDto = {
				type: LibraryItemType.BOOK,
				title: 'Журнал',
				contentUrl: 'https://cloud.mail.ru/public/test',
				isPublished: true,
			};

			const mockFileUploadService = {
				upload: jest.fn(),
				delete: jest.fn(),
				listFiles: jest.fn(),
				uploadDir: '/uploads',
				uploadImage: jest.fn(),
				uploadPdf: jest.fn(),
				saveFile: jest.fn(),
				deleteMultiple: jest.fn(),
			} as any;

			await expect(
				libraryService.create(createDto, {}, mockFileUploadService),
			).rejects.toThrow(BadRequestException);
		});

		it('должна выбросить ошибку если нет contentUrl и pdfFile', async () => {
			const createDto = {
				type: LibraryItemType.BOOK,
				title: 'Журнал',
				isPublished: true,
			};

			const mockFile = {
				buffer: Buffer.from('image'),
				originalname: 'cover.png',
				mimetype: 'image/png',
				size: 1024,
			};

			const mockFileUploadService = {
				upload: jest.fn(),
				delete: jest.fn(),
				listFiles: jest.fn(),
				uploadDir: '/uploads',
				uploadImage: jest.fn(),
				uploadPdf: jest.fn(),
				saveFile: jest.fn(),
				deleteMultiple: jest.fn(),
			} as any;

			await expect(
				libraryService.create(
					createDto,
					{
						previewImage: [mockFile],
					},
					mockFileUploadService,
				),
			).rejects.toThrow(BadRequestException);
		});

		it('должна получить все опубликованные книги', async () => {
			const queryBuilder = {
				leftJoinAndSelect: jest.fn().mockReturnThis(),
				where: jest.fn().mockReturnThis(),
				andWhere: jest.fn().mockReturnThis(),
				orderBy: jest.fn().mockReturnThis(),
				limit: jest.fn().mockReturnThis(),
				getMany: jest.fn().mockResolvedValue([]),
			};

			mockLibraryItemRepository.createQueryBuilder.mockReturnValue(queryBuilder);

			const result = await libraryService.findAll(LibraryItemType.BOOK);

			expect(queryBuilder.where).toHaveBeenCalledWith('item.isPublished = :isPublished', { isPublished: true });
			expect(queryBuilder.andWhere).toHaveBeenCalledWith('item.type = :type', { type: LibraryItemType.BOOK });
			expect(queryBuilder.getMany).toHaveBeenCalled();
		});

		it('должна получить элементы сгруппированные по категориям', async () => {
			const categories = [
				{ id: 2, name: 'Журнал «Охраняется государством»', items: [], createdAt: new Date() },
			];

			mockLibraryCategoryRepository.find.mockResolvedValueOnce(categories);

			const queryBuilder = {
				leftJoinAndSelect: jest.fn().mockReturnThis(),
				where: jest.fn().mockReturnThis(),
				andWhere: jest.fn().mockReturnThis(),
				orderBy: jest.fn().mockReturnThis(),
				limit: jest.fn().mockReturnThis(),
				getMany: jest.fn().mockResolvedValue([]),
			};

			mockLibraryItemRepository.createQueryBuilder.mockReturnValue(queryBuilder);

			const result = await libraryService.findByCategories(6);

			expect(mockLibraryCategoryRepository.find).toHaveBeenCalled();
			expect(Array.isArray(result)).toBe(true);
		});
	});
});

