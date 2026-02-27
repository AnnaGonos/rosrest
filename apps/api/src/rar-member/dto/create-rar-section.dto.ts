import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

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
}
