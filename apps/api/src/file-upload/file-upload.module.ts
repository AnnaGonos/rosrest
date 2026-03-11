import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FileUploadService } from './file-upload.service';
import { FileUploadController } from './file-upload.controller';
import { AdminModule } from '../admin/admin.module';
import { FileUploadRepository } from './file-upload.repository';
import { FileEntity } from './entities/file.entity';

@Module({
	imports: [
		forwardRef(() => AdminModule),
		TypeOrmModule.forFeature([FileEntity, FileUploadRepository]),
	],
	controllers: [FileUploadController],
	providers: [FileUploadService],
	exports: [FileUploadService],
})
export class FileUploadModule {}

