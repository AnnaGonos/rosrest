import Breadcrumbs from '../../components/Breadcrumbs/Breadcrumbs'
import ContentSection from '../../components/ContentSection/ContentSection'
import { BackToSectionButton } from '../../components/LinkButtons'
import './AboutPage.css'
import '../services/ServiceDetailPage.css'
import Seo from '../../components/Seo/Seo'

export default function HeadSpeechPage() {
    return (
        <div className="page-main page__container">
            <Seo
                title="Обращение председателя Российской ассоциации реставраторов"
                description="Обращение председателя Российской ассоциации реставраторов о целях, ценностях и развитии профессионального сообщества."
                canonical="https://rosrest.com/about/head-speech"
                url="https://rosrest.com/about/head-speech"
            />

            <div className="page__header">
                <Breadcrumbs
                    items={[
                        { label: 'Главная', to: '/' },
                        { label: 'Об Ассоциации', to: '/about' },
                        { label: 'Обращение председателя', isCurrent: true },
                    ]}
                />
            </div>

            <div className="page__container page__container--27">
                <div className='page__header-title'>
                    <BackToSectionButton to="/about" label="К разделу Об Ассоциации" />
                    <h1 className="page-title">Обращение председателя</h1>
                </div>

                <ContentSection columns={1}>
                    <div className="service-contacts" style={{ marginBottom: '50px' }}>
                        <div className="service-contacts__grid" style={{ gridTemplateColumns: '1fr' }}>
                            <a href="https://test.rosrest.com/portfolio/acting-chairman" className="service-contact-card" style={{ flexDirection: 'row', alignItems: 'center', gap: '20px' }}>
                                <div  className="service-contact-card__photo">
                                    <img
                                        src="/photo_5362041132193352721_y-e1766964863262-600x600.jpg"
                                        alt="Татьяна Черняева"
                                        loading="lazy"
                                    />
                                </div>
                                <div className="service-contact-card__info">
                                    <h3 className="service-contact-card__name">Татьяна Черняева</h3>
                                    <p className="service-contact-card__position">Председатель Российской ассоциации реставраторов</p>                               
                                </div>
                            </a>
                        </div>
                    </div>
                </ContentSection>

                <ContentSection columns={1}>
                    
                    <p className="body-text">
                        <b>Уважаемые коллеги!</b>
                    </p>

                    <p className="body-text">
                        Российская ассоциация реставраторов создана в 2004 году с целью объединения высокопрофессиональных реставрационных организаций и развития реставрационного рынка во всех регионах России.
                    </p>
                    <p className="body-text">
                        Ассоциация объединяет тех, кто знает и любит реставрационное дело, профессионально и с душой подходит к сохранению уникального культурного наследия нашей великой страны. Проблема сохранения и возрождения культурных ценностей в России, созданных на протяжении ее многовековой истории, является актуальной для каждого поколения. В России уникальных мест с точки зрения природной, исторической и культурной ценностей больше, чем где-либо в мире, они интересны как для сограждан, так и для жителей других стран.
                    </p>
                    <p className="body-text">
                        Объекты культурного наследия — это вехи богатой истории России, они соединяют уникальность традиций и совершенство стиля. В России из года в год растет число памятников культуры и истории, требующих реставрации. Профессиональная реставрация является залогом сохранения национальной памяти и духовного наследия.
                    </p>
                    <p className="body-text">
                        Реставрация имеет важное экономическое значение. Качество реставрационных услуг влияет на развитие культурно-познавательного туризма. Раскрытие туристического потенциала региона связано с цивилизованным отношением к объектам культурного наследия.
                    </p>
                    <p className="body-text">
                        Благодаря реставрационным школам, которые формировались в России на протяжении XX столетия в Петербурге, Москве, Новгороде и других регионах возможно развивать реставрационное дело и реставрационную отрасль России. Открытое сотрудничество, профессиональный подход и высокие стандарты в реставрации — это основные приоритеты Российской ассоциации реставраторов.
                    </p>
                </ContentSection>
            </div>
        </div>
    )
}
