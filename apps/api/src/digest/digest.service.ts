import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { News } from '../news/entities/news.entity';
import { NewsSubscription } from '../subscription/subscription.entity';
import { EmailService } from '../email/email.service';
import { MailTemplateService } from '../email/mail-template.service';

interface DigestNews {
  id: string;
  title: string;
  slug: string;
  previewImage?: string;
  publishedAt?: string;
}

@Injectable()
export class DigestService {
  private readonly logger = new Logger(DigestService.name);

  constructor(
    @InjectRepository(News)
    private newsRepository: Repository<News>,
    @InjectRepository(NewsSubscription)
    private subscriptionRepository: Repository<NewsSubscription>,
    private emailService: EmailService,
    private mailTemplateService: MailTemplateService,
  ) {}

  async collectNewsForDigest(): Promise<DigestNews[]> {

    const latestDigest = await this.subscriptionRepository
      .createQueryBuilder()
      .select('MAX(lastDigestSentAt)', 'latestSendTime')
      .getRawOne();

    const sinceTime =
      latestDigest?.latestSendTime || new Date('1970-01-01');

    this.logger.log(`Collecting news since: ${sinceTime}`);

    const news = await this.newsRepository
      .createQueryBuilder('news')
      .leftJoinAndSelect('news.page', 'page')
      .where('page.isDraft = :isDraft', { isDraft: false })
      .andWhere('page.publishedAt > :sinceTime', { sinceTime })
      .orderBy('page.publishedAt', 'DESC')
      .getMany();

    return news.map((n) => ({
      id: n.id,
      title: n.page.title,
      slug: n.page.slug,
      previewImage: n.previewImage,
      publishedAt: n.page.publishedAt?.toISOString(),
    }));
  }

  async getActiveSubscribers(): Promise<NewsSubscription[]> {
    return this.subscriptionRepository.find({
      where: { isActive: true },
    });
  }

  generateDigestHtml(newsItems: DigestNews[]): string {
    const formattedNews = newsItems.map((news) => ({
      id: parseInt(news.id),
      title: news.title,
      excerpt: news.slug,
      publishedAt: news.publishedAt ? new Date(news.publishedAt) : undefined,
    }));

    return this.mailTemplateService.generateDigestEmail(formattedNews);
  }

  async sendDigestEmails(
    subscribers: NewsSubscription[],
    newsItems: DigestNews[],
  ): Promise<{ sent: number; failed: number }> {
    if (newsItems.length === 0) {
      this.logger.warn('No news to send in digest');
      return { sent: 0, failed: 0 };
    }

    const html = this.generateDigestHtml(newsItems);
    const text = this.mailTemplateService.generateDigestText(
      newsItems.map((n) => ({
        id: parseInt(n.id),
        title: n.title,
        excerpt: n.slug,
        publishedAt: n.publishedAt ? new Date(n.publishedAt) : undefined,
      })),
    );
    const subject = `Дайджест новостей РАР — ${new Date().toLocaleDateString('ru-RU')}`;

    if (!this.emailService.isConfigured()) {
      this.logDigestEmails(subscribers, newsItems);
      return {
        sent: subscribers.length,
        failed: 0,
      };
    }

    const recipientEmails = subscribers.map((s) => s.email);
    return await this.emailService.sendBulkEmail(
      recipientEmails,
      subject,
      html,
      text,
    );
  }


  private logDigestEmails(
    subscribers: NewsSubscription[],
    newsItems: DigestNews[],
  ): void {
    const html = this.generateDigestHtml(newsItems);

    this.logger.log(`
======================================
💌 Digest Email Simulation (SMTP not configured)
======================================
Recipients: ${subscribers.length}
News items: ${newsItems.length}

Sample news titles:
${newsItems.slice(0, 3).map((n) => `  - ${n.title}`).join('\n')}

${subscribers.length > 0 ? `\nFirst recipient: ${subscribers[0].email}` : ''}

HTML Preview (first 300 chars):
${html.substring(0, 300)}...
======================================
    `);
  }
}
