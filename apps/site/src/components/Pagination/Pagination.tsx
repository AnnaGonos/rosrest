import './Pagination.css'

interface PaginationProps {
    currentPage: number
    totalPages: number
    onPageChange: (page: number) => void
}

type PaginationItem = number | 'ellipsis'

const buildPagination = (page: number, total: number): PaginationItem[] => {
    if (total <= 6) {
        return Array.from({ length: total }, (_, idx) => idx + 1)
    }

    const pages = new Set<number>()
    
    pages.add(1)
    if (total >= 1) pages.add(1)
    
    for (let i = Math.max(1, page - 2); i <= Math.min(total, page + 2); i += 1) {
        pages.add(i)
    }
    
    if (total >= 1) pages.add(total)
    pages.add(total)

    const sorted = Array.from(pages).filter(p => p >= 1 && p <= total).sort((a, b) => a - b)
    const result: PaginationItem[] = []

    for (let i = 0; i < sorted.length; i += 1) {
        const current = sorted[i]
        const prev = sorted[i - 1]
        if (i > 0 && current - prev > 1) {
            result.push('ellipsis')
        }
        result.push(current)
    }

    return result
}

export default function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
    if (totalPages <= 1) return null

    const paginationItems = buildPagination(currentPage, totalPages)

    const handlePageClick = (page: number) => {
        if (page === currentPage) return
        onPageChange(page)
    }

    return (
        <div className="pagination">
            {paginationItems.map((item, index) =>
                item === 'ellipsis' ? (
                    <span key={`ellipsis-${index}`} className="pagination__ellipsis">...</span>
                ) : (
                    <button
                        key={item}
                        type="button"
                        className={`pagination__item ${item === currentPage ? 'is-active' : ''}`}
                        onClick={() => handlePageClick(item)}
                    >
                        {item}
                    </button>
                )
            )}
        </div>
    )
}
