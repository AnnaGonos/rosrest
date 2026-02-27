import { ApiProperty } from '@nestjs/swagger';
import {
	Column,
	CreateDateColumn,
	Entity,
	PrimaryGeneratedColumn,
	UpdateDateColumn,
	Unique,
} from 'typeorm';

@Entity({ name: 'admin_account' })
@Unique(['email'])
export class AdminAccount {
	@ApiProperty({ example: 1 })
	@PrimaryGeneratedColumn()
	id!: number;

	@ApiProperty({ example: 'admin@rosrest.com' })
	@Column({ type: 'varchar', length: 255, name: 'email' })
	email!: string;

	@Column({ type: 'text', name: 'password_hash' })
	passwordHash!: string;

	@Column({ type: 'text', name: 'reset_token', nullable: true })
	resetToken: string | null = null;

	@Column({ type: 'timestamptz', name: 'reset_token_expires', nullable: true })
	resetTokenExpires: Date | null = null;

	@CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
	createdAt!: Date;

	@UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
	updatedAt!: Date;
}

