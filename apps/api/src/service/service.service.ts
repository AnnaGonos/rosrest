import { Injectable, BadRequestException, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Service } from './entities/service.entity';
import { ServiceContact } from './entities/service-contact.entity';
import { Page } from '../page/entities/page.entity';
import { Block } from '../page/entities/block.entity';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

@Injectable()
export class ServiceService {
  constructor(
    @InjectRepository(Service)
    private readonly serviceRepository: Repository<Service>,
    @InjectRepository(ServiceContact)
    private readonly serviceContactRepository: Repository<ServiceContact>,
    @InjectRepository(Page)
    private readonly pageRepository: Repository<Page>,
    @InjectRepository(Block)
    private readonly blockRepository: Repository<Block>,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) { }

  
  private readonly SERVICES_CACHE_KEY_ALL = 'services_all';
  private readonly SERVICES_CACHE_KEY_DRAFT = 'services_draft';
  private readonly SERVICES_CACHE_KEY_PUBLISHED = 'services_published';

  private async invalidateCache() {
    await this.cacheManager.del(this.SERVICES_CACHE_KEY_ALL);
    await this.cacheManager.del(this.SERVICES_CACHE_KEY_DRAFT);
    await this.cacheManager.del(this.SERVICES_CACHE_KEY_PUBLISHED);
  }

  async findAll(opts?: { isDraft?: boolean }): Promise<any[]> {
    let cacheKey: string;
    if (opts?.isDraft === true) {
      cacheKey = this.SERVICES_CACHE_KEY_DRAFT;
    } else if (opts?.isDraft === false) {
      cacheKey = this.SERVICES_CACHE_KEY_PUBLISHED;
    } else {
      cacheKey = this.SERVICES_CACHE_KEY_ALL;
    }

    const cached = await this.cacheManager.get<any[]>(cacheKey);
    if (cached && Array.isArray(cached)) {
      return cached;
    }

    const query = this.serviceRepository.createQueryBuilder('service')
      .leftJoinAndSelect('service.page', 'page')
      .leftJoinAndSelect('service.contacts', 'contacts')
      .leftJoinAndSelect('page.blocks', 'block')
      .leftJoinAndSelect('block.children', 'children')
      .orderBy('page.publishedAt', 'ASC')
      .addOrderBy('contacts.order', 'ASC');

    if (opts?.isDraft !== undefined) {
      query.andWhere('page.isDraft = :isDraft', { isDraft: opts.isDraft });

      if (opts.isDraft === false) {
        query.andWhere('page.publishedAt IS NOT NULL')
          .andWhere('page.publishedAt <= :now', { now: new Date() });
      }
    }

    const services = await query.getMany();
    const result = services.map(toPlainService);
    
    await this.cacheManager.set(cacheKey, result);
    return result;
  }

  async findOne(id: string): Promise<any> {
    const service = await this.serviceRepository.findOne({ 
      where: { id }, 
      relations: ['page', 'page.blocks', 'page.blocks.children', 'contacts'],
      order: {
        contacts: {
          order: 'ASC'
        }
      }
    });
    if (!service) throw new Error('Service not found');
    return toPlainService(service);
  }

