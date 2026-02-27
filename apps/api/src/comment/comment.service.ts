import { Injectable, BadRequestException, NotFoundException, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Comment } from './entities/comment.entity';
import { CreateCommentDto } from './dto/create-comment.dto';

@Injectable()
export class CommentService {
  private ipRateLimits = new Map<string, number[]>(); // ip -> timestamps[]

  constructor(
    @InjectRepository(Comment)
    private commentRepository: Repository<Comment>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {
    // Очистка старых IP записей каждые 10 минут
    setInterval(() => this.cleanupOldIpLimits(), 10 * 60 * 1000);
  }

  /**
   * Генерация токена формы
   */
  generateFormToken(): { token: string; timestamp: number } {
    const token = this.generateRandomString(32);
    const timestamp = Date.now();

    return { token, timestamp };
  }

  /**
   * Создание комментария с проверкой на спам
   */
  async create(
    createCommentDto: CreateCommentDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<Comment> {
    // === ЗАЩИТА ОТ СПАМА ===

    // 1. Honeypot проверка
    if (createCommentDto.website && createCommentDto.website.trim() !== '') {
      throw new BadRequestException('Обнаружена подозрительная активность');
    }

    // 2. Проверка времени заполнения (минимум 3 секунды, максимум 30 минут)
    const now = Date.now();
    const timeDelta = now - createCommentDto.formTimestamp;
    const MIN_TIME = 3000; // 3 секунды
    const MAX_TIME = 30 * 60 * 1000; // 30 минут

    if (timeDelta < MIN_TIME) {
      throw new BadRequestException('Форма заполнена слишком быстро');
    }

    if (timeDelta > MAX_TIME) {
      throw new BadRequestException('Форма устарела, обновите страницу');
    }

    // 3. Rate limiting по IP
    if (ipAddress) {
      this.checkRateLimit(ipAddress);
    }

    // 5. Анализ содержимого
    const isSuspicious = this.analyzeContent(createCommentDto.content);

    // === СОЗДАНИЕ КОММЕНТАРИЯ ===

    const comment = this.commentRepository.create({
      commentableType: createCommentDto.commentableType,
      commentableId: createCommentDto.commentableId,
      parentCommentId: createCommentDto.parentCommentId,
      authorName: createCommentDto.authorName.trim(),
      authorEmail: createCommentDto.authorEmail.toLowerCase().trim(),
      content: createCommentDto.content.trim(),
      ipAddress,
      userAgent,
      submissionTime: timeDelta,
      isVisible: !isSuspicious, // Если подозрительный - скрываем
      isFlagged: isSuspicious,
    });

    return await this.commentRepository.save(comment);
  }

  /**
   * Получение комментариев для сущности
   */
  async findByEntity(
    commentableType: string,
    commentableId: string,
  ): Promise<Comment[]> {
    // Получаем только корневые комментарии с вложенными ответами
    return await this.commentRepository.find({
      relations: ['replies'],
      where: {
        commentableType: commentableType as any,
        commentableId,
        parentCommentId: IsNull(),
        isVisible: true,
      },
      order: {
        createdAt: 'ASC',
      },
    });
  }

  /**
   * Получение всех комментариев (для админа)
   */
  async findAll(): Promise<Comment[]> {
    return await this.commentRepository.find({
      order: {
        createdAt: 'DESC',
      },
    });
  }

  /**
   * Количество немодерированных (новых) комментариев
   */
  async getUnreadCount(): Promise<number> {
    const cacheKey = 'comments:unreadCount';
    const cached = await this.cacheManager.get<number>(cacheKey);
    if (typeof cached === 'number') return cached;
    const count = await this.commentRepository.count({ where: { isModerated: false } });
    await this.cacheManager.set(cacheKey, count, 10); // кеш на 10 секунд
    return count;
  }

  /**
   * Скрыть комментарий
   */
  async hide(id: number): Promise<Comment> {
    const comment = await this.commentRepository.findOne({ where: { id } });
    if (!comment) {
      throw new NotFoundException('Комментарий не найден');
    }

    comment.isVisible = false;
    return await this.commentRepository.save(comment);
  }

  /**
   * Показать комментарий
   */
  async show(id: number): Promise<Comment> {
    const comment = await this.commentRepository.findOne({ where: { id } });
    if (!comment) {
      throw new NotFoundException('Комментарий не найден');
    }

    comment.isVisible = true;
    comment.isModerated = true;
    return await this.commentRepository.save(comment);
  }

  /**
   * Удалить комментарий
   */
  async remove(id: number): Promise<void> {
    const result = await this.commentRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('Комментарий не найден');
    }
  }

  /**
   * Обновить поля комментария (контент / автор)
   */
  async update(id: number, payload: Partial<Comment>): Promise<Comment> {
    const comment = await this.commentRepository.findOne({ where: { id } });
    if (!comment) throw new NotFoundException('Комментарий не найден');

    if (payload.content && typeof payload.content === 'string') {
      comment.content = payload.content.trim()
    }
    if (payload.authorName && typeof payload.authorName === 'string') {
      comment.authorName = payload.authorName.trim()
    }
    if (payload.authorEmail && typeof payload.authorEmail === 'string') {
      comment.authorEmail = payload.authorEmail.trim()
    }

    // mark as moderated when updated by admin
    comment.isModerated = true

    return await this.commentRepository.save(comment)
  }

  // === ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ ===

  private checkRateLimit(ipAddress: string): void {
    const now = Date.now();
    const timestamps = this.ipRateLimits.get(ipAddress) || [];

    // Удаляем старые записи (старше 1 часа)
    const recentTimestamps = timestamps.filter(t => now - t < 60 * 60 * 1000);

    // Проверяем лимиты
    const last10Min = recentTimestamps.filter(t => now - t < 10 * 60 * 1000);
    const last60Min = recentTimestamps.filter(t => now - t < 60 * 60 * 1000);

    if (last10Min.length >= 3) {
      throw new BadRequestException('Слишком много комментариев за короткий период. Попробуйте позже.');
    }

    if (last60Min.length >= 10) {
      throw new BadRequestException('Превышен лимит комментариев в час. Попробуйте позже.');
    }

    // Добавляем текущую отметку времени
    recentTimestamps.push(now);
    this.ipRateLimits.set(ipAddress, recentTimestamps);
  }

  private analyzeContent(content: string): boolean {
    // Проверка на слишком много ссылок
    const urlPattern = /(https?:\/\/[^\s]+)/gi;
    const urls = content.match(urlPattern) || [];
    if (urls.length > 2) {
      return true; // Подозрительно
    }

    // Проверка на повторяющиеся символы
    if (/(.)\1{10,}/.test(content)) {
      return true;
    }

    // Проверка на известные спам-паттерны
    const spamPatterns = [
      /viagra/i,
      /casino/i,
      /lottery/i,
      /winner/i,
      /click here/i,
      /buy now/i,
    ];

    if (spamPatterns.some(pattern => pattern.test(content))) {
      return true;
    }

    return false;
  }

  private cleanupOldIpLimits(): void {
    const now = Date.now();

    // Очистка старых IP записей
    for (const [ip, timestamps] of this.ipRateLimits.entries()) {
      const recent = timestamps.filter(t => now - t < 60 * 60 * 1000);
      if (recent.length === 0) {
        this.ipRateLimits.delete(ip);
      } else {
        this.ipRateLimits.set(ip, recent);
      }
    }
  }

  private generateRandomString(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
}
