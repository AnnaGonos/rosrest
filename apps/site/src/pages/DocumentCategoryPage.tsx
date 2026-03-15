import { useEffect, useState } from 'react'
import { BlocksRenderer } from '../components/BlocksRenderer'
import { useParams } from 'react-router-dom'
import Breadcrumbs from '../components/Breadcrumbs/Breadcrumbs'
import ContentSection from '../components/ContentSection/ContentSection'
import DocumentList from '../components/DocumentList/DocumentList'
import CategoryAccordion from '../components/CategoryAccordion/CategoryAccordion'
import { BackToSectionButton } from '../components/LinkButtons'

const API_BASE = (import.meta.env.VITE_API_URL as string) || 'http://localhost:3002'

type Category = {
  id: number
  name: string
  slug?: string | null
  icon?: string | null
  children?: Category[]
}

export default function DocumentCategoryPage() {
  const { slug } = useParams<{ slug?: string }>()
  const [tree, setTree] = useState<Category[]>([])
  const [category, setCategory] = useState<Category | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [documents, setDocuments] = useState<any[]>([])
  const [docsLoading, setDocsLoading] = useState(true)
  const [subcategoryDocs, setSubcategoryDocs] = useState<{ [key: string]: any[] }>({})

  useEffect(() => {
    let mounted = true
    setLoading(true)
    fetch(`${API_BASE}/document-categories/tree`)
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
    fetch(`${API_BASE}/documents?type=documents&categoryId=${category.id}&isPublished=true`)
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() })
      .then((data) => {
        if (mounted) {
          const allDocs = data || []
          setDocuments(allDocs)

          const grouped: { [key: string]: any[] } = {}
          if (category.children) {
            category.children.forEach((subcat) => {
              grouped[subcat.id] = []
            })
          }

          allDocs.forEach((doc: any) => {
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
      <div className="page__header">
        <Breadcrumbs items={[{ label: 'Главная', to: '/' }, { label: 'Документы', to: '/documents' }, { label: category.name, isCurrent: true }]} />
      </div>

      <div className="page__container">
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
