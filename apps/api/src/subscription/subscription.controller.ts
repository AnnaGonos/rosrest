import { Body, Controller, Post, Get, Delete, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SubscriptionService } from './subscription.service';
import { MailTemplateService } from '../email/mail-template.service';
import { EmailService } from '../email/email.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';

@ApiTags('subscriptions')
@Controller('subscriptions')
export class SubscriptionController {
  constructor(
    private readonly subscriptionService: SubscriptionService,
    private readonly mailTemplateService: MailTemplateService,
    private readonly emailService: EmailService,
  ) {}

  @Post('news/subscribe')
  @ApiOperation({ summary: 'Подписаться на новости' })
  @ApiResponse({ status: 201, description: 'Успешно подписано' })
  @ApiResponse({ status: 400, description: 'Ошибка валидации email' })
  async subscribeToNews(@Body() dto: CreateSubscriptionDto) {
    const result = await this.subscriptionService.subscribe(dto);
    
    let message: string;
    if (result.status === 'already_active') {
      message = 'Вы уже подписаны на новости';
    } else if (result.status === 'reactivated') {
      message = 'Ваша подписка успешно возобновлена';
    } else {
      message = 'Вы успешно подписались на новости';
    }
    
    return {
      success: true,
      message,
      status: result.status,
      subscription: {
        id: result.subscription.id,
        email: result.subscription.email,
      },
    };
  }

  @Post('news/unsubscribe')
  @ApiOperation({ summary: 'Отписаться от новостей' })
  @ApiResponse({ status: 200, description: 'Успешно отписано' })
  async unsubscribeFromNews(@Body() dto: CreateSubscriptionDto) {
    await this.subscriptionService.unsubscribe(dto.email);
    return {
      success: true,
      message: 'Вы успешно отписались от новостей',
    };
  }

  @Get('preview/welcome')
  @ApiOperation({ summary: 'Предпросмотр шаблона приветственного письма (админ)' })
  @ApiResponse({ status: 200, description: 'Предпросмотр письма' })
  async previewWelcomeEmail() {
    const html = this.mailTemplateService.generateWelcomeEmail('example@email.com');
    const text = this.mailTemplateService.generateWelcomeEmailText('example@email.com');

    return {
      success: true,
      type: 'welcome',
      html,
      text,
      preview: {
        email: 'example@email.com',
        generatedAt: new Date().toISOString(),
      },
    };
  }

  @Post('test/send-welcome')
  @ApiOperation({ summary: 'Отправить тестовое welcome-письмо на указанный email (для тестирования)' })
  @ApiResponse({ status: 200, description: 'Письмо отправлено' })
  async testSendWelcomeEmail(@Body() dto: CreateSubscriptionDto) {
    const email = dto.email.toLowerCase().trim();
    
    const html = this.mailTemplateService.generateWelcomeEmail(email);
    const text = this.mailTemplateService.generateWelcomeEmailText(email);

    const success = await this.emailService.sendEmail({
      to: email,
      subject: 'Добро пожаловать! Вы успешно подписались на новости РАР',
      html,
      text,
    });

    return {
      success,
      message: success 
        ? `Тестовое письмо успешно отправлено на ${email}` 
        : 'Не удалось отправить письмо. Проверьте настройки SMTP в .env файле',
      email,
      sentAt: success ? new Date().toISOString() : null,
    };
  }

  @Get('list')
  @ApiOperation({ summary: 'Получить список всех подписчиков (админ)' })
  @ApiResponse({ status: 200, description: 'Список подписчиков' })
  async getSubscriptions() {
    const subscriptions = await this.subscriptionService.getAllSubscriptions();
    return {
      success: true,
      data: subscriptions,
      count: subscriptions.length,
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Удалить подписчика по ID (админ)' })
  @ApiResponse({ status: 200, description: 'Подписчик удален' })
  async deleteSubscription(@Param('id') id: number) {
    await this.subscriptionService.deleteSubscription(id);
    return {
      success: true,
      message: 'Подписчик удален',
    };
  }
}
