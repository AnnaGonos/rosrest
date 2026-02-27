import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Event } from './entities/event.entity';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

@Injectable()
export class EventService {
  constructor(
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) { }

  private readonly EVENT_CACHE_KEYS = [
    'event_all',
    'event_published_upcoming',
    'event_published_past',
    'event_published_all',
  ];

  private getCacheKey(isPublished?: boolean, filter?: 'past' | 'upcoming' | 'all') {
    if (isPublished === false) return 'event_all';
    if (isPublished === true && filter === 'upcoming') return 'event_published_upcoming';
    if (isPublished === true && filter === 'past') return 'event_published_past';
    if (isPublished === true && filter === 'all') return 'event_published_all';
    return 'event_all';
  }

  private async invalidateCache() {
    for (const key of this.EVENT_CACHE_KEYS) {
      await this.cacheManager.del(key);
    }
  }

  async create(createEventDto: CreateEventDto): Promise<Event> {
    const event = this.eventRepository.create(createEventDto);
    const saved = await this.eventRepository.save(event);
    await this.invalidateCache();
    return saved
  }


  async findAll(
    isPublished?: boolean,
    limit?: number,
    filter?: 'past' | 'upcoming' | 'all',
    offset?: number,
    sortOrder?: 'ASC' | 'DESC', 
  ): Promise<{ events: Event[]; totalCount: number }> {
    const cacheKey = this.getCacheKey(isPublished, filter);
    const cached = await this.cacheManager.get<{ events: Event[]; totalCount: number }>(cacheKey);
    if (cached) {
      const paginatedEvents = cached.events.slice(offset || 0, (offset || 0) + (limit || cached.events.length));
      return { events: paginatedEvents, totalCount: cached.totalCount };
    }

    const query = this.eventRepository.createQueryBuilder('event');

    if (isPublished !== undefined) {
      query.where('event.isPublished = :isPublished', { isPublished });
    }

    const now = new Date();
    const todayNum = parseInt(
      `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`
    );

    if (filter === 'past') {
      query.andWhere(
        `(
        (event.endDate IS NOT NULL AND (CAST(CASE WHEN LENGTH(event.endDate) = 7 THEN SUBSTRING(event.endDate, 4, 4) || SUBSTRING(event.endDate, 1, 2) || '31' 
          ELSE SUBSTRING(event.endDate, 7, 4) || SUBSTRING(event.endDate, 4, 2) || SUBSTRING(event.endDate, 1, 2) END AS INTEGER) < :todayNum))
        OR
        (event.endDate IS NULL AND (CAST(CASE WHEN LENGTH(event.startDate) = 7 THEN SUBSTRING(event.startDate, 4, 4) || SUBSTRING(event.startDate, 1, 2) || '31' 
          ELSE SUBSTRING(event.startDate, 7, 4) || SUBSTRING(event.startDate, 4, 2) || SUBSTRING(event.startDate, 1, 2) END AS INTEGER) < :todayNum))
      )`,
        { todayNum }
      );
    } else if (filter === 'upcoming') {
      query.andWhere(
        `(
        (event.endDate IS NOT NULL AND (CAST(CASE WHEN LENGTH(event.endDate) = 7 THEN SUBSTRING(event.endDate, 4, 4) || SUBSTRING(event.endDate, 1, 2) || '31' 
          ELSE SUBSTRING(event.endDate, 7, 4) || SUBSTRING(event.endDate, 4, 2) || SUBSTRING(event.endDate, 1, 2) END AS INTEGER) >= :todayNum))
        OR
        (event.endDate IS NULL AND (CAST(CASE WHEN LENGTH(event.startDate) = 7 THEN SUBSTRING(event.startDate, 4, 4) || SUBSTRING(event.startDate, 1, 2) || '31' 
          ELSE SUBSTRING(event.startDate, 7, 4) || SUBSTRING(event.startDate, 4, 2) || SUBSTRING(event.startDate, 1, 2) END AS INTEGER) >= :todayNum))
      )`,
        { todayNum }
      );
    }

    const effectiveSortOrder: 'ASC' | 'DESC' =
      sortOrder ?? (filter === 'past' ? 'DESC' : 'ASC');

    const dateSortExpression = `
    COALESCE(
      CAST(
        CASE 
          WHEN LENGTH(event.endDate) = 7 THEN SUBSTRING(event.endDate, 4, 4) || SUBSTRING(event.endDate, 1, 2) || '31'
          WHEN event.endDate IS NOT NULL THEN SUBSTRING(event.endDate, 7, 4) || SUBSTRING(event.endDate, 4, 2) || SUBSTRING(event.endDate, 1, 2)
        END AS INTEGER
      ),
      CAST(
        CASE 
          WHEN LENGTH(event.startDate) = 7 THEN SUBSTRING(event.startDate, 4, 4) || SUBSTRING(event.startDate, 1, 2) || '31'
          WHEN event.startDate IS NOT NULL THEN SUBSTRING(event.startDate, 7, 4) || SUBSTRING(event.startDate, 4, 2) || SUBSTRING(event.startDate, 1, 2)
        END AS INTEGER
      )
    )
  `;

    query.orderBy(dateSortExpression.trim(), effectiveSortOrder);
    query.addOrderBy('event.id', effectiveSortOrder);

    const [allEvents, totalCount] = await query.getManyAndCount();
    const result = { events: allEvents, totalCount };

    await this.cacheManager.set(cacheKey, result);

    const paginatedEvents = allEvents.slice(offset || 0, (offset || 0) + (limit || allEvents.length));
    return { events: paginatedEvents, totalCount };
  }

  async findOne(id: number): Promise<Event> {
    const event = await this.eventRepository.findOne({ where: { id } });
    if (!event) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }
    return event;
  }

  async update(id: number, updateEventDto: UpdateEventDto): Promise<Event> {
    const event = await this.findOne(id);

    Object.assign(event, updateEventDto);

    const saved = await this.eventRepository.save(event);

    await this.invalidateCache();
    return saved
  }

  async remove(id: number): Promise<void> {
    const event = await this.findOne(id);
    await this.eventRepository.remove(event);
    await this.invalidateCache();
  }
}
