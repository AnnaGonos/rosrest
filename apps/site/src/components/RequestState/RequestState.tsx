import './RequestState.css'

type RequestStateVariant = 'page' | 'inline'

interface RequestStateProps {
    loading: boolean
    error?: string | null
    loadingText?: string
    errorText?: string
    variant?: RequestStateVariant
    className?: string
}

export default function RequestState({
    loading,
    error,
    loadingText = 'Загрузка...',
    errorText,
    variant = 'page',
    className = '',
}: RequestStateProps) {
    if (!loading && !error) {
        return null
    }

    const statusClassName = [
        'request-state',
        loading ? 'request-state--loading' : 'request-state--error',
        className,
    ].filter(Boolean).join(' ')

    const statusContent = loading ? (
        <div className={statusClassName} role="status" aria-live="polite">
            <div className="request-state__spinner" aria-hidden="true" />
            <p className="request-state__text">{loadingText}</p>
        </div>
    ) : (
        <div className={statusClassName} role="alert">
            <p className="request-state__text">{errorText || `Ошибка: ${error}`}</p>
        </div>
    )

    if (variant === 'inline') {
        return statusContent
    }

    return (
        <div className="page-main">
            <div className="page__container">{statusContent}</div>
        </div>
    )
}
