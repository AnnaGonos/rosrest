import { Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { MailTemplateService } from './mail-template.service';

@Module({
  providers: [EmailService, MailTemplateService],
  exports: [EmailService, MailTemplateService],
})
export class EmailModule {}
