import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PartnerController } from './partner.controller';
import { PartnerService } from './partner.service';
import { Partner } from './entities/partner.entity';
import { AdminModule } from '../admin/admin.module';
import { FileUploadModule } from '../file-upload/file-upload.module';

@Module({
  imports: [TypeOrmModule.forFeature([Partner]), AdminModule, FileUploadModule],
  controllers: [PartnerController],
  providers: [PartnerService]
})
export class PartnerModule { }

