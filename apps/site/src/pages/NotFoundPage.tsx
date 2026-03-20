import './NotFoundPage.css'
import { PrimaryButtonLink, BackButton } from '../components/LinkButtons'

export default function NotFoundPage() {
    return (
        <div className="page-main">
            <div className="page__container privacy-page__container">
                <div className="not-found-page__content">
                    <img src="/public/search-loupe.jpg" className="not-found-page__illustration" alt="Страница не найдена" />

                    <h2 className="not-found-page__title">Страница не найдена</h2>
                    <p className="not-found-page__description body-text article-text">
                        Страница, которую вы искали, не существует. 
                        Возможно, вы ошиблись при вводе адреса или страница могла быть перемещена
                    </p>
                    <div className="not-found-page__actions">
                        <PrimaryButtonLink href="/">На главную</PrimaryButtonLink>
                        <BackButton>
                            <i className="bi bi-arrow-left" />
                            Назад
                        </BackButton>
                    </div>
                    <h1 className="not-found-page__code">404</h1>
                </div>
            </div>
        </div>
    )
}
