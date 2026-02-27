import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Block } from './block.entity';

@Entity()
export class Page {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  slug!: string;

  @Column()
  title!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  navTitle?: string | null;

  @Column({ type: 'timestamp', nullable: true })
  publishedAt!: Date | null;

  @Column({ default: false })
  isDraft!: boolean;

  @OneToMany(() => Block, block => block.page, { cascade: true, onDelete: 'CASCADE' })
  blocks!: Block[];
}
