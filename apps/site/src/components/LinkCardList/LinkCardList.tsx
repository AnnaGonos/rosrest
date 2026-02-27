import './LinkCardList.css'
import 'bootstrap-icons/font/bootstrap-icons.css'
import { ArrowButton } from '../LinkButtons'

interface LinkCardItem {
    title: string
    href?: string
    image?: string
    icon?: string
    subtitle?: string
    target?: '_self' | '_blank'
}

interface LinkCardListProps {
    items: LinkCardItem[]
    columns?: 1 | 2 | 3 | 4 | 5 | 6
    className?: string
    variant?: 'card' | 'compact' | 'featured' | 'categories' | 'image'
}

export default function LinkCardList({ items, columns = 4, className = '', variant = 'card' }: LinkCardListProps) {
    return (
        <div className={`link-card-list columns-${columns} ${className} ${variant === 'compact' ? 'variant-compact' : ''} ${variant === 'featured' ? 'variant-featured' : ''} ${variant === 'image' ? 'variant-image' : ''}`.trim()}>
            {items.map((it, i) => {
                const rawHref = it.href || ''
                const hasLink = rawHref && rawHref !== '#'
                const isBlank = it.target === '_blank'
                const Wrapper: any = hasLink ? 'a' : 'div'

                if (variant === 'compact') {
                    const wrapperProps = hasLink ? { href: it.href, target: it.target || '_self', ...(isBlank ? { rel: 'noopener noreferrer' } : {}) } : {}
                    return (
                        <Wrapper key={i} className="link-card link-card--compact" {...wrapperProps}>
                            <div className={`link-card__image ${it.image ? '' : 'link-card__image--placeholder'}`}>
                                {it.image ? (
                                    <img src={it.image} alt={it.title} />
                                ) : it.icon ? (
                                    <i className={`bi ${it.icon}`} style={{ fontSize: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }} />
                                ) : (
                                    <div className="link-card__placeholder-icon" />
                                )}
                            </div>
                            <div className="link-card__body--compact">
                                <div className="link-card__title block-label">{it.title}</div>
                            </div>
                            <div className="link-card__action">
                                {hasLink ? <ArrowButton href={it.href}></ArrowButton> : <div className="arrow-button disabled" aria-hidden />}
                            </div>
                        </Wrapper>
                    )
                }

                if (variant === 'featured') {
                    const wrapperProps = hasLink ? { href: it.href, target: it.target || '_self', ...(isBlank ? { rel: 'noopener noreferrer' } : {}) } : {}
                    return (
                        <Wrapper key={i} className="link-card link-card--featured" {...wrapperProps}>
                            <div className={`link-card__image ${it.image ? '' : 'link-card__image--placeholder'}`}>
                                {it.image ? (
                                    <img src={it.image} alt={it.title} />
                                ) : it.icon ? (
                                    <i className={`bi ${it.icon}`} style={{ fontSize: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }} />
                                ) : (
                                    <div className="link-card__placeholder-icon" />
                                )}
                            </div>
                            <div className="link-card__body link-card__body--featured">
                                <div className="link-card__title block-label">{it.title}</div>
                                {it.subtitle && <div className="link-card__subtitle">{it.subtitle}</div>}
                            </div>
                        </Wrapper>
                    )
                }

                if (variant === 'categories') {
                    const wrapperProps = hasLink ? { href: it.href, target: it.target || '_self', ...(isBlank ? { rel: 'noopener noreferrer' } : {}) } : {}
                    return (
                        <Wrapper key={i} className="link-card link-card--categories" {...wrapperProps}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '10px', paddingBottom: '60px' }} >
                                {it.image ? (
                                    <img src={it.image} alt={it.title} />
                                ) : it.icon ? (
                                    <i className={`bi ${it.icon} icon icon--lg`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 'max-content', height: '100%' }} />
                                ) : (
                                    <div className="link-card__placeholder-icon" />
                                )}
                                <div className="link-card__action">
                                    {hasLink ? <ArrowButton href={it.href}></ArrowButton> : <div className="arrow-button disabled" aria-hidden />}
                                </div>
                            </div>
                            <div className="link-card__body link-card__body--categories">
                                <div className="link-card__title block-label">{it.title}</div>
                                {it.subtitle && <div className="link-card__subtitle">{it.subtitle}</div>}
                            </div>
                        </Wrapper>
                    )
                }
                if (variant === 'image') {
                    const wrapperProps = hasLink ? { href: it.href, target: it.target || '_self', ...(isBlank ? { rel: 'noopener noreferrer' } : {}) } : {}
                    return (
                        <Wrapper key={i} className="link-card link-card--image" {...wrapperProps}>
                            <img src={it.image} alt={it.title} />
                            
                            {/* <div className="link-card__body link-card__body--image">
                                {it.title && <p className="link-card__title">{it.title}</p>}
                            </div> */}
                        </Wrapper>
                    )
                }

                const wrapperProps = hasLink ? { href: it.href, target: it.target || '_self', ...(isBlank ? { rel: 'noopener noreferrer' } : {}) } : {}
                return (
                    <Wrapper
                        key={i}
                        className="link-card"
                        {...wrapperProps}
                    >
                        <div className={`link-card__image ${it.image ? '' : 'link-card__image--placeholder'}`}>
                            {it.image ? (
                                <img src={it.image} alt={it.title} />
                            ) : it.icon ? (
                                <i className={`bi ${it.icon}`} style={{ fontSize: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }} />
                            ) : (
                                <div className="link-card__placeholder-icon" />
                            )}
                            {hasLink ? <ArrowButton href={it.href}></ArrowButton> : <div className="arrow-button disabled" aria-hidden />}
                        </div>

                        <div className="link-card__body">
                            <div className="link-card__title block-label">{it.title}</div>
                            {it.subtitle && <div className="link-card__subtitle">{it.subtitle}</div>}
                        </div>
                    </Wrapper>
                )
            })}
        </div>
    )
}
