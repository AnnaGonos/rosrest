import { Controller, Get, Post, Body, Param, Delete, Patch, Ip, Headers, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CommentService } from './comment.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { Comment } from './entities/comment.entity';

@ApiTags('comments')
@Controller('comments')
export class CommentController {
  constructor(private readonly commentService: CommentService) { }

  @Get('form-token')
  @ApiOperation({ summary: 'Получить токен для формы комментария' })
  @ApiResponse({ status: 200, description: 'Токен и вопрос успешно сгенерированы' })
  getFormToken() {
    return this.commentService.generateFormToken();
  }

  @Post()
  @ApiOperation({ summary: 'Создать новый комментарий' })
  @ApiResponse({ status: 201, description: 'Комментарий успешно создан', type: Comment })
  @ApiResponse({ status: 400, description: 'Ошибка валидации или обнаружен спам' })
  async create(
    @Body() createCommentDto: CreateCommentDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent?: string,
  ): Promise<Comment> {
    return await this.commentService.create(createCommentDto, ip, userAgent);
  }

  @Get(':commentableType/:commentableId')
  @ApiOperation({ summary: 'Получить комментарии для сущности' })
  @ApiResponse({ status: 200, description: 'Список комментариев', type: [Comment] })
  async findByEntity(
    @Param('commentableType') commentableType: string,
    @Param('commentableId') commentableId: string,
  ): Promise<Comment[]> {
    return await this.commentService.findByEntity(commentableType, commentableId);
  }

  @Get()
  @ApiOperation({ summary: 'Получить все комментарии (для админа)' })
  @ApiResponse({ status: 200, description: 'Список всех комментариев', type: [Comment] })
  async findAll(): Promise<Comment[]> {
    return await this.commentService.findAll();
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Количество немодерированных комментариев' })
  @ApiResponse({ status: 200, description: 'Количество новых комментариев' })
  async unreadCount(): Promise<{ count: number }> {
    const count = await this.commentService.getUnreadCount()
    return { count }
  }

  @Patch(':id/hide')
  @ApiOperation({ summary: 'Скрыть комментарий' })
  @ApiResponse({ status: 200, description: 'Комментарий скрыт', type: Comment })
  async hide(@Param('id') id: string): Promise<Comment> {
    return await this.commentService.hide(+id);
  }

  @Patch(':id/show')
  @ApiOperation({ summary: 'Показать комментарий' })
  @ApiResponse({ status: 200, description: 'Комментарий опубликован', type: Comment })
  async show(@Param('id') id: string): Promise<Comment> {
    return await this.commentService.show(+id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Удалить комментарий' })
  @ApiResponse({ status: 200, description: 'Комментарий удален' })
  async remove(@Param('id') id: string): Promise<{ message: string }> {
    await this.commentService.remove(+id);
    return { message: 'Комментарий успешно удален' };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Редактировать комментарий' })
  @ApiResponse({ status: 200, description: 'Комментарий обновлён', type: Comment })
  async update(@Param('id') id: string, @Body() body: Partial<Comment>): Promise<Comment> {
    // Only allow updating content and author fields from admin
    const payload: any = {}
    if (typeof body.content === 'string') payload.content = body.content
    if (typeof body.authorName === 'string') payload.authorName = body.authorName
    if (typeof body.authorEmail === 'string') payload.authorEmail = body.authorEmail
    return await this.commentService.update(+id, payload)
  }
}
