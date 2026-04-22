import { getFileUrl } from './getFileUrl'

const DOCUMENT_ASSET_PATH = /^(\/(uploads|documents|files|docs|pdf|docx|doc)(\/|$))/i

function rewriteDocumentAssetUrls(html: string): string {
    if (!html) return ''

    if (typeof DOMParser === 'undefined') {
        return html.replace(/\b(href|src)=(['"])(\/[^'"]+)\2/gi, (match, attribute, quote, value) => {
            if (!DOCUMENT_ASSET_PATH.test(value)) return match
            return `${attribute}=${quote}${getFileUrl(value) ?? value}${quote}`
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
            if (!value || !DOCUMENT_ASSET_PATH.test(value)) continue
            element.setAttribute(attributeName, getFileUrl(value) ?? value)
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
