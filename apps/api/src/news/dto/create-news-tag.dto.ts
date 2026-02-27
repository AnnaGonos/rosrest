import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class CreateNewsTagDto {
  @ApiProperty({ description: 'Название тега' })
  @IsString()
  name!: string;

  @ApiProperty({ description: 'Slug тега (необязательно, будет сгенерирован автоматически)', required: false })
  @IsOptional()
  @IsString()
  slug?: string;
}
