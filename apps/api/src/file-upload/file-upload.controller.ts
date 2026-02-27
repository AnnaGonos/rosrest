import { Controller, Delete, Get, Param, UseGuards, Post, UseInterceptors, UploadedFile, Body, Query } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOkResponse, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { FileUploadService } from './file-upload.service';
import { JwtAuthGuard } from '../admin/jwt-auth.guard';

@ApiTags('files')
@Controller('files')
export class FileUploadController {
	constructor(private readonly fileUploadService: FileUploadService) {}

	@Post('upload')
	@UseGuards(JwtAuthGuard)
	@UseInterceptors(FileInterceptor('file'))
	async upload(
		@UploadedFile() file: any,
		@Body('type') type: string = 'file',
		@Body('folder') folder: string = 'blocks',
	): Promise<{ url: string }> {
		const url = await this.fileUploadService.upload(
			{
				buffer: file.buffer,
				originalname: file.originalname,
				mimetype: file.mimetype,
				size: file.size,
			},
			type as any,
			folder,
		);
		return { url };
	}

	@Get()
	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth()
	@ApiOkResponse({ description: 'Список всех загруженных файлов' })


	listFiles(@Query('folder') folder?: string) {
		return this.fileUploadService.listFiles(folder);
	}

	@Get('library')
	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth()
	@ApiOkResponse({ description: 'Пагинированный список файлов для медиа‑библиотеки' })
	@ApiQuery({ name: 'folder', required: false, description: 'Подпапка внутри uploads, по умолчанию library/images' })
	@ApiQuery({ name: 'page', required: false, description: 'Номер страницы (начиная с 1)', type: Number })
	@ApiQuery({ name: 'limit', required: false, description: 'Размер страницы (кол-во элементов)', type: Number })
	getMediaLibrary(
		@Query('folder') folder?: string,
		@Query('page') page: string = '1',
		@Query('limit') limit: string = '50',
	) {
		const effectiveFolder = folder || 'library/images';
		const pageNum = Math.max(parseInt(page, 10) || 1, 1);
		const limitNum = Math.max(Math.min(parseInt(limit, 10) || 50, 200), 1);

		const allFiles = this.fileUploadService.listFiles(effectiveFolder);
		const total = allFiles.length;
		const start = (pageNum - 1) * limitNum;
		const end = start + limitNum;
		const items = allFiles.slice(start, end);

		return {
			items,
			total,
			page: pageNum,
			limit: limitNum,
		};
	}

	@Delete(':filename')
	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth()
	@ApiOkResponse({ description: 'Файл успешно удалён' })
	@ApiResponse({ status: 404, description: 'Файл не найден' })
	deleteFile(@Param('filename') filename: string) {
		const filePath = `/uploads/${filename}`;
		this.fileUploadService.delete(filePath);
		return { message: 'File deleted successfully' };
	}
}




