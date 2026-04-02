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

  private decodeHtmlEntities(input: string): string {
    return input
      .replace(/&nbsp;/gi, ' ')
      .replace(/&amp;/gi, '&')
      .replace(/&quot;/gi, '"')
      .replace(/&#39;/gi, "'")
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>');
  }

  private htmlToPlainText(html: string): string {
    if (!html) return '';

    let text = html;

    text = text.replace(/<style[\s\S]*?<\/style>/gi, '');
    text = text.replace(/<script[\s\S]*?<\/script>/gi, '');

    text = text.replace(
      /<a\s+[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi,
      (_match, href, label) => {
        const cleanLabel = String(label || '').replace(/<[^>]+>/g, '').trim();
        if (!cleanLabel) {
          return String(href).trim();
        }
        return `${cleanLabel} (${String(href).trim()})`;
      },
    );

    text = text.replace(/<\s*br\s*\/?\s*>/gi, '\n');
    text = text.replace(/<\/(p|div|h1|h2|h3|h4|h5|h6|tr|li|table|section|article)>/gi, '\n');
    text = text.replace(/<li[^>]*>/gi, '- ');

    text = text.replace(/<[^>]+>/g, '');
    text = this.decodeHtmlEntities(text);

    text = text.replace(/\r\n/g, '\n');
    text = text.replace(/\n{3,}/g, '\n\n');
    text = text.replace(/[ \t]{2,}/g, ' ');

    return text.trim();
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

      html = html.replace(/{{\s*[^}]+\s*}}/g, '');

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
    const html = this.generateWelcomeEmail(email, name);
    return this.htmlToPlainText(html);
  }

  private getDigestFileUrl(url?: string | null): string | null {
    if (!url) return null;

    const raw = String(url).trim();
    if (!raw) return null;

    if (raw.startsWith('http://') || raw.startsWith('https://') || raw.startsWith('//')) {
      return raw;
    }

    const base = process.env.FILE_BASE_URL || process.env.VITE_FILES_BASE_URL || 'https://document.rosrest.com';

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

    let pathForUrl: string;
    if (newsItem.slug && String(newsItem.slug).trim()) {
      pathForUrl = String(newsItem.slug).trim();
    } else {
      pathForUrl = String(newsItem.id).trim();
    }

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
    subscriberEmail?: string,
  ): string {
    const html = this.generateDigestEmail(newsItems, subscriberEmail);
    return this.htmlToPlainText(html);
  }
}
