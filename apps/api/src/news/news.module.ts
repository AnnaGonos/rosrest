import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { News } from './entities/news.entity';
import { NewsTag } from './entities/news-tag.entity';
import { NewsService } from './news.service';
import { NewsController } from './news.controller';
import { Page } from '../page/entities/page.entity';
import { Block } from '../page/entities/block.entity';
import { FileUploadModule } from '../file-upload/file-upload.module';
import { AdminModule } from '../admin/admin.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([News, NewsTag, Page, Block]),
    FileUploadModule,
    AdminModule,
  ],
  providers: [NewsService],
  controllers: [NewsController],
  exports: [NewsService],
})
export class NewsModule {}
