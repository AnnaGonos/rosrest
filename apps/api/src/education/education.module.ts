import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminModule } from '../admin/admin.module';
import { FileUploadModule } from '../file-upload/file-upload.module';
import { EducationController } from './education.controller';
import { EducationService } from './education.service';
import { EducationInstitution } from './entities/education-institution.entity';

@Module({
	imports: [TypeOrmModule.forFeature([EducationInstitution]), AdminModule, FileUploadModule],
	controllers: [EducationController],
	providers: [EducationService],
})
export class EducationModule { }

