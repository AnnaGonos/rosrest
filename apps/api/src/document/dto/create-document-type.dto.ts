import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUrl, MaxLength } from 'class-validator';

export class CreateDocumentTypeDto {
	@ApiProperty({ example: 'contracts', enum: ['charter', 'contracts', 'documents'] })
	@IsString()
	@IsNotEmpty()
	@MaxLength(50)
	name!: string;
}

