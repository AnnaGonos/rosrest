import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateNewsDto {
  @ApiProperty({ description: 'Превью-изображение', required: false, type: 'string', format: 'binary' })
  @IsOptional()
  previewImage?: any;

  @ApiProperty({ description: 'URL превью-изображения (альтернатива загрузке файла)', required: false })
  @IsOptional()
  @IsString()
  previewImageUrl?: string;

  @ApiProperty({ description: 'Заголовок новости', required: false })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({ description: 'Slug страницы', required: false })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiProperty({ description: 'Дата публикации (ISO строка)', required: false })
  @IsOptional()
  @IsString()
  publishedAt?: string;

  @ApiProperty({ description: 'Черновик или нет', required: false })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      const lower = value.toLowerCase();
      if (lower === 'true' || lower === '1') return true;
      if (lower === 'false' || lower === '0') return false;
      try {
        const parsed = JSON.parse(value);
        return !!parsed;
      } catch {
        return !!value;
      }
    }
    if (typeof value === 'number') {
      return !!value;
    }
    return !!value;
  })
  @IsBoolean()
  isDraft?: boolean;

  @ApiProperty({ description: 'ID тегов новости', type: [Number], required: false })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) {
        return [];
      }
      
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return parsed.map((id: any) => parseInt(id, 10)).filter((id: number) => !isNaN(id));
        }
        
        if (typeof parsed === 'number' && !isNaN(parsed)) {
          return [parsed];
        }
      } catch {
      }
      
      return trimmed.split(',').map((id: string) => parseInt(id.trim(), 10)).filter((id: number) => !isNaN(id));
    }
    
    if (typeof value === 'number') {
      return [value];
    }
    
    if (Array.isArray(value)) {
      return value.map((id: any) => parseInt(id, 10)).filter((id: number) => !isNaN(id));
    }
    
    return [];
  })
  @IsArray()
  tagIds?: number[];

  @ApiProperty({ description: 'Блоки контента', type: Array, required: false })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return [];
      }
    }
    if (Array.isArray(value)) {
      return value;
    }
    return [];
  })
  @IsArray()
  blocks?: any[];
}
