import { PartialType } from '@nestjs/mapped-types';
import { CreateMonitoringZakonDto } from './create-monitoring-zakon.dto';

export class UpdateMonitoringZakonDto extends PartialType(CreateMonitoringZakonDto) { }
