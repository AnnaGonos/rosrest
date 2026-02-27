import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateLibraryCategoryDto {
	@ApiProperty({ example: 'Журнал "Охраняется государством" №2, 2024' })
	@IsString()
	@IsNotEmpty()
	@MaxLength(255)
	name!: string;
}

