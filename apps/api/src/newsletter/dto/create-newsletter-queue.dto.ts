import { IsUUID, IsOptional, IsString, IsDateString } from 'class-validator';

export class CreateNewsletterQueueDto {
  @IsUUID()
  newsId!: string;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsDateString()
  scheduledAt?: string; // ISO date string, optional
}
