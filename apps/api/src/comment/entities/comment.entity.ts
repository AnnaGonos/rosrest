import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index, ManyToOne, OneToMany, JoinColumn } from 'typeorm';

@Entity('comments')
@Index(['commentableType', 'commentableId'])
export class Comment {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 50 })
  commentableType!: 'news' | 'monitoring-zakon' | 'rar-member';

  @Column({ type: 'varchar', length: 255 })
  commentableId!: string;

  @Column({ type: 'int', nullable: true })
  parentCommentId?: number;

  @ManyToOne(() => Comment, (comment) => comment.replies, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'parentCommentId' })
  parentComment?: Comment;

  @OneToMany(() => Comment, (comment) => comment.parentComment)
  replies!: Comment[];

  @Column({ type: 'varchar', length: 255 })
  authorName!: string;

  @Column({ type: 'varchar', length: 255 })
  authorEmail!: string;

  @Column({ type: 'text' })
  content!: string;

  @Column({ type: 'boolean', default: true })
  isVisible!: boolean;

  @Column({ type: 'boolean', default: false })
  isModerated!: boolean;

  @Column({ type: 'boolean', default: false })
  isFlagged!: boolean;

  @Column({ type: 'varchar', length: 45, nullable: true })
  ipAddress?: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  userAgent?: string;

  @Column({ type: 'int', nullable: true })
  submissionTime?: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
