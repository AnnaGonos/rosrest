import { useEffect, useState } from 'react'
import { BlocksRenderer } from '../../components/BlocksRenderer'
import { useParams } from 'react-router-dom'
import Breadcrumbs from '../../components/Breadcrumbs/Breadcrumbs'
import ContentSection from '../../components/ContentSection/ContentSection'
import DocumentList from '../../components/DocumentList/DocumentList'
import CategoryAccordion from '../../components/CategoryAccordion/CategoryAccordion'
import { BackToSectionButton } from '../../components/LinkButtons'
import Seo from '../../components/Seo/Seo'

const API_BASE = (import.meta.env.VITE_API_URL as string) || 'http://localhost:3002'

type Category = {
  id: number
  name: string
  slug?: string | null
  icon?: string | null
  children?: Category[]
}

type DocumentItem = {
  id: string
  title: string
  fileUrl?: string | null
  previewUrl?: string | null
  createdAt?: string
  subcategory?: { id: number } | null
  orderIndex?: number | null
}

export default function DocumentCategoryPage() {
  const { slug } = useParams<{ slug?: string }>()
  const [tree, setTree] = useState<Category[]>([])
  const [category, setCategory] = useState<Category | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [documents, setDocuments] = useState<DocumentItem[]>([])
  const [docsLoading, setDocsLoading] = useState(true)
  const [subcategoryDocs, setSubcategoryDocs] = useState<{ [key: string]: DocumentItem[] }>({})

  useEffect(() => {
    let mounted = true
    setLoading(true)
    fetch(`${API_BASE}/document-categories/tree`, { cache: 'no-store' })
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() })
      .then((data: Category[]) => { if (mounted) setTree(data || []) })
      .catch((err) => { if (mounted) setError(String(err)) })
      .finally(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  }, [slug])

  useEffect(() => {
    if (!tree || tree.length === 0) return
    const find = (nodes: Category[], value?: string): Category | null => {
      for (const n of nodes) {
        if (!value) continue
        if (String(n.id) === value || (n.slug && n.slug === value)) return n
        if (n.children && n.children.length) {
          const found = find(n.children, value)
          if (found) return found
        }
      }
      return null
    }
    const found = find(tree, slug)
    setCategory(found)
  }, [tree, slug])

  useEffect(() => {
    if (!category) return
    let mounted = true
    setDocsLoading(true)
    fetch(`${API_BASE}/documents?type=documents&categoryId=${category.id}&isPublished=true`, { cache: 'no-store' })
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() })
      .then((data: DocumentItem[]) => {
        if (mounted) {
          const allDocs = Array.isArray(data) ? data : []
          const sortedDocs = [...allDocs].sort((a, b) => {
            const aOrder = a.orderIndex ?? Number.MAX_SAFE_INTEGER
            const bOrder = b.orderIndex ?? Number.MAX_SAFE_INTEGER
            if (aOrder !== bOrder) return bOrder - aOrder

            const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0
            const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0
            if (aTime !== bTime) return bTime - aTime

            return String(b.id).localeCompare(String(a.id))
          })

          setDocuments(sortedDocs)

          const grouped: { [key: string]: DocumentItem[] } = {}
          if (category.children) {
            category.children.forEach((subcat) => {
              grouped[subcat.id] = []
            })
          }

          sortedDocs.forEach((doc: DocumentItem) => {
            if (doc.subcategory && doc.subcategory.id in grouped) {
              grouped[doc.subcategory.id].push(doc)
            } else if (!doc.subcategory) {
              if (!grouped["null"]) grouped["null"] = []
              grouped["null"].push(doc)
            }
          })

          setSubcategoryDocs(grouped)
        }
      })
      .catch((err) => { if (mounted) setError(String(err)) })
      .finally(() => { if (mounted) setDocsLoading(false) })
    return () => { mounted = false }
  }, [category])

  if (loading) return <div>Загрузка...</div>
  if (!category) return <div className="page-main">Категория не найдена</div>

  const hasBlocks = Array.isArray((category as any).blocks) && (category as any).blocks.length > 0


  const hasSubcategories = category.children && category.children.length > 0
  const hasDirectDocuments = documents.some(doc => !doc.subcategory)

  return (
    <div className="page-main documents-page">
      <Seo
        title={`${category.name} - Документы Российской ассоциации реставраторов`}
        description={`Документы в категории «${category.name}» Российской ассоциации реставраторов.`}
        canonical={`https://rosrest.com/documents/${category.slug || category.id}`}
        url={`https://rosrest.com/documents/${category.slug || category.id}`}
      />
      <div className="page__header">
        <Breadcrumbs items={[{ label: 'Главная', to: '/' }, { label: 'Документы', to: '/documents' }, { label: category.name, isCurrent: true }]} />
      </div>

      <div className="page__container page__container--27">
        <div style={{ display: 'flex', alignItems: 'start', gap: '20px', marginBottom: '80px', marginTop: '-30px' }}>
          <BackToSectionButton to="/documents" label="К разделу Документы" />
          <h1 className="page-title">{category.name}</h1>
        </div>

        {hasBlocks && (
          <div style={{ marginBottom: 40 }}>
            <BlocksRenderer blocks={(category as any).blocks} />
          </div>
        )}
        

        {hasSubcategories ? (
          <ContentSection columns={1}>
            {hasDirectDocuments && (
              <div style={{ marginBottom: '10px', paddingBottom: '10px', borderBottom: '1px solid #eee' }}>
                <DocumentList items={subcategoryDocs["null"] || []} loading={docsLoading} error={error} emptyMessage="Документы не найдены." />
              </div>
            )}
            <CategoryAccordion
              subcategories={category.children || []}
              getDocuments={(catId) => subcategoryDocs[catId] || []}
              loadingMap={{}}
              errorMap={{}}
            />
          </ContentSection>
        ) : (
          <>
            {category.slug !== 'istoricheskie-poselenija' && (
              <ContentSection columns={1}>
                <DocumentList items={documents} loading={docsLoading} error={error} emptyMessage="Документы не найдены." />

              </ContentSection>
            )}
          </>
        )}
      </div>
    </div>
  )
}
