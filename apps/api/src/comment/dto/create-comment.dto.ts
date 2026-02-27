import { IsString, IsEmail, IsNotEmpty, MinLength, MaxLength, IsIn, IsNumber, IsOptional, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCommentDto {
  @ApiProperty({
    description: 'Тип сущности, к которой относится комментарий',
    enum: ['news', 'monitoring-zakon', 'rar-member']
  })
  @IsString()
  @IsIn(['news', 'monitoring-zakon', 'rar-member'])
  commentableType!: 'news' | 'monitoring-zakon' | 'rar-member';

  @ApiProperty({ description: 'ID сущности' })
  @IsString()
  @IsNotEmpty()
  commentableId!: string;

  @ApiProperty({ description: 'ID родительского комментария (если это ответ)', required: false })
  @IsOptional()
  @IsNumber()
  parentCommentId?: number;

  @ApiProperty({ description: 'Имя автора', minLength: 2, maxLength: 100 })
  @IsString()
  @IsNotEmpty()
  @MinLength(2, { message: 'Имя должно содержать минимум 2 символа' })
  @MaxLength(100, { message: 'Имя не должно превышать 100 символов' })
  authorName!: string;

  @ApiProperty({ description: 'Email автора' })
  @IsEmail({}, { message: 'Введите корректный email адрес' })
  @IsNotEmpty()
  authorEmail!: string;

  @ApiProperty({ description: 'Текст комментария', minLength: 10, maxLength: 2000 })
  @IsString()
  @IsNotEmpty()
  @MinLength(10, { message: 'Комментарий должен содержать минимум 10 символов' })
  @MaxLength(2000, { message: 'Комментарий не должен превышать 2000 символов' })
  content!: string;

  @ApiProperty({ description: 'Honeypot поле (должно быть пустым)' })
  @IsOptional()
  @IsString()
  website?: string;

  @ApiProperty({ description: 'Токен формы для защиты от CSRF' })
  @IsString()
  @IsNotEmpty()
  formToken!: string;

  @ApiProperty({ description: 'Timestamp загрузки формы' })
  @IsNumber()
  formTimestamp!: number;
}
