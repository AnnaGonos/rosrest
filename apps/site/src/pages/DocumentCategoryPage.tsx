import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import Breadcrumbs from '../components/Breadcrumbs/Breadcrumbs'
import ContentSection from '../components/ContentSection/ContentSection'
import DocumentList from '../components/DocumentList/DocumentList'
import CategoryAccordion from '../components/CategoryAccordion/CategoryAccordion'
import EmployeeCard from '../components/EmployeeCard/EmployeeCard'
import { BackToSectionButton } from '../components/LinkButtons'
import InfoBanner from '../components/InfoBanner/InfoBanner'

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

  const resolveImage = (raw?: string | null) => {
    if (!raw) return undefined
    if (raw.startsWith('http://') || raw.startsWith('https://')) return raw
    return raw.startsWith('/') ? `${API_BASE}${raw}` : raw
  }

  const sampleEmployee = {
    id: '1',
    fullName: 'Мария Ткаченко',
    position: 'Юрисконсульт',
    email: 'info.rosrest@mail.ru',
    photoUrl: '/1-86-e1744920434831-350x350.jpg',
    profileUrl: null,
  }

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

        {category.slug === 'attestation' && (
          <ContentSection columns={1}>

            <ContentSection columns={2}>
              <EmployeeCard employee={sampleEmployee} resolveImage={resolveImage} type="circle" variant="person" />

              <ContentSection columns={1}>

                <InfoBanner
                  message="СОГЛАСНО П.6. СТ. 45 ФЗ-73 РАБОТЫ ПО РЕСТАВРАЦИИ И КОНСЕРВАЦИИ МОГУТ ПРОВОДИТЬ ТОЛЬКО АТТЕСТОВАННЫЕ СПЕЦИАЛИСТЫ!"
                  iconClass="bi bi-lightbulb"
                  type="error"
                  title="Внимание"
                />
                <InfoBanner
                  message="Информируем, что Российская ассоциация реставраторов осуществляет консультирование по вопросам аттестации. Для членов ассоциации услуга оказывается на безвозмездной основе."
                  iconClass="bi bi-info-lg"
                  type="default"
                />
                <InfoBanner
                  message="Обращаем внимание соискателей на аттестацию, что с мая 2022 года в рамках эксперимента по оптимизации и автоматизации процессов разрешительной деятельности подача заявления на аттестацию может быть осуществлена в том числе с использованием портала Госуслуг."
                  iconClass="bi bi-info-lg"
                  type="default"
                />

              </ContentSection>
            </ContentSection>
            <ContentSection columns={1}>
              <InfoBanner
                message="В соответствии с указанным порядком «работы по консервации и реставрации объектов культурного наследия, включенных в реестр, или выявленных объектов культурного наследия проводятся физическими лицами, аттестованными федеральным органом охраны объектов культурного наследия в установленном им порядке, состоящими в трудовых отношениях с юридическими лицами или индивидуальными предпринимателями, имеющими лицензию на осуществление деятельности по сохранению объектов культурного наследия (памятников истории и культуры) народов Российской Федерации, а также физическими лицами, аттестованными федеральным органом охраны объектов культурного наследия в установленном им порядке, являющимися индивидуальными предпринимателями, имеющими лицензию на осуществление деятельности по сохранению объектов культурного наследия (памятников истории и культуры) народов Российской Федерации»."
                iconClass="bi bi-info-lg"
                type="default"
                title="Пунктом 6 ст.45 Федерального закона от 25 июня 2002 г. № 73-ФЗ «Об объектах культурного наследия (памятниках истории и культуры) народов Российской Федерации» утвержден порядок проведения работ по сохранению объектов культурного наследия."
              />
            </ContentSection>


          </ContentSection>
        )}

        {category.slug === 'istoricheskie-poselenija' && (
          <ContentSection columns={1}>
            <DocumentList
              items={[...documents].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())}
              loading={docsLoading}
              error={error}
              emptyMessage="Документы не найдены."
              variant="gallery"
            />
          </ContentSection>
        )}

        {category.slug === 'license' && (

          <ContentSection columns={1}>
            <ContentSection columns={2}>
              <EmployeeCard employee={sampleEmployee} resolveImage={resolveImage} type="circle" variant="person" />
              <ContentSection columns={1}>
                <InfoBanner
                  message="Информируем, что Российская ассоциация реставраторов осуществляет консультирование по вопросам аттестации. Для членов ассоциации услуга оказывается на безвозмездной основе."
                  iconClass="bi bi-info-lg"
                  type="default"
                />
              </ContentSection>
            </ContentSection>
          </ContentSection>
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
