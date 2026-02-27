import { Controller, Get, Post, Patch, Delete, Body, Param, UseInterceptors, UploadedFile, UseGuards, Query } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes, ApiBody, ApiParam, ApiQuery } from '@nestjs/swagger';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { FileUploadService } from '../file-upload/file-upload.service';
import { JwtAuthGuard } from '../admin/jwt-auth.guard';
import { ProjectService } from './project.service';
import { Project } from './entities/project.entity';

@ApiTags('projects')
@Controller('projects')
export class ProjectController {
	constructor(
		private readonly projectService: ProjectService,
		private readonly fileUploadService: FileUploadService,
	) {}

	/**
	 * Получить список проектов
	 * @param isDraft — фильтр по статусу (необязательный)
	 *   - undefined: все проекты (сортировка по дате публикации, новые первые)
	 *   - true: только черновики
	 *   - false: только опубликованные с датой <= текущей
	 */
	@Get()
	@ApiOperation({ summary: 'Получить список всех проектов' })
	@ApiResponse({ status: 200, description: 'Список проектов', type: [Project] })
	@ApiQuery({ 
		name: 'isDraft', 
		required: false, 
		type: Boolean, 
		description: 'Фильтр по статусу: не указано - все проекты, true - только черновики, false - только опубликованные' 
	})
	findAll(
		@Query('isDraft') isDraft?: string
	): Promise<Project[]> {
		let isDraftBool: boolean | undefined = undefined;
		if (isDraft !== undefined) {
			isDraftBool = isDraft.toLowerCase() === 'true' || isDraft === '1';
		}
		return this.projectService.findAll({ isDraft: isDraftBool });
	}


	@Get(':id')
	@ApiOperation({ summary: 'Получить проект по id' })
	@ApiParam({ name: 'id', description: 'ID проекта' })
	@ApiResponse({ status: 200, description: 'Проект', type: Project })
	@ApiResponse({ status: 404, description: 'Project not found' })
	findOne(@Param('id') id: string): Promise<Project> {
		return this.projectService.findOne(id);
	}


	@Post()
	@UseGuards(JwtAuthGuard)
	@ApiOperation({ summary: 'Создать проект' })
	@ApiConsumes('multipart/form-data')
	@ApiBody({ type: CreateProjectDto })
	@ApiResponse({ status: 201, description: 'Проект создан', type: Project })
	@UseInterceptors(FileInterceptor('previewImage'))
	async create(
		@Body() body: any,
		@UploadedFile() previewImage?: any,
	): Promise<Project> {
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
				'projects',
			);
		}

		let blocks = body.blocks;
		if (typeof blocks === 'string') {
			try {
				blocks = JSON.parse(blocks);
			} catch (e) {
				blocks = [];
			}
		}

		return this.projectService.create({ ...body, blocks, previewImage: previewImageUrl });
	}


	@Patch(':id')
	@UseGuards(JwtAuthGuard)
	@ApiOperation({ summary: 'Обновить превью-изображение проекта' })
	@ApiParam({ name: 'id', description: 'ID проекта' })
	@ApiConsumes('multipart/form-data')
	@ApiBody({
		description: 'Данные для обновления проекта',
		type: UpdateProjectDto,
	})
	@ApiResponse({ status: 200, description: 'Проект обновлён', type: Project })
	@UseInterceptors(FileInterceptor('previewImage'))
	async update(
		@Param('id') id: string,
		@Body() updateDto: UpdateProjectDto,
		@UploadedFile() previewImage?: any,
	): Promise<Project> {
		let previewImageUrl = updateDto.previewImage;
		if (previewImage) {
			previewImageUrl = await this.fileUploadService.upload(
				{
					buffer: previewImage.buffer,
					originalname: previewImage.originalname,
					mimetype: previewImage.mimetype,
					size: previewImage.size,
				},
				'image',
				'projects',
			);
		}

		let blocks = updateDto.blocks;
		if (typeof blocks === 'string') {
			try {
				blocks = JSON.parse(blocks);
			} catch (e) {
				blocks = undefined;
			}
		}

		return this.projectService.update(id, { ...updateDto, blocks, previewImage: previewImageUrl });
	}

	@Delete(':id')
	@UseGuards(JwtAuthGuard)
	@ApiOperation({ summary: 'Удалить проект по id' })
	@ApiParam({ name: 'id', description: 'ID проекта' })
	@ApiResponse({ status: 200, description: 'Проект удалён' })
	async remove(@Param('id') id: string): Promise<{ success: boolean }> {
		await this.projectService.remove(id);
		return { success: true };
	}
}



