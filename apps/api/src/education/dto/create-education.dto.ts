import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEnum, IsNotEmpty, IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { EducationType } from '../enums/education-type.enum';

export class CreateEducationDto {
	@ApiProperty({ enum: EducationType, example: EducationType.HIGHER })
	@IsEnum(EducationType)
	@IsNotEmpty()
	type!: EducationType;

	@ApiProperty({ example: 'Московский государственный академический художественный институт имени В.И. Сурикова' })
	@IsString()
	@IsNotEmpty()
	@MaxLength(500)
	name!: string;

	@ApiProperty({ example: 'https://www.mghpu.ru/' })
	@IsString()
	@IsNotEmpty()
	@IsUrl()
	@MaxLength(500)
	websiteUrl!: string;

	@ApiProperty({
		example: 'https://example.com/logo.png',
		required: false,
		description: 'Логотип можно передать как полный URL или относительный путь (например, /uploads/education/images/123.png)',
	})
	@IsOptional()
	@IsString()
	@MaxLength(500)
	imageUrl?: string;

	@ApiProperty({
		example: [
			'Реставратор строительный 54.01.17',
			'Реставратор памятников каменного и деревянного зодчества 54.01.19',
			'Реставрация 54.02.04',
		],
		type: [String],
		required: false,
	})
	@IsOptional()
	@Transform(({ value }) => {
		if (!value || value === '' || value === '[]') return undefined;
		if (typeof value === 'string') {
			try {
				const parsed = JSON.parse(value);
				return Array.isArray(parsed) ? parsed : undefined;
			} catch {
				return undefined;
			}
		}
		return value;
	})
	@IsArray()
	@IsString({ each: true })
	specialties?: string[];
}

