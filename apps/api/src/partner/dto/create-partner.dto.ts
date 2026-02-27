import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUrl, MaxLength, IsOptional } from 'class-validator';

export class CreatePartnerDto {
	@ApiProperty({ example: 'ICOMOS' })
	@IsString()
	@IsNotEmpty()
	@MaxLength(255)
	name!: string;

	@ApiProperty({
		example: 'https://rosrest.com/uploads/images/partner-logo.png',
		required: false,
		description: 'Ссылка на логотип партнёра (абсолютный URL или относительный путь), если логотип не загружается файлом',
	})
	@IsOptional()
	@IsString()
	@MaxLength(500)
	imageUrl?: string;

	@ApiProperty({ example: 'https://www.icomos.org/', required: false })
	@IsOptional()
	@IsString()
	@IsUrl()
	@MaxLength(500)
	link?: string;
}

