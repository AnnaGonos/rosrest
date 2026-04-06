import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Breadcrumbs from '../../components/Breadcrumbs/Breadcrumbs'
import ContentSection from '../../components/ContentSection/ContentSection'
import { BackToSectionButton } from '../../components/LinkButtons'
import Pagination from '../../components/Pagination/Pagination'
import RequestState from '../../components/RequestState/RequestState'
import SearchTypeSearchBar from '../../components/SearchTypeSearchBar/SearchTypeSearchBar'
import Seo from '../../components/Seo/Seo'
import { getFileUrl } from '../../utils/getFileUrl'
import './SearchPage.css'

const API_BASE = (import.meta.env.VITE_API_URL as string) || 'http://localhost:3002'

type SearchScope = 'all' | 'news' | 'projects' | 'events' | 'services' | 'members' | 'monitoring-zakon' | 'documents' | 'library' | 'pages' | 'for-journalist'

type SearchResultItem = {
	type: Exclude<SearchScope, 'all'>
	id: string
	title: string
	url: string
	previewImage?: string | null
	snippet: string
	publishedAt?: string | null
	rank?: number
	section?: string | null
}

type SearchResponse = {
	query: string
	scope: SearchScope
	page: number
	pageSize: number
	total: number
	totalPages: number
	items: SearchResultItem[]
}

const FILTERS: Array<{ value: SearchScope; label: string }> = [
	{ value: 'all', label: 'Все' },
	{ value: 'news', label: 'Новости' },
	{ value: 'projects', label: 'Проекты' },
	{ value: 'events', label: 'События' },
	{ value: 'services', label: 'Услуги' },
	{ value: 'members', label: 'Члены РАР' },
	{ value: 'monitoring-zakon', label: 'Мониторинг законодательства' },
	{ value: 'documents', label: 'Документы' },
	{ value: 'library', label: 'Библиотека' },
	{ value: 'pages', label: 'Страницы' },
	{ value: 'for-journalist', label: 'Журналистам' },
]

const TYPE_LABELS: Record<string, string> = {
	news: 'Новость',
	project: 'Проект',
	event: 'Событие',
	service: 'Услуга',
	member: 'Член РАР',
	'monitoring-zakon': 'Мониторинг законодательства',
	document: 'Документ',
	library: 'Библиотека',
	page: 'Страница',
	'for-journalist': 'Журналистам',
}

const DATE_FORMAT = new Intl.DateTimeFormat('ru-RU', {
	day: '2-digit',
	month: 'long',
	year: 'numeric',
})

const isExternalUrl = (url: string) => /^https?:\/\//i.test(url)

