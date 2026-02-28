import { useState } from 'react'
import DocumentList from '../DocumentList/DocumentList'
import './CategoryAccordion.css'

type Document = {
  id: number
  name: string
  title?: string // добавлено для совместимости с DocItem
  fileName?: string
  fileSize?: number
  uploadedAt?: string
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
  const [expandedId, setExpandedId] = useState<number | null>(subcategories.length > 0 ? subcategories[0].id : null)

  const toggleExpand = (categoryId: number) => {
    setExpandedId(expandedId === categoryId ? null : categoryId)
  }

  return (
    <div className="category-accordion">
      {subcategories.map((subcat) => {
        const isExpanded = expandedId === subcat.id
        const docs = getDocuments(subcat.id)
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
                  items={docs.map((doc) => ({ ...doc, title: doc.title || doc.name, id: String(doc.id) }))}
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
