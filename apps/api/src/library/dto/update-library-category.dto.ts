import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateLibraryCategoryDto {
	@ApiProperty({ example: 'Журнал "Охраняется государством" №3, 2024', required: false })
	@IsOptional()
	@IsString()
	@MaxLength(255)
	name?: string;
}

