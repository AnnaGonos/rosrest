import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, UseInterceptors } from '@nestjs/common';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { CreateRarSectionDto } from './dto/create-rar-section.dto';
import { UpdateRarSectionDto } from './dto/update-rar-section.dto';
import { RarSectionService } from './rar-section.service';
import { RarSection } from './entities/rar-section.entity';
import { JwtAuthGuard } from '../admin/jwt-auth.guard';

@ApiTags('rar-sections')
@Controller('rar-sections')
export class RarSectionController {
  constructor(private readonly sectionService: RarSectionService) {}

  @Get()
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(300)
  @ApiOperation({ summary: 'Получить список секций РАР' })
  @ApiResponse({ status: 200, description: 'Список секций', type: [RarSection] })
  findAll(): Promise<RarSection[]> {
    return this.sectionService.findAll();
  }

  @Get(':id')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(300)
  @ApiOperation({ summary: 'Получить секцию РАР по ID' })
  @ApiParam({ name: 'id', description: 'ID секции' })
  @ApiResponse({ status: 200, description: 'Секция найдена', type: RarSection })
  @ApiResponse({ status: 404, description: 'Секция не найдена' })
  findOne(@Param('id') id: string): Promise<RarSection> {
    return this.sectionService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Создать секцию РАР' })
  @ApiResponse({ status: 201, description: 'Секция создана', type: RarSection })
  create(@Body() dto: CreateRarSectionDto): Promise<RarSection> {
    return this.sectionService.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Обновить секцию РАР' })
  @ApiParam({ name: 'id', description: 'ID секции' })
  @ApiResponse({ status: 200, description: 'Секция обновлена', type: RarSection })
  update(@Param('id') id: string, @Body() dto: UpdateRarSectionDto): Promise<RarSection> {
    return this.sectionService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Удалить секцию РАР' })
  @ApiParam({ name: 'id', description: 'ID секции' })
  @ApiResponse({ status: 200, description: 'Секция удалена' })
  async remove(@Param('id') id: string): Promise<{ success: boolean }> {
    await this.sectionService.remove(id);
    return { success: true };
  }
}
