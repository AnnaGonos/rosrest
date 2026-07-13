import { IsString, IsOptional, IsInt } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CreateRarSectionDto {
  @ApiProperty({ description: 'Название секции', example: 'Секция средств массовой информации' })
  @IsString()
  title!: string;

  @ApiProperty({ description: 'Слаг секции', example: 'media' })
  @IsString()
  slug!: string;

  @ApiPropertyOptional({ description: 'Иконка (класс)', example: 'bi bi-newspaper' })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiPropertyOptional({ description: 'Порядок секции', example: 0 })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : undefined;
    }
    return value;
  })
  @IsInt()
  orderIndex?: number;
}
