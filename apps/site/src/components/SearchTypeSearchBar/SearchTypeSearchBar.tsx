import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import './SearchTypeSearchBar.css'

export type SearchTypeSearchBarOption = {
	value: string
	label: string
}

type SearchTypeSearchBarProps = {
	query: string
	onQueryChange: (value: string) => void
	selectedType: string
	onTypeChange: (value: string) => void
	options: SearchTypeSearchBarOption[]
	onSubmit: (event: FormEvent<HTMLFormElement>) => void
	placeholder?: string
	submitLabel?: string
	allLabel?: string
	className?: string
}

export default function SearchTypeSearchBar({
	query,
	onQueryChange,
	selectedType,
	onTypeChange,
	options,
	onSubmit,
	placeholder = 'Например: конференция',
	submitLabel = 'Поиск',
	allLabel = 'Все',
	className = '',
}: SearchTypeSearchBarProps) {
	const [isOpen, setIsOpen] = useState(false)
	const rootRef = useRef<HTMLDivElement | null>(null)

	const selectedOption = useMemo(() => options.find((item) => item.value === selectedType) || options[0], [options, selectedType])

	useEffect(() => {
		const handleDocumentClick = (event: MouseEvent) => {
			if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
				setIsOpen(false)
			}
		}

		const handleEscape = (event: KeyboardEvent) => {
			if (event.key === 'Escape') {
				setIsOpen(false)
			}
		}

		document.addEventListener('mousedown', handleDocumentClick)
		document.addEventListener('keydown', handleEscape)

		return () => {
			document.removeEventListener('mousedown', handleDocumentClick)
			document.removeEventListener('keydown', handleEscape)
		}
	}, [])

	const handleTypeSelect = (value: string) => {
		onTypeChange(value)
		setIsOpen(false)
	}

	return (
		<form className={`search-type-search-bar ${className}`.trim()} onSubmit={onSubmit} ref={rootRef}>
			<div className="search-type-search-bar__type">
				<button
					type="button"
					className="search-type-search-bar__trigger"
					onClick={() => setIsOpen((value) => !value)}
					aria-haspopup="listbox"
					aria-expanded={isOpen}
				>
					<span className="search-type-search-bar__trigger-label">{selectedOption?.label || allLabel}</span>
					<span className="search-type-search-bar__chevron" aria-hidden>
						▾
					</span>
				</button>

				{isOpen && (
					<div className="search-type-search-bar__menu" role="listbox" aria-label="Тип поиска">
						<button
							type="button"
							className={`search-type-search-bar__option ${selectedType === 'all' ? 'is-active' : ''}`}
							onClick={() => handleTypeSelect('all')}
						>
							{allLabel}
						</button>
						{options.map((option) => (
							<button
								key={option.value}
								type="button"
								className={`search-type-search-bar__option ${selectedType === option.value ? 'is-active' : ''}`}
								onClick={() => handleTypeSelect(option.value)}
							>
								{option.label}
							</button>
						))}
					</div>
				)}
			</div>

			<label className="search-type-search-bar__field">
				<span className="search-type-search-bar__label">Что ищем</span>
				<input
					type="search"
					value={query}
					onChange={(event) => onQueryChange(event.currentTarget.value)}
					placeholder={placeholder}
					autoComplete="off"
				/>
			</label>

			<button type="submit" className="search-type-search-bar__submit btn btn-primary">
				{submitLabel}
			</button>
		</form>
	)
}