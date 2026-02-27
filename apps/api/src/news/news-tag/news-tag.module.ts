import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NewsTag } from '../entities/news-tag.entity';
import { NewsTagService } from './news-tag.service';
import { NewsTagController } from './news-tag.controller';
import { AdminModule } from '../../admin/admin.module';

@Module({
  imports: [TypeOrmModule.forFeature([NewsTag]), AdminModule],
  providers: [NewsTagService],
  controllers: [NewsTagController],
  exports: [NewsTagService],
})
export class NewsTagModule { }
