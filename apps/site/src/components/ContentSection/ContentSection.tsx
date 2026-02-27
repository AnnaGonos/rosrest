import React from 'react'
import './ContentSection.css'

interface ContentSectionProps<T = any> {
  columns?: 1 | 2 | 3 | 4 | 5 | 6
  children?: React.ReactNode
  className?: string
  header?: React.ReactNode
  footer?: React.ReactNode
  items?: T[]
  renderItem?: (item: T, index: number) => React.ReactNode
}

export default function ContentSection<T = any>({
  columns = 1,
  children,
  className = '',
  items,
  renderItem,
}: ContentSectionProps<T>) {
  const body =
    items && renderItem
      ? items.map((it, i) => (
          <div key={i} className="content-section__item">
            {renderItem(it, i)}
          </div>
        ))
      : React.Children.toArray(children).map((child, i) => (
          <div key={i} className="content-section__item">
            {child as React.ReactNode}
          </div>
        ))

  return (
    <div className={`content-section columns-${columns} ${className}`.trim()}>
      {body}
    </div>
  )
}
