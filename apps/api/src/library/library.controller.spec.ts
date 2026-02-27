import { Test, TestingModule } from '@nestjs/testing';
import { LibraryController } from './library.controller';
import { LibraryService } from './library.service';
import { LibraryCategoryService } from './library-category.service';
import { FileUploadService } from '../file-upload/file-upload.service';
import { LibraryItemType } from './enums/library-item-type.enum';
import { JwtAuthGuard } from '../admin/jwt-auth.guard';

describe('LibraryController', () => {
	let controller: LibraryController;
	let libraryService: LibraryService;
	let categoryService: LibraryCategoryService;
	let fileUploadService: FileUploadService;

	const mockLibraryService = {
		create: jest.fn(),
		findAll: jest.fn(),
		findOne: jest.fn(),
		findByCategories: jest.fn(),
		update: jest.fn(),
		remove: jest.fn(),
	};

	const mockCategoryService = {
		create: jest.fn(),
		findAll: jest.fn(),
		findOne: jest.fn(),
		update: jest.fn(),
		remove: jest.fn(),
	};

	const mockFileUploadService = {
		upload: jest.fn(),
		delete: jest.fn(),
		listFiles: jest.fn(),
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [LibraryController],
			providers: [
				{ provide: LibraryService, useValue: mockLibraryService },
				{ provide: LibraryCategoryService, useValue: mockCategoryService },
				{ provide: FileUploadService, useValue: mockFileUploadService },
			],
		})
			.overrideGuard(JwtAuthGuard)
			.useValue({ canActivate: () => true })
			.compile();

		controller = module.get<LibraryController>(LibraryController);
		libraryService = module.get<LibraryService>(LibraryService);
		categoryService = module.get<LibraryCategoryService>(LibraryCategoryService);
		fileUploadService = module.get<FileUploadService>(FileUploadService);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('Категории', () => {
		it('должна получить все категории', async () => {
			const categories = [
				{ id: 1, name: 'Старая категория', items: [], createdAt: new Date() },
				{ id: 2, name: 'Журнал «Охраняется государством»', items: [], createdAt: new Date() },
			];

			mockCategoryService.findAll.mockResolvedValue(categories);

			const result = await controller.getAllCategories();

			expect(result).toEqual(categories);
			expect(result.length).toBe(2);
			expect(result[1].name).toBe('Журнал «Охраняется государством»');
		});

		it('должна создать категорию', async () => {
			const categoryDto = { name: 'Журнал «Охраняется государством»' };
			const createdCategory = {
				id: 2,
				...categoryDto,
				items: [],
				createdAt: new Date(),
			};

			mockCategoryService.create.mockResolvedValue(createdCategory);

			const result = await controller.createCategory(categoryDto);

			expect(result.id).toBe(2);
			expect(result.name).toBe('Журнал «Охраняется государством»');
			expect(mockCategoryService.create).toHaveBeenCalledWith(categoryDto);
		});

		it('должна получить категорию по ID', async () => {
			const category = {
				id: 2,
				name: 'Журнал «Охраняется государством»',
				items: [],
				createdAt: new Date(),
			};

			mockCategoryService.findOne.mockResolvedValue(category);

			const result = await controller.getCategory(2);

			expect(result.id).toBe(2);
			expect(mockCategoryService.findOne).toHaveBeenCalledWith(2);
		});
	});

	describe('Элементы библиотеки', () => {
		it('должна получить все опубликованные книги', async () => {
			const books = [
				{
					id: 1,
					type: LibraryItemType.BOOK,
					title: 'Журнал «Охраняется государством», №1, 2014',
					contentUrl: 'https://cloud.mail.ru/public/Lfb7/45FCEs456',
					previewImage: '/uploads/library/images/cover.png',
					isPublished: true,
					categoryId: 2,
					createdAt: new Date(),
				},
			];

			mockLibraryService.findAll.mockResolvedValue(books);

			const result = await controller.findAll();

			expect(Array.isArray(result)).toBe(true);
			expect(result[0].type).toBe(LibraryItemType.BOOK);
			expect(result[0].title).toBe('Журнал «Охраняется государством», №1, 2014');
		});

		it('должна получить элементы по категориям', async () => {
			const grouped = [
				{
					category: 'Журнал «Охраняется государством»',
					categoryId: 2,
					items: [
						{
							id: 1,
							type: LibraryItemType.BOOK,
							title: 'Журнал «Охраняется государством», №1, 2014',
							contentUrl: 'https://cloud.mail.ru/public/Lfb7/45FCEs456',
							previewImage: '/uploads/library/images/cover.png',
							isPublished: true,
							categoryId: 2,
							createdAt: new Date(),
						},
					],
					totalCount: 1,
				},
			];

			mockLibraryService.findByCategories.mockResolvedValue(grouped);

			const result = await controller.findByCategories();

			expect(Array.isArray(result)).toBe(true);
			expect(result[0].category).toBe('Журнал «Охраняется государством»');
			expect(result[0].totalCount).toBe(1);
		});

		it('должна создать книгу с картинкой и ссылкой на облако', async () => {
			const createDto = {
				type: LibraryItemType.BOOK,
				title: 'Журнал «Охраняется государством», №1, 2014',
				contentUrl: 'https://cloud.mail.ru/public/Lfb7/45FCEs456',
				description: undefined,
				categoryId: 2,
				isPublished: true,
			};

			const mockPreviewFile = {
				buffer: Buffer.from('image data'),
				originalname: 'cover.png',
				mimetype: 'image/png',
				size: 1024,
			};

			const createdBook = {
				id: 1,
				...createDto,
				previewImage: '/uploads/library/images/cover.png',
				category: { id: 2, name: 'Журнал «Охраняется государством»' },
				createdAt: new Date(),
			};

			mockLibraryService.create.mockResolvedValue(createdBook);

			const result = await controller.create(createDto as any, {
				previewImage: [mockPreviewFile],
			});

			expect(result).toBeDefined();
			expect((result as any).id).toBe(1);
			expect((result as any).type).toBe(LibraryItemType.BOOK);
			expect((result as any).title).toBe('Журнал «Охраняется государством», №1, 2014');
			expect((result as any).contentUrl).toBe('https://cloud.mail.ru/public/Lfb7/45FCEs456');
			expect((result as any).categoryId).toBe(2);
			expect((result as any).previewImage).toBe('/uploads/library/images/cover.png');
			expect(mockLibraryService.create).toHaveBeenCalled();
		});

		it('должна получить элемент по ID', async () => {
			const book = {
				id: 1,
				type: LibraryItemType.BOOK,
				title: 'Журнал «Охраняется государством», №1, 2014',
				contentUrl: 'https://cloud.mail.ru/public/Lfb7/45FCEs456',
				previewImage: '/uploads/library/images/cover.png',
				isPublished: true,
				categoryId: 2,
				createdAt: new Date(),
			};

			mockLibraryService.findOne.mockResolvedValue(book);

			const result = await controller.findOne(1);

			expect(result).toBeDefined();
			expect(result!.id).toBe(1);
			expect(result!.title).toBe('Журнал «Охраняется государством», №1, 2014');
			expect(mockLibraryService.findOne).toHaveBeenCalledWith(1);
		});
	});
});

