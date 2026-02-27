import {
	BadRequestException,
	ForbiddenException,
	Injectable,
	UnauthorizedException,
	Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import * as jwt from 'jsonwebtoken';
import { Repository } from 'typeorm';
import { ChangeEmailDto } from './dto/change-email.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { InitAdminDto } from './dto/init-admin.dto';
import { LoginAdminDto } from './dto/login-admin.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { AdminAccount } from './entities/admin-account.entity';

@Injectable()
export class AdminService {
	private readonly logger = new Logger(AdminService.name);
	private readonly saltRounds = 12;
	private readonly jwtSecret = process.env.ADMIN_JWT_SECRET || 'dev-admin-secret';
	private readonly resetTokenTtlMs = 60 * 60 * 1000;

	constructor(
		@InjectRepository(AdminAccount)
		private readonly adminRepo: Repository<AdminAccount>,
	) {}

	private signAdmin(admin: AdminAccount): string {
		return jwt.sign(
			{
				sub: admin.id,
				email: admin.email,
			},
			this.jwtSecret,
			{ expiresIn: '7d' },
		);
	}

	private async hashPassword(password: string): Promise<string> {
		return bcrypt.hash(password, this.saltRounds);
	}

	private async verifyPassword(password: string, hash: string): Promise<boolean> {
		return bcrypt.compare(password, hash);
	}

	async init(dto: InitAdminDto) {
		const existing = await this.adminRepo.count();
		if (existing > 0) {
			throw new ForbiddenException('Admin already initialized');
		}

		const passwordHash = await this.hashPassword(dto.password);
		const admin = this.adminRepo.create({
			email: dto.email,
			passwordHash,
		});
		await this.adminRepo.save(admin);
	
		
		return { created: true, email: admin.email };
	}

	async login(dto: LoginAdminDto) {
		const admin = await this.adminRepo.findOne({ where: { email: dto.email } });
		if (!admin) {
			this.logger.warn(`Попытка входа с несуществующим email: ${dto.email}`);
			throw new UnauthorizedException('Аккаунта не существует. Пожалуйста, создайте его в разделе "Первый запуск"');
		}
		const ok = await this.verifyPassword(dto.password, admin.passwordHash);
		if (!ok) {
			this.logger.warn(`Неверный пароль для email: ${dto.email}`);
			throw new UnauthorizedException('Неверный пароль');
		}

		this.logger.log(`Успешный вход: ${admin.email}`);
		const token = this.signAdmin(admin);
		return { email: admin.email, token, expiresIn: '7d' };
	}

	me(admin: AdminAccount) {
		return { email: admin.email, loggedIn: true };
	}

	async forgotPassword(dto: ForgotPasswordDto) {
		const admin = await this.adminRepo.findOne({ where: { email: dto.email } });
		if (!admin) {
			return { sent: true };
		}
		const token = crypto.randomBytes(32).toString('hex');
		const expires = new Date(Date.now() + this.resetTokenTtlMs);
		admin.resetToken = token;
		admin.resetTokenExpires = expires;
		await this.adminRepo.save(admin);
		return process.env.NODE_ENV === 'development'
			? { sent: true, token }
			: { sent: true };
	}

	async resetPassword(dto: ResetPasswordDto) {
		const admin = await this.adminRepo.findOne({ where: { resetToken: dto.token } });
		if (!admin || !admin.resetTokenExpires) {
			throw new BadRequestException('Invalid reset token');
		}
		if (admin.resetTokenExpires.getTime() < Date.now()) {
			throw new BadRequestException('Reset token expired');
		}

		admin.passwordHash = await this.hashPassword(dto.newPassword);
		admin.resetToken = null;
		admin.resetTokenExpires = null;
		await this.adminRepo.save(admin);
		return { reset: true };
	}

	async changeEmail(admin: AdminAccount, dto: ChangeEmailDto) {
		if (dto.newEmail !== dto.confirmEmail) {
			throw new BadRequestException('Emails do not match');
		}
		const ok = await this.verifyPassword(dto.currentPassword, admin.passwordHash);
		if (!ok) {
			throw new UnauthorizedException('Current password is incorrect');
		}
		admin.email = dto.newEmail;
		await this.adminRepo.save(admin);

		const token = this.signAdmin(admin);
		return { email: admin.email, token, updated: true };
	}

	async changePassword(admin: AdminAccount, dto: ChangePasswordDto) {
		if (dto.newPassword !== dto.confirmPassword) {
			throw new BadRequestException('Passwords do not match');
		}
		const ok = await this.verifyPassword(dto.currentPassword, admin.passwordHash);
		if (!ok) {
			throw new UnauthorizedException('Current password is incorrect');
		}
		admin.passwordHash = await this.hashPassword(dto.newPassword);
		await this.adminRepo.save(admin);

		const token = this.signAdmin(admin);
		return { token, passwordChanged: true };
	}
}

