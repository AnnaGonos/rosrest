import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { NewsletterService } from './newsletter.service';
import { CreateNewsletterQueueDto } from './dto/create-newsletter-queue.dto';

@Controller('newsletter')
export class NewsletterController {
  constructor(private readonly newsletterService: NewsletterService) {}

  @Post('queue/add')
  async addToQueue(@Body() dto: CreateNewsletterQueueDto) {
    return this.newsletterService.addToQueue(dto);
  }

  @Get('queue')
  async listQueue(@Query('pending') pending?: string) {
    const pendingOnly = pending === undefined ? true : pending === 'true';
    return this.newsletterService.listQueue(pendingOnly);
  }

  @Post('queue/send')
  async sendQueue(@Body('ids') ids?: number[], @Body('scheduledAt') scheduledAt?: string) {
    const dt = scheduledAt ? new Date(scheduledAt) : undefined;
    return this.newsletterService.sendQueue(ids, dt);
  }

  @Delete('queue/:id')
  async delete(@Param('id') id: string) {
    await this.newsletterService.delete(parseInt(id, 10));
    return { ok: true };
  }

  @Get('archive')
  async getArchive() {
    const data = await this.newsletterService.getArchive();
    return { success: true, data };
  }
}
