import NewsSubscribeForm from '../../components/Subscribe/NewsSubscribeForm'
import '../../components/Subscribe/NewsSubscribeForm.css'
import Breadcrumbs from '../../components/Breadcrumbs/Breadcrumbs'
import ContentSection from '../../components/ContentSection/ContentSection'
import Seo from '../../components/Seo/Seo'

export default function SubscribePage() {
    return (
        <div className="page-main documents-page">
            <Seo
                title={`Подписка на рассылку Российской ассоциации реставраторов`}
                description={`Подписаться на новости и обновления Российской ассоциации реставраторов.`}
                canonical={window.location.origin + '/subscribe'}
                url={window.location.origin + '/subscribe'}
            />
            <div className="page__header">
                <Breadcrumbs items={[
                    { label: 'Главная', to: '/' },
                    { label: 'Подписка на рассылку', isCurrent: true }
                ]} />
            </div>

            <div className="page__container">
                <div style={{ display: 'flex', alignItems: 'start', gap: '20px', marginBottom: '80px', marginTop: '-30px' }}>
                    <h1 className="page-title">Почта</h1>
                </div>

                <ContentSection columns={1}>
                    <NewsSubscribeForm />
                </ContentSection>

            </div>

        </div>
    )
}
