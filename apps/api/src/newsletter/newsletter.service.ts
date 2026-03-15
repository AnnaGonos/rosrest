import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NewsletterQueueItem } from './newsletter-queue.entity';
import { In } from 'typeorm';
import { CreateNewsletterQueueDto } from './dto/create-newsletter-queue.dto';
import { News } from '../news/entities/news.entity';
import { SubscriptionService } from '../subscription/subscription.service';
import { EmailService } from '../email/email.service';
import { MailTemplateService } from '../email/mail-template.service';

@Injectable()
export class NewsletterService {
  private readonly logger = new Logger(NewsletterService.name);

  constructor(
    @InjectRepository(NewsletterQueueItem)
    private queueRepo: Repository<NewsletterQueueItem>,
    @InjectRepository(News)
    private newsRepo: Repository<News>,
    private subscriptionService: SubscriptionService,
    private emailService: EmailService,
    private mailTemplateService: MailTemplateService,
  ) {}

  async addToQueue(dto: CreateNewsletterQueueDto) {
    this.logger.log(`addToQueue called with dto=${JSON.stringify(dto)}`);
    const news = await this.newsRepo.findOne({ where: { id: dto.newsId }, relations: ['page'] });
    if (!news) throw new BadRequestException('News not found');

    if (news.page?.isDraft) {
      this.logger.warn(`Attempt to add draft news to queue: ${dto.newsId}`);
      throw new BadRequestException('Нельзя добавить черновик в рассылку — опубликуйте новость сначала.');
    }

    // Prevent duplicate pending queue items for the same news
    const existing = await this.queueRepo.findOne({ where: { newsId: dto.newsId, isSent: false } });
    this.logger.log(`existing queue item for dto.newsId=${dto.newsId}: ${existing ? JSON.stringify({ id: existing.id, newsId: existing.newsId }) : 'null'}`);
    if (existing) {
      this.logger.log(`News ${dto.newsId} is already in the newsletter queue (id=${existing.id})`);
      return { item: existing, existed: true };
    }

    const item = this.queueRepo.create({ newsId: dto.newsId, news, note: dto.note, scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : undefined });
    const saved = await this.queueRepo.save(item);
    this.logger.log(`created queue item id=${saved.id} newsId=${saved.newsId}`);
    return { item, existed: false };
  }

  async listQueue(pendingOnly = true) {
    const relations = ['news', 'news.page']
    if (pendingOnly) return this.queueRepo.find({ where: { isSent: false }, order: { addedAt: 'DESC' }, relations });
    return this.queueRepo.find({ order: { addedAt: 'DESC' }, relations });
  }

  async delete(id: number) {
    await this.queueRepo.delete(id);
  }

  async sendQueue(ids?: number[], scheduledAt?: Date) {
    // If scheduledAt is provided and it's in the future, schedule items instead of sending now
    const now = new Date();
    if (scheduledAt && scheduledAt > now) {
      // update matching pending items to set scheduledAt
      const qb = this.queueRepo.createQueryBuilder().update().set({ scheduledAt }).where('isSent = :isSent', { isSent: false });
      if (ids && ids.length > 0) qb.andWhere('id IN (:...ids)', { ids });
      const res = await qb.execute();
      this.logger.log(`Scheduled ${res.affected || 0} newsletter items for ${scheduledAt.toISOString()}`);
      return { scheduled: res.affected || 0 };
    }

    const relations = ['news', 'news.page'];
    const items = ids && ids.length > 0
      ? await this.queueRepo.find({ where: { id: In(ids) }, relations })
      : await this.queueRepo.find({ where: { isSent: false }, relations });

    if (!items || items.length === 0) {
      this.logger.warn('No items to send');
      return { sent: 0, failed: 0 };
    }

    const newsItems = items.map(i => ({
      id: parseInt(String(i.news.id)),
      title: i.news.page?.title || '',
      excerpt: i.news.page?.slug || '',
      publishedAt: i.news.page?.publishedAt ?? undefined,
    }));

    const subscribers = await this.subscriptionService.getActiveSubscriptions();
    const recipientEmails = subscribers.map(s => s.email);

    const html = this.mailTemplateService.generateDigestEmail(newsItems);
    const text = this.mailTemplateService.generateDigestText(newsItems);
    const subject = `Рассылка новостей — ${new Date().toLocaleDateString('ru-RU')}`;

    const result = await this.emailService.sendBulkEmail(recipientEmails, subject, html, text);

    // mark queue items as sent regardless of per-recipient result; caller can inspect result
    const sentAt = new Date();
    for (const it of items) {
      it.isSent = true;
      it.sentAt = sentAt;
      await this.queueRepo.save(it);
      try {
        await this.newsRepo.update(it.news.id, { lastIncludedInNewsletterAt: sentAt });
      } catch (e) {
        this.logger.error(`Failed to update news.lastIncludedInNewsletterAt for newsId=${it.news.id}: ${e}`);
      }
    }

    return { sent: result.sent, failed: result.failed, details: result.results };
  }
}
