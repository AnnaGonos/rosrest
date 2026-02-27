import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NewsTag } from '../entities/news-tag.entity';

@Injectable()
export class NewsTagService {
  constructor(
    @InjectRepository(NewsTag)
    private readonly newsTagRepository: Repository<NewsTag>,
  ) { }

  async findAll(): Promise<NewsTag[]> {
    return this.newsTagRepository.find({ order: { name: 'ASC' } });
  }

  async findOne(id: number): Promise<NewsTag> {
    const tag = await this.newsTagRepository.findOne({ where: { id } });
    if (!tag) throw new NotFoundException('Tag not found');
    return tag;
  }

  async create(data: { name: string; slug?: string }): Promise<NewsTag> {
    const slug = data.slug || this.generateSlug(data.name);

    const existing = await this.newsTagRepository.findOne({ where: { slug } });
    if (existing) {
      throw new ConflictException('Tag with this slug already exists');
    }

    const tag = this.newsTagRepository.create({ name: data.name, slug });
    return this.newsTagRepository.save(tag);
  }

  async update(id: number, data: { name?: string; slug?: string }): Promise<NewsTag> {
    const tag = await this.findOne(id);

    if (data.name !== undefined) {
      tag.name = data.name;
      const newSlug = this.generateSlug(data.name);

      const existing = await this.newsTagRepository.findOne({ where: { slug: newSlug } });
      if (existing && existing.id !== id) {
        throw new ConflictException('Tag with this slug already exists');
      }

      tag.slug = newSlug;
    }

    if (data.slug !== undefined) {
      const existing = await this.newsTagRepository.findOne({ where: { slug: data.slug } });
      if (existing && existing.id !== id) {
        throw new ConflictException('Tag with this slug already exists');
      }
      tag.slug = data.slug;
    }

    return this.newsTagRepository.save(tag);
  }

  async remove(id: number): Promise<void> {
    const tag = await this.findOne(id);
    await this.newsTagRepository.remove(tag);
  }

  private generateSlug(name: string): string {
    const translitMap: { [key: string]: string } = {
      'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'e', 'ж': 'zh',
      'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o',
      'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'h', 'ц': 'ts',
      'ч': 'ch', 'ш': 'sh', 'щ': 'sch', 'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya'
    };

    let transliterated = '';
    for (const char of name.toLowerCase()) {
      transliterated += translitMap[char] || char;
    }

    return transliterated
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}
