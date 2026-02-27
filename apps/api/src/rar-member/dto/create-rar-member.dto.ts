import { IsString, IsOptional, IsDateString, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CreateRarMemberDto {
  @ApiProperty({ description: 'Название члена РАР', example: 'Проектная группа «РИЕДЕР», ООО' })
  @IsString()
  title!: string;

  @ApiProperty({ description: 'Слаг портфолио (без префикса)', example: 'proektnaja-gruppa-rieder-ooo' })
  @IsString()
  slug!: string;

  @ApiPropertyOptional({ description: 'Путь или URL к превью-изображению', example: '/uploads/rar-members/preview.jpg' })
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

  @ApiPropertyOptional({ description: 'Блоки портфолио', type: 'array', isArray: true })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return [];
      }
    }
    return Array.isArray(value) ? value : [];
  })
  blocks?: any[];

  @ApiPropertyOptional({ description: 'ID секций', type: 'array', isArray: true })
  @IsOptional()
  @IsArray()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return [];
      }
    }
    return Array.isArray(value) ? value : [];
  })
  sectionIds?: string[];
}
