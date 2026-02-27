import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Page } from './entities/page.entity';
import { Block } from './entities/block.entity';
import { PageService } from './page.service';
import { PageController } from './page.controller';
import { AdminModule } from '../admin/admin.module';

@Module({
  imports: [TypeOrmModule.forFeature([Page, Block]), AdminModule],
  providers: [PageService],
  controllers: [PageController],
  exports: [PageService],
})
export class PageModule { }
