import { Injectable } from '@nestjs/common'
import { DataSource } from 'typeorm'
import { SearchResultItem, SearchScope } from './search.types'

interface RawSearchRow {
	type: SearchResultItem['type']
	id: string
	title: string
	url: string
	preview_image?: string | null
	snippet: string
	published_at: string | null
	rank: string | number | null
	section?: string | null
}

@Injectable()
export class SearchService {
	constructor(private readonly dataSource: DataSource) {}

	async search(query: string, scope: SearchScope = 'all', limit = 50): Promise<{ query: string; scope: SearchScope; total: number; items: SearchResultItem[] }> {
		const normalizedQuery = query.trim().replace(/\s+/g, ' ')
		if (normalizedQuery.length < 2) {
			return { query: normalizedQuery, scope, total: 0, items: [] }
		}

		const safeLimit = Math.max(1, Math.min(Number(limit) || 50, 100))
		const subqueries = this.buildSubqueries(scope)

		if (subqueries.length === 0) {
			return { query: normalizedQuery, scope, total: 0, items: [] }
		}

		const sql = `
			WITH RECURSIVE block_tree AS (
				SELECT
					b.id,
					b."pageId" AS page_id,
					regexp_replace(COALESCE(b.content ->> 'html', b.content::text, ''), '<[^>]+>', ' ', 'g') AS body,
					b."parentBlockId"
				FROM "block" b
				WHERE b."pageId" IS NOT NULL

				UNION ALL

				SELECT
					child.id,
					parent.page_id,
					regexp_replace(COALESCE(child.content ->> 'html', child.content::text, ''), '<[^>]+>', ' ', 'g') AS body,
					child."parentBlockId"
				FROM "block" child
				INNER JOIN block_tree parent ON child."parentBlockId" = parent.id
			),
			page_text AS (
				SELECT
					page_id,
					string_agg(body, ' ' ORDER BY id) AS body
				FROM block_tree
				GROUP BY page_id
			),
			search_q AS (
				SELECT websearch_to_tsquery('russian', $1) AS query
			)
			SELECT *
			FROM (
				${subqueries.join('\n\t\t\t\tUNION ALL\n\t\t\t\t')}
			) results
			ORDER BY rank DESC, published_at DESC NULLS LAST, title ASC
			LIMIT $2
		`

		const rows = await this.dataSource.query(sql, [normalizedQuery, safeLimit]) as RawSearchRow[]

		const items = rows.map((row) => ({
			type: row.type,
			id: row.id,
			title: row.title,
			url: row.url,
			previewImage: row.preview_image ?? null,
			snippet: row.snippet,
			publishedAt: row.published_at,
			rank: Number(row.rank || 0),
			section: row.section ?? null,
		}))

		return {
			query: normalizedQuery,
			scope,
			total: items.length,
			items,
		}
	}

	private buildSubqueries(scope: SearchScope): string[] {
		const queries: string[] = []

		if (scope === 'all' || scope === 'news') queries.push(this.newsSubquery())
		if (scope === 'all' || scope === 'projects') queries.push(this.projectsSubquery())
		if (scope === 'all' || scope === 'events') queries.push(this.eventsSubquery())
		if (scope === 'all' || scope === 'services') queries.push(this.servicesSubquery())
		if (scope === 'all' || scope === 'members') queries.push(this.membersSubquery())
		if (scope === 'all' || scope === 'documents') queries.push(this.documentsSubquery())
		if (scope === 'all' || scope === 'library') queries.push(this.librarySubquery())
		if (scope === 'all' || scope === 'pages') queries.push(this.pagesSubquery())
		if (scope === 'all' || scope === 'for-journalist') queries.push(this.forJournalistSubquery())

		return queries
	}

	private pageTextExpression(alias: string): string {
		return `COALESCE(${alias}.title, '') || ' ' || COALESCE(${alias}.slug, '') || ' ' || COALESCE(pt.body, '')`
	}

