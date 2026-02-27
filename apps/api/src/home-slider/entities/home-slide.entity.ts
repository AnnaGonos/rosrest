import { ApiProperty } from '@nestjs/swagger';
import {
	Column,
	CreateDateColumn,
	Entity,
	PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'home_slides' })
export class HomeSlide {
	@ApiProperty({ example: 1 })
	@PrimaryGeneratedColumn()
	id!: number;

	@ApiProperty({ example: 'https://rosrest.com/uploads/home-slider/1234567890.jpg' })
	@Column({ type: 'varchar', length: 500 })
	imageUrl!: string;

	@ApiProperty({ example: '2026-01-05T10:00:00.000Z' })
	@CreateDateColumn({ type: 'timestamptz' })
	createdAt!: Date;
}

