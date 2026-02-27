import { ApiProperty } from '@nestjs/swagger';
import {
	Column,
	CreateDateColumn,
	Entity,
	PrimaryGeneratedColumn,
} from 'typeorm';
import { EducationType } from '../enums/education-type.enum';

@Entity({ name: 'education_institutions' })
export class EducationInstitution {
	@ApiProperty({ example: 1 })
	@PrimaryGeneratedColumn()
	id!: number;

	@ApiProperty({ enum: EducationType, example: EducationType.HIGHER })
	@Column({ type: 'enum', enum: EducationType })
	type!: EducationType;

	@ApiProperty({ example: 'Московский государственный академический художественный институт имени В.И. Сурикова' })
	@Column({ type: 'varchar', length: 500 })
	name!: string;

	@ApiProperty({ example: 'https://www.mghpu.ru/' })
	@Column({ type: 'varchar', length: 500 })
	websiteUrl!: string;

	@ApiProperty({ example: 'https://rosrest.com/uploads/education/images/1234567890.jpg', required: false })
	@Column({ type: 'varchar', length: 500, nullable: true })
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
	@Column({ type: 'text', array: true, nullable: true })
	specialties?: string[];

	@ApiProperty({ example: '2025-12-28T10:00:00.000Z' })
	@CreateDateColumn({ type: 'timestamptz' })
	createdAt!: Date;
}

