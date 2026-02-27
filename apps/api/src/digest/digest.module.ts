import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DigestController } from './digest.controller';
import { DigestService } from './digest.service';
import { News } from '../news/entities/news.entity';
import { NewsSubscription } from '../subscription/subscription.entity';
import { SubscriptionModule } from '../subscription/subscription.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([News, NewsSubscription]),
    SubscriptionModule,
    EmailModule,
  ],
  controllers: [DigestController],
  providers: [DigestService],
})
export class DigestModule { }
