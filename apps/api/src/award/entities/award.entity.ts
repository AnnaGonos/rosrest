import { ApiProperty } from '@nestjs/swagger';
import {
	Column,
	CreateDateColumn,
	Entity,
	PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'awards' })
export class Award {
	@ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
	@PrimaryGeneratedColumn('uuid')
	id!: string;

	@ApiProperty({ example: 'https://rosrest.com/uploads/images/1717020000_preview.jpg' })
	@Column({ type: 'varchar', length: 500 })
	imageUrl!: string;

	@ApiProperty({ example: 'Благодарственное письмо', required: false })
	@Column({ type: 'varchar', length: 400, nullable: true })
	caption: string | null = null;

	@ApiProperty({ example: '2025-12-28T10:00:00.000Z' })
	@CreateDateColumn({ type: 'timestamptz' })
	createdAt!: Date;
}

