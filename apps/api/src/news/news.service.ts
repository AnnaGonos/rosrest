import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { News } from './entities/news.entity';
import { NewsTag } from './entities/news-tag.entity';
import { Page } from '../page/entities/page.entity';
import { Block } from '../page/entities/block.entity';

@Injectable()
export class NewsService {
  constructor(
    @InjectRepository(News)
    private readonly newsRepository: Repository<News>,
    @InjectRepository(NewsTag)
    private readonly newsTagRepository: Repository<NewsTag>,
    @InjectRepository(Page)
    private readonly pageRepository: Repository<Page>,
    @InjectRepository(Block)
    private readonly blockRepository: Repository<Block>,
  ) { }

  async findAll(opts?: { isDraft?: boolean; tagId?: number }): Promise<any[]> {
    const query = this.newsRepository
      .createQueryBuilder('news')
      .leftJoinAndSelect('news.page', 'page')
      .leftJoinAndSelect('page.blocks', 'block')
      .leftJoinAndSelect('block.children', 'children')
      .leftJoinAndSelect('news.tags', 'tags')
      .orderBy('page.publishedAt', 'DESC');

    if (opts?.isDraft !== undefined) {
      query.andWhere('page.isDraft = :isDraft', { isDraft: opts.isDraft });

      if (opts.isDraft === false) {
        query
          .andWhere('page.publishedAt IS NOT NULL')
          .andWhere('page.publishedAt <= :now', { now: new Date() });
      }
    }

    if (opts?.tagId) {
      query.andWhere('tags.id = :tagId', { tagId: opts.tagId });
    }

    const newsList = await query.getMany();
    return newsList.map(toPlainNews);
  }

  async findOne(id: string): Promise<any> {
    const news = await this.newsRepository.findOne({
      where: { id },
      relations: ['page', 'page.blocks', 'page.blocks.children', 'tags'],
    });
    if (!news) throw new NotFoundException('News not found');
    return toPlainNews(news);
  }

  async findBySlug(slug: string): Promise<any> {
    const news = await this.newsRepository.findOne({
      where: { page: { slug } },
      relations: ['page', 'page.blocks', 'page.blocks.children', 'tags'],
    });
    if (!news) throw new NotFoundException('News not found');
    return toPlainNews(news);
  }

  async getRecommendations(newsId: string, limit: number = 6): Promise<any[]> {
    const news = await this.newsRepository.findOne({
      where: { id: newsId },
      relations: ['tags'],
    });
    if (!news) throw new NotFoundException('News not found');

    if (news.tags && news.tags.length > 0) {
      const tagIds = news.tags.map(tag => tag.id);

      const recommendations = await this.newsRepository
        .createQueryBuilder('news')
        .leftJoinAndSelect('news.page', 'page')
        .leftJoinAndSelect('page.blocks', 'block')
        .leftJoinAndSelect('block.children', 'children')
        .leftJoinAndSelect('news.tags', 'tag')
        .where('news.id != :id', { id: newsId })
        .andWhere('page.isDraft = :isDraft', { isDraft: false })
        .andWhere('page.publishedAt <= :now', { now: new Date() })
        .andWhere('tag.id IN (:...tagIds)', { tagIds })
        .orderBy('page.publishedAt', 'DESC')
        .limit(limit)
        .getMany();

      const uniqueNews = Array.from(
        new Map(recommendations.map(item => [item.id, item])).values()
      );

      return uniqueNews.slice(0, limit).map(toPlainNews);
    }

    const recommendations = await this.newsRepository
      .createQueryBuilder('news')
      .leftJoinAndSelect('news.page', 'page')
      .leftJoinAndSelect('page.blocks', 'block')
      .leftJoinAndSelect('block.children', 'children')
      .leftJoinAndSelect('news.tags', 'tag')
      .where('news.id != :id', { id: newsId })
      .andWhere('page.isDraft = :isDraft', { isDraft: false })
      .andWhere('page.publishedAt <= :now', { now: new Date() })
      .orderBy('page.publishedAt', 'DESC')
      .take(limit)
      .getMany();

    return recommendations.map(toPlainNews);
  }

