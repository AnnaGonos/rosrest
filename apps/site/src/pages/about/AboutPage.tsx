import Breadcrumbs from '../../components/Breadcrumbs/Breadcrumbs'
import LinkList from '../../components/LinkList/LinkList'
import ImageViewer from '../../components/ImageViewer/ImageViewer'
import ContentSection from '../../components/ContentSection/ContentSection'
import './AboutPage.css'
import { PresentationButton } from '../../components/LinkButtons'

export default function AboutPage() {
    return (
        <div className="page-main">
            <div className="page__header">
                <Breadcrumbs
                    items={[
                        { label: 'Главная', to: '/' },
                        { label: 'Об Ассоциации', isCurrent: true },
                    ]}
                />
                <LinkList
                    items={[
                        { label: 'Обращение председателя', href: '/about/head-speech' },
                        { label: 'Устав и ежегодные отчёты', href: '/charter' },
                        { label: 'Члены РАР', href: '/members' },
                        { label: 'Соглашения РАР', href: '/contracts' },
                        { label: 'Награды и дипломы', href: '/about/awards' },
                        { label: 'Партнеры', href: '/about/partners' },
                        { label: 'Аппарат Ассоциации и Контакты', href: '/contacts' },
                    ]}
                />
            </div>

            <div className="page__container page__container--27">
                <div className='page__header-title'>
                    <h1 className="page-title">«Российская Ассоциация Реставраторов»</h1>
                </div>
                <div className="content-section__image-wrapper" style={{ marginBottom: '50px' }}>
                    <ImageViewer src="https://sun9-1.userapi.com/s/v1/ig2/KFaveUghQIAUAPnOy7w6yEMnRKrwZ5XNYkn3NVg0vQy-24YJX39mC_b3rQxv9wRLqJBk3XAUmNTlBN9K3YkCFc8E.jpg?quality=96&as=32x21,48x32,72x48,108x72,160x107,240x160,360x240,480x320,540x360,640x427,720x480,1080x720,1280x853,1440x960,2268x1512&from=bu&cs=2268x0" alt="Ассоциация" />
                </div>


                <ContentSection columns={2}>
                    <h2 className='section-title--lg'>[ Об Ассоциации ]</h2>

                    <ContentSection columns={1}>
                        <p className="body-text body-text--light">
                            Некоммерческое партнерство «Российская Ассоциация Реставраторов» основано в 2004 году в Санкт-Петербурге как всероссийское профессиональное объединение реставраторов.
                        </p>

                        <p className="body-emphasis">Наша <b>миссия</b> - сохранять <b>культурное наследие России</b> через профессионализм, сотрудничество, образование и правовую поддержку.
                        </p>

                    </ContentSection>
                </ContentSection>

                <ContentSection columns={1}>
                    <p className="body-text article-text">
                        На сегодняшний день <a href="https://rosrest.com/members/" target="_blank" rel="noopener">членами НП «Росрегионреставрация»</a> являются более 130 ведущих реставрационных и проектных организаций, производителей реставрационных материалов, профильных образовательных учреждений и отдельных мастеров-реставраторов со всей России. Члены Ассоциации осуществляют реставрацию не только архитектурных памятников, но и произведений монументального, изобразительного и декоративно-прикладного искусства. Специалисты организаций-членов Ассоциации – обладатели федеральных и региональных наград, истинные приверженцы своего дела.
                    </p>
                    <p className="body-text article-text">Среди основных задач Ассоциации: сплочение реставрационного сообщества, содействие деятельности реставрационных организаций и индивидуальных мастеров-реставраторов, популяризация историко-культурного наследия, взаимодействие с органами государственной власти, в том числе по вопросам совершенствования законодательства, международное сотрудничество в сфере сохранения культурного наследия.</p>
                    <p className="body-text article-text">Российская ассоциация реставраторов ежегодно проводит <a href="https://rosrest.com/news/" target="_blank" rel="noopener">профильные мероприятия</a>: научно-практические конференции, семинары, совещания, круглые столы, выставки для представителей реставрационного сообщества.</p>
                </ContentSection>

                {/* <LinkCardList
                    columns={4}
                    items={[
                        {
                            title: 'Образовательные проекты',
                            href: '/projects',
                            image: '/image-about-project.png',
                        },
                        {
                            title: 'Выставки',
                            href: '#',
                            image: '/image-about-project.png',
                        },
                        {
                            title: 'Конференции',
                            href: '#',
                            image: '/image-about-project.png',
                        },
                        {
                            title: 'Международные деловые миссии',
                            href: '/mezhdunarodnye-delovye-missii',
                            image: '/image-about-project.png',
                        },
                    ]}
                /> */}

                <ContentSection columns={1}>
                    <p className="body-text article-text">
                        Плодотворное сотрудничество Ассоциации с зарубежными коллегами в рамках организуемых ею официальных бизнес-миссий и конференций укрепляет позиции отечественной реставрационной школы на международной арене.
                    </p>
                </ContentSection>

                <div className="content-section__image-wrapper" style={{ display: 'flex', justifyContent: 'center', marginTop: '50px'  }}>
                    <div style={{width: '85%', }}>
                        <ImageViewer src="https://sun9-45.userapi.com/s/v1/ig2/R5iVlE16BA_VqCSmLnG0fPwzkhOu8NSxwUvH7A3maCZ2tP0uSFFSeaWD7UORaPB5vu9f_DQzNSYF_j70_AjDeC7m.jpg?quality=95&as=32x21,48x32,72x48,108x72,160x107,240x160,360x240,480x320,540x360,640x427,720x480,1080x720,1280x853,1440x960,2268x1512&from=bu&cs=2268x0" alt="Ассоциация" />
                    </div>

                </div>

                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '50px' }}>
                    <PresentationButton href="/uploads/Презентация-РАР.pdf" label="Презентация" />
                </div>

            </div>
        </div>
    )
}
