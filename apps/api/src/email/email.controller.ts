import { Body, Controller, Post } from '@nestjs/common';
import { EmailService } from './email.service';

@Controller('email')
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @Post('test')
  async sendTest(@Body() body: { to: string; subject?: string; text?: string; html?: string }) {
    const to = body.to;
    const subject = body.subject || 'Test email from Rosrest';
    const html = body.html || `<p>Test email sent at ${new Date().toISOString()}</p>`;
    const text = body.text || `Test email sent at ${new Date().toISOString()}`;
    const ok = await this.emailService.sendEmail({ to, subject, html, text });
    return { ok };
  }
}
