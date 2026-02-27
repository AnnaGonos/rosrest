import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from './entities/project.entity';
import { Page } from '../page/entities/page.entity';
import { Block } from '../page/entities/block.entity';

@Injectable()
export class ProjectService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(Page)
    private readonly pageRepository: Repository<Page>,
    @InjectRepository(Block)
    private readonly blockRepository: Repository<Block>,
  ) { }


  async findAll(opts?: { isDraft?: boolean }): Promise<any[]> {
    const query = this.projectRepository.createQueryBuilder('project')
      .leftJoinAndSelect('project.page', 'page')
      .leftJoinAndSelect('page.blocks', 'block')
      .leftJoinAndSelect('block.children', 'children')
      .orderBy('page.publishedAt', 'ASC');

    if (opts?.isDraft !== undefined) {
      query.andWhere('page.isDraft = :isDraft', { isDraft: opts.isDraft });

      if (opts.isDraft === false) {
        query.andWhere('page.publishedAt IS NOT NULL')
          .andWhere('page.publishedAt <= :now', { now: new Date() });
      }
    }

    const projects = await query.getMany();
    return projects.map(toPlainProject);
  }

  async findOne(id: string): Promise<any> {
    const project = await this.projectRepository.findOne({ where: { id }, relations: ['page', 'page.blocks', 'page.blocks.children'] });
    if (!project) throw new Error('Project not found');
    return toPlainProject(project);
  }

  async create(data: { slug: string; title: string; previewImage?: string; publishedAt?: string; blocks?: any[]; isDraft?: any }): Promise<any> {
    let slug = data.slug ? data.slug : `page-${Date.now()}`;

    if (!slug.startsWith('projects/')) {
      slug = `projects/${slug}`;
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

    const project = this.projectRepository.create({
      page,
      previewImage: data.previewImage || '',
    });

    const saved = await this.projectRepository.save(project);
    const full = await this.projectRepository.findOne({
      where: { id: saved.id },
      relations: ['page', 'page.blocks', 'page.blocks.children']
    });

    if (!full) {
      throw new Error('Project not found after save');
    }

    return toPlainProject(full);
  }

  async update(id: string, update: { previewImage?: string; publishedAt?: string; blocks?: any[]; isDraft?: any; title?: string; slug?: string }): Promise<any> {
    const project = await this.projectRepository.findOne({ where: { id }, relations: ['page'] });
    if (!project || !project.page) throw new Error('Project or page not found');

    let pageModified = false;

    if (update.previewImage !== undefined) {
      project.previewImage = update.previewImage;
    }

    if (update.title !== undefined) {
      project.page.title = update.title;
      pageModified = true;
    }

    if (update.slug !== undefined) {
      project.page.slug = update.slug.startsWith('projects/') ? update.slug : `projects/${update.slug}`;
      pageModified = true;
    }

    if (update.publishedAt !== undefined) {
      project.page.publishedAt = update.publishedAt ? new Date(update.publishedAt) : null;
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

      if (project.page.isDraft !== isDraftValue) {
        project.page.isDraft = isDraftValue;
        pageModified = true;
      }
    }

    if (pageModified) {
      await this.pageRepository.save(project.page);
    }

    if (update.blocks && project.page) {
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


      await this.blockRepository.delete({ page: { id: project.page.id } });

      if (blocksArr.length > 0) {
        const blocks = blocksArr.map((b: any, idx: number) => {
          const block = new Block();
          block.type = b.type;
          block.content = b.content;
          block.order = typeof b.order === 'number' ? b.order : idx;
          block.parentBlock = null;
          block.page = project.page;
          return block;
        });

        await this.blockRepository.save(blocks);
      }
      pageModified = true;
    }

    if (update.previewImage !== undefined || pageModified) {
      await this.projectRepository.save(project);
    }

    const full = await this.projectRepository.findOne({
      where: { id: project.id },
      relations: ['page', 'page.blocks', 'page.blocks.children']
    });
    return toPlainProject(full);
  }

  async remove(id: string): Promise<void> {
    const project = await this.projectRepository.findOne({ where: { id } });
    if (!project) throw new Error('Project not found');
    await this.projectRepository.remove(project);
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

function toPlainProject(project: any): any {
  return {
    id: project.id,
    previewImage: project.previewImage,
    page: project.page ? toPlainPage(project.page) : null,
  };
}

