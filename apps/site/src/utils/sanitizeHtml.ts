import { getFileUrl } from './getFileUrl'

const DOCUMENT_ASSET_PATH = /^\/(uploads|documents|files|docs|pdf|docx|doc)(\/|$)/i

function resolveDocumentAssetUrl(value: string): string | null {
    const normalized = value.trim()
    if (!normalized || !DOCUMENT_ASSET_PATH.test(normalized)) return null
    return getFileUrl(normalized) ?? normalized
}

function rewriteDocumentAssetUrls(html: string): string {
    if (!html) return ''

    if (typeof DOMParser === 'undefined') {
        return html.replace(/\b(href|src)=(['"])(\/[^'"]+)\2/gi, (match, attribute, quote, value) => {
            const resolvedUrl = resolveDocumentAssetUrl(value)
            if (!resolvedUrl) return match
            return `${attribute}=${quote}${resolvedUrl}${quote}`
        })
    }

    const parser = new DOMParser()
    const document = parser.parseFromString(html, 'text/html')

    document.querySelectorAll<HTMLElement>('[style]').forEach((element) => {
        element.removeAttribute('style')
    })

    document.querySelectorAll<HTMLElement>('[href], [src]').forEach((element) => {
        for (const attributeName of ['href', 'src'] as const) {
            const value = element.getAttribute(attributeName)
            if (!value) continue

            const resolvedUrl = resolveDocumentAssetUrl(value)
            if (!resolvedUrl) continue

            element.setAttribute(attributeName, resolvedUrl)
        }
    })

    return document.body.innerHTML
}

export const sanitizeHtmlRemoveStyles = (html: string): string => {
    if (!html) return ''
    return rewriteDocumentAssetUrls(html)
}

export const normalizeBlockText = (text: string): string => {
    if (!text) return ''
    return text
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
}
