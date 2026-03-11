import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'files' })
export class FileEntity {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ApiProperty({ example: 'document.pdf' })
  @Column({ type: 'varchar', length: 255 })
  originalName!: string;

  @ApiProperty({ example: '/uploads/documents/files/document.pdf' })
  @Column({ type: 'text' })
  url!: string;

  @ApiProperty({ example: 'application/pdf' })
  @Column({ type: 'varchar', length: 100 })
  mimetype!: string;

  @ApiProperty({ example: 123456 })
  @Column({ type: 'int' })
  size!: number;

  @ApiProperty({ example: '2026-03-11T10:00:00.000Z' })
  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}
