import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateAwardDto {
	@ApiProperty({ example: 'Благодарственное письмо', required: false })
	@IsOptional()
	@IsString()
	@MaxLength(400)
	caption?: string;

	@ApiProperty({
		example: 'https://example.com/award.jpg',
		required: false,
		description: 'Ссылка на изображение награды, если изображение не загружается файлом',
	})
	@IsOptional()
	@IsString()
	@MaxLength(500)
	imageUrl?: string;
}

