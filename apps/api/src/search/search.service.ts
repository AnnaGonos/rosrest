import { Injectable, Logger } from '@nestjs/common'
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
	total_count?: string | number | null
}

@Injectable()
export class SearchService {
	private readonly logger = new Logger(SearchService.name)

	constructor(private readonly dataSource: DataSource) {}

	async search(
		query: string,
		scope: SearchScope = 'all',
		page = 1,
		pageSize = 12,
	): Promise<{ query: string; scope: SearchScope; page: number; pageSize: number; total: number; totalPages: number; items: SearchResultItem[] }> {
		const normalizedQuery = query.trim().replace(/\s+/g, ' ')
		if (normalizedQuery.length < 2) {
			return { query: normalizedQuery, scope, page: 1, pageSize, total: 0, totalPages: 0, items: [] }
		}

		const safePage = Math.max(1, Math.floor(Number(page) || 1))
		const safePageSize = Math.max(1, Math.min(Math.floor(Number(pageSize) || 12), 24))
		const scopes = this.getScopes(scope)

		if (scopes.length === 0) {
			return { query: normalizedQuery, scope, page: safePage, pageSize: safePageSize, total: 0, totalPages: 0, items: [] }
		}

		const allRows = await Promise.all(
			scopes.map(async (currentScope) => this.runScopeQuery(currentScope, normalizedQuery, safePage * safePageSize)),
		)

		const rows = allRows.flat()
		const total = allRows.reduce((sum, scopeRows) => {
			const scopeTotal = Number(scopeRows[0]?.total_count || 0)
			return sum + (Number.isFinite(scopeTotal) ? scopeTotal : 0)
		}, 0)
		const items = rows
			.map((row) => ({
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
			.sort((a, b) => {
				const aTime = a.publishedAt ? new Date(a.publishedAt).getTime() : 0
				const bTime = b.publishedAt ? new Date(b.publishedAt).getTime() : 0
				if (bTime !== aTime) return bTime - aTime
				if (b.rank !== a.rank) return b.rank - a.rank
				return a.title.localeCompare(b.title)
			})

		const totalPages = total > 0 ? Math.ceil(total / safePageSize) : 0
		const resolvedPage = totalPages > 0 ? Math.min(safePage, totalPages) : 1
		const offset = (resolvedPage - 1) * safePageSize
		const pageItems = items.slice(offset, offset + safePageSize)

		return {
			query: normalizedQuery,
			scope,
			page: resolvedPage,
			pageSize: safePageSize,
			total,
			totalPages,
			items: pageItems,
		}
	}

	private async runScopeQuery(scope: Exclude<SearchScope, 'all'>, query: string, limit: number): Promise<RawSearchRow[]> {
		const subquery = this.getScopeSubquery(scope)

		const sql = `
			WITH RECURSIVE block_tree AS (
				SELECT
					b.id,
					b."pageId" AS page_id,
					regexp_replace(COALESCE(b.content ->> 'html', b.content::text, ''), '<[^>]+>', ' ', 'g') AS body,
					b."parentBlockId"
				FROM "block" b
				WHERE b."pageId" IS NOT NULL
					AND b."parentBlockId" IS NULL

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
				SELECT
					plainto_tsquery('russian', $1) AS query,
					$1::text AS raw_query
			)
			SELECT *
			FROM (
				SELECT
					results.*,
					COUNT(*) OVER() AS total_count
				FROM (
					${subquery}
				) results
			) results
			ORDER BY published_at DESC NULLS LAST, rank DESC, title ASC
			LIMIT $2
		`

		try {
			return await this.dataSource.query(sql, [query, limit]) as RawSearchRow[]
		} catch (error) {
				this.logger.error(
					`Search query failed. q="${query}", scope="${scope}", limit=${limit}`,
				error instanceof Error ? error.stack : String(error),
			)
			return []
		}
	}

	private getScopes(scope: SearchScope): Array<Exclude<SearchScope, 'all'>> {
		if (scope === 'all') {
			return ['news', 'projects', 'events', 'services', 'members', 'monitoring-zakon', 'documents', 'library', 'pages', 'for-journalist']
		}

		return [scope]
	}

	private getScopeSubquery(scope: Exclude<SearchScope, 'all'>): string {
		switch (scope) {
			case 'news':
				return this.newsSubquery()
			case 'projects':
				return this.projectsSubquery()
			case 'events':
				return this.eventsSubquery()
			case 'services':
				return this.servicesSubquery()
			case 'members':
				return this.membersSubquery()
			case 'monitoring-zakon':
				return this.monitoringZakonSubquery()
			case 'documents':
				return this.documentsSubquery()
			case 'library':
				return this.librarySubquery()
			case 'pages':
				return this.pagesSubquery()
			case 'for-journalist':
				return this.forJournalistSubquery()
		}
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
				${this.pageHeadlineExpression('page')} AS snippet,
				NULL::text AS section${extraSelect ? `,
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

	private monitoringZakonSubquery(): string {
		return this.pageEntitySql({
			type: 'monitoring-zakon',
			entityTable: 'monitoring_zakon',
			entityAlias: 'mz',
			joinPageCondition: 'page.id = mz."pageId"',
			urlExpression: `'/' || 'monitoring-zakon/' || regexp_replace(page.slug, '^monitoring-zakon/', '')`,
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
				'content-page'::text AS type,
				page.id::text AS id,
				page.title AS title,
				'/' || page.slug AS url,
				NULL::text AS preview_image,
				page."publishedAt" AS published_at,
				ts_rank_cd(to_tsvector('russian', COALESCE(page.title, '') || ' ' || COALESCE(page.slug, '') || ' ' || COALESCE(pt.body, '')), search_q.query) AS rank,
				ts_headline('russian', COALESCE(page.title, '') || ' ' || COALESCE(page.slug, '') || ' ' || COALESCE(pt.body, ''), search_q.query, 'StartSel=<mark>, StopSel=</mark>, MinWords=5, MaxWords=18, MaxFragments=2') AS snippet,
				NULL::text AS section
			FROM "page" page
			LEFT JOIN page_text pt ON pt.page_id = page.id
			CROSS JOIN search_q
			WHERE page."isDraft" = false
				AND page."publishedAt" IS NOT NULL
				AND page."publishedAt" <= NOW()
				AND NOT EXISTS (SELECT 1 FROM news n WHERE n."pageId" = page.id)
				AND NOT EXISTS (SELECT 1 FROM projects p WHERE p."pageId" = page.id)
				AND NOT EXISTS (SELECT 1 FROM services s WHERE s."pageId" = page.id)
				AND NOT EXISTS (SELECT 1 FROM rar_members rm WHERE rm."pageId" = page.id)
				AND NOT EXISTS (SELECT 1 FROM library_items li WHERE li."pageId" = page.id)
				AND NOT EXISTS (SELECT 1 FROM for_journalist fj WHERE fj."pageId" = page.id)
				AND NOT EXISTS (SELECT 1 FROM monitoring_zakon mz WHERE mz."pageId" = page.id)
				AND page.slug NOT LIKE 'news/%'
				AND page.slug NOT LIKE 'projects/%'
				AND page.slug NOT LIKE 'services/%'
				AND page.slug NOT LIKE 'portfolio/%'
				AND page.slug NOT LIKE 'library/%'
				AND page.slug NOT LIKE 'monitoring-zakon/%'
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
					WHEN item.type = 'article' AND page.slug IS NOT NULL THEN '/' || 'articles/' || regexp_replace(page.slug, '^library/', '')
					WHEN item.type = 'article' THEN '/' || 'library/' || item.id::text
					ELSE '/' || 'library/' || item.id::text
				END AS url,
				item."previewImage" AS preview_image,
				COALESCE(page."publishedAt", item."createdAt") AS published_at,
				ts_rank_cd(
					setweight(to_tsvector('russian', COALESCE(item.title, '')), 'A') ||
					setweight(to_tsvector('russian', COALESCE(item.description, '')), 'B') ||
					setweight(to_tsvector('russian', COALESCE(cat.name, '')), 'B') ||
					setweight(to_tsvector('russian', COALESCE(page.title, '')), 'A') ||
					setweight(to_tsvector('russian', COALESCE(pt.body, '')), 'C'),
					search_q.query
				) AS rank,
				ts_headline('russian', COALESCE(item.title, '') || ' ' || COALESCE(item.description, '') || ' ' || COALESCE(cat.name, '') || ' ' || COALESCE(page.title, '') || ' ' || COALESCE(pt.body, ''), search_q.query, 'StartSel=<mark>, StopSel=</mark>, MinWords=5, MaxWords=18, MaxFragments=2') AS snippet,
				NULL::text AS section
			FROM library_items item
			LEFT JOIN library_categories cat ON cat.id = item."categoryId"
			LEFT JOIN "page" page ON page.id = item."pageId"
			LEFT JOIN page_text pt ON pt.page_id = page.id
			CROSS JOIN search_q
			WHERE item.isPublished = true
				AND (
					item.type != 'article'
					OR (
						page.id IS NOT NULL
						AND page.slug IS NOT NULL
						AND page."isDraft" = false
						AND page."publishedAt" IS NOT NULL
						AND page."publishedAt" <= NOW()
					)
				)
				AND (
					(
						to_tsvector('russian', COALESCE(item.title, '')) ||
						to_tsvector('russian', COALESCE(item.description, '')) ||
						to_tsvector('russian', COALESCE(cat.name, '')) ||
						to_tsvector('russian', COALESCE(page.title, '')) ||
						to_tsvector('russian', COALESCE(pt.body, ''))
					) @@ search_q.query
					OR COALESCE(item.title, '') ILIKE '%' || search_q.raw_query || '%'
					OR COALESCE(item.description, '') ILIKE '%' || search_q.raw_query || '%'
					OR COALESCE(cat.name, '') ILIKE '%' || search_q.raw_query || '%'
					OR COALESCE(page.title, '') ILIKE '%' || search_q.raw_query || '%'
					OR COALESCE(pt.body, '') ILIKE '%' || search_q.raw_query || '%'
				)
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
				ts_headline('russian', COALESCE(event.title, '') || ' ' || COALESCE(event.description, '') || ' ' || COALESCE(event.address, '') || ' ' || COALESCE(event."detailedAddress", '') || ' ' || COALESCE(event.schedule::text, '') || ' ' || COALESCE(event.faq::text, ''), search_q.query, 'StartSel=<mark>, StopSel=</mark>, MinWords=5, MaxWords=18, MaxFragments=2') AS snippet,
				NULL::text AS section
			FROM events event
			CROSS JOIN search_q
			WHERE event."isPublished" = true
				AND to_tsvector('russian', COALESCE(event.title, '') || ' ' || COALESCE(event.description, '') || ' ' || COALESCE(event.address, '') || ' ' || COALESCE(event."detailedAddress", '') || ' ' || COALESCE(event."registrationUrl", '') || ' ' || COALESCE(event.schedule::text, '') || ' ' || COALESCE(event.faq::text, '')) @@ search_q.query
		`
	}
}