export default function SearchPage() {
	const [searchParams, setSearchParams] = useSearchParams()
	const [queryInput, setQueryInput] = useState(searchParams.get('q') || '')
	const query = useMemo(() => (searchParams.get('q') || '').trim(), [searchParams])
	const currentPage = useMemo(() => {
		const raw = Number(searchParams.get('page') || '1')
		return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : 1
	}, [searchParams])
	const scope = useMemo<SearchScope>(() => {
		const value = searchParams.get('type') as SearchScope | null
		return value && FILTERS.some((item) => item.value === value) ? value : 'all'
	}, [searchParams])
	const pageSize = 12

	const [results, setResults] = useState<SearchResultItem[]>([])
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [totalPages, setTotalPages] = useState(0)
	const [totalResults, setTotalResults] = useState(0)
	const effectivePage = totalPages > 0 ? Math.min(currentPage, totalPages) : currentPage

	useEffect(() => {
		setQueryInput(searchParams.get('q') || '')
	}, [searchParams])

	useEffect(() => {
		if (!query) {
			setResults([])
			setTotalPages(0)
			setTotalResults(0)
			setError(null)
			setLoading(false)
			return
		}

		const controller = new AbortController()
		let active = true

		const loadResults = async () => {
			setLoading(true)
			setError(null)

			try {
				const params = new URLSearchParams({ q: query, type: scope, page: String(currentPage), pageSize: String(pageSize) })
				const response = await fetch(`${API_BASE}/search?${params.toString()}`, {
					signal: controller.signal,
					cache: 'no-store',
				})

				if (!response.ok) {
					throw new Error(`Ошибка поиска (HTTP ${response.status})`)
				}

				const data = (await response.json()) as SearchResponse
				if (active) {
					setResults(Array.isArray(data.items) ? data.items : [])
					setTotalPages(Number(data.totalPages || 0))
					setTotalResults(Number(data.total || 0))
				}
			} catch (err) {
				if (!active || controller.signal.aborted) return
				setError(err instanceof Error ? err.message : 'Неизвестная ошибка')
			} finally {
				if (active) setLoading(false)
			}
		}

		loadResults()

		return () => {
			active = false
			controller.abort()
		}
	}, [query, scope, currentPage])

	const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault()
		const nextParams: Record<string, string> = {}
		const trimmed = queryInput.trim()
		if (trimmed) nextParams.q = trimmed
		if (scope !== 'all') nextParams.type = scope
		nextParams.page = '1'
		setSearchParams(nextParams)
	}

	const handleScopeChange = (value: SearchScope) => {
		const nextParams: Record<string, string> = {}
		const trimmed = queryInput.trim() || query
		if (trimmed) nextParams.q = trimmed
		if (value !== 'all') nextParams.type = value
		nextParams.page = '1'
		setSearchParams(nextParams)
	}

	const handlePageChange = (page: number) => {
		const nextParams: Record<string, string> = { page: String(page) }
		const trimmed = queryInput.trim() || query
		if (trimmed) nextParams.q = trimmed
		if (scope !== 'all') nextParams.type = scope
		setSearchParams(nextParams)
	}

	const showLoadingState = loading && query.length > 0

	return (
		<div className="page-main search-page">
			<Seo
				title={query ? `Поиск: ${query}` : 'Поиск по сайту'}
				description="Поиск по новостям, проектам, событиям, документам, членам РАР и страницам сайта."
				canonical={window.location.origin + '/search'}
				url={window.location.origin + '/search'}
			/>

			<div className="page__header">
				<Breadcrumbs items={[{ label: 'Главная', to: '/' }, { label: 'Поиск', isCurrent: true }]} />
			</div>

			<div className="page__container page__container--27">
				<div className="page__header-title search-page__hero">
					<BackToSectionButton to="/" label="На главную" />
					<div>
						<h1 className="page-title">Поиск по сайту</h1>
						<p className="body-text search-page__subtitle">
							Ищите по новостям, событиям, проектам, документам, членам РАР и другим страницам сайта.
						</p>
					</div>
				</div>

				<SearchTypeSearchBar
					query={queryInput}
					onQueryChange={setQueryInput}
					selectedType={scope}
					onTypeChange={handleScopeChange}
					options={FILTERS.filter((filter) => filter.value !== 'all')}
					onSubmit={handleSubmit}
					placeholder="Например: конференция"
					submitLabel="Поиск"
					allLabel="Все"
				/>

				{!query && (
					<ContentSection columns={1}>
						<div className="search-page__empty-state">
							<p className="body-text">
								Введите запрос, например <strong>конференция</strong>, и мы покажем совпадения по всему сайту.
							</p>
						</div>
					</ContentSection>
				)}

				{query && (
					<ContentSection columns={1}>
						<div className="search-page__results-head">
							<h2 className="section-title--lg">Результаты</h2>
							<p className="body-text search-page__count">
								Найдено: {totalResults}
							</p>
						</div>

						{(showLoadingState || error) && (
							<RequestState loading={showLoadingState} error={error} loadingText="Поиск по сайту..." />
						)}

						{!showLoadingState && !error && results.length === 0 ? (
							<div className="search-page__empty-state">
								<p className="body-text">Ничего не найдено. Попробуйте другой запрос.</p>
							</div>
						) : !showLoadingState && !error ? (
							<div className="search-page__results">
								{results.map((item) => {
									const previewSrc = item.previewImage ? getFileUrl(item.previewImage) : ''
									const content = (
										<>
											<div className={`search-page__thumb-wrap ${previewSrc ? '' : 'search-page__thumb-wrap--empty'}`}>
												{previewSrc && (
													<img className="search-page__thumb" src={previewSrc} alt={item.title} loading="lazy" />
											)}
											</div>
											<div className="search-page__content">
											<div className="search-page__result-meta">
												<span className="search-page__badge">{TYPE_LABELS[item.type] || item.type}</span>
												{item.publishedAt && (
													<time className="search-page__date" dateTime={item.publishedAt}>
														{DATE_FORMAT.format(new Date(item.publishedAt))}
													</time>
												)}
											</div>
											<h3 className="search-page__result-title">{item.title}</h3>
											{item.section && <p className="search-page__section">{item.section}</p>}
											{/* <p className="search-page__link">{item.url}</p> */}
											<p className="search-page__snippet" dangerouslySetInnerHTML={{ __html: item.snippet }} />
											</div>
										</>
									)

									return isExternalUrl(item.url) ? (
										<a key={`${item.type}-${item.id}`} href={item.url} className="search-page__result" target="_blank" rel="noopener noreferrer">
											{content}
										</a>
									) : (
										<Link key={`${item.type}-${item.id}`} to={item.url} className="search-page__result">
											{content}
										</Link>
									)
								})}
							</div>
						) : null}

						<Pagination currentPage={effectivePage} totalPages={totalPages} onPageChange={handlePageChange} />
					</ContentSection>
				)}
			</div>
		</div>
	)
}