  async create(data: { slug: string; title: string; publishedAt?: string; blocks?: any[]; isDraft?: any; contacts?: any[] }): Promise<any> {
    let slug = data.slug ? data.slug : `page-${Date.now()}`;

    if (!slug.startsWith('services/')) {
      slug = `services/${slug}`;
    }

    const existingPage = await this.pageRepository.findOne({ where: { slug } });
    if (existingPage) {
      throw new BadRequestException(`Страница с URL "${slug}" уже существует. Пожалуйста, используйте другой slug.`);
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

    const service = this.serviceRepository.create({
      page,
    });

    const saved = await this.serviceRepository.save(service);

    const contactsInput = typeof data.contacts === 'string'
      ? safeParseArray(data.contacts)
      : data.contacts;
    if (Array.isArray(contactsInput) && contactsInput.length > 0) {
      const contacts = contactsInput.map((c, idx) => {
        const contact = new ServiceContact();
        contact.fullName = c.fullName;
        contact.photo = c.photo;
        contact.position = c.position || null;
        contact.email = c.email || null;
        contact.phone = c.phone || null;
        contact.order = typeof c.order === 'number' ? c.order : idx;
        contact.serviceId = saved.id;
        contact.service = saved;
        return contact;
      });
      await this.serviceContactRepository.save(contacts);
    }

    const full = await this.serviceRepository.findOne({
      where: { id: saved.id },
      relations: ['page', 'page.blocks', 'page.blocks.children', 'contacts'],
      order: {
        contacts: {
          order: 'ASC'
        }
      }
    });

    if (!full) {
      throw new Error('Service not found after save');
    }

    await this.invalidateCache();
    return toPlainService(full);
  }

  async update(id: string, update: { publishedAt?: string; blocks?: any[]; isDraft?: any; title?: string; slug?: string; contacts?: any[] }): Promise<any> {
    const service = await this.serviceRepository.findOne({ where: { id }, relations: ['page'] });
    if (!service || !service.page) throw new Error('Service or page not found');

    let pageModified = false;

    if (update.title !== undefined) {
      service.page.title = update.title;
      pageModified = true;
    }

    if (update.slug !== undefined) {
      const newSlug = update.slug.startsWith('services/') ? update.slug : `services/${update.slug}`;
      
      if (newSlug !== service.page.slug) {
        const existingPage = await this.pageRepository.findOne({ where: { slug: newSlug } });
        if (existingPage && existingPage.id !== service.page.id) {
          throw new BadRequestException(`Страница с URL "${newSlug}" уже существует. Пожалуйста, используйте другой slug.`);
        }
      }
      
      service.page.slug = newSlug;
      pageModified = true;
    }

    if (update.publishedAt !== undefined) {
      service.page.publishedAt = update.publishedAt ? new Date(update.publishedAt) : null;
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

      if (service.page.isDraft !== isDraftValue) {
        service.page.isDraft = isDraftValue;
        pageModified = true;
      }
    }

    if (pageModified) {
      await this.pageRepository.save(service.page);
    }

    if (update.blocks && service.page) {
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

      
      await this.blockRepository.delete({ page: { id: service.page.id } });
      
      if (blocksArr.length > 0) {
        const blocks = blocksArr.map((b: any, idx: number) => {
          const block = new Block();
          block.type = b.type;
          block.content = b.content;
          block.order = typeof b.order === 'number' ? b.order : idx;
          block.parentBlock = null;
          block.page = service.page;
          return block;
        });

        await this.blockRepository.save(blocks);
      }
      pageModified = true;
    }

    const contactsUpdateInput = typeof update.contacts === 'string'
      ? safeParseArray(update.contacts)
      : update.contacts;
    if (contactsUpdateInput !== undefined) {
      await this.serviceContactRepository.delete({ service: { id: service.id } });
      
      if (Array.isArray(contactsUpdateInput) && contactsUpdateInput.length > 0) {
        const contacts = contactsUpdateInput.map((c: any, idx: number) => {
          const contact = new ServiceContact();
          contact.fullName = c.fullName;
          contact.photo = c.photo;
          contact.position = c.position || null;
          contact.email = c.email || null;
          contact.phone = c.phone || null;
          contact.order = typeof c.order === 'number' ? c.order : idx;
          contact.serviceId = service.id;
          contact.service = service;
          return contact;
        });
        await this.serviceContactRepository.save(contacts);
      }
    }

    if (pageModified) {
      await this.serviceRepository.save(service);
    }

    const full = await this.serviceRepository.findOne({
      where: { id: service.id },
      relations: ['page', 'page.blocks', 'page.blocks.children', 'contacts'],
      order: {
        contacts: {
          order: 'ASC'
        }
      }
    });
    
    await this.invalidateCache();
    return toPlainService(full);
  }

  async remove(id: string): Promise<void> {
    const service = await this.serviceRepository.findOne({ where: { id } });
    if (!service) throw new Error('Service not found');
    await this.serviceRepository.remove(service);
    await this.invalidateCache();
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

function safeParseArray(value: string): any[] {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function toPlainService(service: any): any {
  return {
    id: service.id,
    page: service.page ? toPlainPage(service.page) : null,
    contacts: Array.isArray(service.contacts) 
      ? service.contacts.map((c: any) => ({
          id: c.id,
          fullName: c.fullName,
          photo: c.photo,
          position: c.position,
          email: c.email,
          phone: c.phone,
          order: c.order
        }))
      : []
  };
}
