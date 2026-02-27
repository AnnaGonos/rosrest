import { IsString, IsOptional, IsDateString, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CreateProjectDto {
  @ApiProperty({ description: 'Название проекта', example: 'Проект «Маленький реставратор»' })
  @IsString()
  title!: string;

  @ApiProperty({ description: 'Слаг проекта (без префикса)', example: 'lilrestorer' })
  @IsString()
  slug!: string;

  @ApiPropertyOptional({ description: 'Путь или URL к превью-изображению', example: '/uploads/projects/preview.jpg' })
  @IsOptional()
  @IsString()
  previewImage?: string;

  @ApiPropertyOptional({ description: 'Дата публикации', example: '2026-01-31T12:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  publishedAt?: string;

  @ApiPropertyOptional({ description: 'Статус: черновик (true) или опубликовано (false)', example: false })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true' || value === '1';
    }
    if (typeof value === 'number') {
      return !!value;
    }
    return !!value;
  })
  isDraft?: boolean;

  @ApiPropertyOptional({ description: 'Блоки страницы', type: 'array', isArray: true })
  @IsOptional()
  blocks?: any[];
}

