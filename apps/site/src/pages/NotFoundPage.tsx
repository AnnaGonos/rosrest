import './NotFoundPage.css'
import { PrimaryButtonLink, BackButton } from '../components/LinkButtons'

export default function NotFoundPage() {
    return (
        <div className="not-found-page">
            <div className="not-found-page__container">
                <div className="not-found-page__content">
                    <h1 className="not-found-page__code">404</h1>
                    <h2 className="not-found-page__title">Страница не найдена</h2>
                    <p className="not-found-page__description">
                        К сожалению, запрашиваемая страница не существует или была перемещена.
                    </p>
                    <div className="not-found-page__actions">
                        <PrimaryButtonLink href="/">На главную</PrimaryButtonLink>
                        <BackButton>
                            <i className="bi bi-arrow-left" />
                            Назад
                        </BackButton>
                    </div>
                </div>
                <div className="not-found-page__illustration">
                    <i className="bi bi-exclamation-triangle" />
                </div>
            </div>
        </div>
    )
}
