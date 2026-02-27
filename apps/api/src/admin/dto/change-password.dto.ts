import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
	@ApiProperty({ example: 'CurrentPassw0rd!' })
	@IsString()
	@MinLength(8)
	currentPassword!: string;

	@ApiProperty({ example: 'NewStrongPassw0rd!' })
	@IsString()
	@MinLength(8)
	newPassword!: string;

	@ApiProperty({ example: 'NewStrongPassw0rd!' })
	@IsString()
	@MinLength(8)
	confirmPassword!: string;
}

