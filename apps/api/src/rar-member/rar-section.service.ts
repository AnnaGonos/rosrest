import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Repository } from 'typeorm';
import { RarSection } from './entities/rar-section.entity';
import { RarMember } from './entities/rar-member.entity';

@Injectable()
export class RarSectionService {
  constructor(
    @InjectRepository(RarSection)
    private readonly sectionRepository: Repository<RarSection>,
    @InjectRepository(RarMember)
    private readonly memberRepository: Repository<RarMember>,
    @Inject(CACHE_MANAGER)
    private cacheManager: Cache,
  ) {}

  private async clearCache(): Promise<void> {
    try {
      const keys = await this.cacheManager.store.keys();
      const relevantKeys = keys.filter(key => 
        key.includes('/rar-sections') || 
        key.includes('/rar-members') ||
        key.includes('rar_section') ||
        key.includes('rar_member')
      );
      await Promise.all(relevantKeys.map(key => this.cacheManager.del(key)));
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  }

  async findAll(): Promise<RarSection[]> {
    return this.sectionRepository.find({ order: { orderIndex: 'ASC', title: 'ASC' } });
  }

  async findOne(id: string): Promise<RarSection> {
    const section = await this.sectionRepository.findOne({ where: { id } });
    if (!section) throw new Error('Section not found');
    return section;
  }

  async create(data: { title: string; slug: string; icon?: string; orderIndex?: number }): Promise<RarSection> {
    const { maxOrderIndex } = (await this.sectionRepository
      .createQueryBuilder('section')
      .select('MAX(section.orderIndex)', 'maxOrderIndex')
      .getRawOne<{ maxOrderIndex: string | null }>()) ?? { maxOrderIndex: null };

    const nextOrderIndex = typeof data.orderIndex === 'number'
      ? data.orderIndex
      : (maxOrderIndex !== null ? Number(maxOrderIndex) + 1 : 0);

    const section = this.sectionRepository.create({
      title: data.title,
      slug: data.slug,
      icon: data.icon ?? null,
      orderIndex: Number.isFinite(nextOrderIndex) ? nextOrderIndex : 0,
    });
    const saved = await this.sectionRepository.save(section);
    await this.clearCache();
    return saved;
  }

  async update(id: string, update: { title?: string; slug?: string; icon?: string | null; orderIndex?: number }): Promise<RarSection> {
    const section = await this.sectionRepository.findOne({ where: { id } });
    if (!section) throw new Error('Section not found');

    if (update.title !== undefined) section.title = update.title;
    if (update.slug !== undefined) section.slug = update.slug;
    if (update.icon !== undefined) section.icon = update.icon;
    if (update.orderIndex !== undefined) section.orderIndex = update.orderIndex;

    const saved = await this.sectionRepository.save(section);
    await this.clearCache();
    return saved;
  }

  async remove(id: string): Promise<void> {
    const section = await this.sectionRepository.findOne({
      where: { id },
      relations: ['members'],
    });
    if (!section) throw new Error('Section not found');

    if (Array.isArray(section.members) && section.members.length > 0) {
      for (const member of section.members) {
        member.sections = (member.sections || []).filter((item) => item.id !== id);
        await this.memberRepository.save(member);
      }
    }
    await this.sectionRepository.remove(section);
    await this.clearCache();
  }
}
