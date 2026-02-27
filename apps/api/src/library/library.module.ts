import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LibraryItem } from './entities/library-item.entity';
import { LibraryCategory } from './entities/library-category.entity';
import { LibraryService } from './library.service';
import { LibraryCategoryService } from './library-category.service';
import { LibraryController } from './library.controller';
import { AdminModule } from '../admin/admin.module';
import { FileUploadModule } from '../file-upload/file-upload.module';
import { Page } from '../page/entities/page.entity';
import { Block } from '../page/entities/block.entity';

@Module({
	imports: [
		TypeOrmModule.forFeature([LibraryItem, LibraryCategory, Page, Block]),
		forwardRef(() => AdminModule),
		FileUploadModule,
	],
	controllers: [LibraryController],
	providers: [LibraryService, LibraryCategoryService],
	exports: [LibraryService, LibraryCategoryService],
})
export class LibraryModule { }

