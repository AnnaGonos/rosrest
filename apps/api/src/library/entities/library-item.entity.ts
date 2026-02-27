import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, OneToOne } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { LibraryItemType } from '../enums/library-item-type.enum';
import { LibraryCategory } from './library-category.entity';
import { Page } from '../../page/entities/page.entity';

@Entity('library_items')
export class LibraryItem {
	@ApiProperty({ example: 1 })
	@PrimaryGeneratedColumn()
	id!: number;

	@ApiProperty({ enum: LibraryItemType, example: LibraryItemType.BOOK })
	@Column({ type: 'varchar', length: 20 })
	type!: LibraryItemType;

	@ApiProperty({ example: 'Реставрация фресок' })
	@Column({ type: 'varchar', length: 255 })
	title!: string;

	@ApiProperty({
		example: 'https://rosrest.com/uploads/docs/restoration.pdf',
		description: 'Ссылка на контент: загруженный PDF файл, облако или статическая страница',
		required: false,
	})
	@Column({ type: 'text', nullable: true })
	contentUrl?: string;

	@ApiProperty({
		example: 'https://rosrest.com/uploads/images/restoration-preview.jpg',
		required: false,
		description: 'URL загруженного изображения обложки',
	})
	@Column({ type: 'text', nullable: true })
	previewImage?: string;

	@ApiProperty({
		example: 'Подробное руководство по восстановлению фресковых покрытий',
		required: false,
	})
	@Column({ type: 'text', nullable: true })
	description?: string;

	@ApiProperty({ description: 'Страница с блоками для статей (только для type=article)', required: false })
	@OneToOne(() => Page, { cascade: true, onDelete: 'CASCADE', nullable: true })
	@JoinColumn()
	page?: Page;

	@ApiProperty({ example: 1, required: false })
	@Column({ type: 'int', nullable: true })
	categoryId?: number;

	@ManyToOne(() => LibraryCategory, (category) => category.items, { nullable: true })
	@JoinColumn({ name: 'categoryId' })
	category?: LibraryCategory;

	@ApiProperty({ example: true })
	@Column({ type: 'boolean' })
	isPublished!: boolean;

	@ApiProperty({ example: '2025-12-28T10:00:00.000Z' })
	@CreateDateColumn({ type: 'timestamptz' })
	createdAt!: Date;
}

