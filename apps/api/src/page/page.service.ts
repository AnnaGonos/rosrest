import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Page } from './entities/page.entity';
import { Block } from './entities/block.entity';
import { CreatePageDto } from './dto/create-page.dto';
import { UpdatePageDto } from './dto/update-page.dto';
import { CreateBlockDto } from './dto/create-block.dto';

@Injectable()
export class PageService {
  constructor(
    @InjectRepository(Page) private pageRepo: Repository<Page>,
    @InjectRepository(Block) private blockRepo: Repository<Block>,
  ) { }

  async create(createPageDto: CreatePageDto): Promise<Page> {
    let isDraft: boolean = false;
    if (typeof createPageDto.isDraft === 'string') {
      isDraft = createPageDto.isDraft === 'true' || createPageDto.isDraft === '1';
    } else if (typeof createPageDto.isDraft === 'boolean') {
      isDraft = createPageDto.isDraft;
    } else if (typeof createPageDto.isDraft === 'number') {
      isDraft = !!createPageDto.isDraft;
    }
    const page = this.pageRepo.create({
      ...createPageDto,
      isDraft,
      blocks: [],
    });
    await this.pageRepo.save(page);
    if (createPageDto.blocks) {
      await this.saveBlocksRecursive(createPageDto.blocks, page, null);
    }
    return this.findOne(page.id);
  }

  async saveBlocksRecursive(blocks: CreateBlockDto[], page: Page, parentBlock: Block | null) {
    for (const blockDto of blocks) {
      const { children, ...blockData } = blockDto;
      const block = this.blockRepo.create({
        ...blockData,
        page: parentBlock ? null : page,
        parentBlock: parentBlock || null,
      });
      await this.blockRepo.save(block);
      if (children && Array.isArray(children)) {
        await this.saveBlocksRecursive(children, page, block);
      }
    }
  }

  async findAll(): Promise<Page[]> {
    const pages = await this.pageRepo.find({ relations: ['blocks', 'blocks.children'] });

    for (const page of pages) {
      if (Array.isArray(page.blocks)) {
        page.blocks.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      }
    }
    return pages;
  }

  async findOne(id: string): Promise<Page> {
    const page = await this.pageRepo.findOne({
      where: { id },
      relations: ['blocks', 'blocks.children'],
      order: { blocks: { order: 'ASC' } },
    });
    if (!page) throw new NotFoundException('Page not found');

    if (Array.isArray(page.blocks)) {
      page.blocks.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    }
    return page;
  }

  async findBySlug(slug: string): Promise<Page> {
    const page = await this.pageRepo.findOne({
      where: { slug },
      relations: ['blocks', 'blocks.children'],
      order: { blocks: { order: 'ASC' } },
    });
    if (!page) throw new NotFoundException('Page not found');

    if (Array.isArray(page.blocks)) {
      page.blocks.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    }
    return page;
  }

  async update(id: string, updatePageDto: UpdatePageDto): Promise<Page> {
    const page = await this.findOne(id);

    const updateData: any = {};

    if ('previewImage' in updatePageDto && updatePageDto.previewImage !== undefined) {
      updateData.previewImage = updatePageDto.previewImage;
    }

    if ('publishedAt' in updatePageDto) {
      const val = updatePageDto.publishedAt;
      if (typeof val === 'string' && val.trim() !== '') {
        updateData.publishedAt = new Date(val);
        updateData.isDraft = false;
      } else if (val === null || val === undefined || (typeof val === 'string' && val.trim() === '')) {
        updateData.publishedAt = null;
        updateData.isDraft = true;
      }
    }

    if ('isDraft' in updatePageDto && updatePageDto.isDraft !== undefined) {
      const val = updatePageDto.isDraft;
      if (typeof val === 'string') {
        updateData.isDraft = val === 'true' || val === '1';
      } else if (typeof val === 'boolean') {
        updateData.isDraft = val;
      } else if (typeof val === 'number') {
        updateData.isDraft = !!val;
      }
    }

    if ('slug' in updatePageDto && updatePageDto.slug !== undefined) {
      updateData.slug = updatePageDto.slug;
    }
    if ('title' in updatePageDto && updatePageDto.title !== undefined) {
      updateData.title = updatePageDto.title;
    }
    if ('blocks' in updatePageDto && updatePageDto.blocks !== undefined) {
      await this.blockRepo.delete({ page: { id } });

      if (Array.isArray(updatePageDto.blocks) && updatePageDto.blocks.length > 0) {
        await this.saveBlocksRecursive(updatePageDto.blocks, page, null);
      }
    }

    await this.pageRepo.save({ ...page, ...updateData, id });
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.pageRepo.delete(id);
  }
}
