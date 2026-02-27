import { ApiProperty } from '@nestjs/swagger';
import {
	Column,
	CreateDateColumn,
	Entity,
	PrimaryGeneratedColumn,
	ManyToOne,
	JoinColumn,
} from 'typeorm';
import { DocumentType } from '../enums/document-type.enum';
import { DocumentCategory } from './document-category.entity';

@Entity({ name: 'documents' })
export class Document {
	@ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
	@PrimaryGeneratedColumn('uuid')
	id!: string;

	@ApiProperty({ example: 'Письмо Минэкономразвития от 25.06.2012' })
	@Column({ type: 'varchar', length: 255 })
	title!: string;

	@ApiProperty({
		example: 'https://rosrest.com/wp-content/uploads/2025/06/letter.pdf',
	})
	@Column({ type: 'text' })
	pdfUrl!: string;

	@ApiProperty({ enum: DocumentType, example: DocumentType.CHARTER })
	@Column({ type: 'varchar', length: 50 })
	type!: DocumentType;

	@ManyToOne(() => DocumentCategory, { eager: true, nullable: true, onDelete: 'RESTRICT' })
	@JoinColumn({ name: 'category_id' })
	@ApiProperty({ type: () => DocumentCategory, required: false })
	category: DocumentCategory | null = null;

	@ManyToOne(() => DocumentCategory, { eager: true, nullable: true, onDelete: 'RESTRICT' })
	@JoinColumn({ name: 'subcategory_id' })
	@ApiProperty({ type: () => DocumentCategory, required: false })
	subcategory: DocumentCategory | null = null;

	@ApiProperty({
		example: 'https://rosrest.com/uploads/documents/preview.jpg',
		required: false,
	})
	@Column({ type: 'text', nullable: true })
	previewUrl?: string | null;

	@ApiProperty({ example: true })
	@Column({ type: 'boolean', default: true })
	isPublished!: boolean;

	@ApiProperty({ example: '2025-12-28T10:00:00.000Z' })
	@CreateDateColumn({ type: 'timestamptz' })
	createdAt!: Date;
}

