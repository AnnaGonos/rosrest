import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RarMember } from './entities/rar-member.entity';
import { RarSection } from './entities/rar-section.entity';
import { RarMemberService } from './rar-member.service';
import { RarSectionService } from './rar-section.service';
import { RarMemberController } from './rar-member.controller';
import { RarSectionController } from './rar-section.controller';
import { Page } from '../page/entities/page.entity';
import { Block } from '../page/entities/block.entity';
import { FileUploadModule } from '../file-upload/file-upload.module';
import { AdminModule } from '../admin/admin.module';

@Module({
  imports: [TypeOrmModule.forFeature([RarMember, RarSection, Page, Block]), FileUploadModule, AdminModule],
  providers: [RarMemberService, RarSectionService],
  controllers: [RarMemberController, RarSectionController],
})
export class RarMemberModule { }
