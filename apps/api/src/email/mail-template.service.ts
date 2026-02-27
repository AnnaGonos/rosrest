import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class MailTemplateService {
  private readonly logger = new Logger(MailTemplateService.name);
  private templatesDir = path.join(__dirname, 'templates');


  renderTemplate(
    templateName: string,
    variables: Record<string, string>,
  ): string {
    const templatePath = path.join(this.templatesDir, `${templateName}.html`);

    try {
      let html = fs.readFileSync(templatePath, 'utf-8');

      Object.entries(variables).forEach(([key, value]) => {
        const placeholder = new RegExp(`{{${key}}}`, 'g');
        html = html.replace(placeholder, value || '');
      });

      return html;
    } catch (error) {
      this.logger.error(
        `Failed to load template ${templateName}: ${error instanceof Error ? error.message : String(error)
        }`,
      );
      throw error;
    }
  }


  generateWelcomeEmail(email: string): string {
    const siteUrl = process.env.SITE_URL || 'https://rosrest.ru';
    const apiUrl = process.env.API_URL || 'http://localhost:3002';

    const useSimple = process.env.USE_SIMPLE_EMAIL === 'true';
    const templateName = useSimple ? 'welcome-simple' : 'welcome';

    return this.renderTemplate(templateName, {
      email,
      siteUrl,
      unsubscribeUrl: `${apiUrl}/subscriptions/news/unsubscribe?email=${encodeURIComponent(email)}`,
    });
  }

  generateWelcomeEmailText(email: string): string {
    const siteUrl = process.env.SITE_URL || 'https://rosrest.ru';

    return `
Добро пожаловать!

Спасибо за подписку на рассылку новостей Российской ассоциации реставраторов.

ЧТО ВЫ ПОЛУЧИТЕ:
- Еженедельный дайджест с новыми публикациями
- Важные новости из ассоциации
- Информацию о событиях и мониторинге законодательства
- Все новости в одном письме

Письма будут приходить на ${email} один раз в неделю или по мере необходимости.

РЕКОМЕНДУЕМ:
Посетите сайт РАР для прочтения всех последних новостей:
${siteUrl}

Если у вас есть вопросы, свяжитесь с нами на сайте.

---
Это письмо было отправлено автоматически. 
Пожалуйста, не отвечайте на это письмо.
    `;
  }

  private formatNewsItemHtml(newsItem: {
    title: string;
    excerpt?: string;
    publishedAt?: Date;
    id: number;
  }): string {
    const siteUrl = process.env.SITE_URL || 'https://rosrest.ru';
    const newsUrl = `${siteUrl}/news/${newsItem.id}`;
    const publishedDate = newsItem.publishedAt
      ? new Date(newsItem.publishedAt).toLocaleDateString('ru-RU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
      : '';

    return `
    <div class="news-item">
        ${publishedDate ? `<div class="news-date">${publishedDate}</div>` : ''}
        <h3 class="news-title">
            <a href="${newsUrl}">${newsItem.title}</a>
        </h3>
        ${newsItem.excerpt ? `<p class="news-excerpt">${newsItem.excerpt}</p>` : ''}
        <a href="${newsUrl}" class="news-link">Читать полностью →</a>
    </div>
    `;
  }


  generateDigestEmail(
    newsItems: Array<{
      title: string;
      excerpt?: string;
      publishedAt?: Date;
      id: number;
    }>,
    subscriberEmail?: string,
  ): string {
    const apiUrl = process.env.API_URL || 'http://localhost:3002';
    const siteUrl = process.env.SITE_URL || 'https://rosrest.ru';

    let unsubscribeUrl: string;
    if (subscriberEmail) {
      unsubscribeUrl = `${apiUrl}/subscriptions/news/unsubscribe?email=${encodeURIComponent(subscriberEmail)}`;
    } else {
      unsubscribeUrl = `${siteUrl}/unsubscribe`;
    }

    let newsItemsHtml: string;
    if (newsItems.length === 0) {
      newsItemsHtml = `
      <div class="empty-state">
          <p>📭 К сожалению, в этот раз нет новых публикаций.</p>
          <p>Посетите наш сайт, чтобы узнать о других материалах.</p>
      </div>
      `;
    } else {
      newsItemsHtml = newsItems
        .map((item) => this.formatNewsItemHtml(item))
        .join('');
    }

    return this.renderTemplate('digest', {
      newsItems: newsItemsHtml,
      siteUrl,
      unsubscribeUrl,
    });
  }

  generateDigestText(
    newsItems: Array<{
      title: string;
      excerpt?: string;
      publishedAt?: Date;
      id: number;
    }>,
  ): string {
    const siteUrl = process.env.SITE_URL || 'https://rosrest.ru';

    const newsSection = newsItems
      .map((item) => {
        const publishedDate = item.publishedAt
          ? new Date(item.publishedAt).toLocaleDateString('ru-RU', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })
          : '';
        return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${publishedDate}

${item.title}

${item.excerpt || ''}

Читать: ${siteUrl}/news/${item.id}
        `;
      })
      .join('\n');

    return `
ДАЙДЖЕСТ НОВОСТЕЙ
Российская ассоциация реставраторов

${newsItems.length > 0 ? newsSection : '\nК сожалению, в этот раз нет новых публикаций.\n'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Посетите наш сайт для получения полной информации:
${siteUrl}

Это письмо было отправлено автоматически.
Пожалуйста, не отвечайте на это письмо.
    `;
  }
}
