import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class UpdateNewsTagDto {
  @ApiProperty({ description: 'Название тега', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ description: 'Slug тега', required: false })
  @IsOptional()
  @IsString()
  slug?: string;
}
