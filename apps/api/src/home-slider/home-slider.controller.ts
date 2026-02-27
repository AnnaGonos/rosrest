import {
	Body,
	Controller,
	Delete,
	Get,
	HttpCode,
	Param,
	Post,
	ParseIntPipe,
	UseGuards,
	UseInterceptors,
	UploadedFile,
	BadRequestException,
} from '@nestjs/common';
import {
	ApiCreatedResponse,
	ApiOkResponse,
	ApiResponse,
	ApiTags,
	ApiBearerAuth,
	ApiConsumes,
	ApiBody,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../admin/jwt-auth.guard';
import { FileUploadService } from '../file-upload/file-upload.service';
import { HomeSlide } from './entities/home-slide.entity';
import { HomeSliderService } from './home-slider.service';

interface UploadFile {
	buffer: Buffer;
	originalname: string;
	mimetype: string;
	size: number;
}

@ApiTags('home-slider')
@Controller('home-slider')
export class HomeSliderController {
	constructor(
		private readonly sliderService: HomeSliderService,
		private readonly fileUploadService: FileUploadService,
	) {}

	@Get()
	@ApiOkResponse({ type: HomeSlide, isArray: true, description: 'Получить все слайды (от новых к старым)' })
	async findAll() {
		return await this.sliderService.findAll();
	}

	@Post()
	@UseGuards(JwtAuthGuard)
	@UseInterceptors(FileInterceptor('image'))
	@ApiBearerAuth()
	@ApiConsumes('multipart/form-data', 'application/json')
	@ApiBody({
		description: 'Добавление изображения в слайдер главной страницы (файл или URL)',
		schema: {
			type: 'object',
			properties: {
				image: { type: 'string', format: 'binary', description: 'Изображение для слайдера (файл)' },
				imageUrl: { type: 'string', description: 'Прямая ссылка на изображение', example: 'https://example.com/image.jpg' },
			},
		},
	})
	@ApiCreatedResponse({ type: HomeSlide, description: 'Слайд создан' })
	@ApiResponse({ status: 400, description: 'Bad request - необходимо передать файл или ссылку на изображение' })
	async create(@UploadedFile() file?: UploadFile, @Body('imageUrl') imageUrl?: string) {
		if (file) {
			return await this.sliderService.createFromFile(file, this.fileUploadService);
		}

		if (imageUrl) {
			return await this.sliderService.createFromUrl(imageUrl);
		}

		throw new BadRequestException('Необходимо передать файл или ссылку на изображение');
	}

	@Delete(':id')
	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth()
	@HttpCode(204)
	@ApiResponse({ status: 204, description: 'Слайд удален' })
	@ApiResponse({ status: 404, description: 'Слайд не найден' })
	async remove(@Param('id', ParseIntPipe) id: number) {
		return await this.sliderService.remove(id);
	}
}


