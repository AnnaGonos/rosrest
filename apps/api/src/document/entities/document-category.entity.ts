import { ApiProperty } from '@nestjs/swagger';
import {
	Column,
	CreateDateColumn,
	Entity,
	PrimaryGeneratedColumn,
	Tree,
	TreeChildren,
	TreeParent,
} from 'typeorm';

@Entity({ name: 'document_categories' })
@Tree('closure-table')
export class DocumentCategory {
	@ApiProperty({ example: 1 })
	@PrimaryGeneratedColumn()
	id!: number;

	@ApiProperty({ example: 'Разъяснения госорганов по вопросам деятельности' })
	@Column({ type: 'varchar', length: 255 })
	name!: string;

	@ApiProperty({ example: 'razjasnenija-gosorganov', required: false })
	@Column({ type: 'varchar', length: 255, nullable: true, unique: true })
	slug?: string | null;

	@ApiProperty({ example: 'bi-folder', required: false })
	@Column({ type: 'varchar', length: 255, nullable: true })
	icon?: string | null;

	@TreeParent()
	parent?: DocumentCategory | null;

	@TreeChildren()
	children?: DocumentCategory[];

	@ApiProperty({ example: '2025-12-28T10:00:00.000Z' })
	@CreateDateColumn({ type: 'timestamptz' })
	createdAt!: Date;
}

