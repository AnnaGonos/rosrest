import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateDocumentCategoryDto {
	@ApiProperty({ example: 'Разъяснения госорганов по вопросам деятельности' })
	@Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
	@IsString()
	@IsNotEmpty()
	@MaxLength(255)
	name!: string;

	@ApiProperty({ example: 'razjasnenija-gosorganov', required: false, description: 'Slug категории (URL адрес)' })
	@IsOptional()
	@IsString()
	@MaxLength(255)
	slug?: string;

	@ApiProperty({ example: 1, required: false, description: 'Parent category ID for subcategories' })
	@IsOptional()
	@Transform(({ value }) => value ? parseInt(value, 10) : undefined)
	parentId?: number;

	@ApiProperty({ example: 'bi-folder', required: false, description: 'Bootstrap icon class or image URL for root categories' })
	@IsOptional()
	@IsString()
	@MaxLength(255)
	icon?: string;
}

