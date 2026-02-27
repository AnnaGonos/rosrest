import { Injectable, BadRequestException, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { MonitoringZakon } from './entities/monitoring-zakon.entity';
import { Page } from '../page/entities/page.entity';
import { Block } from '../page/entities/block.entity';

@Injectable()
export class MonitoringZakonService {
  constructor(
    @InjectRepository(MonitoringZakon)
    private readonly monitoringRepository: Repository<MonitoringZakon>,
    @InjectRepository(Page)
    private readonly pageRepository: Repository<Page>,
    @InjectRepository(Block)
    private readonly blockRepository: Repository<Block>,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) { }

  private readonly CACHE_PREFIX = 'monitoring_zakon';
  private readonly CACHE_LIST_KEY = `${this.CACHE_PREFIX}_list`;
  private readonly CACHE_ITEM_KEY = (id: string) => `${this.CACHE_PREFIX}_item_${id}`;
  private readonly CACHE_SLUG_KEY = (slug: string) => `${this.CACHE_PREFIX}_slug_${slug}`;
  private readonly CACHE_RECOMMENDATIONS_KEY = (excludeId: string) => `${this.CACHE_PREFIX}_recommendations_${excludeId}`;

  private async invalidateCache() {
    const keys = await this.cacheManager.store.keys(`${this.CACHE_PREFIX}*`);
    if (keys && keys.length > 0) {
      await Promise.all(keys.map(key => this.cacheManager.del(key)));
    }
  }

  async findAll(opts?: { isDraft?: boolean; page?: number; pageSize?: number }): Promise<{ items: any[]; totalCount: number; totalPages: number; page: number; pageSize: number }> {
    const page = Math.max(1, opts?.page ?? 1);
    const pageSize = Math.max(1, opts?.pageSize ?? 21);

    const cacheKey = `${this.CACHE_LIST_KEY}_draft_${opts?.isDraft ?? 'all'}_page_${page}_size_${pageSize}`;

    const cached = await this.cacheManager.get<{ items: any[]; totalCount: number; totalPages: number; page: number; pageSize: number }>(cacheKey);
    if (cached) {
      return cached;
    }

    const query = this.monitoringRepository.createQueryBuilder('monitoring')
      .leftJoinAndSelect('monitoring.page', 'page')
      .orderBy('page.publishedAt', 'DESC')
      .addOrderBy('page.id', 'DESC');

    if (opts?.isDraft !== undefined) {
      query.andWhere('page.isDraft = :isDraft', { isDraft: opts.isDraft });

      if (opts.isDraft === false) {
        query.andWhere('page.publishedAt IS NOT NULL')
          .andWhere('page.publishedAt <= :now', { now: new Date() });
      }
    }

    query.skip((page - 1) * pageSize).take(pageSize);

    const [items, totalCount] = await query.getManyAndCount();
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

    const ids = items.map(item => item.id);
    let fullItems = items;
    if (ids.length > 0) {
      fullItems = await this.monitoringRepository.find({
        where: { id: In(ids) },
        relations: ['page', 'page.blocks', 'page.blocks.children'],
      });
    }
    const byId = new Map(fullItems.map(item => [item.id, item]));
    const orderedItems = ids.map(id => byId.get(id)).filter(Boolean) as MonitoringZakon[];

    const result = {
      items: orderedItems.map(toPlainMonitoring),
      totalCount,
      totalPages,
      page,
      pageSize,
    };

    await this.cacheManager.set(cacheKey, result, 300000);

    return result;
  }

  async findOne(id: string): Promise<any> {
    const cacheKey = this.CACHE_ITEM_KEY(id);
    const cached = await this.cacheManager.get<any>(cacheKey);
    if (cached) {
      return cached;
    }

    const item = await this.monitoringRepository.findOne({
      where: { id },
      relations: ['page', 'page.blocks', 'page.blocks.children'],
    });
    if (!item) throw new Error('Monitoring item not found');

    const result = toPlainMonitoring(item);

    await this.cacheManager.set(cacheKey, result, 300000);

    return result;
  }

  async findBySlug(slug: string): Promise<any> {
    const normalized = slug.startsWith('monitoring-zakon/') ? slug : `monitoring-zakon/${slug}`;

    const cacheKey = this.CACHE_SLUG_KEY(normalized);
    const cached = await this.cacheManager.get<any>(cacheKey);
    if (cached) {
      return cached;
    }

    const item = await this.monitoringRepository.findOne({
      where: { page: { slug: normalized } },
      relations: ['page', 'page.blocks', 'page.blocks.children'],
    });
    if (!item) throw new Error('Monitoring item not found');

    const result = toPlainMonitoring(item);

    await this.cacheManager.set(cacheKey, result, 300000);

    return result;
  }

  async create(data: { slug: string; title: string; publishedAt?: string; blocks?: any[]; isDraft?: any }): Promise<any> {
    let slug = data.slug ? data.slug : `page-${Date.now()}`;
    if (!slug.startsWith('monitoring-zakon/')) {
      slug = `monitoring-zakon/${slug}`;
    }

    const existingPage = await this.pageRepository.findOne({ where: { slug } });
    if (existingPage) {
      throw new BadRequestException(`Страница с URL "${slug}" уже существует. Пожалуйста, используйте другой slug.`);
    }

    const blocksInput = typeof data.blocks === 'string'
      ? safeParseArray(data.blocks)
      : data.blocks;

    let blocks: Block[] = [];
    if (Array.isArray(blocksInput)) {
      blocks = blocksInput.map((b, idx) => {
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
      title: data.title || 'Новая страница',
      slug,
      isDraft,
      publishedAt: data.publishedAt ? new Date(data.publishedAt) : null,
      blocks,
    });

    await this.pageRepository.save(page);

    const item = this.monitoringRepository.create({ page });
    const saved = await this.monitoringRepository.save(item);

    const full = await this.monitoringRepository.findOne({
      where: { id: saved.id },
      relations: ['page', 'page.blocks', 'page.blocks.children'],
    });

    if (!full) {
      throw new Error('Monitoring item not found after save');
    }

    await this.invalidateCache();

    return toPlainMonitoring(full);
  }

  async update(id: string, update: { publishedAt?: string; blocks?: any[]; isDraft?: any; title?: string; slug?: string }): Promise<any> {
    const item = await this.monitoringRepository.findOne({ where: { id }, relations: ['page'] });
    if (!item || !item.page) throw new Error('Monitoring item or page not found');

    let pageModified = false;

    if (update.title !== undefined) {
      item.page.title = update.title;
      pageModified = true;
    }

    if (update.slug !== undefined) {
      const newSlug = update.slug.startsWith('monitoring-zakon/')
        ? update.slug
        : `monitoring-zakon/${update.slug}`;

      if (newSlug !== item.page.slug) {
        const existingPage = await this.pageRepository.findOne({ where: { slug: newSlug } });
        if (existingPage && existingPage.id !== item.page.id) {
          throw new BadRequestException(`Страница с URL "${newSlug}" уже существует. Пожалуйста, используйте другой slug.`);
        }
      }

      item.page.slug = newSlug;
      pageModified = true;
    }

    if (update.publishedAt !== undefined) {
      item.page.publishedAt = update.publishedAt ? new Date(update.publishedAt) : null;
      pageModified = true;
    }

    if (update.isDraft !== undefined) {
      let isDraftValue: boolean = false;

      if (typeof update.isDraft === 'string') {
        isDraftValue = update.isDraft.toLowerCase() === 'true' || update.isDraft === '1';
      } else if (typeof update.isDraft === 'boolean') {
        isDraftValue = update.isDraft;
      } else if (typeof update.isDraft === 'number') {
        isDraftValue = !!update.isDraft;
      }

      if (item.page.isDraft !== isDraftValue) {
        item.page.isDraft = isDraftValue;
        pageModified = true;
      }
    }

    if (pageModified) {
      await this.pageRepository.save(item.page);
    }

    if (update.blocks !== undefined && item.page) {
      let blocksArr: any[] = [];
      if (typeof update.blocks === 'string') {
        blocksArr = safeParseArray(update.blocks);
      } else if (Array.isArray(update.blocks)) {
        blocksArr = update.blocks;
      }

      await this.blockRepository.delete({ page: { id: item.page.id } });

      if (blocksArr.length > 0) {
        const blocks = blocksArr.map((b: any, idx: number) => {
          const block = new Block();
          block.type = b.type;
          block.content = b.content;
          block.order = typeof b.order === 'number' ? b.order : idx;
          block.parentBlock = null;
          block.page = item.page;
          return block;
        });

        await this.blockRepository.save(blocks);
      }
      pageModified = true;
    }

    const full = await this.monitoringRepository.findOne({
      where: { id: item.id },
      relations: ['page', 'page.blocks', 'page.blocks.children'],
    });

    await this.invalidateCache();

    return toPlainMonitoring(full);
  }

  async remove(id: string): Promise<void> {
    const item = await this.monitoringRepository.findOne({ where: { id } });
    if (!item) throw new Error('Monitoring item not found');
    await this.monitoringRepository.remove(item);

    await this.invalidateCache();
  }

  async getRecommendations(excludeId: string): Promise<any[]> {
    const cacheKey = this.CACHE_RECOMMENDATIONS_KEY(excludeId);
    const cached = await this.cacheManager.get<any[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const items = await this.monitoringRepository.find({
      where: { page: { isDraft: false } },
      relations: ['page', 'page.blocks', 'page.blocks.children'],
      order: { page: { publishedAt: 'DESC' } },
      take: 100,
    });

    const filtered = items.filter(item => item.id !== excludeId).slice(0, 4);
    const result = filtered.map(toPlainMonitoring);

    await this.cacheManager.set(cacheKey, result, 300000);

    return result;
  }
}

function safeParseArray(value: string): any[] {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function toPlainBlock(block: any): any {
  return {
    id: block.id,
    type: block.type,
    content: block.content,
    order: block.order,
    parentBlockId: block.parentBlockId || null,
    children: Array.isArray(block.children) ? block.children.map(toPlainBlock) : [],
  };
}

function toPlainPage(page: any): any {
  return {
    id: page.id,
    slug: page.slug,
    title: page.title,
    publishedAt: page.publishedAt,
    isDraft: page.isDraft,
    blocks: Array.isArray(page.blocks)
      ? [...page.blocks].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)).map(toPlainBlock)
      : [],
  };
}

function toPlainMonitoring(item: any): any {
  return {
    id: item.id,
    page: item.page ? toPlainPage(item.page) : null,
  };
}
