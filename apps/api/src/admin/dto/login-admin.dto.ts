import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginAdminDto {
	@ApiProperty({ example: 'admin@rosrest.com' })
	@IsEmail()
	email!: string;

	@ApiProperty({ example: 'StrongPassw0rd!' })
	@IsString()
	@MinLength(8)
	password!: string;
}

