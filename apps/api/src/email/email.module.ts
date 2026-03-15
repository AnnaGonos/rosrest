import { Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { MailTemplateService } from './mail-template.service';
import { EmailController } from './email.controller';

@Module({
  providers: [EmailService, MailTemplateService],
  controllers: [EmailController],
  exports: [EmailService, MailTemplateService],
})
export class EmailModule {}
