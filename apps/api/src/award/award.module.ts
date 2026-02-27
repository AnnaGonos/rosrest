import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminModule } from '../admin/admin.module';
import { FileUploadModule } from '../file-upload/file-upload.module';
import { AwardController } from './award.controller';
import { AwardService } from './award.service';
import { Award } from './entities/award.entity';

@Module({
	imports: [TypeOrmModule.forFeature([Award]), AdminModule, FileUploadModule],
	controllers: [AwardController],
	providers: [AwardService],
})
export class AwardModule { }

