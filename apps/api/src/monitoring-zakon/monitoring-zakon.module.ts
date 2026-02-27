import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MonitoringZakon } from './entities/monitoring-zakon.entity';
import { MonitoringZakonService } from './monitoring-zakon.service';
import { MonitoringZakonController } from './monitoring-zakon.controller';
import { Page } from '../page/entities/page.entity';
import { Block } from '../page/entities/block.entity';
import { AdminModule } from '../admin/admin.module';

@Module({
  imports: [TypeOrmModule.forFeature([MonitoringZakon, Page, Block]), AdminModule],
  providers: [MonitoringZakonService],
  controllers: [MonitoringZakonController],
})
export class MonitoringZakonModule { }
