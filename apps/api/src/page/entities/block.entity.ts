import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from 'typeorm';
import { Page } from './page.entity';
import { ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';

@Entity()
export class Block {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ApiProperty({ description: 'Вариант/тип блока', example: 'TX01' })
  @Column()
  type!: string; // Например: TX01, IMG01, COL01 и т.д.

  @ApiProperty({ description: 'Содержимое блока', example: { html: '<p>Текст</p>' } })
  @Column({ type: 'jsonb' })
  content!: Record<string, any>;

  @ApiProperty({ description: 'Порядок блока', example: 0 })
  @Column()
  order!: number;

  @ManyToOne(() => Page, page => page.blocks, { nullable: true })
  @Exclude()
  page!: Page | null;

  @ManyToOne(() => Block, block => block.children, { nullable: true })
  parentBlock!: Block | null;

  @OneToMany(() => Block, block => block.parentBlock)
  children!: Block[];
}
