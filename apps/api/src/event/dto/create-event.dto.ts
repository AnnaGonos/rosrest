import { IsString, IsOptional, IsBoolean, MaxLength, IsUrl, IsArray } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateEventDto {
  @IsString()
  @MaxLength(120)
  title!: string;

  @IsString()
  startDate!: string;

  @IsString()
  @IsOptional()
  endDate?: string;

  @IsString()
  @IsOptional()
  previewImageUrl?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  detailedAddress?: string;

  @IsString()
  @IsOptional()
  mapCoordinates?: string;

  @IsString()
  @IsOptional()
  @IsUrl()
  registrationUrl?: string;

  @IsArray()
  @Transform(({ value }: { value: any }) => {
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value)
        return parsed
      } catch (err) {
        console.error('Ошибка парсинга FAQ:', err)
        return []
      }
    }

    return Array.isArray(value) ? value : []
  }, { toClassOnly: true })
  @IsOptional()
  faq?: Array<{ question?: string; answer?: string }>;

  @IsArray()
  @Transform(({ value }: { value: any }) => {
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value)
        return parsed
      } catch (err) {
        console.error('Ошибка парсинга SCHEDULE:', err)
        return []
      }
    }

    return Array.isArray(value) ? value : []
  }, { toClassOnly: true })
  @IsOptional()
  schedule?: Array<{
    date: string;
    blocks: Array<{
      timeStart: string;
      timeEnd?: string;
      title: string;
      description: string;
      location?: string;
      moderators?: Array<{
        name: string;
        position?: string;
        photoUrl?: string;
      }>;
      speakers?: Array<{
        name: string;
        position?: string;
        photoUrl?: string;
      }>;
    }>;
  }>;


  @IsBoolean()
  @IsOptional()
  @Transform(({ value }: { value: any }) => {
    if (value === '1' || value === 1 || value === true) return true;
    if (value === '0' || value === 0 || value === false) return false;
    return value;
  })
  isPublished?: boolean;
}
