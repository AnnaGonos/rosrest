import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Service } from './entities/service.entity';
import { ServiceContact } from './entities/service-contact.entity';
import { ServiceService } from './service.service';
import { ServiceController } from './service.controller';
import { Page } from '../page/entities/page.entity';
import { Block } from '../page/entities/block.entity';
import { FileUploadModule } from '../file-upload/file-upload.module';
import { AdminModule } from '../admin/admin.module';

@Module({
  imports: [TypeOrmModule.forFeature([Service, ServiceContact, Page, Block]), FileUploadModule, AdminModule],
  providers: [ServiceService],
  controllers: [ServiceController],
})
export class ServiceModule { }
