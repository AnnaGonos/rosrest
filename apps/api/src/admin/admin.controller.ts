import {
	Body,
	Controller,
	Get,
	HttpCode,
	HttpStatus,
	Patch,
	Post,
	Query,
	Req,
	UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiOperation, ApiTags, ApiBearerAuth, ApiQuery, ApiOkResponse } from '@nestjs/swagger';
import { JwtAuthGuard, AdminRequest } from './jwt-auth.guard';
import { AdminService } from './admin.service';
import { LibraryService } from '../library/library.service';
import { ChangeEmailDto } from './dto/change-email.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { InitAdminDto } from './dto/init-admin.dto';
import { LoginAdminDto } from './dto/login-admin.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@ApiTags('admin')
@Controller('admin')
export class AdminController {
	constructor(
		private readonly adminService: AdminService,
	) {}

	@Post('init')
	@HttpCode(HttpStatus.CREATED)
	@ApiOperation({ summary: 'Create first admin (only when empty)' })
	init(@Body() dto: InitAdminDto) {
		return this.adminService.init(dto);
	}

	@Post('login')
	@Throttle({ default: { limit: 5, ttl: 60000 } })
	@ApiOperation({ summary: 'Admin login (returns JWT token)' })
	async login(@Body() dto: LoginAdminDto) {
		return this.adminService.login(dto);
	}

	@Get('me')
	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth()
	@ApiOperation({ summary: 'Check current admin session' })
	me(@Req() req: AdminRequest) {
		return this.adminService.me(req.admin!);
	}

	@Post('forgot-password')
	@ApiOperation({ summary: 'Send reset token to email' })
	forgotPassword(@Body() dto: ForgotPasswordDto) {
		return this.adminService.forgotPassword(dto);
	}

	@Post('reset-password')
	@ApiOperation({ summary: 'Reset password with token' })
	resetPassword(@Body() dto: ResetPasswordDto) {
		return this.adminService.resetPassword(dto);
	}

	@Patch('account/email')
	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth()
	@ApiOperation({ summary: 'Change admin email (requires current password)' })
	async changeEmail(
		@Req() req: AdminRequest,
		@Body() dto: ChangeEmailDto,
	) {
		return this.adminService.changeEmail(req.admin!, dto);
	}

	@Patch('account/password')
	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth()
	@ApiOperation({ summary: 'Change password (requires current password)' })
	async changePassword(
		@Req() req: AdminRequest,
		@Body() dto: ChangePasswordDto,
	) {
		return this.adminService.changePassword(req.admin!, dto);
	}
}




