import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Query, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes, ApiBody, ApiParam, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../admin/jwt-auth.guard';
import { MonitoringZakonService } from './monitoring-zakon.service';
import { CreateMonitoringZakonDto } from './dto/create-monitoring-zakon.dto';
import { UpdateMonitoringZakonDto } from './dto/update-monitoring-zakon.dto';
import { MonitoringZakon } from './entities/monitoring-zakon.entity';

@ApiTags('monitoring-zakon')
@Controller('monitoring-zakon')
export class MonitoringZakonController {
  constructor(private readonly monitoringService: MonitoringZakonService) {}

  @Get()
  @ApiOperation({ summary: 'Получить список мониторинга с пагинацией' })
  @ApiResponse({ status: 200, description: 'Список мониторинга', type: [MonitoringZakon] })
  @ApiQuery({ name: 'isDraft', required: false, type: Boolean })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  findAll(
    @Query('isDraft') isDraft?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ): Promise<{ items: MonitoringZakon[]; totalCount: number; totalPages: number; page: number; pageSize: number }> {
    let isDraftBool: boolean | undefined = undefined;
    if (isDraft !== undefined) {
      isDraftBool = isDraft.toLowerCase() === 'true' || isDraft === '1';
    }

    const pageNum = page ? parseInt(page, 10) : undefined;
    const pageSizeNum = pageSize ? parseInt(pageSize, 10) : undefined;

    return this.monitoringService.findAll({ isDraft: isDraftBool, page: pageNum, pageSize: pageSizeNum });
  }

  @Get(':id/recommendations')
  @ApiOperation({ summary: 'Получить рекомендуемые элементы по ID' })
  @ApiParam({ name: 'id', description: 'ID элемента (исключается из результатов)' })
  @ApiResponse({ status: 200, description: 'Список рекомендуемых элементов (макс 4)', type: [MonitoringZakon] })
  async getRecommendations(@Param('id') id: string): Promise<any[]> {
    return this.monitoringService.getRecommendations(id);
  }

  @Get('slug/:slug')

  @Get(':id')
  @ApiOperation({ summary: 'Получить элемент по id' })
  @ApiParam({ name: 'id', description: 'ID элемента' })
  @ApiResponse({ status: 200, description: 'Элемент', type: MonitoringZakon })
  @ApiResponse({ status: 404, description: 'Item not found' })
  findOne(@Param('id') id: string): Promise<MonitoringZakon> {
    return this.monitoringService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Создать элемент мониторинга' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: CreateMonitoringZakonDto })
  @ApiResponse({ status: 201, description: 'Элемент создан', type: MonitoringZakon })
  @UseInterceptors(FileInterceptor('file'))
  async create(
    @Body() body: CreateMonitoringZakonDto,
    @UploadedFile() _file?: any,
  ): Promise<MonitoringZakon> {
    return this.monitoringService.create(body);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Обновить элемент мониторинга' })
  @ApiParam({ name: 'id', description: 'ID элемента' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ description: 'Данные для обновления', type: UpdateMonitoringZakonDto })
  @ApiResponse({ status: 200, description: 'Элемент обновлён', type: MonitoringZakon })
  @UseInterceptors(FileInterceptor('file'))
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateMonitoringZakonDto,
    @UploadedFile() _file?: any,
  ): Promise<MonitoringZakon> {
    return this.monitoringService.update(id, updateDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Удалить элемент мониторинга' })
  @ApiParam({ name: 'id', description: 'ID элемента' })
  @ApiResponse({ status: 200, description: 'Элемент удалён' })
  async remove(@Param('id') id: string): Promise<{ success: boolean }> {
    await this.monitoringService.remove(id);
    return { success: true };
  }
}
