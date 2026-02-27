import { Entity, PrimaryGeneratedColumn, OneToOne, OneToMany, JoinColumn } from 'typeorm';
import { Page } from '../../page/entities/page.entity';
import { ServiceContact } from './service-contact.entity';

@Entity('services')
export class Service {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @OneToOne(() => Page, { cascade: true, onDelete: 'CASCADE' })
  @JoinColumn()
  page!: Page;

  @OneToMany(() => ServiceContact, contact => contact.service)
  contacts!: ServiceContact[];
}
