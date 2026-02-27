import {
	Body,
	Controller,
	Delete,
	Get,
	HttpCode,
	Param,
	Patch,
	Post,
	Query,
	ParseIntPipe,
	UseGuards,
	UseInterceptors,
	UploadedFiles,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import {
	ApiCreatedResponse,
	ApiOkResponse,
	ApiResponse,
	ApiTags,
	ApiBearerAuth,
	ApiQuery,
	ApiConsumes,
	ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../admin/jwt-auth.guard';
import { LibraryItem } from './entities/library-item.entity';
import { LibraryCategory } from './entities/library-category.entity';
import { LibraryService } from './library.service';
import { LibraryCategoryService } from './library-category.service';
import { CreateLibraryItemDto } from './dto/create-library-item.dto';
import { UpdateLibraryItemDto } from './dto/update-library-item.dto';
import { CreateLibraryCategoryDto } from './dto/create-library-category.dto';
import { UpdateLibraryCategoryDto } from './dto/update-library-category.dto';
import { LibraryItemType } from './enums/library-item-type.enum';
import { FileUploadService } from '../file-upload/file-upload.service';

interface UploadFile {
	buffer: Buffer;
	originalname: string;
	mimetype: string;
	size: number;
}

@ApiTags('library')
@Controller('library')
export class LibraryController {
	constructor(
		private readonly libraryService: LibraryService,
		private readonly categorySvc: LibraryCategoryService,
		private readonly fileUploadService: FileUploadService,
	) {}

	@Get('categories')
	@ApiOkResponse({ type: LibraryCategory, isArray: true, description: 'Список всех категорий' })
	getAllCategories() {
		return this.categorySvc.findAll();
	}

	@Get('categories/:id')
	@ApiOkResponse({ type: LibraryCategory, description: 'Категория найдена' })
	@ApiResponse({ status: 404, description: 'Категория не найдена' })
	getCategory(@Param('id', ParseIntPipe) id: number) {
		return this.categorySvc.findOne(id);
	}

	@Post('categories')
	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth()
	@ApiCreatedResponse({ type: LibraryCategory, description: 'Категория создана' })
	@ApiResponse({ status: 409, description: 'Категория с таким именем уже существует' })
	createCategory(@Body() dto: CreateLibraryCategoryDto) {
		return this.categorySvc.create(dto);
	}

	@Patch('categories/:id')
	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth()
	@ApiOkResponse({ type: LibraryCategory, description: 'Категория обновлена' })
	@ApiResponse({ status: 404, description: 'Категория не найдена' })
	@ApiResponse({ status: 409, description: 'Категория с таким именем уже существует' })
	updateCategory(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateLibraryCategoryDto) {
		return this.categorySvc.update(id, dto);
	}

	@Delete('categories/:id')
	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth()
	@HttpCode(204)
	@ApiResponse({ status: 204, description: 'Категория удалена' })
	@ApiResponse({ status: 404, description: 'Категория не найдена' })
	async removeCategory(@Param('id', ParseIntPipe) id: number) {
		await this.categorySvc.remove(id);
	}

	@Get()
	@ApiOkResponse({ type: LibraryItem, isArray: true })
	@ApiQuery({ name: 'type', enum: LibraryItemType, required: false })
	@ApiQuery({ name: 'categoryName', type: String, required: false, description: 'Название категории' })
	@ApiQuery({ name: 'limit', type: Number, required: false, description: 'Лимит элементов для конкретной категории (применяется только если указан categoryName)' })
	findAll(
		@Query('type') type?: LibraryItemType,
		@Query('categoryName') categoryName?: string,
		@Query('limit') limit?: string,
	) {
		return this.libraryService.findAll(
			type,
			categoryName,
			limit ? parseInt(limit, 10) : undefined,
		);
	}

	@Get('admin/all')
	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth()
	@ApiOkResponse({ type: LibraryItem, isArray: true, description: 'Все элементы библиотеки включая черновики (только для админов)' })
	@ApiQuery({ name: 'type', enum: LibraryItemType, required: false })
	@ApiQuery({ name: 'categoryName', type: String, required: false, description: 'Название категории' })
	@ApiQuery({ name: 'limit', type: Number, required: false, description: 'Лимит элементов' })
	findAllForAdmin(
		@Query('type') type?: LibraryItemType,
		@Query('categoryName') categoryName?: string,
		@Query('limit') limit?: string,
	) {
		return this.libraryService.findAllForAdmin(
			type,
			categoryName,
			limit ? parseInt(limit, 10) : undefined,
		);
	}

	@Get('grouped-by-categories')
	@ApiOkResponse({
		description: 'Получить элементы, сгруппированные по категориям (по умолчанию 9 элементов из каждой категории)',
	})
	@ApiQuery({ name: 'limit', type: Number, required: false, description: 'Лимит элементов на категорию (по умолчанию 9)' })
	@ApiQuery({ name: 'type', enum: LibraryItemType, required: false })
	findByCategories(@Query('limit') limit?: string, @Query('type') type?: LibraryItemType) {
		return this.libraryService.findByCategories(limit ? parseInt(limit, 10) : 9, type);
	}

	@Get(':id')
	@ApiOkResponse({ type: LibraryItem, description: 'Library item found' })
	@ApiResponse({ status: 404, description: 'Library item with ID not found' })
	findOne(@Param('id', ParseIntPipe) id: number) {
		return this.libraryService.findOne(id);
	}

	@Post()
	@UseGuards(JwtAuthGuard)
	@UseInterceptors(
		FileFieldsInterceptor([
			{ name: 'previewImage', maxCount: 1 },
			{ name: 'pdfFile', maxCount: 1 },
		]),
	)
	@ApiBearerAuth()
	@ApiConsumes('multipart/form-data')
	@ApiBody({
		description: 'Создание элемента библиотеки',
		schema: {
			type: 'object',
			properties: {
				type: { type: 'string', enum: ['book', 'article'], description: 'Тип элемента' },
				title: { type: 'string', description: 'Название' },
				isPublished: { type: 'boolean', description: 'Опубликован ли элемент' },
				categoryId: { type: 'number', description: 'ID категории' },
				createNewCategory: { type: 'string', description: 'Создать новую категорию с этим именем' },
				description: { type: 'string', description: 'Описание' },
				contentUrl: {
					type: 'string',
					description: 'URL контента (ссылка на облако/страницу, если не загружается pdfFile)',
				},
				previewImage: { type: 'string', format: 'binary', description: 'Изображение обложки (обязательно для книг)' },
				pdfFile: { type: 'string', format: 'binary', description: 'PDF файл для загрузки (для книг)' },
				slug: { type: 'string', description: 'Slug URL (только для статей)' },
				publishedAt: { type: 'string', format: 'date-time', description: 'Дата публикации (только для статей)' },
				isDraft: { type: 'boolean', description: 'Черновик (только для статей)' },
				blocks: { type: 'string', description: 'JSON массив блоков контента (только для статей)' },
			},
			required: ['type', 'title', 'isPublished'],
		},
	})
	@ApiCreatedResponse({ type: LibraryItem, description: 'Library item created' })
	@ApiResponse({ status: 400, description: 'Bad request - validation failed' })
	create(
		@Body() dto: CreateLibraryItemDto,
		@UploadedFiles()
		files?: {
			previewImage?: UploadFile[];
			pdfFile?: UploadFile[];
		},
	) {
		return this.libraryService.create(dto, files, this.fileUploadService);
	}

	@Patch(':id')
	@UseGuards(JwtAuthGuard)
	@UseInterceptors(
		FileFieldsInterceptor([
			{ name: 'previewImage', maxCount: 1 },
			{ name: 'pdfFile', maxCount: 1 },
		]),
	)
	@ApiBearerAuth()
	@ApiConsumes('multipart/form-data')
	@ApiBody({
		description: 'Обновление элемента библиотеки с загрузкой файлов',
		schema: {
			type: 'object',
			properties: {
				type: { type: 'string', enum: ['book', 'article'] },
				title: { type: 'string' },
				isPublished: { type: 'boolean' },
				categoryId: { type: 'number', description: 'ID категории' },
				createNewCategory: { type: 'string', description: 'Создать новую категорию с этим именем' },
				description: { type: 'string' },
				contentUrl: { type: 'string', description: 'URL контента (ссылка на облако/страницу)' },
				pdfFile: { type: 'string', format: 'binary', description: 'PDF файл для загрузки' },
				previewImage: { type: 'string', format: 'binary', description: 'Изображение обложки для загрузки' },
				slug: { type: 'string', description: 'Slug URL (только для статей)' },
				publishedAt: { type: 'string', format: 'date-time', description: 'Дата публикации (только для статей)' },
				isDraft: { type: 'boolean', description: 'Черновик (только для статей)' },
				blocks: { type: 'string', description: 'JSON массив блоков контента (только для статей)' },
			},
		},
	})
	@ApiOkResponse({ type: LibraryItem, description: 'Library item updated' })
	@ApiResponse({ status: 400, description: 'Bad request - validation failed' })
	@ApiResponse({ status: 404, description: 'Library item with ID not found' })
	update(
		@Param('id', ParseIntPipe) id: number,
		@Body() dto: UpdateLibraryItemDto,
		@UploadedFiles()
		files?: {
			previewImage?: UploadFile[];
			pdfFile?: UploadFile[];
		},
	) {
		return this.libraryService.update(id, dto, files, this.fileUploadService);
	}

	@Delete(':id')
	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth()
	@HttpCode(204)
	@ApiResponse({ status: 204, description: 'Library item deleted successfully' })
	@ApiResponse({ status: 404, description: 'Library item with ID not found' })
	remove(@Param('id', ParseIntPipe) id: number) {
		return this.libraryService.remove(id, this.fileUploadService);
	}
}




