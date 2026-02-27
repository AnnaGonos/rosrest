import { IsString, IsNumber, IsOptional, IsObject, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateBlockDto {
  @IsString()
  type!: string;

  @IsObject()
  content!: Record<string, any>;

  @IsNumber()
  order!: number;

  @IsOptional()
  @IsString()
  parentBlockId?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateBlockDto)
  children?: CreateBlockDto[];
}
