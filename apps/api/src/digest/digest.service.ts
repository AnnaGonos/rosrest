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

  private extractImageFromHtml(html?: string): string | undefined {
    if (!html) return undefined;
    const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
    return match?.[1]?.trim() || undefined;
  }

  private findImageInValue(value: any): string | undefined {
    if (value == null) return undefined;

    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) return undefined;

      const fromHtml = this.extractImageFromHtml(trimmed);
      if (fromHtml) return fromHtml;

      if (
        /^https?:\/\//i.test(trimmed) ||
        trimmed.startsWith('/uploads') ||
        trimmed.startsWith('uploads/')
      ) {
        return trimmed;
      }

      if (/\.(jpg|jpeg|png|webp|gif|svg)(\?.*)?$/i.test(trimmed)) {
        return trimmed;
      }

      return undefined;
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        const found = this.findImageInValue(item);
        if (found) return found;
      }
      return undefined;
    }

    if (typeof value === 'object') {
      const preferredKeys = ['image', 'imageUrl', 'previewImage', 'src', 'url', 'path', 'file'];
      for (const key of preferredKeys) {
        if (key in value) {
          const found = this.findImageInValue(value[key]);
          if (found) return found;
        }
      }

      for (const nested of Object.values(value)) {
        const found = this.findImageInValue(nested);
        if (found) return found;
      }
    }

    return undefined;
  }

  private extractPreviewImageFromPage(page: any): string | undefined {
    if (!page?.blocks || !Array.isArray(page.blocks)) return undefined;
    for (const block of page.blocks) {
      const found = this.findImageInValue(block?.content);
      if (found) return found;
      if (Array.isArray(block?.children)) {
        for (const child of block.children) {
          const childFound = this.findImageInValue(child?.content);
          if (childFound) return childFound;
        }
      }
    }
    return undefined;
  }

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
      .leftJoinAndSelect('page.blocks', 'block')
      .leftJoinAndSelect('block.children', 'children')
      .where('page.isDraft = :isDraft', { isDraft: false })
      .andWhere('page.publishedAt > :sinceTime', { sinceTime })
      .orderBy('page.publishedAt', 'DESC')
      .getMany();

    return news.map((n) => {
      const previewImage = n.previewImage || this.extractPreviewImageFromPage(n.page);
      const digestNews = {
        id: n.id,
        title: n.page.title,
        slug: n.page.slug,
        previewImage,
        publishedAt: n.page.publishedAt?.toISOString(),
      };
      this.logger.log(
        `Collected news: id=${digestNews.id}, slug=${digestNews.slug}, title=${digestNews.title}, previewImage=${digestNews.previewImage}`,
      );
      return digestNews;
    });
  }

  async getActiveSubscribers(): Promise<NewsSubscription[]> {
    return this.subscriptionRepository.find({
      where: { isActive: true },
    });
  }

  generateDigestHtml(newsItems: DigestNews[]): string {
    const formattedNews = newsItems.map((news) => ({
      id: news.id,
      slug: news.slug,
      title: news.title,
      excerpt: '',
      previewImage: news.previewImage,
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
        id: n.id,
        slug: n.slug,
        title: n.title,
        excerpt: '',
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
    const result = await this.emailService.sendBulkEmail(
      recipientEmails,
      subject,
      html,
      text,
    );

    return { sent: result.sent, failed: result.failed };
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
