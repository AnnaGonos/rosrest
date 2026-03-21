import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;
  private readonly fromEmail: string;
  private readonly hasSmtpAuth: boolean;

  constructor() {
    const host = process.env.MAIL_HOST || process.env.SMTP_HOST || 'smtp.beget.com';
    const port = parseInt(process.env.MAIL_PORT || process.env.SMTP_PORT || '465', 10);
    const secure = process.env.MAIL_SECURE
      ? process.env.MAIL_SECURE === 'true'
      : port === 465;
    const user = process.env.MAIL_USER || process.env.SMTP_USER || '';
    const pass = process.env.MAIL_PASSWORD || process.env.SMTP_PASS || '';
    this.hasSmtpAuth = Boolean(user && pass);

    this.fromEmail = process.env.MAIL_FROM || user || 'noreply@rosrest.com';

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: this.hasSmtpAuth ? { user, pass } : undefined,
    });
  }

  async sendMail(to: string, subject: string, text: string, html?: string) {
    // Avoid nodemailer "Missing credentials for LOGIN" by failing fast with explicit config hint.
    if (!this.hasSmtpAuth) {
      throw new Error(
        'SMTP credentials are not configured. Set MAIL_USER/MAIL_PASSWORD (or SMTP_USER/SMTP_PASS) in API environment.',
      );
    }

    await this.transporter.sendMail({
      from: `RosRest <${this.fromEmail}>`,
      to,
      subject,
      text,
      html,
    });
  }

  getWelcomeHtml(email: string) {
    return `<h2>Добро пожаловать в админ-панель RosRest!</h2>
<p>Ваш email: <b>${email}</b></p>
<p>Это приветственное письмо при первом запуске проекта.</p>`;
  }

  getLoginHtml(email: string, ip?: string) {
    return `<h2>Вход администратора</h2>
<p>Выполнен вход в админку RosRest с email: <b>${email}</b>${ip ? `<br>IP: ${ip}` : ''}</p>`;
  }

  getPasswordChangeHtml(email: string) {
    return `<h2>Смена пароля администратора</h2>
<p>Пароль для аккаунта <b>${email}</b> был изменён.</p>`;
  }

  getResetPasswordHtml(email: string, resetUrl: string) {
    return `<h2>Сброс пароля администратора</h2>
<p>Для аккаунта <b>${email}</b> был запрошен сброс пароля.</p>
<p>Чтобы установить новый пароль, перейдите по ссылке:</p>
<p><a href="${resetUrl}">${resetUrl}</a></p>
<p>Если вы не запрашивали сброс пароля, просто проигнорируйте это письмо.</p>`;
  }
}
