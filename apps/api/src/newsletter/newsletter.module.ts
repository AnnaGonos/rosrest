import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NewsletterQueueItem } from './newsletter-queue.entity';
import { NewsletterService } from './newsletter.service';
import { NewsletterController } from './newsletter.controller';
import { News } from '../news/entities/news.entity';
import { SubscriptionModule } from '../subscription/subscription.module';
import { EmailModule } from '../email/email.module';
import { NewsletterSchedulerService } from './newsletter-scheduler.service';

@Module({
  imports: [TypeOrmModule.forFeature([NewsletterQueueItem, News]), SubscriptionModule, EmailModule],
  providers: [NewsletterService, NewsletterSchedulerService],
  controllers: [NewsletterController],
  exports: [NewsletterService],
})
export class NewsletterModule {}
