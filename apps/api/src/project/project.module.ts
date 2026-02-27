import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Project } from './entities/project.entity';
import { ProjectService } from './project.service';
import { ProjectController } from './project.controller';
import { Page } from '../page/entities/page.entity';
import { Block } from '../page/entities/block.entity';
import { FileUploadModule } from '../file-upload/file-upload.module';
import { AdminModule } from '../admin/admin.module';

@Module({
  imports: [TypeOrmModule.forFeature([Project, Page, Block]), FileUploadModule, AdminModule],
  providers: [ProjectService],
  controllers: [ProjectController],
})
export class ProjectModule { }
