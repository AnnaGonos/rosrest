import { useEffect, useState } from 'react'
import EducationCard from '../../components/EducationCard'
import './EducationPage.css'
import Breadcrumbs from '../../components/Breadcrumbs/Breadcrumbs'
import ContentSection from '../../components/ContentSection/ContentSection'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3002'

type EducationInstitution = {
    id: number
    name: string
    websiteUrl: string
    imageUrl?: string | null
    specialties?: string[] | null
}

export default function EducationPage() {
    const [items, setItems] = useState<EducationInstitution[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        let active = true
        const load = async () => {
            setLoading(true)
            setError('')
            try {
                const res = await fetch(`${API_BASE}/education?type=professional_development`)
                if (!res.ok) throw new Error('Не удалось загрузить данные')
                const data = await res.json()
                if (active) setItems(Array.isArray(data) ? data : [])
            } catch (err) {
                if (active) setError(err instanceof Error ? err.message : 'Неизвестная ошибка')
            } finally {
                if (active) setLoading(false)
            }
        }
        load()
        return () => { active = false }
    }, [])

    return (
        <div className="page-main">
            <div className="page__header">
                <Breadcrumbs
                    items={[
                        { label: 'Главная', to: '/' },
                        { label: 'Образование', isCurrent: true },
                    ]}
                />
            </div>
            <div className="page__container page__container--27">
                <h1 className="page-title" style={{ marginBottom: '80px' }}>Образование</h1>

                <ContentSection columns={1}>
                    <p className="body-text article-text">
                        В рамках услуг, оказываемых членам Российской ассоциации реставраторов, специалистами РАР осуществляются консультации по вопросам повышения квалификации специалистов-реставраторов, а также по вопросам прохождения обязательной аттестации физическими лицами, проводящими работы по консервации и реставрации объектов культурного наследия.
                    </p>
                    <p className="body-text article-text">
                        Члены Ассоциации, желающие пройти профессиональное обучение, переподготовку или повысить квалификацию, могут направлять свои заявки на адрес: <a href="mailto:info.rosrest@mail.ru" target="_blank" rel="noopener noreferrer">info.rosrest@mail.ru</a> с пометкой «Повышение квалификации».
                    </p>
                </ContentSection>

                <ContentSection columns={1}>
                    <h2 className="section-title--sm" style={{ marginTop: '20px' }}>ПОВЫШЕНИЕ КВАЛИФИКАЦИИ</h2>

                    {loading ? (
                        <div className="education-page__loading">Загрузка...</div>
                    ) : error ? (
                        <div className="education-page__error">{error}</div>
                    ) : items.length === 0 ? (
                        <div className="education-page__empty">Нет записей</div>
                    ) : (
                        <div className="education-grid">
                            {items.map((it) => (
                                <EducationCard key={it.id} item={it} />
                            ))}
                        </div>
                    )}
                </ContentSection>

                <ContentSection columns={2}>
                    <a href="/education/srednee-professionalnoe-obrazovanie"
                        rel="nofollow"
                    >
                        <img className="education-image-banner" src="/education/srednee-600x450.png" alt="Образование" />
                    </a>
                    <a href="/education/vysshee-professionalnoe-obrazovanie"
                        rel="nofollow"  
                    >
                        <img className="education-image-banner" src="/education/vysshee-600x450.png" alt="Образование" />
                    </a>
                </ContentSection>

                <ContentSection columns={1}>
                    <h2 className="section-title--sm" style={{ marginTop: '80px' }}>РЕЕСТР ВЫПУСКНИКОВ РЕСТАВРАЦИОННЫХ СПЕЦИАЛЬНОСТЕЙ</h2>

                    <p className="body-text article-text">
                        Российская ассоциация реставраторов совместно с Департаментом культурного наследия города Москвы запускает проект, призванный расширить возможности трудоустройства и профессионального роста молодежи.
                        Единый реестр выпускников реставрационных специальностей, завершивших обучение по  образовательным программам высшего и среднего профессионального образования. Реестр выпускников представляет собой регулярно пополняемую таблицу с информацией о каждом соискателе по предложенной форме.
                    </p>
                </ContentSection>

                <ContentSection columns={2}>
                    <a target="_blank" rel="nofollow"
                        href="https://docs.google.com/forms/d/e/1FAIpQLSeHb-dRYqcTY3grMzRbuomG77FSydRo9ErHxIkuyLrUvA9hsg/viewform">
                        <img className="education-image-banner" src="/education/anketa-vypusknika-600x450.png" alt="Анкета выпускника" />
                    </a>
                    <a target="_blank" rel="nofollow"
                        href="https://docs.google.com/spreadsheets/d/1F78TcG9PUyOxldUDbMuhlWiGI8hMYQJ9SJzQ92cQLN0/edit?gid=0#gid=0">
                        <img className="education-image-banner" src="/education/baza-vypusknikov-600x450.png" alt="Таблица выпускников" />
                    </a>
                </ContentSection>
            </div >
        </div >
    )
}
