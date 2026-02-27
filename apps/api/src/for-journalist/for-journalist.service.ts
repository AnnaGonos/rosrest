import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ForJournalist } from './entities/for-journalist.entity';
import { Page } from '../page/entities/page.entity';
import { Block } from '../page/entities/block.entity';

function toPlainForJournalist(entity: ForJournalist): any {
  return {
    id: entity.id,
    previewImage: entity.previewImage,
    page: entity.page ? {
      id: entity.page.id,
      title: entity.page.title,
      slug: entity.page.slug,
      isDraft: entity.page.isDraft,
      publishedAt: entity.page.publishedAt,
      blocks: entity.page.blocks || [],
    } : null,
  };
}

@Injectable()
export class ForJournalistService {
  constructor(
    @InjectRepository(ForJournalist)
    private readonly forJournalistRepository: Repository<ForJournalist>,
    @InjectRepository(Page)
    private readonly pageRepository: Repository<Page>,
    @InjectRepository(Block)
    private readonly blockRepository: Repository<Block>,
  ) { }


  async findOne(): Promise<any | null> {
    const pages = await this.forJournalistRepository.find({ 
      relations: ['page', 'page.blocks', 'page.blocks.children'],
      order: { page: { publishedAt: 'DESC' } },
      take: 1
    });
    
    
    if (!pages || pages.length === 0) return null;
    return toPlainForJournalist(pages[0]);
  }

  async create(data: { slug: string; title: string; previewImage?: string; publishedAt?: string; blocks?: any[]; isDraft?: any }): Promise<any> {
   
    const existingPages = await this.forJournalistRepository.find({
      relations: ['page'],
      take: 1
    });
    
    if (existingPages && existingPages.length > 0) {
      throw new Error('Страница для журналистов уже существует. Используйте обновление.');
    }

    let slug = data.slug || 'for-journalist';

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
    } else {
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
      title: data.title || 'Информация для журналистов',
      slug,
      isDraft,
      publishedAt: data.publishedAt ? new Date(data.publishedAt) : new Date(),
    });

    const savedPage = await this.pageRepository.save(page);

    if (blocks.length > 0) {
      blocks.forEach(block => {
        block.page = savedPage;
      });
      const savedBlocks = await this.blockRepository.save(blocks);
    }

    const forJournalist = this.forJournalistRepository.create({
      page: savedPage,
      previewImage: data.previewImage || '',
    });

    const saved = await this.forJournalistRepository.save(forJournalist);
    const full = await this.forJournalistRepository.findOne({
      where: { id: saved.id },
      relations: ['page', 'page.blocks', 'page.blocks.children'],
    });

    return toPlainForJournalist(full!);
  }

  async update(id: string, data: Partial<{ slug?: string; title?: string; previewImage?: string; publishedAt?: string; blocks?: any[]; isDraft?: any }>): Promise<any> {
    const forJournalist = await this.forJournalistRepository.findOne({
      where: { id },
      relations: ['page'], 
    });

    if (!forJournalist) {
      throw new Error('ForJournalist not found');
    }

    let pageModified = false;

    if (data.previewImage !== undefined) {
      forJournalist.previewImage = data.previewImage;
    }

    if (data.title !== undefined) {
      forJournalist.page.title = data.title;
      pageModified = true;
    }

    if (data.slug !== undefined) {
      forJournalist.page.slug = data.slug;
      pageModified = true;
    }

    if (data.publishedAt !== undefined) {
      forJournalist.page.publishedAt = data.publishedAt ? new Date(data.publishedAt) : null;
      pageModified = true;
    }

    if (data.isDraft !== undefined) {
      let isDraft: boolean = false;
      if (typeof data.isDraft === 'string') {
        isDraft = data.isDraft.toLowerCase() === 'true' || data.isDraft === '1';
      } else if (typeof data.isDraft === 'boolean') {
        isDraft = data.isDraft;
      } else if (typeof data.isDraft === 'number') {
        isDraft = !!data.isDraft;
      }
      forJournalist.page.isDraft = isDraft;
      pageModified = true;
    }

    if (pageModified) {
      await this.pageRepository.save(forJournalist.page);
    }

    if (data.blocks !== undefined && Array.isArray(data.blocks)) {
      await this.blockRepository.delete({ page: { id: forJournalist.page.id } });
      
      if (data.blocks.length > 0) {
        const newBlocks = data.blocks.map((b, idx) => {
          const block = new Block();
          block.type = b.type;
          block.content = b.content;
          block.order = typeof b.order === 'number' ? b.order : idx;
          block.page = forJournalist.page;
          block.parentBlock = null;
          
          return block;
        });

        await this.blockRepository.save(newBlocks);
      }
    }

    await this.forJournalistRepository.save(forJournalist);

    const updated = await this.forJournalistRepository.findOne({
      where: { id },
      relations: ['page', 'page.blocks', 'page.blocks.children'],
    });

    return toPlainForJournalist(updated!);
  }

  async delete(id: string): Promise<void> {
    const forJournalist = await this.forJournalistRepository.findOne({
      where: { id },
      relations: ['page'],
    });

    if (!forJournalist) {
      throw new Error('ForJournalist not found');
    }

    await this.forJournalistRepository.remove(forJournalist);
  }
}
