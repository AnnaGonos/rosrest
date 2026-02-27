import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminModule } from '../admin/admin.module';
import { FileUploadModule } from '../file-upload/file-upload.module';
import { HomeSliderController } from './home-slider.controller';
import { HomeSliderService } from './home-slider.service';
import { HomeSlide } from './entities/home-slide.entity';

@Module({
	imports: [TypeOrmModule.forFeature([HomeSlide]), AdminModule, FileUploadModule],
	controllers: [HomeSliderController],
	providers: [HomeSliderService],
})
export class HomeSliderModule { }

