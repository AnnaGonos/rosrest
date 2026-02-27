import { ApiProperty } from '@nestjs/swagger';

export class CreateForJournalistDto {
  @ApiProperty({ description: 'Заголовок страницы', example: 'Информация для журналистов' })
  title!: string;

  @ApiProperty({ description: 'URL slug страницы', example: 'for-journalist' })
  slug!: string;

  @ApiProperty({ description: 'Дата публикации', example: '2024-01-15T10:00:00Z', required: false })
  publishedAt?: string;

  @ApiProperty({ description: 'Черновик', example: false, required: false })
  isDraft?: boolean;

  @ApiProperty({ description: 'Превью изображение', type: 'string', format: 'binary', required: false })
  previewImage?: any;

  @ApiProperty({ description: 'Блоки контента', type: 'array', required: false })
  blocks?: any[];
}
