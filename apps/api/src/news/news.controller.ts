import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { CreateNewsDto } from './dto/create-news.dto';
import { UpdateNewsDto } from './dto/update-news.dto';
import { FileUploadService } from '../file-upload/file-upload.service';
import { JwtAuthGuard } from '../admin/jwt-auth.guard';
import { NewsService } from './news.service';
import { News } from './entities/news.entity';

@ApiTags('news')
@Controller('news')
export class NewsController {
  constructor(
    private readonly newsService: NewsService,
    private readonly fileUploadService: FileUploadService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Получить список всех новостей' })
  @ApiResponse({ status: 200, description: 'Список новостей', type: [News] })
  @ApiQuery({
    name: 'isDraft',
    required: false,
    type: Boolean,
    description:
      'Фильтр по статусу: не указано - все новости, true - только черновики, false - только опубликованные',
  })
  @ApiQuery({
    name: 'tagId',
    required: false,
    type: Number,
    description: 'Фильтр по ID тега',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Номер страницы (начиная с 1)',
  })
  @ApiQuery({
    name: 'pageSize',
    required: false,
    type: Number,
    description: 'Количество элементов на странице',
  })
  async findAll(
    @Query('isDraft') isDraft?: string,
    @Query('tagId') tagId?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ): Promise<News[] | { items: News[]; total: number; totalPages: number; currentPage: number }> {
    let isDraftBool: boolean | undefined = undefined;
    if (isDraft !== undefined) {
      isDraftBool = isDraft.toLowerCase() === 'true' || isDraft === '1';
    }

    let tagIdNum: number | undefined = undefined;
    if (tagId) {
      tagIdNum = parseInt(tagId, 10);
    }

    const pageNum = page ? parseInt(page, 10) : 1;
    const pageSizeNum = pageSize ? parseInt(pageSize, 10) : 21;

    if (pageNum || pageSizeNum) {
      const allNews = await this.newsService.findAll({ isDraft: isDraftBool, tagId: tagIdNum });
      const total = allNews.length;
      const totalPages = Math.ceil(total / pageSizeNum);
      const startIndex = (pageNum - 1) * pageSizeNum;
      const endIndex = startIndex + pageSizeNum;
      const items = allNews.slice(startIndex, endIndex);

      return {
        items,
        total,
        totalPages,
        currentPage: pageNum,
      };
    }

    return this.newsService.findAll({ isDraft: isDraftBool, tagId: tagIdNum });
  }

  @Get('slug/:slug')
  @ApiOperation({ summary: 'Получить новость по slug' })
  @ApiParam({ name: 'slug', description: 'Slug новости' })
  @ApiResponse({ status: 200, description: 'Новость', type: News })
  @ApiResponse({ status: 404, description: 'News not found' })
  async findBySlug(@Param('slug') slug: string): Promise<News> {
    return this.newsService.findBySlug(slug);
  }

  @Get(':id/recommendations')
  @ApiOperation({ summary: 'Получить рекомендации для новости' })
  @ApiParam({ name: 'id', description: 'ID новости' })
  @ApiResponse({ status: 200, description: 'Список рекомендуемых новостей (макс 6)', type: [News] })
  async getRecommendations(@Param('id') id: string): Promise<any[]> {
    return this.newsService.getRecommendations(id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить новость по id' })
  @ApiParam({ name: 'id', description: 'ID новости' })
  @ApiResponse({ status: 200, description: 'Новость', type: News })
  @ApiResponse({ status: 404, description: 'News not found' })
  findOne(@Param('id') id: string): Promise<News> {
    return this.newsService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Создать новость' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: CreateNewsDto })
  @ApiResponse({ status: 201, description: 'Новость создана', type: News })
  @UseInterceptors(FileInterceptor('previewImage'))
  async create(
    @Body() body: any,
    @UploadedFile() previewImage?: any,
  ): Promise<News> {
    let previewImageUrl = body.previewImage;
    
    if (previewImage) {
      previewImageUrl = await this.fileUploadService.upload(
        {
          buffer: previewImage.buffer,
          originalname: previewImage.originalname,
          mimetype: previewImage.mimetype,
          size: previewImage.size,
        },
        'image',
        'news',
      );
    }
    else if (body.previewImageUrl) {
      previewImageUrl = body.previewImageUrl;
    }

    let tagIds: number[] = [];
    if (body.tagIds) {
      tagIds = body.tagIds; 
    }

    return this.newsService.create({ ...body, previewImage: previewImageUrl, tagIds });
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Обновить новость' })
  @ApiParam({ name: 'id', description: 'ID новости' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Данные для обновления новости',
    type: UpdateNewsDto,
  })
  @ApiResponse({ status: 200, description: 'Новость обновлена', type: News })
  @UseInterceptors(FileInterceptor('previewImage'))
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateNewsDto,
    @UploadedFile() previewImage?: any,
  ): Promise<News> {
    let previewImageUrl = updateDto.previewImage;
    
    if (previewImage) {
      previewImageUrl = await this.fileUploadService.upload(
        {
          buffer: previewImage.buffer,
          originalname: previewImage.originalname,
          mimetype: previewImage.mimetype,
          size: previewImage.size,
        },
        'image',
        'news',
      );
    }
    else if (updateDto.previewImageUrl) {
      previewImageUrl = updateDto.previewImageUrl;
    }

    const tagIds = updateDto.tagIds;

    return this.newsService.update(id, {
      ...updateDto,
      previewImage: previewImageUrl,
      tagIds,
    });
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Удалить новость по id' })
  @ApiParam({ name: 'id', description: 'ID новости' })
  @ApiResponse({ status: 200, description: 'Новость удалена' })
  async remove(@Param('id') id: string): Promise<{ success: boolean }> {
    await this.newsService.remove(id);
    return { success: true };
  }
}
