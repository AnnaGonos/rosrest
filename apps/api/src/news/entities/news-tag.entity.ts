import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { News } from './news.entity';

@Entity('news_tags')
export class NewsTag {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true, length: 100 })
  name!: string;

  @Column({ length: 100, unique: true })
  slug!: string;

  @ManyToMany(() => News, (news) => news.tags)
  news!: News[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
