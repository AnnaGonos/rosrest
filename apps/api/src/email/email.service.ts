import { Injectable, Logger } from '@nestjs/common';
import nodemailer, { Transporter } from 'nodemailer';

interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: Transporter | null = null;

  constructor() {
    this.initializeTransporter();
  }


  private initializeTransporter() {
    const host = process.env.MAIL_HOST || 'localhost';
    const port = parseInt(process.env.MAIL_PORT || '25', 10);
    const user = process.env.MAIL_USER;
    const pass = process.env.MAIL_PASSWORD;

    try {
      if (host === 'localhost' || host === '127.0.0.1') {
        this.transporter = nodemailer.createTransport({
          host: 'localhost',
          port: port || 25,
          secure: false,
          ignoreTLS: true,
        } as any);

        this.logger.log(
          '✓ Email service initialized (local Postfix on localhost:25)',
        );
      } else {
        if (!user || !pass) {
          this.logger.warn(
            'External SMTP requires authentication. Email sending is disabled. ' +
            'Please set MAIL_USER and MAIL_PASSWORD in .env file, or use localhost for Postfix',
          );
          return;
        }

        this.transporter = nodemailer.createTransport({
          host,
          port,
          secure: port === 465,
          auth: {
            user,
            pass,
          },
          tls: {
            rejectUnauthorized: true,
            minVersion: 'TLSv1.2',
          },
          connectionTimeout: 10000,
          greetingTimeout: 10000,
          socketTimeout: 10000,
          requireTLS: port !== 465,
        } as any);

        this.transporter
          .verify()
          .then(() => {
            this.logger.log(
              `✓ Email service connected successfully (${host}:${port})`,
            );
          })
          .catch((err) => {
            this.logger.error(
              `Failed to verify email transporter: ${err.message}`,
            );
          });
      }
    } catch (error) {
      this.logger.error(
        `Failed to initialize email transporter: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!this.transporter) {
      this.logger.warn(
        `Email not sent (SMTP not configured): ${Array.isArray(options.to) ? options.to.join(', ') : options.to}`,
      );
      this.logger.debug(`Subject: ${options.subject}`);
      return false;
    }

    try {
      const from = process.env.MAIL_FROM || 'noreply@rosrestoration.ru';

      const info = await this.transporter.sendMail({
        from: `Российская ассоциация реставраторов <${from}>`,
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
        headers: {
          'X-Mailer': 'RosRest Newsletter System',
          'List-Unsubscribe': `<${process.env.API_URL || 'http://localhost:3002'}/subscriptions/news/unsubscribe>`,
        },
      });

      this.logger.log(
        `✓ Email sent successfully. Message ID: ${info.messageId}`,
      );
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to send email: ${error instanceof Error ? error.message : String(error)}`,
      );
      return false;
    }
  }


  async sendBulkEmail(
    recipients: string[],
    subject: string,
    html: string,
    text?: string,
  ): Promise<{ sent: number; failed: number }> {
    if (!this.transporter) {
      this.logger.warn(
        `Bulk email not sent (SMTP not configured). Recipients: ${recipients.length}`,
      );
      return { sent: 0, failed: recipients.length };
    }

    let sent = 0;
    let failed = 0;

    this.logger.log(`Starting bulk email send to ${recipients.length} recipients...`);

    for (const email of recipients) {
      const success = await this.sendEmail({
        to: email,
        subject,
        html,
        text,
      });

      if (success) {
        sent++;
      } else {
        failed++;
      }

      if (process.env.MAIL_HOST !== 'localhost' && process.env.MAIL_HOST !== '127.0.0.1') {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    this.logger.log(
      `Bulk email campaign completed. Sent: ${sent}, Failed: ${failed}`,
    );

    return { sent, failed };
  }

  isConfigured(): boolean {
    return !!this.transporter;
  }
}
