import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { News } from '../news/entities/news.entity';

@Entity('newsletter_queue')
export class NewsletterQueueItem {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => News, { nullable: false })
  @JoinColumn({ name: 'newsId' })
  news!: News;

  @Column({ type: 'uuid' })
  newsId!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  note?: string;

  @Column({ type: 'boolean', default: false })
  isSent!: boolean;

  @Column({ type: 'timestamp', nullable: true })
  sentAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  scheduledAt?: Date;

  @CreateDateColumn()
  addedAt!: Date;
}
