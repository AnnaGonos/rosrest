import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, ManyToMany, JoinTable } from 'typeorm';
import { Page } from '../../page/entities/page.entity';
import { RarSection } from './rar-section.entity';

@Entity('rar_members')
export class RarMember {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @OneToOne(() => Page, { cascade: true, onDelete: 'CASCADE' })
  @JoinColumn()
  page!: Page;

  @Column()
  previewImage!: string;

  @ManyToMany(() => RarSection, (section) => section.members)
  @JoinTable()
  sections!: RarSection[];
}