  async create(data: {
    slug: string;
    title: string;
    previewImage?: string;
    publishedAt?: string;
    isDraft?: any;
    tagIds?: number[];
    blocks?: any[];
  }): Promise<any> {
    let slug = data.slug ? data.slug : `news-${Date.now()}`;
    if (!slug.startsWith('news/')) {
      slug = `news/${slug}`;
    }

    let blocks: Block[] = [];
    if (Array.isArray(data.blocks)) {
      blocks = data.blocks.map((b, idx) => {
        const block = new Block();
        block.type = b.type;
        block.content = b.content;
        block.order = typeof b.order === 'number' ? b.order : idx;
        block.parentBlock = null;
        return block;
      });
    }

    let isDraft: boolean = false;
    if (typeof data.isDraft === 'string') {
      isDraft = data.isDraft.toLowerCase() === 'true' || data.isDraft === '1';
    } else if (typeof data.isDraft === 'boolean') {
      isDraft = data.isDraft;
    } else if (typeof data.isDraft === 'number') {
      isDraft = !!data.isDraft;
    }

    const page = this.pageRepository.create({
      title: data.title || 'Новая новость',
      slug,
      isDraft,
      publishedAt: data.publishedAt ? new Date(data.publishedAt) : null,
      blocks,
    });

    await this.pageRepository.save(page);

    let tags: NewsTag[] = [];
    if (data.tagIds && data.tagIds.length > 0) {
      tags = await this.newsTagRepository.find({
        where: { id: In(data.tagIds) },
      });
    }

    const news = this.newsRepository.create({
      page,
      previewImage: data.previewImage || '',
      tags,
    });

    const saved = await this.newsRepository.save(news);
    const full = await this.newsRepository.findOne({
      where: { id: saved.id },
      relations: ['page', 'page.blocks', 'page.blocks.children', 'tags'],
    });

    if (!full) {
      throw new Error('News not found after save');
    }

    return toPlainNews(full);
  }

  async update(
    id: string,
    update: {
      previewImage?: string;
      publishedAt?: string;
      isDraft?: any;
      title?: string;
      slug?: string;
      tagIds?: number[];
      blocks?: any[];
    },
  ): Promise<any> {
    const news = await this.newsRepository.findOne({
      where: { id },
      relations: ['page', 'tags'],
    });
    if (!news || !news.page) throw new NotFoundException('News or page not found');

    let pageModified = false;

    if (update.previewImage !== undefined) {
      news.previewImage = update.previewImage;
    }

    if (update.title !== undefined) {
      news.page.title = update.title;
      pageModified = true;
    }

    if (update.slug !== undefined) {
      news.page.slug = update.slug.startsWith('news/')
        ? update.slug
        : `news/${update.slug}`;
      pageModified = true;
    }

    if (update.publishedAt !== undefined) {
      news.page.publishedAt = update.publishedAt ? new Date(update.publishedAt) : null;
      pageModified = true;
    }

    if (update.isDraft !== undefined) {
      let isDraftValue: boolean = false;

      if (typeof update.isDraft === 'string') {
        isDraftValue =
          update.isDraft.toLowerCase() === 'true' || update.isDraft === '1';
      } else if (typeof update.isDraft === 'boolean') {
        isDraftValue = update.isDraft;
      } else if (typeof update.isDraft === 'number') {
        isDraftValue = !!update.isDraft;
      }

      news.page.isDraft = isDraftValue;
      pageModified = true;
    }

    if (update.tagIds !== undefined) {
      if (update.tagIds.length === 0) {
        news.tags = [];
      } else {
        news.tags = await this.newsTagRepository.find({
          where: { id: In(update.tagIds) },
        });
      }
    }

    if (Array.isArray(update.blocks)) {
      await this.blockRepository.delete({ page: { id: news.page.id } });

      const newBlocks = update.blocks.map((b, idx) => {
        const block = new Block();
        block.type = b.type;
        block.content = b.content;
        block.order = typeof b.order === 'number' ? b.order : idx;
        block.page = news.page;
        block.parentBlock = null;
        return block;
      });

      await this.blockRepository.save(newBlocks);
      pageModified = true;
    }

    if (pageModified) {
      await this.pageRepository.save(news.page);
    }

    await this.newsRepository.save(news);

    const updated = await this.newsRepository.findOne({
      where: { id },
      relations: ['page', 'page.blocks', 'page.blocks.children', 'tags'],
    });

    if (!updated) {
      throw new NotFoundException('News not found after update');
    }

    return toPlainNews(updated);
  }

  async remove(id: string): Promise<void> {
    const news = await this.newsRepository.findOne({ where: { id } });
    if (!news) throw new NotFoundException('News not found');
    await this.newsRepository.remove(news);
  }
}

function toPlainNews(news: News): any {
  return {
    id: news.id,
    previewImage: news.previewImage,
    createdAt: news.createdAt,
    updatedAt: news.updatedAt,
    page: {
      id: news.page.id,
      title: news.page.title,
      slug: news.page.slug,
      isDraft: news.page.isDraft,
      publishedAt: news.page.publishedAt,
      blocks: news.page.blocks
        ? news.page.blocks
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
          .map((b) => ({
            id: b.id,
            type: b.type,
            content: b.content,
            order: b.order,
            children: b.children
              ? b.children
                .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                .map((c) => ({
                  id: c.id,
                  type: c.type,
                  content: c.content,
                  order: c.order,
                }))
              : [],
          }))
        : [],
    },
    tags: news.tags
      ? news.tags.map((t) => ({
        id: t.id,
        name: t.name,
        slug: t.slug,
      }))
      : [],
  };
}
