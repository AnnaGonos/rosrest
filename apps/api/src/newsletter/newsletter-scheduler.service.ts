import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
import { NewsletterQueueItem } from './newsletter-queue.entity';
import { NewsletterService } from './newsletter.service';

@Injectable()
export class NewsletterSchedulerService {
  private readonly logger = new Logger(NewsletterSchedulerService.name);

  constructor(
    @InjectRepository(NewsletterQueueItem)
    private queueRepo: Repository<NewsletterQueueItem>,
    private newsletterService: NewsletterService,
  ) {}

  // run every minute and send any scheduled items whose time has come
  @Cron('*/1 * * * *')
  async handleScheduledSends() {
    try {
      const due = await this.queueRepo.find({ where: { isSent: false, scheduledAt: LessThanOrEqual(new Date()) } });
      if (!due || due.length === 0) return;
      const ids = due.map(d => d.id);
      this.logger.log(`Found ${ids.length} scheduled newsletter items to send: ${ids.join(',')}`);
      await this.newsletterService.sendQueue(ids);
    } catch (e) {
      this.logger.error(`Error processing scheduled newsletter items: ${e}`);
    }
  }
}
