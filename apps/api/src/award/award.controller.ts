import {
	Body,
	Controller,
	Delete,
	Get,
	HttpCode,
	Param,
	Patch,
	Post,
	ParseUUIDPipe,
	UseGuards,
	UseInterceptors,
	UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
	ApiCreatedResponse,
	ApiOkResponse,
	ApiResponse,
	ApiTags,
	ApiBearerAuth,
	ApiConsumes,
	ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../admin/jwt-auth.guard';
import { Award } from './entities/award.entity';
import { AwardService } from './award.service';
import { CreateAwardDto } from './dto/create-award.dto';
import { UpdateAwardDto } from './dto/update-award.dto';
import { FileUploadService } from '../file-upload/file-upload.service';

interface UploadFile {
	buffer: Buffer;
	originalname: string;
	mimetype: string;
	size: number;
}

@ApiTags('awards')
@Controller('awards')
export class AwardController {
	constructor(
		private readonly awardService: AwardService,
		private readonly fileUploadService: FileUploadService,
	) {}

	@Get()
	@ApiOkResponse({ type: Award, isArray: true })
	findAll() {
		return this.awardService.findAll();
	}

	@Post()
	@UseGuards(JwtAuthGuard)
	@UseInterceptors(FileInterceptor('image'))
	@ApiBearerAuth()
	@ApiConsumes('multipart/form-data')
	@ApiBody({
		description: 'Создание награды с загрузкой изображения',
		schema: {
			type: 'object',
			properties: {
				image: { type: 'string', format: 'binary', description: 'Изображение награды (файл)' },
				imageUrl: {
					type: 'string',
					example: 'https://example.com/award.jpg',
					description: 'Ссылка на изображение награды, если изображение не загружается файлом',
				},
				caption: { type: 'string', example: 'Благодарственное письмо', description: 'Описание награды' },
			},
			required: [],
		},
	})
	@ApiCreatedResponse({ type: Award, description: 'Award created' })
	@ApiResponse({ status: 400, description: 'Bad request - validation failed' })
	create(
		@Body() dto: CreateAwardDto,
		@UploadedFile() file?: UploadFile,
	) {
		return this.awardService.create(dto, file, this.fileUploadService);
	}

	@Get(':id')
	@ApiOkResponse({ type: Award, description: 'Award found' })
	@ApiResponse({ status: 404, description: 'Award with ID not found' })
	findOne(@Param('id', new ParseUUIDPipe()) id: string) {
		return this.awardService.findOne(id);
	}

	@Patch(':id')
	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth()
	@ApiOkResponse({ type: Award, description: 'Award updated' })
	@ApiResponse({ status: 400, description: 'Bad request - validation failed' })
	@ApiResponse({ status: 404, description: 'Award with ID not found' })
	update(
		@Param('id', new ParseUUIDPipe()) id: string,
		@Body() dto: UpdateAwardDto,
	) {
		return this.awardService.update(id, dto);
	}

	@Delete(':id')
	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth()
	@HttpCode(204)
	@ApiResponse({ status: 204, description: 'Award deleted successfully' })
	@ApiResponse({ status: 404, description: 'Award with ID not found' })
	remove(@Param('id', new ParseUUIDPipe()) id: string) {
		return this.awardService.remove(id);
	}
}




