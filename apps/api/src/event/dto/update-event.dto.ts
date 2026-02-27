import { PartialType } from '@nestjs/mapped-types';
import { CreateEventDto } from './create-event.dto';
import { IsArray, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateEventDto extends PartialType(CreateEventDto) {
  
  @IsOptional()
  @IsArray()
  @Transform(({ value }: { value: any }) => {
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value)
        return Array.isArray(parsed) ? parsed : []
      } catch (err) {
        console.error('Ошибка парсинга FAQ:', err)
        return []
      }
    }

    return Array.isArray(value) ? value : []
  }, { toClassOnly: true })
  faq?: Array<{ question?: string; answer?: string }>;

  @IsOptional()
  @IsArray()
  @Transform(({ value }: { value: any }) => {
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value)
        return Array.isArray(parsed) ? parsed : []
      } catch (err) {
        console.error('Ошибка парсинга SCHEDULE:', err)
        return []
      }
    }

    return Array.isArray(value) ? value : []
  }, { toClassOnly: true })
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
}
