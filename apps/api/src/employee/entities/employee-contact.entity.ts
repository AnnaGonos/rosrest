import { ApiProperty } from '@nestjs/swagger';
import {
	Column,
	CreateDateColumn,
	Entity,
	PrimaryGeneratedColumn,
	UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'employee_contacts' })
export class EmployeeContact {
	@ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
	@PrimaryGeneratedColumn('uuid')
	id!: string;

	@ApiProperty({ example: 'Татьяна Черняева' })
	@Column({ type: 'varchar', length: 255 })
	fullName!: string;

	@ApiProperty({ example: 'Председатель' })
	@Column({ type: 'varchar', length: 255 })
	position!: string;

	@ApiProperty({ example: 'tatiana.rosrest@gmail.com', required: false })
	@Column({ type: 'varchar', length: 255, nullable: true })
	email: string | null = null;

	@ApiProperty({ example: '+7 (495) 123-45-67', required: false })
	@Column({ type: 'varchar', length: 20, nullable: true })
	phone: string | null = null;

	@ApiProperty({ example: 'https://rosrest.com/uploads/images/1717020000_preview.jpg' })
	@Column({ type: 'varchar', length: 500 })
	photoUrl!: string;

	@ApiProperty({ example: 'https://rosrest.com/member/tatiana-chernyaeva', required: false })
	@Column({ type: 'varchar', length: 500, nullable: true })
	profileUrl: string | null = null;

	@ApiProperty({ example: 0 })
	@Column({ type: 'integer' })
	orderIndex!: number;

	@ApiProperty({ example: '2025-12-27T10:00:00.000Z' })
	@CreateDateColumn({ type: 'timestamptz' })
	createdAt!: Date;

	@ApiProperty({ example: '2025-12-27T10:00:00.000Z' })
	@UpdateDateColumn({ type: 'timestamptz' })
	updatedAt!: Date;
}

