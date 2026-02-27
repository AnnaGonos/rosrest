import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Query, UseInterceptors, UploadedFiles } from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes, ApiBody, ApiParam, ApiQuery } from '@nestjs/swagger';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { JwtAuthGuard } from '../admin/jwt-auth.guard';
import { ServiceService } from './service.service';
import { Service } from './entities/service.entity';
import { FileUploadService } from '../file-upload/file-upload.service';

@ApiTags('services')
@Controller('services')
export class ServiceController {
	constructor(
		private readonly serviceService: ServiceService,
		private readonly fileUploadService: FileUploadService,
	) { }

	@Get()
	@ApiOperation({ summary: 'Получить список всех услуг' })
	@ApiResponse({ status: 200, description: 'Список услуг', type: [Service] })
	@ApiQuery({
		name: 'isDraft',
		required: false,
		type: Boolean,
		description: 'Фильтр по статусу: не указано - все услуги, true - только черновики, false - только опубликованные'
	})
	findAll(
		@Query('isDraft') isDraft?: string
	): Promise<Service[]> {
		let isDraftBool: boolean | undefined = undefined;
		if (isDraft !== undefined) {
			isDraftBool = isDraft.toLowerCase() === 'true' || isDraft === '1';
		}
		return this.serviceService.findAll({ isDraft: isDraftBool });
	}


	@Get(':id')
	@ApiOperation({ summary: 'Получить услугу по id' })
	@ApiParam({ name: 'id', description: 'ID услуги' })
	@ApiResponse({ status: 200, description: 'Услуга', type: Service })
	@ApiResponse({ status: 404, description: 'Service not found' })
	findOne(@Param('id') id: string): Promise<Service> {
		return this.serviceService.findOne(id);
	}


	@Post()
	@UseGuards(JwtAuthGuard)
	@ApiOperation({ summary: 'Создать услугу' })
	@ApiConsumes('multipart/form-data')
	@ApiBody({ type: CreateServiceDto })
	@ApiResponse({ status: 201, description: 'Услуга создана', type: Service })
	@UseInterceptors(FileFieldsInterceptor([
		{ name: 'contactPhotos', maxCount: 10 }
	]))
	async create(
		@Body() body: any,
		@UploadedFiles() files?: { contactPhotos?: any[] },
	): Promise<Service> {
		let contacts = [];
		if (body.contacts) {
			try {
				const contactsData = typeof body.contacts === 'string' ? JSON.parse(body.contacts) : body.contacts;
				if (Array.isArray(contactsData)) {
					let fileIndex = 0;
					contacts = await Promise.all(contactsData.map(async (contact: any, idx: number) => {
						let photoUrl = contact.photo;

						if ((!photoUrl || photoUrl.trim() === '') && files?.contactPhotos && fileIndex < files.contactPhotos.length) {
							const file = files.contactPhotos[fileIndex];
							photoUrl = await this.fileUploadService.upload(
								{
									buffer: file.buffer,
									originalname: file.originalname,
									mimetype: file.mimetype,
									size: file.size,
								},
								'image',
								'services/contacts',
							);
							fileIndex++;
						}
						return {
							...contact,
							photo: photoUrl,
							order: typeof contact.order === 'number' ? contact.order : idx
						};
					}));
				}
			} catch (e) {
				console.error('Error parsing contacts:', e);
			}
		}

		return this.serviceService.create({ ...body, contacts });
	}


	@Patch(':id')
	@UseGuards(JwtAuthGuard)
	@ApiOperation({ summary: 'Обновить услугу' })
	@ApiParam({ name: 'id', description: 'ID услуги' })
	@ApiConsumes('multipart/form-data')
	@ApiBody({
		description: 'Данные для обновления услуги',
		type: UpdateServiceDto,
	})
	@ApiResponse({ status: 200, description: 'Услуга обновлена', type: Service })
	@UseInterceptors(FileFieldsInterceptor([
		{ name: 'contactPhotos', maxCount: 10 }
	]))
	async update(
		@Param('id') id: string,
		@Body() body: any,
		@UploadedFiles() files?: { contactPhotos?: any[] },
	): Promise<Service> {
		let contacts = [];
		if (body.contacts) {
			try {
				const contactsData = typeof body.contacts === 'string' ? JSON.parse(body.contacts as any) : body.contacts;
				if (Array.isArray(contactsData)) {
					let fileIndex = 0;
					contacts = await Promise.all(contactsData.map(async (contact: any, idx: number) => {
						let photoUrl = contact.photo;

						if ((!photoUrl || photoUrl.trim() === '') && files?.contactPhotos && fileIndex < files.contactPhotos.length) {
							const file = files.contactPhotos[fileIndex];
							photoUrl = await this.fileUploadService.upload(
								{
									buffer: file.buffer,
									originalname: file.originalname,
									mimetype: file.mimetype,
									size: file.size,
								},
								'image',
								'services/contacts',
							);
							fileIndex++;
						}
						return {
							...contact,
							photo: photoUrl,
							order: typeof contact.order === 'number' ? contact.order : idx
						};
					}));
				}
			} catch (e) {
				console.error('Error parsing contacts:', e);
			}
		}

		return this.serviceService.update(id, { ...body, contacts });
	}

	@Delete(':id')
	@UseGuards(JwtAuthGuard)
	@ApiOperation({ summary: 'Удалить услугу по id' })
	@ApiParam({ name: 'id', description: 'ID услуги' })
	@ApiResponse({ status: 200, description: 'Услуга удалена' })
	async remove(@Param('id') id: string): Promise<{ success: boolean }> {
		await this.serviceService.remove(id);
		return { success: true };
	}
}
