import { Controller, Post, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { DigestService } from './digest.service';
import { SubscriptionService } from '../subscription/subscription.service';
import { MailTemplateService } from '../email/mail-template.service';

@ApiTags('digest')
@Controller('digest')
export class DigestController {
  constructor(
    private readonly digestService: DigestService,
    private readonly subscriptionService: SubscriptionService,
    private readonly mailTemplateService: MailTemplateService,
  ) { }

  @Post('send')
  @ApiOperation({ summary: 'Отправить дайджест новостей подписчикам (админ)' })
  @ApiResponse({ status: 200, description: 'Дайджест отправлен' })
  async sendDigest() {
    const newsItems = await this.digestService.collectNewsForDigest();

    const subscribers = await this.subscriptionService.getActiveSubscriptions();

    const result = await this.digestService.sendDigestEmails(
      subscribers,
      newsItems,
    );

    const now = new Date();
    for (const subscriber of subscribers) {
      await this.subscriptionService.markDigestSent(subscriber.id, now);
    }

    return {
      success: true,
      message:
        result.sent > 0
          ? `Дайджест отправлен ${result.sent} подписчикам`
          : 'Дайджест (письма логировались, SMTP не настроен)',
      newsCount: newsItems.length,
      subscriberCount: subscribers.length,
      sent: result.sent,
      failed: result.failed,
      sentAt: now.toISOString(),
    };
  }

  @Get('preview')
  @ApiOperation({ summary: 'Предпросмотр шаблона дайджеста' })
  @ApiResponse({ status: 200, description: 'Предпросмотр дайджеста' })
  async previewDigest() {
    const newsItems = await this.digestService.collectNewsForDigest();

    const previewNews = newsItems.length > 0 ? newsItems.slice(0, 5) : [
      {
        id: '1',
        title: 'Пример новости 1: Важное обновление законодательства',
        slug: 'example-news-1',
        publishedAt: new Date().toISOString(),
      },
      {
        id: '2',
        title: 'Пример новости 2: Новые проекты РАР',
        slug: 'example-news-2',
        publishedAt: new Date(Date.now() - 86400000).toISOString(),
      },
      {
        id: '3',
        title: 'Пример новости 3: Конференция и события',
        slug: 'example-news-3',
        publishedAt: new Date(Date.now() - 172800000).toISOString(),
      },
    ];

    const html = this.digestService.generateDigestHtml(previewNews);
    const text = this.mailTemplateService.generateDigestText(
      previewNews.map((n) => ({
        id: parseInt(n.id),
        title: n.title,
        excerpt: n.slug,
        publishedAt: n.publishedAt ? new Date(n.publishedAt) : undefined,
      })),
    );

    return {
      success: true,
      newsCount: previewNews.length,
      html,
      text,
      preview: {
        news: previewNews,
        generatedAt: new Date().toISOString(),
      },
    };
  }
}
