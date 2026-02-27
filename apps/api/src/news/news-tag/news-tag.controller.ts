import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { CreateNewsTagDto } from '../dto/create-news-tag.dto';
import { UpdateNewsTagDto } from '../dto/update-news-tag.dto';
import { JwtAuthGuard } from '../../admin/jwt-auth.guard';
import { NewsTagService } from './news-tag.service';
import { NewsTag } from '../entities/news-tag.entity';

@ApiTags('news-tags')
@Controller('news-tags')
export class NewsTagController {
  constructor(private readonly newsTagService: NewsTagService) {}

  @Get()
  @ApiOperation({ summary: 'Получить список всех тегов новостей' })
  @ApiResponse({ status: 200, description: 'Список тегов', type: [NewsTag] })
  findAll(): Promise<NewsTag[]> {
    return this.newsTagService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить тег по id' })
  @ApiParam({ name: 'id', description: 'ID тега' })
  @ApiResponse({ status: 200, description: 'Тег', type: NewsTag })
  @ApiResponse({ status: 404, description: 'Tag not found' })
  findOne(@Param('id') id: string): Promise<NewsTag> {
    return this.newsTagService.findOne(parseInt(id, 10));
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Создать тег' })
  @ApiResponse({ status: 201, description: 'Тег создан', type: NewsTag })
  create(@Body() createDto: CreateNewsTagDto): Promise<NewsTag> {
    return this.newsTagService.create(createDto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Обновить тег' })
  @ApiParam({ name: 'id', description: 'ID тега' })
  @ApiResponse({ status: 200, description: 'Тег обновлён', type: NewsTag })
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdateNewsTagDto,
  ): Promise<NewsTag> {
    return this.newsTagService.update(parseInt(id, 10), updateDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Удалить тег по id' })
  @ApiParam({ name: 'id', description: 'ID тега' })
  @ApiResponse({ status: 200, description: 'Тег удалён' })
  async remove(@Param('id') id: string): Promise<{ success: boolean }> {
    await this.newsTagService.remove(parseInt(id, 10));
    return { success: true };
  }
}