	private pageRankExpression(alias: string): string {
		return `ts_rank_cd(to_tsvector('russian', ${this.pageTextExpression(alias)}), search_q.query)`
	}

	private pageHeadlineExpression(alias: string): string {
		return `ts_headline('russian', ${this.pageTextExpression(alias)}, search_q.query, 'StartSel=<mark>, StopSel=</mark>, MinWords=5, MaxWords=18, MaxFragments=2')`
	}

	private pageSearchWhere(alias: string, extraConditions: string[] = []): string {
		const baseConditions = [
			`${this.pageTextExpression(alias)} IS NOT NULL`,
			`to_tsvector('russian', ${this.pageTextExpression(alias)}) @@ search_q.query`,
			...extraConditions,
		]

		return baseConditions.join('\n\t\t\t\tAND ')
	}

	private pageEntitySql(options: {
		type: SearchResultItem['type']
		entityTable: string
		entityAlias: string
		joinPageCondition: string
		urlExpression: string
		previewImageExpression?: string
		extraSelect?: string
		extraWhere?: string[]
		publishedAtExpression: string
	}): string {
		const {
			type,
			entityTable,
			entityAlias,
			joinPageCondition,
			urlExpression,
			previewImageExpression = 'NULL',
			extraSelect,
			extraWhere = [],
			publishedAtExpression,
		} = options

		return `
			SELECT
				'${type}'::text AS type,
				${entityAlias}.id::text AS id,
				page.title AS title,
				${urlExpression} AS url,
				${previewImageExpression}::text AS preview_image,
				${publishedAtExpression} AS published_at,
				${this.pageRankExpression('page')} AS rank,
				${this.pageHeadlineExpression('page')} AS snippet${extraSelect ? `,
				${extraSelect}` : ''}
			FROM ${entityTable} ${entityAlias}
			INNER JOIN "page" page ON ${joinPageCondition}
			LEFT JOIN page_text pt ON pt.page_id = page.id
			CROSS JOIN search_q
			WHERE ${this.pageSearchWhere('page', extraWhere)}
		`
	}

	private newsSubquery(): string {
		return this.pageEntitySql({
			type: 'news',
			entityTable: 'news',
			entityAlias: 'news',
			joinPageCondition: 'page.id = news."pageId"',
			urlExpression: `'/' || 'news/' || regexp_replace(page.slug, '^news/', '')`,
			previewImageExpression: `news."previewImage"`,
			publishedAtExpression: `page."publishedAt"`,
			extraWhere: [
				`page."isDraft" = false`,
				`page."publishedAt" IS NOT NULL`,
				`page."publishedAt" <= NOW()`,
			],
		})
	}

	private projectsSubquery(): string {
		return this.pageEntitySql({
			type: 'project',
			entityTable: 'projects',
			entityAlias: 'project',
			joinPageCondition: 'page.id = project."pageId"',
			urlExpression: `'/' || 'projects/' || regexp_replace(page.slug, '^projects/', '')`,
			previewImageExpression: `project."previewImage"`,
			publishedAtExpression: `page."publishedAt"`,
			extraWhere: [
				`page."isDraft" = false`,
				`page."publishedAt" IS NOT NULL`,
				`page."publishedAt" <= NOW()`,
			],
		})
	}

	private servicesSubquery(): string {
		return this.pageEntitySql({
			type: 'service',
			entityTable: 'services',
			entityAlias: 'service',
			joinPageCondition: 'page.id = service."pageId"',
			urlExpression: `'/' || 'services/' || regexp_replace(page.slug, '^services/', '')`,
			publishedAtExpression: `page."publishedAt"`,
			extraWhere: [
				`page."isDraft" = false`,
				`page."publishedAt" IS NOT NULL`,
				`page."publishedAt" <= NOW()`,
			],
		})
	}

