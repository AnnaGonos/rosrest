import { useEffect, useState } from 'react'
import DocumentList from '../DocumentList/DocumentList'
import './CategoryAccordion.css'

type Document = {
  id: string | number
  name?: string
  title?: string
  fileName?: string
  fileSize?: number
  uploadedAt?: string
  createdAt?: string
  orderIndex?: number | null
}

type Subcategory = {
  id: number
  name: string
}

interface CategoryAccordionProps {
  subcategories: Subcategory[]
  getDocuments: (categoryId: number) => Document[]
  loadingMap: { [key: number]: boolean }
  errorMap: { [key: number]: string | null }
}

export default function CategoryAccordion({ subcategories, getDocuments, loadingMap, errorMap }: CategoryAccordionProps) {
  const [expandedIds, setExpandedIds] = useState<number[]>([])

  useEffect(() => {
    setExpandedIds(subcategories.map((subcategory) => subcategory.id))
  }, [subcategories])

  const toggleExpand = (categoryId: number) => {
    setExpandedIds((current) =>
      current.includes(categoryId)
        ? current.filter((id) => id !== categoryId)
        : [...current, categoryId]
    )
  }

  return (
    <div className="category-accordion">
      {subcategories.map((subcat) => {
        const isExpanded = expandedIds.includes(subcat.id)
        const docs = [...getDocuments(subcat.id)].sort((a, b) => {
          const aOrder = a.orderIndex ?? Number.MAX_SAFE_INTEGER
          const bOrder = b.orderIndex ?? Number.MAX_SAFE_INTEGER
          if (aOrder !== bOrder) return bOrder - aOrder

          const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0
          const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0
          if (aTime !== bTime) return bTime - aTime

          return String(b.id).localeCompare(String(a.id))
        })
        const loading = loadingMap[subcat.id] || false
        const error = errorMap[subcat.id] || null

        return (
          <div key={subcat.id} className="accordion-item">
            <button
              className={`accordion-header ${isExpanded ? 'expanded' : ''}`}
              onClick={() => toggleExpand(subcat.id)}
              aria-expanded={isExpanded}
            >
              <span className="accordion-icon">
                <i className={`bi bi-chevron-${isExpanded ? 'down' : 'right'}`} />
              </span>
              <span className="accordion-title card-contact">{subcat.name}</span>
            </button>
            {isExpanded && (
              <div className="accordion-content">
                <DocumentList
                  items={docs.map((doc) => ({
                    ...doc,
                    title: doc.title || doc.name || 'Без названия документа',
                    id: String(doc.id),
                  }))}
                  loading={loading}
                  error={error}
                  emptyMessage={`Документы в "${subcat.name}" не найдены.`}
                />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
