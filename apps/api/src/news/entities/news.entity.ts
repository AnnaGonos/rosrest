import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, ManyToMany, JoinTable, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Page } from '../../page/entities/page.entity';
import { NewsTag } from './news-tag.entity';

@Entity('news')
export class News {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @OneToOne(() => Page, { cascade: true, onDelete: 'CASCADE' })
  @JoinColumn()
  page!: Page;

  @Column({ nullable: true })
  previewImage?: string;

  @ManyToMany(() => NewsTag, (tag) => tag.news, { cascade: true })
  @JoinTable({
    name: 'news_tags_relation',
    joinColumn: { name: 'newsId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'tagId', referencedColumnName: 'id' },
  })
  tags!: NewsTag[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
