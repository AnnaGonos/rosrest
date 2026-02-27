import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminModule } from '../admin/admin.module';
import { FileUploadModule } from '../file-upload/file-upload.module';
import { Document } from './entities/document.entity';
import { DocumentCategory } from './entities/document-category.entity';
import { DocumentController, DocumentCategoryController } from './document.controller';
import { DocumentService } from './document.service';

@Module({
	imports: [
		TypeOrmModule.forFeature([Document, DocumentCategory]),
		AdminModule,
		FileUploadModule,
	],
	controllers: [DocumentController, DocumentCategoryController],
	providers: [DocumentService],
})
export class DocumentModule {}

