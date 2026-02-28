import React from 'react'
import { Link } from 'react-router-dom'
import './LinkButtons.css'
import 'bootstrap-icons/font/bootstrap-icons.css'

type BaseProps = React.AnchorHTMLAttributes<HTMLAnchorElement> & {
    children?: React.ReactNode
}

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
    children?: React.ReactNode
    fallbackHref?: string
}

export const ArrowIcon = ({ size = 'md', className = '' }: { size?: 'sm' | 'md' | 'lg'; className?: string }) => {
    const sizeClass = size === 'sm' ? 'icon--sm' : size === 'lg' ? 'icon--lg' : 'icon--md'
    return <i className={`bi bi-arrow-up-right icon ${sizeClass} ${className}`} aria-hidden />
}

export const ArrowLink = ({ href = '#', children, ...rest }: BaseProps) => (
    <a href={href} className="arrow-link" {...rest}>
        <ArrowIcon size="md" />
    </a>
)

export const PrimaryButtonLink = ({ href = '#', children, ...rest }: BaseProps) => (
    <a href={href} className="primary-link" {...rest}>
        {children}
    </a>
)

export const OutlineButtonLink = ({ href = '#', children, ...rest }: BaseProps) => (
    <a href={href} className="outline-link" {...rest}>
        {children}
    </a>
)

export const OutlineArrowButtonLink = ({ href = '#', children, ...rest }: BaseProps) => (
    <a href={href} className="outline-arrow-link" {...rest}>
        <span className="outline-link">{children}</span>
        <span className="arrow-button__arrow"><ArrowIcon size="sm" /></span>
    </a>
)

export const ArrowButton = ({ href = '#', asButton = false, 'aria-label': ariaLabel, ...rest }: any) => {
    if (asButton) {
        return (
            <span className="arrow-button" aria-hidden {...(rest as any)}>
                <span className="arrow-button__arrow"><ArrowIcon size="sm" /></span>
            </span>
        )
    }

    return (
        <a href={href} className="arrow-button" aria-label={ariaLabel || 'arrow button'} {...rest}>
            <span className="arrow-button__arrow"><ArrowIcon size="sm" /></span>
        </a>
    )
}

export const PresentationButton = ({ href, label = 'Презентация', target = '_blank', className = '' }: { href: string; label?: string; target?: '_self' | '_blank'; className?: string }) => {
    const isBlank = target === '_blank'
    return (
        <a className={`primary-link ${className}`.trim()} href={href} target={target} {...(isBlank ? { rel: 'noopener noreferrer' } : {})}>
            <span className="presentation-button__icon" aria-hidden><i className="bi bi-easel2-fill"></i></span>
            <span className="presentation-button__label">{label}</span>
        </a>
    )
}

export const BackButton = ({ children = 'Назад', fallbackHref = '/', className = '', onClick, type = 'button', ...rest }: ButtonProps) => {
    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        onClick?.(event)
        if (!event.defaultPrevented) {
            if (window.history.length > 1) {
                window.history.back()
            } else {
                window.location.href = fallbackHref
            }
        }
    }

    return (
        <button type={type} className={`back-button outline-link ${className}`.trim()} onClick={handleClick} {...rest}>
            {children}
        </button>
    )
}

type Props = {
    to?: string
    label?: string
    title?: string
}

export const BackToSectionButton = ({ to = '/about', label = 'Перейти в раздел', title = '' }: Props) => {
    return (
        <Link to={to} className="outline-arrow-link" aria-label={label}>
            <span className="arrow-button__arrow"><i className="bi bi-chevron-double-left"></i></span>
            {title !== '' && <span className="outline-link">{title}</span>}
        </Link>
    )
}

export const PrimaryButtonLinkWithIcon = ({ to = '/about', label = 'Перейти в раздел' }: Props) => {
    return (
        <Link to={to} className="outline-arrow-link" aria-label={label}>
            <span className="arrow-button__arrow"><i className="bi bi-arrow-up-right"></i></span>
        </Link>
    )
}


export default {
    ArrowLink,
    PrimaryButtonLink,
    OutlineButtonLink,
    OutlineArrowButtonLink,
    ArrowButton,
    PresentationButton,
    BackButton,
    BackToSectionButton,
}