	private membersSubquery(): string {
		return this.pageEntitySql({
			type: 'member',
			entityTable: 'rar_members',
			entityAlias: 'member',
			joinPageCondition: 'page.id = member."pageId"',
			urlExpression: `'/' || 'portfolio/' || regexp_replace(page.slug, '^portfolio/', '')`,
			previewImageExpression: `member."previewImage"`,
			publishedAtExpression: `page."publishedAt"`,
			extraWhere: [
				`page."isDraft" = false`,
				`page."publishedAt" IS NOT NULL`,
				`page."publishedAt" <= NOW()`,
			],
		})
	}

	private forJournalistSubquery(): string {
		return this.pageEntitySql({
			type: 'for-journalist',
			entityTable: 'for_journalist',
			entityAlias: 'fj',
			joinPageCondition: 'page.id = fj."pageId"',
			urlExpression: `'/' || 'for-journalist'`,
			previewImageExpression: `fj."previewImage"`,
			publishedAtExpression: `page."publishedAt"`,
			extraWhere: [
				`page."isDraft" = false`,
				`page."publishedAt" IS NOT NULL`,
				`page."publishedAt" <= NOW()`,
			],
		})
	}

	private pagesSubquery(): string {
		return `
			SELECT
				'page'::text AS type,
				page.id::text AS id,
				page.title AS title,
				'/' || page.slug AS url,
				NULL::text AS preview_image,
				page."publishedAt" AS published_at,
				ts_rank_cd(to_tsvector('russian', COALESCE(page.title, '') || ' ' || COALESCE(page.slug, '') || ' ' || COALESCE(pt.body, '')), search_q.query) AS rank,
				ts_headline('russian', COALESCE(page.title, '') || ' ' || COALESCE(page.slug, '') || ' ' || COALESCE(pt.body, ''), search_q.query, 'StartSel=<mark>, StopSel=</mark>, MinWords=5, MaxWords=18, MaxFragments=2') AS snippet
			FROM "page" page
			LEFT JOIN page_text pt ON pt.page_id = page.id
			CROSS JOIN search_q
			WHERE page."isDraft" = false
				AND page."publishedAt" IS NOT NULL
				AND page."publishedAt" <= NOW()
				AND page.slug NOT LIKE 'news/%'
				AND page.slug NOT LIKE 'projects/%'
				AND page.slug NOT LIKE 'services/%'
				AND page.slug NOT LIKE 'portfolio/%'
				AND page.slug NOT LIKE 'library/%'
				AND page.slug NOT LIKE 'press-center/for-journalist%'
				AND page.slug NOT LIKE 'for-journalist%'
				AND to_tsvector('russian', COALESCE(page.title, '') || ' ' || COALESCE(page.slug, '') || ' ' || COALESCE(pt.body, '')) @@ search_q.query
		`
	}

	private documentsSubquery(): string {
		return `
			SELECT
				'document'::text AS type,
				doc.id::text AS id,
				doc.title AS title,
				doc."fileUrl" AS url,
				doc."previewUrl" AS preview_image,
				doc."createdAt" AS published_at,
				ts_rank_cd(
					to_tsvector('russian', COALESCE(doc.title, '') || ' ' || COALESCE(cat.name, '') || ' ' || COALESCE(subcat.name, '')),
					search_q.query
				) AS rank,
				ts_headline('russian', COALESCE(doc.title, '') || ' ' || COALESCE(cat.name, '') || ' ' || COALESCE(subcat.name, ''), search_q.query, 'StartSel=<mark>, StopSel=</mark>, MinWords=5, MaxWords=18, MaxFragments=2') AS snippet,
				COALESCE(cat.name, subcat.name) AS section
			FROM documents doc
			LEFT JOIN document_categories cat ON cat.id = doc.category_id
			LEFT JOIN document_categories subcat ON subcat.id = doc.subcategory_id
			CROSS JOIN search_q
			WHERE doc."isPublished" = true
				AND to_tsvector('russian', COALESCE(doc.title, '') || ' ' || COALESCE(cat.name, '') || ' ' || COALESCE(subcat.name, '')) @@ search_q.query
		`
	}

