import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: 'smtp.beget.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async sendMail(to: string, subject: string, text: string, html?: string) {
    await this.transporter.sendMail({
      from: 'RosRest <noreply@rosrest.com>',
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
}
