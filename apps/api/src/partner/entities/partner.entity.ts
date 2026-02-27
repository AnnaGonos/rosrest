import { ApiProperty } from '@nestjs/swagger';
import {
	Column,
	CreateDateColumn,
	Entity,
	PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'partners' })
export class Partner {
	@ApiProperty({ example: 'c6f5b6c1-5e7e-4b9e-a9c0-3d5ed5f77b5e' })
	@PrimaryGeneratedColumn('uuid')
	id!: string;

	@ApiProperty({ example: 'ICOMOS' })
	@Column({ type: 'varchar', length: 255 })
	name!: string;

	@ApiProperty({ example: 'https://rosrest.com/uploads/images/1717020000_preview.jpg' })
	@Column({ type: 'varchar', length: 500 })
	imageUrl!: string;

	@ApiProperty({ example: 'https://www.icomos.org/', required: false })
	@Column({ type: 'varchar', length: 500, nullable: true })
	link?: string;

	@ApiProperty({ example: '2025-12-27T10:00:00.000Z' })
	@CreateDateColumn({ type: 'timestamptz' })
	createdAt!: Date;
}

