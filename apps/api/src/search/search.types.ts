export type SearchScope =
	| 'all'
	| 'news'
	| 'projects'
	| 'events'
	| 'services'
	| 'members'
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
