import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminModule } from '../admin/admin.module';
import { FileUploadModule } from '../file-upload/file-upload.module';
import { EmployeeController } from './employee.controller';
import { EmployeeService } from './employee.service';
import { EmployeeContact } from './entities/employee-contact.entity';

@Module({
	imports: [TypeOrmModule.forFeature([EmployeeContact]), AdminModule, FileUploadModule],
	controllers: [EmployeeController],
	providers: [EmployeeService],
})
export class EmployeeModule {}

