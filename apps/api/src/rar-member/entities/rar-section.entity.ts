import { Entity, PrimaryGeneratedColumn, Column, ManyToMany } from 'typeorm';
import { RarMember } from './rar-member.entity';

@Entity('rar_sections')
export class RarSection {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  title!: string;

  @Column({ unique: true })
  slug!: string;

  @Column({ type: 'varchar', nullable: true })
  icon?: string | null;

  @ManyToMany(() => RarMember, (member) => member.sections)
  members!: RarMember[];
}
