import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
	@ApiProperty({ example: '1e3b4c...' })
	@IsString()
	@MinLength(16)
	token!: string;

	@ApiProperty({ example: 'NewStrongPassw0rd!' })
	@IsString()
	@MinLength(8)
	newPassword!: string;
}

