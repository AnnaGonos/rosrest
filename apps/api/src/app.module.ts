import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { AdminModule } from './admin/admin.module';
import { PartnerModule } from './partner/partner.module';
import { EmployeeModule } from './employee/employee.module';
import { AwardModule } from './award/award.module';
import { DocumentModule } from './document/document.module';
import { EducationModule } from './education/education.module';
import { LibraryModule } from './library/library.module';
import { HomeSliderModule } from './home-slider/home-slider.module';
import { EventModule } from './event/event.module';
import { PageModule } from './page';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { ProjectModule } from './project/project.module';
import { ServiceModule } from './service/service.module';
import { MonitoringZakonModule } from './monitoring-zakon/monitoring-zakon.module';
import { RarMemberModule } from './rar-member/rar-member.module';
import { NewsModule } from './news/news.module';
import { NewsTagModule } from './news/news-tag/news-tag.module';
import { CommentModule } from './comment/comment.module';
import { MenuModule } from './menu/menu.module';
import { SubscriptionModule } from './subscription/subscription.module';
import { DigestModule } from './digest/digest.module';
import { EmailModule } from './email/email.module';
import { ForJournalistModule } from './for-journalist/for-journalist.module';
import { redisStore } from 'cache-manager-redis-yet';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

@Module({
  imports: [
    ThrottlerModule.forRoot([{
      ttl: 60000, // 1 минута
      limit: 10,
    }]),
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: async () => ({
        store: await redisStore({
          url: process.env.REDIS_URL || 'redis://localhost:6379',
        }),
      }),
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_DEV_HOST || 'localhost',
      port: parseInt(process.env.DB_DEV_PORT || '5432', 10),
      username: process.env.DB_DEV_USER || 'postgres',
      password: process.env.DB_DEV_PASSWORD || 'postgres',
      database: process.env.DB_DEV_NAME || 'rosrest_dev',
      autoLoadEntities: true,
      synchronize: true,
      logging: process.env.NODE_ENV === 'development',
    }),
    AdminModule,
    PartnerModule,
    EmployeeModule,
    AwardModule,
    DocumentModule,
    EducationModule,
    LibraryModule,
    HomeSliderModule,
    EventModule,
    PageModule,
    ProjectModule,
    ServiceModule,
    MonitoringZakonModule,
    RarMemberModule,
    NewsModule,
    NewsTagModule,
    CommentModule,
    MenuModule,
    SubscriptionModule,
    DigestModule,
    EmailModule,
    ForJournalistModule,
  ],
})
export class AppModule {}

