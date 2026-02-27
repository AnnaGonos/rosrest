import {
	CanActivate,
	ExecutionContext,
	Injectable,
	UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Request } from 'express';
import * as jwt from 'jsonwebtoken';
import { Repository } from 'typeorm';
import { AdminAccount } from './entities/admin-account.entity';

export interface AdminRequest extends Request {
	admin?: AdminAccount;
	adminTokenPayload?: jwt.JwtPayload;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
	private readonly jwtSecret = process.env.ADMIN_JWT_SECRET || 'dev-admin-secret';

	constructor(
		@InjectRepository(AdminAccount)
		private readonly adminRepo: Repository<AdminAccount>,
	) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const req = context.switchToHttp().getRequest<AdminRequest>();
		const authHeader = req.headers.authorization;

		if (!authHeader?.startsWith('Bearer ')) {
			throw new UnauthorizedException('Missing or invalid authorization header');
		}

		const token = authHeader.substring(7);

		try {
			const payload = jwt.verify(token, this.jwtSecret) as jwt.JwtPayload;
			const adminId = parseInt(payload.sub as string, 10);
			const admin = await this.adminRepo.findOne({ where: { id: adminId } });
			if (!admin) {
				throw new UnauthorizedException('Admin not found');
			}

			req.admin = admin;
			req.adminTokenPayload = payload;
			return true;
		} catch (error) {
			throw new UnauthorizedException('Invalid token');
		}
	}
}

