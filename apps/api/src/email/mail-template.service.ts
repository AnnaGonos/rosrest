import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class MailTemplateService {
  private readonly logger = new Logger(MailTemplateService.name);
  private readonly templateSearchDirs = [
    path.join(__dirname, 'templates'),
    path.join(process.cwd(), 'dist', 'email', 'templates'),
    path.join(process.cwd(), 'apps', 'api', 'src', 'email', 'templates'),
    path.join(process.cwd(), 'src', 'email', 'templates'),
  ];

  private resolveTemplatePath(templateName: string): string {
    const fileName = `${templateName}.html`;

    if (templateName === 'digest') {
      const digestCandidates = [
        path.join(__dirname, 'templates', 'digest.html'),
        path.join(process.cwd(), 'dist', 'email', 'templates', 'digest.html'),
        path.join(process.cwd(), 'apps', 'api', 'src', 'email', 'templates', 'digest.html'),
        path.join(process.cwd(), 'src', 'email', 'templates', 'digest.html'),
      ];

      for (const digestPath of digestCandidates) {
        if (fs.existsSync(digestPath)) {
          return digestPath;
        }
      }

      throw new Error(`Digest template not found. Checked: ${digestCandidates.join(', ')}`);
    }

    for (const dir of this.templateSearchDirs) {
      const fullPath = path.join(dir, fileName);
      if (fs.existsSync(fullPath)) {
        return fullPath;
      }
    }

    throw new Error(
      `Template ${fileName} not found. Checked: ${this.templateSearchDirs.join(', ')}`,
    );
  }

  private renderBuiltInTemplate(
    templateName: string,
    variables: Record<string, string>,
  ): string {
    if (templateName === 'welcome') {
      return `
      <html>
        <body style="font-family:Arial,sans-serif;color:#222;line-height:1.5;">
          <h2>Добро пожаловать${variables.name ? `, ${variables.name}` : ''}!</h2>
          <p>Спасибо за подписку на новости Российской ассоциации реставраторов.</p>
          <p>Сайт: <a href="${variables.siteUrl}">${variables.siteUrl}</a></p>
          <p>Если хотите отписаться: <a href="${variables.unsubscribeUrl}">ссылка</a></p>
        </body>
      </html>
      `;
    }

    return '';
  }


  renderTemplate(
    templateName: string,
    variables: Record<string, string>,
  ): string {
    try {
      const templatePath = this.resolveTemplatePath(templateName);
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

      const fallback = this.renderBuiltInTemplate(templateName, variables);
      if (fallback) {
        this.logger.warn(`Using built-in fallback template for ${templateName}`);
        return fallback;
      }

      throw error;
    }
  }


  generateWelcomeEmail(email: string, name?: string): string {
    const siteUrl = process.env.SITE_URL || 'https://rosrest.com';

    const useSimple = process.env.USE_SIMPLE_EMAIL === 'true';
    const templateName = useSimple ? 'welcome-simple' : 'welcome';

    return this.renderTemplate(templateName, {
      email,
      name: name || '',
      siteUrl,
      unsubscribeUrl: `${siteUrl}/unsubscribe?email=${encodeURIComponent(email)}`,
    });
  }

  generateWelcomeEmailText(email: string, name?: string): string {
    const siteUrl = process.env.SITE_URL || 'https://rosrest.com';
    return `
Добро пожаловать${name ? ', ' + name : ''}!

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

Чтобы отписаться от рассылки, перейдите по ссылке: ${siteUrl}/unsubscribe?email=${encodeURIComponent(email)}

---
Это письмо было отправлено автоматически. 
Пожалуйста, не отвечайте на это письмо.
    `;
  }

  private getDigestFileUrl(url?: string | null): string | null {
    if (!url) return null;

    const raw = String(url).trim();
    if (!raw) return null;

    if (raw.startsWith('http://') || raw.startsWith('https://') || raw.startsWith('//')) {
      return raw;
    }

    const base = process.env.FILE_BASE_URL || process.env.VITE_FILES_BASE_URL || 'https://document.rosrest.com';

    // Guard against accidentally passing news slug as image path.
    if (raw.startsWith('news/')) {
      return null;
    }

    if (raw.startsWith('/uploads')) {
      return `${base}${raw}`;
    }

    if (raw.match(/^\/((documents|files|docs|pdf|docx|doc)\/?)/)) {
      return `${base}${raw}`;
    }

    if (raw.startsWith('uploads/')) {
      return `${base}/${raw}`;
    }

    return raw;
  }

  private formatNewsItemHtml(newsItem: {
    id: string | number;
    slug?: string;
    title: string;
    excerpt?: string;
    publishedAt?: Date | string;
    previewImage?: string;
    tags?: Array<{ id?: number; name?: string; title?: string; label?: string }>;
  }): string {
    const siteUrl = process.env.SITE_URL || 'https://rosrest.com';
    
    // Determine URL path: prefer slug, fallback to id
    let pathForUrl: string;
    if (newsItem.slug && String(newsItem.slug).trim()) {
      pathForUrl = String(newsItem.slug).trim();
    } else {
      pathForUrl = String(newsItem.id).trim();
    }
    
    // Clean up the path (remove leading slashes and potential news/ prefix)
    const normalizedPath = pathForUrl.replace(/^\/+/, '').replace(/^news\//, '');
    const newsUrl = `${siteUrl}/news/${normalizedPath}`;
    
    this.logger.log(
      `formatNewsItemHtml: slug="${newsItem.slug}", normalized="${normalizedPath}", url="${newsUrl}"`,
    );
    const publishedDate = newsItem.publishedAt
      ? new Date(newsItem.publishedAt).toLocaleDateString('ru-RU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
      : '';

    const imageUrl = this.getDigestFileUrl(newsItem.previewImage || undefined);

    const tagsHtml = newsItem.tags && newsItem.tags.length > 0
      ? (() => {
        const tags = newsItem.tags
          .map((t) => (t?.name || t?.title || t?.label || '').trim())
          .filter((tag) => !!tag)
          .map((tag) => `<span class="tag">${tag}</span>`)
          .join(' ');

        return tags ? `<div class="news-tags">${tags}</div>` : '';
      })()
      : '';

    // Use table-based markup for reliable email client rendering and omit excerpt/description
    return `
    <table class="news-table" role="presentation" cellpadding="0" cellspacing="0" width="100%">
      <tr class="news-row">
        <td class="thumb-td" width="140" valign="top">
          ${imageUrl ? `<img src="${imageUrl}" alt="${newsItem.title}" width="140" height="90" />` : ''}
        </td>
        <td valign="top">
          ${publishedDate ? `<div class="news-date">${publishedDate}</div>` : ''}
          <h3 class="news-title"><a href="${newsUrl}">${newsItem.title}</a></h3>
          ${tagsHtml}
          <p style="margin:10px 0 0 0"><a href="${newsUrl}" class="news-link">Читать полностью →</a></p>
        </td>
      </tr>
    </table>
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%"><tr><td class="spacer-td">&nbsp;</td></tr></table>
    `;
  }


  generateDigestEmail(
    newsItems: Array<{
      title: string;
      slug?: string;
      excerpt?: string;
      publishedAt?: Date;
      id: string | number;
    }>,
    subscriberEmail?: string,
  ): string {
    const apiUrl = process.env.API_URL || 'http://localhost:3002';
    const siteUrl = process.env.SITE_URL || 'https://rosrest.com';

    let unsubscribeUrl: string;
    if (subscriberEmail) {
      unsubscribeUrl = `${siteUrl}/unsubscribe?email=${encodeURIComponent(subscriberEmail)}`;
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
      slug?: string;
      excerpt?: string;
      publishedAt?: Date;
      id: string | number;
    }>,
  ): string {
    const siteUrl = process.env.SITE_URL || 'https://rosrest.com';

    const newsSection = newsItems
      .map((item) => {
        const publishedDate = item.publishedAt
          ? new Date(item.publishedAt).toLocaleDateString('ru-RU', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })
          : '';
        const rawPath = (item.slug && String(item.slug).trim())
          ? String(item.slug).trim()
          : String(item.id).trim();
        const normalizedPath = rawPath.replace(/^\/+/, '').replace(/^news\//, '');

        return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${publishedDate}

${item.title}

      Читать: ${siteUrl}/news/${normalizedPath}
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
