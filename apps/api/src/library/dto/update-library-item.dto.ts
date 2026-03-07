	@ApiProperty({
		example: 'https://rosrest.com/uploads/images/restoration-preview.jpg',
		required: false,
		description: 'URL изображения обложки (альтернатива загрузке файла)'
	})
	@IsOptional()
	@IsString()
	previewImage?: string;
import { PartialType } from '@nestjs/swagger';
import { CreateLibraryItemDto } from './create-library-item.dto';

export class UpdateLibraryItemDto extends PartialType(CreateLibraryItemDto) {}

