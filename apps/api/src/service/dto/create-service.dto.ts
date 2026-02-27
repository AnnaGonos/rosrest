import { IsString, IsOptional, IsDateString, IsBoolean, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class ServiceContactDto {
  @ApiPropertyOptional({ description: 'ID контакта (для обновления)' })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty({ description: 'ФИО' })
  @IsString()
  fullName!: string;

  @ApiProperty({ description: 'Путь к фото' })
  @IsString()
  photo!: string;

  @ApiPropertyOptional({ description: 'Должность' })
  @IsOptional()
  @IsString()
  position?: string;

  @ApiPropertyOptional({ description: 'Email' })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({ description: 'Телефон' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ description: 'Порядок отображения' })
  order!: number;
}

export class CreateServiceDto {
  @ApiProperty({ description: 'Название услуги', example: 'Реставрация мебели' })
  @IsString()
  title!: string;
  
  @ApiProperty({ description: 'Слаг услуги (без префикса)', example: 'furniture-restoration' })
  @IsString()
  slug!: string;

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
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }
    return value;
  })
  blocks?: any[];

  @ApiPropertyOptional({ description: 'Контакты ответственных лиц', type: [ServiceContactDto] })
  @IsOptional()
  @IsArray()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }
    return value;
  })
  contacts?: ServiceContactDto[];
}
