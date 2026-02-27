import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ForJournalist } from './entities/for-journalist.entity';
import { ForJournalistService } from './for-journalist.service';
import { ForJournalistController } from './for-journalist.controller';
import { Page } from '../page/entities/page.entity';
import { Block } from '../page/entities/block.entity';
import { FileUploadModule } from '../file-upload/file-upload.module';
import { AdminModule } from '../admin/admin.module';

@Module({
  imports: [TypeOrmModule.forFeature([ForJournalist, Page, Block]), FileUploadModule, AdminModule],
  providers: [ForJournalistService],
  controllers: [ForJournalistController],
})
export class ForJournalistModule {}