	private librarySubquery(): string {
		return `
			SELECT
				'library'::text AS type,
				item.id::text AS id,
				COALESCE(page.title, item.title) AS title,
				CASE
					WHEN item.type = 'article' THEN '/' || 'articles/' || regexp_replace(page.slug, '^library/', '')
					ELSE '/' || 'library/' || item.id::text
				END AS url,
				item."previewImage" AS preview_image,
				COALESCE(page."publishedAt", item."createdAt") AS published_at,
				ts_rank_cd(
					to_tsvector('russian', COALESCE(item.title, '') || ' ' || COALESCE(item.description, '') || ' ' || COALESCE(cat.name, '') || ' ' || COALESCE(page.title, '') || ' ' || COALESCE(pt.body, '')),
					search_q.query
				) AS rank,
				ts_headline('russian', COALESCE(item.title, '') || ' ' || COALESCE(item.description, '') || ' ' || COALESCE(cat.name, '') || ' ' || COALESCE(page.title, '') || ' ' || COALESCE(pt.body, ''), search_q.query, 'StartSel=<mark>, StopSel=</mark>, MinWords=5, MaxWords=18, MaxFragments=2') AS snippet
			FROM library_items item
			LEFT JOIN library_categories cat ON cat.id = item."categoryId"
			LEFT JOIN "page" page ON page.id = item."pageId"
			LEFT JOIN page_text pt ON pt.page_id = page.id
			CROSS JOIN search_q
			WHERE item.isPublished = true
				AND (
					item.type != 'article'
					OR (page."isDraft" = false AND page."publishedAt" IS NOT NULL AND page."publishedAt" <= NOW())
				)
				AND to_tsvector('russian', COALESCE(item.title, '') || ' ' || COALESCE(item.description, '') || ' ' || COALESCE(cat.name, '') || ' ' || COALESCE(page.title, '') || ' ' || COALESCE(pt.body, '')) @@ search_q.query
		`
	}

	private eventsSubquery(): string {
		return `
			SELECT
				'event'::text AS type,
				event.id::text AS id,
				event.title AS title,
				'/' || 'events/' || event.id::text AS url,
				event."previewImageUrl" AS preview_image,
				event."createdAt" AS published_at,
				ts_rank_cd(
					to_tsvector('russian', COALESCE(event.title, '') || ' ' || COALESCE(event.description, '') || ' ' || COALESCE(event.address, '') || ' ' || COALESCE(event."detailedAddress", '') || ' ' || COALESCE(event."registrationUrl", '') || ' ' || COALESCE(event.schedule::text, '') || ' ' || COALESCE(event.faq::text, '')),
					search_q.query
				) AS rank,
				ts_headline('russian', COALESCE(event.title, '') || ' ' || COALESCE(event.description, '') || ' ' || COALESCE(event.address, '') || ' ' || COALESCE(event."detailedAddress", '') || ' ' || COALESCE(event.schedule::text, '') || ' ' || COALESCE(event.faq::text, ''), search_q.query, 'StartSel=<mark>, StopSel=</mark>, MinWords=5, MaxWords=18, MaxFragments=2') AS snippet
			FROM events event
			CROSS JOIN search_q
			WHERE event."isPublished" = true
				AND to_tsvector('russian', COALESCE(event.title, '') || ' ' || COALESCE(event.description, '') || ' ' || COALESCE(event.address, '') || ' ' || COALESCE(event."detailedAddress", '') || ' ' || COALESCE(event."registrationUrl", '') || ' ' || COALESCE(event.schedule::text, '') || ' ' || COALESCE(event.faq::text, '')) @@ search_q.query
		`
	}
}
