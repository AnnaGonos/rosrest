import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { Page } from '../../page/entities/page.entity';

@Entity('projects')
export class Project {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @OneToOne(() => Page, { cascade: true, onDelete: 'CASCADE' })
  @JoinColumn()
  page!: Page;

  @Column()
  previewImage!: string;
}


