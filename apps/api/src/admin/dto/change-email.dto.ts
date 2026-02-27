import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class ChangeEmailDto {
	@ApiProperty({ example: 'CurrentPassw0rd!' })
	@IsString()
	@MinLength(8)
	currentPassword!: string;

	@ApiProperty({ example: 'new-admin@rosrest.com' })
	@IsEmail()
	newEmail!: string;

	@ApiProperty({ example: 'new-admin@rosrest.com' })
	@IsEmail()
	confirmEmail!: string;
}

