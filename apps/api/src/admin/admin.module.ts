import { Module, forwardRef } from '@nestjs/common';
import { MailService } from '../common/mail.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtAuthGuard } from './jwt-auth.guard';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminAccount } from './entities/admin-account.entity';

@Module({
	imports: [TypeOrmModule.forFeature([AdminAccount])],
	controllers: [AdminController],
	providers: [AdminService, JwtAuthGuard, MailService],
	exports: [JwtAuthGuard, TypeOrmModule],
})
export class AdminModule {}

