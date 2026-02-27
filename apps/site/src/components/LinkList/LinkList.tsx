import { ArrowButton } from '../LinkButtons';
import './LinkList.css'
import { Link as RouterLink } from 'react-router-dom'

interface LinkItem {
  label: string
  href: string
}

interface LinkListProps {
  items: LinkItem[],
  variant?: 'default' | 'primary-icon';
}

export default function LinkList({ items, variant = 'default' }: LinkListProps) {
  if (variant === 'default') {
    return (
      <nav className="link-list" aria-label="Page links">
        <ul className="link-list__list">
          {items.map((it, idx) => (
            <li key={idx} className="link-list__item">
              {it.href.startsWith('/') ? (
                <RouterLink to={it.href} className="link-list__link">
                  {it.label}
                </RouterLink>
              ) : (
                <a href={it.href} className="link-list__link" target="_blank" rel="noopener noreferrer">
                  {it.label}
                </a>
              )}
            </li>
          ))}
        </ul>
      </nav>
    )
  } else if (variant === 'primary-icon') {
    return (
      <nav className="link-list link-list--primary" aria-label="Page links">
        <ul className="link-list__list link-list__list--primary">
          {items.map((it, idx) => (
            <li key={idx} className="link-list__item link-list__item--primary">
              <RouterLink to={it.href} className="link-list__link link-list__link--primary">
                <span className='section-title--sm'>{it.label}
                </span>
                <ArrowButton href={it.href}></ArrowButton>
              </RouterLink>
            </li>
          ))}
        </ul>
      </nav>
    )
  }
}
