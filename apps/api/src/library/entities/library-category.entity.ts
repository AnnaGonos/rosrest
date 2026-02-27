import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { LibraryItem } from './library-item.entity';

@Entity('library_categories')
export class LibraryCategory {
	@ApiProperty({ example: 1 })
	@PrimaryGeneratedColumn()
	id!: number;

	@ApiProperty({ example: 'Журнал "Охраняется государством" №2, 2024' })
	@Column({ type: 'varchar', length: 255, unique: true })
	name!: string;

	@OneToMany(() => LibraryItem, (item) => item.category)
	items!: LibraryItem[];

	@ApiProperty({ example: '2025-12-28T10:00:00.000Z' })
	@CreateDateColumn({ type: 'timestamptz' })
	createdAt!: Date;
}

