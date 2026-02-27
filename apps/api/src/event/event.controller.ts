import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiConsumes, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { EventService } from './event.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { JwtAuthGuard } from '../admin/jwt-auth.guard';
import { FileUploadService } from '../file-upload/file-upload.service';

interface UploadFile {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}

@ApiTags('events')
@Controller('events')
export class EventController {
  constructor(
    private readonly eventService: EventService,
    private readonly fileUploadService: FileUploadService,
  ) { }

  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(AnyFilesInterceptor())
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Создать новое событие' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'Событие успешно создано' })
  @ApiResponse({ status: 400, description: 'Неверные данные' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  async create(
    @Body() createEventDto: CreateEventDto,
    @UploadedFiles() files: any[],
  ) {
    const previewImage = files?.find(f => f.fieldname === 'previewImage');
    if (previewImage) {
      const imageUrl = await this.fileUploadService.upload(
        previewImage,
        'image',
        'events',
      );
      createEventDto.previewImageUrl = imageUrl;
    }
    if (createEventDto.schedule) {
      for (let dayIndex = 0; dayIndex < createEventDto.schedule.length; dayIndex++) {
        const day = createEventDto.schedule[dayIndex];
        for (let blockIndex = 0; blockIndex < day.blocks.length; blockIndex++) {
          const block = day.blocks[blockIndex];
   
          if (block.moderators) {
            for (let moderatorIndex = 0; moderatorIndex < block.moderators.length; moderatorIndex++) {
              const moderator = block.moderators[moderatorIndex];
              if (!moderator.photoUrl) {
                const file = files?.find(f => f.fieldname === `moderatorPhoto_${dayIndex}_${blockIndex}_${moderatorIndex}`);
                if (file) {
                  const url = await this.fileUploadService.upload(file, 'image', 'events');
                  moderator.photoUrl = url;
                }
              }
            }
          }

          if (block.speakers) {
            for (let speakerIndex = 0; speakerIndex < block.speakers.length; speakerIndex++) {
              const speaker = block.speakers[speakerIndex];
              if (!speaker.photoUrl) {
                const file = files?.find(f => f.fieldname === `speakerPhoto_${dayIndex}_${blockIndex}_${speakerIndex}`);
                if (file) {
                  const url = await this.fileUploadService.upload(file, 'image', 'events');
                  speaker.photoUrl = url;
                }
              }
            }
          }
        }
      }
    }
    return this.eventService.create(createEventDto);
  }

  @Get()
  @ApiOperation({ summary: 'Получить список событий' })
  @ApiQuery({
    name: 'isPublished', required: false, enum: ['true', 'false'],
    description: 'Фильтр по статусу публикации: true - опубликовано, false - черновик'
  })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Количество событий' })
  @ApiQuery({ name: 'filter', required: false, enum: ['past', 'upcoming', 'all'], description: 'Фильтр по времени: past - прошедшие, upcoming - актуальные, all - все' })
  @ApiQuery({ name: 'offset', required: false, type: Number, description: 'Смещение для пагинации' })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['ASC', 'DESC'], description: 'Направление сортировки по дате: ASC - по возрастанию, DESC - по убыванию' })
  @ApiResponse({ status: 200, description: 'Список событий успешно получен' })
  async findAll(
    @Query('isPublished') isPublished?: string,
    @Query('limit') limit?: string,
    @Query('filter') filter?: 'past' | 'upcoming' | 'all',
    @Query('offset') offset?: string,
    @Query('sortOrder') sortOrder?: 'ASC' | 'DESC',
  ) {
    const published = isPublished === 'true' ? true : isPublished === 'false' ? false : undefined;
    const parsedLimit = limit ? parseInt(limit, 10) : undefined;
    const parsedOffset = offset ? parseInt(offset, 10) : undefined;

    return this.eventService.findAll(published, parsedLimit, filter, parsedOffset, sortOrder);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить событие по ID' })
  @ApiParam({ name: 'id', type: Number, description: 'ID события' })
  @ApiResponse({ status: 200, description: 'Событие успешно получено' })
  @ApiResponse({ status: 404, description: 'Событие не найдено' })
  findOne(@Param('id') id: string) {
    return this.eventService.findOne(+id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(AnyFilesInterceptor())
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Обновить событие' })
  @ApiParam({ name: 'id', type: Number, description: 'ID события' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 200, description: 'Событие успешно обновлено' })
  @ApiResponse({ status: 400, description: 'Неверные данные' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 404, description: 'Событие не найдено' })
  async update(
    @Param('id') id: string,
    @Body() updateEventDto: UpdateEventDto,
    @UploadedFiles() files: any[],
  ) {
    const previewImage = files?.find(f => f.fieldname === 'previewImage');
    if (previewImage) {
      const imageUrl = await this.fileUploadService.upload(
        previewImage,
        'image',
        'events',
      );
      updateEventDto.previewImageUrl = imageUrl;
    }

    if (updateEventDto.schedule) {
      for (let dayIndex = 0; dayIndex < updateEventDto.schedule.length; dayIndex++) {
        const day = updateEventDto.schedule[dayIndex];
        for (let blockIndex = 0; blockIndex < day.blocks.length; blockIndex++) {
          const block = day.blocks[blockIndex];

          if (block.moderators) {
            for (let moderatorIndex = 0; moderatorIndex < block.moderators.length; moderatorIndex++) {
              const moderator = block.moderators[moderatorIndex];
              if (!moderator.photoUrl) {
                const file = files?.find(f => f.fieldname === `moderatorPhoto_${dayIndex}_${blockIndex}_${moderatorIndex}`);
                if (file) {
                  const url = await this.fileUploadService.upload(file, 'image', 'events');
                  moderator.photoUrl = url;
                }
              }
            }
          }

          if (block.speakers) {
            for (let speakerIndex = 0; speakerIndex < block.speakers.length; speakerIndex++) {
              const speaker = block.speakers[speakerIndex];
              if (!speaker.photoUrl) {
                const file = files?.find(f => f.fieldname === `speakerPhoto_${dayIndex}_${blockIndex}_${speakerIndex}`);
                if (file) {
                  const url = await this.fileUploadService.upload(file, 'image', 'events');
                  speaker.photoUrl = url;
                }
              }
            }
          }
        }
      }
    }
    return this.eventService.update(+id, updateEventDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Удалить событие' })
  @ApiParam({ name: 'id', type: Number, description: 'ID события' })
  @ApiResponse({ status: 200, description: 'Событие успешно удалено' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  @ApiResponse({ status: 404, description: 'Событие не найдено' })
  remove(@Param('id') id: string) {
    return this.eventService.remove(+id);
  }
}
