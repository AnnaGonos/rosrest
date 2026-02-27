import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsNumber, IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateEmployeeDto {
	@ApiProperty({ example: 'Татьяна Черняева' })
	@IsString()
	@IsNotEmpty()
	@MaxLength(255)
	fullName!: string;

	@ApiProperty({ example: 'Председатель' })
	@IsString()
	@IsNotEmpty()
	@MaxLength(255)
	position!: string;

	@ApiProperty({ example: 'tatiana.rosrest@gmail.com', required: false })
	@IsOptional()
	@IsEmail()
	@MaxLength(255)
	email?: string;

	@ApiProperty({ example: '+7 (495) 123-45-67', required: false })
	@IsOptional()
	@IsString()
	@MaxLength(20)
	phone?: string;

	@ApiProperty({
		example: 'https://rosrest.com/uploads/images/employee-photo.jpg',
		required: false,
		description: 'Ссылка на фото сотрудника, если фото не загружается файлом',
	})
	@IsOptional()
	@IsString()
	@MaxLength(500)
	photoUrl?: string;

	@ApiProperty({ example: 'https://rosrest.com/member/tatiana-chernyaeva', required: false })
	@IsOptional()
	@IsString()
	@MaxLength(500)
	profileUrl?: string;

	@ApiProperty({ example: 0 })
	@Transform(({ value }) => (value === null || value === undefined ? undefined : parseInt(value, 10)))
	@IsNumber()
	@IsNotEmpty()
	orderIndex!: number;
}

