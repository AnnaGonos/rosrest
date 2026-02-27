import { Controller, Get, Post, Patch, Delete, Body, Param, UseInterceptors, UploadedFile, UseGuards, NotFoundException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes, ApiBody, ApiParam } from '@nestjs/swagger';
import { CreateForJournalistDto } from './dto/create-for-journalist.dto';
import { UpdateForJournalistDto } from './dto/update-for-journalist.dto';
import { FileUploadService } from '../file-upload/file-upload.service';
import { JwtAuthGuard } from '../admin/jwt-auth.guard';
import { ForJournalistService } from './for-journalist.service';
import { ForJournalist } from './entities/for-journalist.entity';

@ApiTags('for-journalist')
@Controller('for-journalist')
export class ForJournalistController {
	constructor(
		private readonly forJournalistService: ForJournalistService,
		private readonly fileUploadService: FileUploadService,
	) {}

	@Get()
	@ApiOperation({ summary: 'Получить страницу для журналистов' })
	@ApiResponse({ status: 200, description: 'Страница для журналистов', type: ForJournalist })
	@ApiResponse({ status: 404, description: 'Страница не найдена' })
	async findOne(): Promise<ForJournalist> {
		const result = await this.forJournalistService.findOne();
		if (!result) {
			throw new NotFoundException('Страница для журналистов не найдена');
		}
		return result;
	}

	@Post()
	@UseGuards(JwtAuthGuard)
	@ApiOperation({ summary: 'Создать страницу для журналистов' })
	@ApiConsumes('multipart/form-data')
	@ApiBody({ type: CreateForJournalistDto })
	@ApiResponse({ status: 201, description: 'Страница создана', type: ForJournalist })
	@UseInterceptors(FileInterceptor('previewImage'))
	async create(
		@Body() body: any,
		@UploadedFile() previewImage?: any,
	): Promise<ForJournalist> {

		let previewImageUrl = body.previewImage;
		if (previewImage) {
			previewImageUrl = await this.fileUploadService.upload(
				{
					buffer: previewImage.buffer,
					originalname: previewImage.originalname,
					mimetype: previewImage.mimetype,
					size: previewImage.size,
				},
				'image',
				'for-journalist',
			);
		}

		let blocks = body.blocks;
		if (typeof blocks === 'string') {
			try {
				blocks = JSON.parse(blocks);
			} catch (e) {
				console.error('❌ Failed to parse blocks:', e);
				blocks = [];
			}
		}

		return this.forJournalistService.create({ ...body, blocks, previewImage: previewImageUrl });
	}

	@Patch(':id')
	@UseGuards(JwtAuthGuard)
	@ApiOperation({ summary: 'Обновить страницу для журналистов' })
	@ApiParam({ name: 'id', description: 'ID страницы' })
	@ApiConsumes('multipart/form-data')
	@ApiBody({
		description: 'Данные для обновления страницы',
		type: UpdateForJournalistDto,
	})
	@ApiResponse({ status: 200, description: 'Страница обновлена', type: ForJournalist })
	@UseInterceptors(FileInterceptor('previewImage'))
	async update(
		@Param('id') id: string,
		@Body() body: any, 
		@UploadedFile() previewImage?: any,
	): Promise<ForJournalist> {
		
		let previewImageUrl = body.previewImage;
		if (previewImage) {
			previewImageUrl = await this.fileUploadService.upload(
				{
					buffer: previewImage.buffer,
					originalname: previewImage.originalname,
					mimetype: previewImage.mimetype,
					size: previewImage.size,
				},
				'image',
				'for-journalist',
			);
		}

		let blocks = body.blocks;
		if (typeof blocks === 'string') {
			try {
				blocks = JSON.parse(blocks);
			} catch (e) {
				console.error('❌ Update - Failed to parse blocks:', e);
				blocks = undefined;
			}
		}

		return this.forJournalistService.update(id, { ...body, blocks, previewImage: previewImageUrl });
	}

	@Delete(':id')
	@UseGuards(JwtAuthGuard)
	@ApiOperation({ summary: 'Удалить страницу для журналистов' })
	@ApiParam({ name: 'id', description: 'ID страницы' })
	@ApiResponse({ status: 200, description: 'Страница удалена' })
	async delete(@Param('id') id: string): Promise<void> {
		return this.forJournalistService.delete(id);
	}
}
