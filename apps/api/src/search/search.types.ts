export type SearchScope =
	| 'all'
	| 'news'
	| 'projects'
	| 'events'
	| 'services'
	| 'members'
	| 'monitoring-zakon'
	| 'documents'
	| 'library'
	| 'pages'
	| 'for-journalist'

export type SearchResultType =
	| 'news'
	| 'project'
	| 'event'
	| 'service'
	| 'member'
	| 'monitoring-zakon'
	| 'document'
	| 'library'
	| 'page'
	| 'for-journalist'

export interface SearchResultItem {
	type: SearchResultType
	id: string
	title: string
	url: string
	previewImage?: string | null
	snippet: string
	publishedAt: string | null
	rank: number
	section?: string | null
}
