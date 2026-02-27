import { IsString, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CreateMonitoringZakonDto {
  @ApiProperty({ description: 'Название', example: 'Новые требования к реставрации' })
  @IsString()
  title!: string;

  @ApiProperty({ description: 'Слаг (без префикса)', example: 'novye-trebovaniya' })
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
  blocks?: any[];
}
