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
	UploadedFile,
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
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../admin/jwt-auth.guard';
import { FileUploadService } from '../file-upload/file-upload.service';
import { EducationInstitution } from './entities/education-institution.entity';
import { EducationService } from './education.service';
import { CreateEducationDto } from './dto/create-education.dto';
import { UpdateEducationDto } from './dto/update-education.dto';
import { EducationType } from './enums/education-type.enum';

interface UploadFile {
	buffer: Buffer;
	originalname: string;
	mimetype: string;
	size: number;
}

@ApiTags('education')
@Controller('education')
export class EducationController {
	constructor(
		private readonly educationService: EducationService,
		private readonly fileUploadService: FileUploadService,
	) {}

	@Get()
	@ApiOkResponse({ type: EducationInstitution, isArray: true })
	@ApiQuery({ name: 'type', enum: EducationType, required: false })
	findAll(@Query('type') type?: EducationType) {
		return this.educationService.findAll(type);
	}

	@Post()
	@UseGuards(JwtAuthGuard)
	@UseInterceptors(FileInterceptor('imageFile'))
	@ApiBearerAuth()
	@ApiConsumes('multipart/form-data')
	@ApiBody({
		description: 'Создание образовательного учреждения с загрузкой лого',
		schema: {
			type: 'object',
			properties: {
				type: { type: 'string', enum: ['higher', 'secondary', 'professional_development'], example: 'higher' },
				name: { type: 'string', example: 'Московский государственный академический художественный институт' },
				websiteUrl: { type: 'string', example: 'https://www.mghpu.ru/' },
				specialties: { type: 'array', items: { type: 'string' }, example: ['Реставратор строительный'] },
				imageFile: { type: 'string', format: 'binary', description: 'Лого учреждения (вариант 1 - загрузка файла)' },
				imageUrl: { type: 'string', description: 'Лого учреждения (вариант 2 - ссылка на изображение)' },
			},
			required: ['type', 'name', 'websiteUrl'],
		},
	})
	@ApiCreatedResponse({ type: EducationInstitution, description: 'Education institution created' })
	@ApiResponse({ status: 400, description: 'Bad request - validation failed' })
	async create(@Body() dto: CreateEducationDto, @UploadedFile() file?: UploadFile) {
		return await this.educationService.create(dto, file, this.fileUploadService);
	}
	
	@Get(':id')
	@ApiOkResponse({ type: EducationInstitution, description: 'Education institution found' })
	@ApiResponse({ status: 404, description: 'Education institution with ID not found' })
	findOne(@Param('id', ParseIntPipe) id: number) {
		return this.educationService.findOne(id);
	}

	@Patch(':id')
	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth()
	@ApiOkResponse({ type: EducationInstitution, description: 'Education institution updated' })
	@ApiResponse({ status: 400, description: 'Bad request - validation failed' })
	@ApiResponse({ status: 404, description: 'Education institution with ID not found' })
	@UseInterceptors(FileInterceptor('imageFile'))
	@ApiConsumes('multipart/form-data', 'application/json')
	@ApiBody({
			description: 'Обновление образовательного учреждения. Можно изменить данные и/или логотип.',
			schema: {
				type: 'object',
				properties: {
					name: { type: 'string' },
					websiteUrl: { type: 'string' },
					type: { type: 'string', enum: ['higher', 'secondary', 'professional_development'] },
					specialties: { type: 'array', items: { type: 'string' } },
					imageFile: { type: 'string', format: 'binary', description: 'Новый логотип (файл)' },
					imageUrl: { type: 'string', description: 'Новый логотип (URL). Пустое значение очистит логотип.' },
				},
			},
	})
	update(
		@Param('id', ParseIntPipe) id: number,
		@Body() dto: UpdateEducationDto,
		@UploadedFile() file?: UploadFile,
	) {
		return this.educationService.update(id, dto, file, this.fileUploadService);
	}

	@Delete(':id')
	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth()
	@HttpCode(204)
	@ApiResponse({ status: 204, description: 'Education institution deleted successfully' })
	@ApiResponse({ status: 404, description: 'Education institution with ID not found' })
	remove(@Param('id', ParseIntPipe) id: number) {
		return this.educationService.remove(id);
	}
}




