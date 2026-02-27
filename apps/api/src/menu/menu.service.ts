import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MenuItem } from './menu-item.entity';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

@Injectable()
export class MenuService {
  constructor(
    @InjectRepository(MenuItem)
    private readonly menuRepo: Repository<MenuItem>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) { }

  async getMenu(menuName: string) {
    const cacheKey = `menu:${menuName}`;

    const cached = await this.cacheManager.get<any>(cacheKey);
    if (cached) return cached;

    const items = await this.menuRepo.find({ order: { ord: 'ASC' } });

    type MenuNode = { id: string; children: MenuNode[] } & Record<string, any>;
    const byId = new Map<string, MenuNode>(items.map(i => [i.id, { ...(i as any), children: [] as MenuNode[] } as MenuNode]));
    const roots: MenuNode[] = [];
    for (const it of items) {
      const node = byId.get(it.id)!;
      if (it.parentId) {
        const p = byId.get(it.parentId);
        if (p) p.children.push(node);
        else roots.push(node);
      } else {
        roots.push(node);
      }
    }
    const result = { items: roots };

    await this.cacheManager.set(cacheKey, result, 600);
    return result;
  }

  async replaceMenu(menuName: string, items: any[]) {
    await this.menuRepo.clear();

    const tempMap = new Map<string, any>();
    const created: any[] = [];
    for (const it of items) {
      const entity = this.menuRepo.create({
        title: it.title ?? it.label ?? '',
        url: it.url ?? null,
        ord: typeof it.ord === 'number' ? it.ord : 0,
        parentId: null,
      });
      const saved = await this.menuRepo.save(entity);
      created.push(saved);
      if (it.tempId) tempMap.set(it.tempId, saved);
      else tempMap.set(saved.id, saved);
    }

    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      const saved = tempMap.get(it.tempId || created[i].id);
      if (it.parentTempId) {
        const parent = tempMap.get(it.parentTempId);
        if (parent) {
          saved.parentId = parent.id;
          await this.menuRepo.save(saved);
        }
      }
    }

    await this.cacheManager.del(`menu:header`);
    return this.getMenu('header');
  }

  async getAllItems() {
    return this.menuRepo.find({ order: { ord: 'ASC' } });
  }

  async updateItem(id: string, patch: Partial<MenuItem>) {
    const item = await this.menuRepo.findOneBy({ id } as any);
    if (!item) return null;
    if (typeof (patch as any).title !== 'undefined') item.title = (patch as any).title;
    if (typeof (patch as any).url !== 'undefined') item.url = (patch as any).url;
    if (typeof (patch as any).parentId !== 'undefined') item.parentId = (patch as any).parentId;
    if (typeof (patch as any).ord !== 'undefined') item.ord = (patch as any).ord;
    await this.menuRepo.save(item);
    await this.cacheManager.del(`menu:header`);
    return item;
  }

  async deleteItem(id: string) {
    const toDelete = [id];
    for (let i = 0; i < toDelete.length; i++) {
      const cur = toDelete[i];
      const children = await this.menuRepo.findBy({ parentId: cur as any } as any);
      for (const c of children) toDelete.push(c.id);
    }
    await this.menuRepo.delete(toDelete as any);
    await this.cacheManager.del(`menu:header`);
    return { deleted: toDelete };
  }
}
