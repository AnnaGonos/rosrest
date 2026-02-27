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
	ParseUUIDPipe,
	ParseIntPipe,
	UseGuards,
	UseInterceptors,
	UploadedFile,
	UploadedFiles,
	ValidationPipe,
} from '@nestjs/common';
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
import { FileInterceptor, AnyFilesInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../admin/jwt-auth.guard';
import { FileUploadService } from '../file-upload/file-upload.service';
import { Document } from './entities/document.entity';
import { DocumentCategory } from './entities/document-category.entity';
import { DocumentType } from './enums/document-type.enum';
import { DocumentService } from './document.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { CreateDocumentCategoryDto } from './dto/create-document-category.dto';
import { UpdateDocumentCategoryDto } from './dto/update-document-category.dto';

interface UploadFile {
	buffer: Buffer;
	originalname: string;
	mimetype: string;
	size: number;
	fieldname: string;
}

@ApiTags('documents')
@Controller('documents')
export class DocumentController {
	constructor(
		private readonly documentService: DocumentService,
		private readonly fileUploadService: FileUploadService,
	) {}

	@Get()
	@ApiOkResponse({ type: Document, isArray: true })
	@ApiQuery({ name: 'type', required: false, enum: DocumentType })
	@ApiQuery({ name: 'categoryId', required: false, type: Number })
	@ApiQuery({ name: 'subcategoryId', required: false, type: Number })
	@ApiQuery({ name: 'isPublished', required: false, type: Boolean, description: 'Filter by publication status. If not provided, returns all documents' })
	async findAll(
		@Query('type') type?: DocumentType,
		@Query('categoryId') categoryId?: string,
		@Query('subcategoryId') subcategoryId?: string,
		@Query('isPublished') isPublished?: string,
	) {
		const parsedCategoryId = categoryId ? parseInt(categoryId, 10) : undefined;
		const parsedSubcategoryId = subcategoryId ? parseInt(subcategoryId, 10) : undefined;
		const parsedIsPublished = isPublished !== undefined ? isPublished === 'true' : undefined;
		return await this.documentService.findAllDocuments(type, parsedCategoryId, parsedSubcategoryId, parsedIsPublished);
	}

	@Get(':id')
	@ApiOkResponse({ type: Document })
	@ApiResponse({ status: 404, description: 'Document not found' })
	async findOne(@Param('id', new ParseUUIDPipe()) id: string) {
		return await this.documentService.findOneDocument(id);
	}

	@Post()
	@UseGuards(JwtAuthGuard)
	@UseInterceptors(AnyFilesInterceptor())
	@ApiBearerAuth()
	@ApiConsumes('multipart/form-data')
	@ApiBody({
		description: 'Создание документа: загрузите PDF файл и/или превью изображение',
		schema: {
			type: 'object',
			properties: {
				title: { type: 'string', example: 'Письмо Минэкономразвития от 25.06.2012' },
				type: { type: 'string', enum: ['charter', 'contracts', 'documents'], example: 'charter' },
				categoryId: { type: 'number', example: 1, description: 'ID категории (используется когда нет подкатегории)' },
				subcategoryId: { type: 'number', example: 2, description: 'ID подкатегории (категория берётся из parent)' },
				pdfUrl: { type: 'string', example: 'https://drive.google.com/file/d/abc/doc.pdf', description: 'URL на PDF (либо загрузите pdfFile)' },
				previewUrl: { type: 'string', example: 'https://drive.google.com/file/d/xyz/preview.jpg', description: 'URL на превью изображение (либо загрузите previewFile)' },
				isPublished: { type: 'boolean', example: true },
				pdfFile: { type: 'string', format: 'binary', description: 'PDF файл документа (либо укажите pdfUrl)' },
				previewFile: { type: 'string', format: 'binary', description: 'Превью изображение (JPG, PNG)' },
			},
			required: ['title', 'type'],
		},
	})
	@ApiCreatedResponse({ type: Document })
	@ApiResponse({ status: 400, description: 'Bad request' })
	async create(
		@Body(new ValidationPipe({ transform: true, whitelist: false })) dto: CreateDocumentDto,
		@UploadedFiles() files?: UploadFile | UploadFile[]
	) {
		const fileMap: { pdfFile?: UploadFile, previewFile?: UploadFile } = {};
		if (files) {
			if (Array.isArray(files)) {
				for (const f of files) {
					if (f.fieldname === 'pdfFile') fileMap.pdfFile = f;
					if (f.fieldname === 'previewFile') fileMap.previewFile = f;
				}
			} else {
				if (files.fieldname === 'pdfFile') fileMap.pdfFile = files;
				if (files.fieldname === 'previewFile') fileMap.previewFile = files;
			}
		}
		return await this.documentService.create(dto, fileMap.pdfFile, this.fileUploadService, fileMap.previewFile);
	}

	@Patch(':id')
	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth()
	@ApiOkResponse({ type: Document })
	@ApiResponse({ status: 400, description: 'Bad request' })
	@ApiResponse({ status: 404, description: 'Document not found' })
	async update(
		@Param('id', new ParseUUIDPipe()) id: string,
		@Body(new ValidationPipe({ transform: true, whitelist: false })) dto: UpdateDocumentDto,
	) {
		return await this.documentService.updateDocument(id, dto);
	}

	@Delete(':id')
	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth()
	@HttpCode(204)
	@ApiResponse({ status: 204, description: 'Document deleted' })
	@ApiResponse({ status: 404, description: 'Document not found' })
	async remove(@Param('id', new ParseUUIDPipe()) id: string) {
		return await this.documentService.removeDocument(id);
	}
}

@ApiTags('document-categories')
@Controller('document-categories')
export class DocumentCategoryController {
	constructor(private readonly documentService: DocumentService) {}

	@Get('tree')
	@ApiOkResponse({ type: DocumentCategory, isArray: true })
	async getTree() {
		return await this.documentService.getCategoryTree();
	}

	@Get(':id')
	@ApiOkResponse({ type: DocumentCategory })
	@ApiResponse({ status: 404, description: 'Category not found' })
	async findOne(@Param('id', new ParseIntPipe()) id: number) {
		return await this.documentService.findOneCategory(id);
	}

	@Post()
	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth()
	@ApiBody({
		description: 'Создание категории документов',
		schema: {
			type: 'object',
			properties: {
				name: { type: 'string', example: 'Разъяснения госорганов по вопросам деятельности' },
				slug: { type: 'string', example: 'razjasnenija-gosorganov', description: 'URL адрес категории (только латиница, цифры и дефисы)' },
				parentId: { type: 'number', example: 1, description: 'ID родительской категории (опционально)' },
				icon: { type: 'string', example: 'bi-folder', description: 'Иконка (только для корневых категорий)' },
			},
			required: ['name'],
		},
	})
	@ApiCreatedResponse({ type: DocumentCategory })
	@ApiResponse({ status: 400, description: 'Bad request' })
	async create(@Body(new ValidationPipe({ transform: true, whitelist: false })) dto: CreateDocumentCategoryDto) {
		return await this.documentService.createCategory(dto);
	}

	@Patch(':id')
	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth()
	@ApiBody({
		description: 'Обновление категории',
		schema: {
			type: 'object',
			properties: {
				name: { type: 'string' },
				parentId: { type: 'number' },
				slug: { type: 'string' },
				icon: { type: 'string' },
			},
		},
	})
	@ApiOkResponse({ type: DocumentCategory })
	@ApiResponse({ status: 400, description: 'Bad request' })
	@ApiResponse({ status: 404, description: 'Category not found' })
	async update(@Param('id', new ParseIntPipe()) id: number, @Body() dto: UpdateDocumentCategoryDto) {
		return await this.documentService.updateCategory(id, dto);
	}

	@Delete(':id')
	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth()
	@HttpCode(204)
	@ApiResponse({ status: 204, description: 'Category deleted' })
	@ApiResponse({ status: 404, description: 'Category not found' })
	async remove(@Param('id', new ParseIntPipe()) id: number) {
		return await this.documentService.removeCategory(id);
	}
}




