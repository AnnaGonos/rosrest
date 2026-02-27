import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { In, Repository } from 'typeorm';
import { RarMember } from './entities/rar-member.entity';
import { RarSection } from './entities/rar-section.entity';
import { Page } from '../page/entities/page.entity';
import { Block } from '../page/entities/block.entity';

@Injectable()
export class RarMemberService {
  constructor(
    @InjectRepository(RarMember)
    private readonly memberRepository: Repository<RarMember>,
    @InjectRepository(RarSection)
    private readonly sectionRepository: Repository<RarSection>,
    @InjectRepository(Page)
    private readonly pageRepository: Repository<Page>,
    @InjectRepository(Block)
    private readonly blockRepository: Repository<Block>,
    @Inject(CACHE_MANAGER)
    private cacheManager: Cache,
  ) {}

  private async clearMembersCache(): Promise<void> {
    try {
      const keys = await this.cacheManager.store.keys();
      const rarMemberKeys = keys.filter(key => 
        key.includes('/rar-members') || key.includes('rar_member')
      );
      await Promise.all(rarMemberKeys.map(key => this.cacheManager.del(key)));
    } catch (error) {
      console.error('Failed to clear members cache:', error);
    }
  }

  async findAll(opts?: { isDraft?: boolean }): Promise<any[]> {
    const query = this.memberRepository.createQueryBuilder('member')
      .leftJoinAndSelect('member.page', 'page')
      .leftJoinAndSelect('page.blocks', 'block')
      .leftJoinAndSelect('block.children', 'children')
      .leftJoinAndSelect('member.sections', 'section')
      .orderBy('page.publishedAt', 'ASC')
      .addOrderBy('section.title', 'ASC');

    if (opts?.isDraft !== undefined) {
      query.andWhere('page.isDraft = :isDraft', { isDraft: opts.isDraft });

      if (opts.isDraft === false) {
        query.andWhere('page.publishedAt IS NOT NULL')
          .andWhere('page.publishedAt <= :now', { now: new Date() });
      }
    }

    const members = await query.getMany();
    return members.map(toPlainMember);
  }

  async findOne(id: string): Promise<any> {
    const member = await this.memberRepository.findOne({
      where: { id },
      relations: ['page', 'page.blocks', 'page.blocks.children', 'sections'],
    });
    if (!member) throw new Error('Member not found');
    return toPlainMember(member);
  }

  async create(data: { slug: string; title: string; previewImage?: string; publishedAt?: string; blocks?: any[]; isDraft?: any; sectionIds?: any }): Promise<any> {
    let slug = data.slug ? data.slug : `portfolio-${Date.now()}`;
    if (!slug.startsWith('portfolio/')) {
      slug = `portfolio/${slug}`;
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
      title: data.title || 'Новая страница',
      slug,
      isDraft,
      publishedAt: data.publishedAt ? new Date(data.publishedAt) : null,
      blocks,
    });

    await this.pageRepository.save(page);

    const sectionIds = parseSectionIds(data.sectionIds);
    const sections = sectionIds.length > 0
      ? await this.sectionRepository.findBy({ id: In(sectionIds) })
      : [];

    const member = this.memberRepository.create({
      page,
      previewImage: data.previewImage || '',
      sections,
    });

    const saved = await this.memberRepository.save(member);
    await this.clearMembersCache();
    const full = await this.memberRepository.findOne({
      where: { id: saved.id },
      relations: ['page', 'page.blocks', 'page.blocks.children', 'sections'],
    });

    if (!full) throw new Error('Member not found after save');
    return toPlainMember(full as RarMember);
  }

  async update(id: string, update: { previewImage?: string; publishedAt?: string; blocks?: any[]; isDraft?: any; title?: string; slug?: string; sectionIds?: any }): Promise<any> {
    const member = await this.memberRepository.findOne({ where: { id }, relations: ['page', 'sections'] });
    if (!member || !member.page) throw new Error('Member or page not found');

    let pageModified = false;

    if (update.previewImage !== undefined) {
      member.previewImage = update.previewImage;
    }

    if (update.title !== undefined) {
      member.page.title = update.title;
      pageModified = true;
    }

    if (update.slug !== undefined) {
      member.page.slug = update.slug.startsWith('portfolio/') ? update.slug : `portfolio/${update.slug}`;
      pageModified = true;
    }

    if (update.publishedAt !== undefined) {
      member.page.publishedAt = update.publishedAt ? new Date(update.publishedAt) : null;
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

      if (member.page.isDraft !== isDraftValue) {
        member.page.isDraft = isDraftValue;
        pageModified = true;
      }
    }

    if (update.sectionIds !== undefined) {
      const sectionIds = parseSectionIds(update.sectionIds);
      const sections = sectionIds.length > 0
        ? await this.sectionRepository.findBy({ id: In(sectionIds) })
        : [];
      member.sections = sections;
    }

    if (pageModified) {
      await this.pageRepository.save(member.page);
    }

    if (update.blocks && member.page) {
      let blocksArr: any[] = [];
      if (typeof update.blocks === 'string') {
        try {
          blocksArr = JSON.parse(update.blocks);
        } catch {
          blocksArr = [];
        }
      } else if (Array.isArray(update.blocks)) {
        blocksArr = update.blocks;
      }

      await this.blockRepository.delete({ page: { id: member.page.id } });

      if (blocksArr.length > 0) {
        const blocks = blocksArr.map((b: any, idx: number) => {
          const block = new Block();
          block.type = b.type;
          block.content = b.content;
          block.order = typeof b.order === 'number' ? b.order : idx;
          block.parentBlock = null;
          block.page = member.page;
          return block;
        });

        await this.blockRepository.save(blocks);
      }
      pageModified = true;
    }

    if (update.previewImage !== undefined || pageModified || update.sectionIds !== undefined) {
      await this.memberRepository.save(member);
    }

    await this.clearMembersCache();
    const full = await this.memberRepository.findOne({
      where: { id: member.id },
      relations: ['page', 'page.blocks', 'page.blocks.children', 'sections'],
    });
    if (!full) throw new Error('Member not found after update');
    return toPlainMember(full as RarMember);
  }

  async remove(id: string): Promise<void> {
    const member = await this.memberRepository.findOne({ where: { id } });
    if (!member) throw new Error('Member not found');
    await this.memberRepository.remove(member);
    await this.clearMembersCache();
  }
}

function parseSectionIds(input: any): string[] {
  if (!input) return [];
  if (Array.isArray(input)) {
    return input.map((value) => String(value));
  }
  if (typeof input === 'string') {
    try {
      const parsed = JSON.parse(input);
      if (Array.isArray(parsed)) {
        return parsed.map((value) => String(value));
      }
    } catch {
      return input.split(',').map((value) => value.trim()).filter(Boolean);
    }
  }
  return [];
}

function toPlainSection(section: RarSection): any {
  return {
    id: section.id,
    title: section.title,
    slug: section.slug,
    icon: section.icon ?? null,
  };
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

function toPlainMember(member: RarMember): any {
  return {
    id: member.id,
    previewImage: member.previewImage,
    page: member.page ? {
      id: member.page.id,
      slug: member.page.slug,
      title: member.page.title,
      publishedAt: member.page.publishedAt,
      isDraft: member.page.isDraft,
      blocks: Array.isArray(member.page.blocks) ? member.page.blocks.map(toPlainBlock) : [],
    } : null,
    sections: Array.isArray(member.sections) 
      ? member.sections
        .sort((a: any, b: any) => a.title.localeCompare(b.title, 'ru'))
        .map(toPlainSection)
      : [],
  };
}
