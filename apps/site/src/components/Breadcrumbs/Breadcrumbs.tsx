import { Link } from 'react-router-dom'
import './Breadcrumbs.css'

export type BreadcrumbItem = {
    label: string
    to?: string
    isCurrent?: boolean
}

export default function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
    return (
        <nav className="breadcrumbs" aria-label="breadcrumb">
            <ol className="breadcrumbs__list">
                {items.map((item, index) => {
                    const isLast = index === items.length - 1
                    const isCurrent = item.isCurrent || isLast

                    return (
                        <li key={index} className="breadcrumbs__item">
                            {isCurrent || !item.to ? (
                                <span className="breadcrumbs__current" aria-current="page">{item.label}</span>
                            ) : (
                                <Link to={item.to} className="breadcrumbs__link">
                                    {item.label}
                                </Link>
                            )}
                            {!isLast && <span className="breadcrumbs__separator">/</span>}
                        </li>
                    )
                })}
            </ol>
        </nav>
    )
}
