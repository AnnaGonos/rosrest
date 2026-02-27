import { Controller, Get, Post, Patch, Delete, Body, Param, UseInterceptors, UploadedFile, UseGuards, Query } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CacheInterceptor, CacheKey, CacheTTL } from '@nestjs/cache-manager';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes, ApiBody, ApiParam, ApiQuery } from '@nestjs/swagger';
import { CreateRarMemberDto } from './dto/create-rar-member.dto';
import { UpdateRarMemberDto } from './dto/update-rar-member.dto';
import { FileUploadService } from '../file-upload/file-upload.service';
import { JwtAuthGuard } from '../admin/jwt-auth.guard';
import { RarMemberService } from './rar-member.service';
import { RarMember } from './entities/rar-member.entity';

@ApiTags('rar-members')
@Controller('rar-members')
export class RarMemberController {
  constructor(
    private readonly memberService: RarMemberService,
    private readonly fileUploadService: FileUploadService,
  ) { }

  @Get()
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(300)
  @ApiOperation({ summary: 'Получить список членов РАР' })
  @ApiResponse({ status: 200, description: 'Список членов', type: [RarMember] })
  @ApiQuery({
    name: 'isDraft',
    required: false,
    type: Boolean,
    description: 'Фильтр по статусу: не указано - все, true - только черновики, false - только опубликованные',
  })
  findAll(@Query('isDraft') isDraft?: string): Promise<RarMember[]> {
    let isDraftBool: boolean | undefined = undefined;
    if (isDraft !== undefined) {
      isDraftBool = isDraft.toLowerCase() === 'true' || isDraft === '1';
    }
    return this.memberService.findAll({ isDraft: isDraftBool });
  }

  @Get(':id')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(300)
  @ApiOperation({ summary: 'Получить члена РАР по id' })
  @ApiParam({ name: 'id', description: 'ID члена' })
  @ApiResponse({ status: 200, description: 'Член РАР', type: RarMember })
  @ApiResponse({ status: 404, description: 'Member not found' })
  findOne(@Param('id') id: string): Promise<RarMember> {
    return this.memberService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Создать члена РАР' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: CreateRarMemberDto })
  @ApiResponse({ status: 201, description: 'Член создан', type: RarMember })
  @UseInterceptors(FileInterceptor('previewImage'))
  async create(
    @Body() body: CreateRarMemberDto,
    @UploadedFile() previewImage?: any,
  ): Promise<RarMember> {
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
        'rar-members',
      );
    }

    return this.memberService.create({
      ...body,
      previewImage: previewImageUrl,
    });
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Обновить члена РАР' })
  @ApiParam({ name: 'id', description: 'ID члена' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ description: 'Данные для обновления', type: UpdateRarMemberDto })
  @ApiResponse({ status: 200, description: 'Член обновлён', type: RarMember })
  @UseInterceptors(FileInterceptor('previewImage'))
  async update(
    @Param('id') id: string,
    @Body() body: UpdateRarMemberDto,
    @UploadedFile() previewImage?: any,
  ): Promise<RarMember> {
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
        'rar-members',
      );
    }

    return this.memberService.update(id, {
      ...body,
      previewImage: previewImageUrl,
    });
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Удалить члена РАР по id' })
  @ApiParam({ name: 'id', description: 'ID члена' })
  @ApiResponse({ status: 200, description: 'Член удалён' })
  async remove(@Param('id') id: string): Promise<{ success: boolean }> {
    await this.memberService.remove(id);
    return { success: true };
  }
}
