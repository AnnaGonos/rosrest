import { ApiProperty } from '@nestjs/swagger';

export class UpdateForJournalistDto {
  @ApiProperty({ description: 'Заголовок страницы', required: false })
  title?: string;

  @ApiProperty({ description: 'URL slug страницы', required: false })
  slug?: string;

  @ApiProperty({ description: 'Дата публикации', required: false })
  publishedAt?: string;

  @ApiProperty({ description: 'Черновик', required: false })
  isDraft?: boolean;

  @ApiProperty({ description: 'Превью изображение', type: 'string', format: 'binary', required: false })
  previewImage?: any;

  @ApiProperty({ description: 'Блоки контента', type: 'array', required: false })
  blocks?: any[];
}
