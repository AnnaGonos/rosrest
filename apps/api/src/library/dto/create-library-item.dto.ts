import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { LibraryItemType } from '../enums/library-item-type.enum';

export class CreateLibraryItemDto {
	@ApiProperty({
		enum: ['book', 'article'],
		example: 'book',
		description: 'Тип элемента: книга или статья',
	})
	@IsEnum(LibraryItemType)
	@IsNotEmpty()
	type!: LibraryItemType;

	@ApiProperty({ example: 'Реставрация фресок' })
	@IsString()
	@IsNotEmpty()
	@MaxLength(255)
	title!: string;

	@ApiProperty({
		example: 'https://cloud.mail.ru/public/4Euk/Kq7QZLvjv',
		description: 'Ссылка на контент: загруженный PDF файл, облако или статическая страница',
		required: false,
	})
	@IsOptional()
	@IsString()
	contentUrl?: string;

	@ApiProperty({
		example: 'Подробное руководство по восстановлению фресковых покрытий',
		required: false,
	})
	@IsOptional()
	@IsString()
	description?: string;

	@ApiProperty({
		example: 1,
		description: 'ID категории или создайте новую через createNewCategory',
		required: false,
	})
	@IsOptional()
	@Transform(({ value }) => (value ? parseInt(value, 10) : undefined))
	@IsInt()
	categoryId?: number;

	@ApiProperty({
		example: 'Журнал "Охраняется государством" №2, 2024',
		description: 'Создать новую категорию с этим именем',
		required: false,
	})
	@IsOptional()
	@IsString()
	@MaxLength(255)
	createNewCategory?: string;

	@ApiProperty({ example: false, description: 'false - книга в архиве, true - опубликована на сайте' })
	@Transform(({ value }) => {
		if (value === 'true' || value === true) return true;
		if (value === 'false' || value === false) return false;
		return value;
	})
	@IsBoolean()
	@IsNotEmpty()
	isPublished!: boolean;

	@ApiProperty({
		example: 'article-restoration-techniques',
		description: 'Slug для URL статьи (только для type=article)',
		required: false,
	})
	@IsOptional()
	@IsString()
	slug?: string;

	@ApiProperty({
		example: '2025-12-25T00:00:00.000Z',
		description: 'Дата публикации статьи (только для type=article)',
		required: false,
	})
	@IsOptional()
	@IsString()
	publishedAt?: string;

	@ApiProperty({
		example: false,
		description: 'Черновик ли статья (только для type=article)',
		required: false,
	})
	@IsOptional()
	@Transform(({ value }) => {
		if (value === 'true' || value === true) return true;
		if (value === 'false' || value === false) return false;
		return value;
	})
	isDraft?: boolean | string;

	@ApiProperty({
		description: 'Блоки контента для статьи (только для type=article)',
		required: false,
		isArray: true,
	})
	@IsOptional()
	blocks?: any[];
}

