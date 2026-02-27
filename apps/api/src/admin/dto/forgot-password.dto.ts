import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class ForgotPasswordDto {
	@ApiProperty({ example: 'admin@rosrest.com' })
	@IsEmail()
	email!: string;
}

