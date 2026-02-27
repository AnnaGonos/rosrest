import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NewsSubscription } from './subscription.entity';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { EmailService } from '../email/email.service';
import { MailTemplateService } from '../email/mail-template.service';

@Injectable()
export class SubscriptionService {
  private readonly logger = new Logger(SubscriptionService.name);

  constructor(
    @InjectRepository(NewsSubscription)
    private subscriptionRepository: Repository<NewsSubscription>,
    private emailService: EmailService,
    private mailTemplateService: MailTemplateService,
  ) { }

  async subscribe(dto: CreateSubscriptionDto): Promise<{
    subscription: NewsSubscription;
    status: 'new' | 'reactivated' | 'already_active';
  }> {
    const email = dto.email.toLowerCase().trim();

    let subscription = await this.subscriptionRepository.findOne({
      where: { email },
    });

    let status: 'new' | 'reactivated' | 'already_active';

    if (!subscription) {
      subscription = this.subscriptionRepository.create({
        email,
        isActive: true,
      });
      await this.subscriptionRepository.save(subscription);
      this.logger.log(`New subscription: ${email}`);
      status = 'new';

      await this.sendWelcomeEmail(email);
    } else if (!subscription.isActive) {
      subscription.isActive = true;
      await this.subscriptionRepository.save(subscription);
      this.logger.log(`Reactivated subscription: ${email}`);
      status = 'reactivated';

      await this.sendWelcomeEmail(email);
    } else {
      this.logger.log(`Already active subscription: ${email}`);
      status = 'already_active';
    }

    return { subscription, status };
  }

  private async sendWelcomeEmail(email: string): Promise<void> {
    const html = this.mailTemplateService.generateWelcomeEmail(email);
    const text = this.mailTemplateService.generateWelcomeEmailText(email);

    const success = await this.emailService.sendEmail({
      to: email,
      subject: 'Добро пожаловать! Вы успешно подписались на новости РАР',
      html,
      text,
    });

    if (success) {
      this.logger.log(`Welcome email sent to: ${email}`);
    } else {
      this.logger.warn(`Welcome email not sent to: ${email} (check SMTP config)`);
    }
  }

  async unsubscribe(email: string): Promise<void> {
    const normalizedEmail = email.toLowerCase().trim();
    await this.subscriptionRepository.update(
      { email: normalizedEmail },
      { isActive: false },
    );
    this.logger.log(`Unsubscribed: ${normalizedEmail}`);
  }

  async getActiveSubscriptions(): Promise<NewsSubscription[]> {
    return this.subscriptionRepository.find({
      where: { isActive: true },
    });
  }

  async getAllSubscriptions(): Promise<NewsSubscription[]> {
    return this.subscriptionRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async deleteSubscription(id: number): Promise<void> {
    await this.subscriptionRepository.delete(id);
    this.logger.log(`Subscription deleted: ${id}`);
  }

  async markDigestSent(subscriptionId: number, sentAt: Date): Promise<void> {
    await this.subscriptionRepository.update(
      { id: subscriptionId },
      { lastDigestSentAt: sentAt },
    );
  }
}
