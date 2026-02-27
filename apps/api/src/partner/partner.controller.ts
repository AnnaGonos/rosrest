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
	Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
	ApiBadRequestResponse,
	ApiCreatedResponse,
	ApiNotFoundResponse,
	ApiOkResponse,
	ApiResponse,
	ApiTags,
	ApiBearerAuth,
	ApiConsumes,
	ApiBody,
	ApiQuery,
} from '@nestjs/swagger';
import { CreatePartnerDto } from './dto/create-partner.dto';
import { UpdatePartnerDto } from './dto/update-partner.dto';
import { PartnerService } from './partner.service';
import { Partner } from './entities/partner.entity';
import { JwtAuthGuard } from '../admin/jwt-auth.guard';
import { FileUploadService } from '../file-upload/file-upload.service';

interface UploadFile {
	buffer: Buffer;
	originalname: string;
	mimetype: string;
	size: number;
}

@ApiTags('partners')
@Controller('partners')
export class PartnerController {
	constructor(
		private readonly partnerService: PartnerService,
		private readonly fileUploadService: FileUploadService,
	) {}

	@Get()
	@ApiOkResponse({ type: Partner, isArray: true })
	@ApiQuery({ name: 'limit', type: Number, required: false, description: 'Лимит количества партнеров' })
	findAll(@Query('limit') limit?: string) {
		return this.partnerService.findAll(limit ? parseInt(limit, 10) : undefined);
	}

	@Post()
	@UseGuards(JwtAuthGuard)
	@UseInterceptors(FileInterceptor('image'))
	@ApiBearerAuth()
	@ApiConsumes('multipart/form-data')
	@ApiBody({
		description: 'Создание партнера с загрузкой логотипа',
		schema: {
			type: 'object',
			properties: {
				name: { type: 'string', example: 'ICOMOS', description: 'Название партнера' },
				image: { type: 'string', format: 'binary', description: 'Логотип партнера (файл)' },
				imageUrl: {
					type: 'string',
					example: 'https://rosrest.com/uploads/images/partner-logo.png',
					description: 'Ссылка на логотип партнера, если логотип не загружается файлом',
				},
				link: { type: 'string', example: 'https://www.icomos.org/', description: 'Ссылка на сайт партнера' },
			},
			required: ['name'],
		},
	})
	@ApiCreatedResponse({ type: Partner, description: 'Partner created' })
	@ApiResponse({ status: 400, description: 'Bad request - validation failed' })
	create(
		@Body() dto: CreatePartnerDto,
		@UploadedFile() file?: UploadFile,
	) {
		return this.partnerService.create(dto, file, this.fileUploadService);
	}

	@Get(':id')
	@ApiOkResponse({ type: Partner, description: 'Partner found' })
	@ApiResponse({ status: 404, description: 'Partner with ID not found' })
	findOne(@Param('id', new ParseUUIDPipe()) id: string) {
		return this.partnerService.findOne(id);
	}

	@Patch(':id')
	@UseGuards(JwtAuthGuard)
	@UseInterceptors(FileInterceptor('image'))
	@ApiBearerAuth()
	@ApiConsumes('multipart/form-data')
	@ApiBody({
		description: 'Обновление партнера с опциональной загрузкой нового логотипа',
		schema: {
			type: 'object',
			properties: {
				name: { type: 'string', example: 'ICOMOS', description: 'Название партнера' },
				image: { type: 'string', format: 'binary', description: 'Новый логотип партнера (файл, опционально)' },
				imageUrl: {
					type: 'string',
					example: 'https://rosrest.com/uploads/images/partner-logo-new.png',
					description: 'Новая ссылка на логотип партнера (опционально, если логотип задаётся URL)',
				},
				link: { type: 'string', example: 'https://www.icomos.org/', description: 'Ссылка на сайт партнера' },
			},
		},
	})
	@ApiOkResponse({ type: Partner, description: 'Partner updated' })
	@ApiResponse({ status: 400, description: 'Bad request - validation failed' })
	@ApiResponse({ status: 404, description: 'Partner with ID not found' })
	update(
		@Param('id', new ParseUUIDPipe()) id: string,
		@Body() dto: UpdatePartnerDto,
		@UploadedFile() file?: UploadFile,
	) {
		return this.partnerService.update(id, dto, file, this.fileUploadService);
	}

	@Delete(':id')
	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth()
	@HttpCode(204)
	@ApiResponse({ status: 204, description: 'Partner deleted successfully' })
	@ApiResponse({ status: 404, description: 'Partner with ID not found' })
	remove(@Param('id', new ParseUUIDPipe()) id: string) {
		return this.partnerService.remove(id);
	}
}




