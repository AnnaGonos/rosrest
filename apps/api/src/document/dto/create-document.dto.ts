import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsNumber, IsBoolean, IsEnum, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { DocumentType } from '../enums/document-type.enum';

export class CreateDocumentDto {
	@ApiProperty({ example: 'Письмо Минэкономразвития от 25.06.2012' })
	@IsString()
	@IsNotEmpty()
	@MaxLength(255)
	title!: string;

	@ApiProperty({
		enum: DocumentType,
		example: DocumentType.CHARTER,
		description: 'Тип документа',
	})
	@IsEnum(DocumentType)
	@IsNotEmpty()
	type!: DocumentType;

	@ApiProperty({ example: 1, required: false, description: 'ID категории (используется когда нет подкатегории)' })
	@IsOptional()
	@Transform(({ value }) => (value ? parseInt(value, 10) : undefined))
	@IsNumber()
	categoryId?: number;

	@ApiProperty({ example: 2, required: false, description: 'ID подкатегории (категория определяется по ее parent)' })
	@IsOptional()
	@Transform(({ value }) => (value ? parseInt(value, 10) : undefined))
	@IsNumber()
	subcategoryId?: number;

	@ApiProperty({ example: 'https://drive.google.com/file/d/abc123/document.pdf', required: false, description: 'URL на PDF файл в облаке (либо загрузите pdfFile)' })
	@IsOptional()
	@IsString()
	pdfUrl?: string;
	@ApiProperty({ example: 'https://drive.google.com/file/d/abc123/preview.jpg', required: false, description: 'URL на превью изображение' })
	@IsOptional()
	@IsString()
	previewUrl?: string;
	@ApiProperty({ example: true, required: false })
	@IsOptional()
	@Transform(({ value }) => {
		if (value === 'true' || value === true) return true;
		if (value === 'false' || value === false) return false;
		return value;
	})
	@IsBoolean()
	isPublished?: boolean;
}

