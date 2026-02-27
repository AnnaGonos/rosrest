import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('events')
export class Event {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 120 })
  title!: string;

  @Column()
  startDate!: string;

  @Column({ nullable: true })
  endDate?: string;

  @Column({ type: 'text', nullable: true })
  previewImageUrl?: string;

  @Column({ type: 'text', nullable: true })
  description?: string; 

  @Column({ type: 'text', nullable: true })
  address?: string;

  @Column({ type: 'text', nullable: true })
  detailedAddress?: string; 

  @Column({ type: 'text', nullable: true })
  mapCoordinates?: string; 

  @Column({ type: 'text', nullable: true })
  registrationUrl?: string;

  @Column({ type: 'jsonb', nullable: true, default: [] })
  faq?: Array<{ question: string; answer: string }>;


  @Column({ type: 'jsonb', nullable: true, default: [] })
  schedule?: Array<{
    date: string;
    blocks: Array<{
      timeStart: string;
      timeEnd?: string; 
      title: string;
      description: string;
      location?: string;
      moderators?: Array<{
        name: string;
        position?: string;
        photoUrl?: string;
      }>;
      speakers?: Array<{
        name: string;
        position?: string;
        photoUrl?: string;
      }>;
    }>;
  }>;

  @Column({ default: false })
  isPublished!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
