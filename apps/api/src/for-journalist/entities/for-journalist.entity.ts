import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { Page } from '../../page/entities/page.entity';

@Entity('for_journalist')
export class ForJournalist {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @OneToOne(() => Page, { cascade: true, onDelete: 'CASCADE' })
  @JoinColumn()
  page!: Page;

  @Column({ nullable: true })
  previewImage?: string;
}
