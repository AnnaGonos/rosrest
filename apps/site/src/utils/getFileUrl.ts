export function getFileUrl(url?: string | null): string | null {
    if (!url) return null;
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    if (url.startsWith('/uploads')) {
        const base = 'https://document.rosrest.com';
        return base + url;
    }
    if (url.match(/^\/((documents|files|docs|pdf|docx|doc)\/?)/)) {
        const base = 'https://document.rosrest.com';
        return base + url;
    }
   
    return url;
}
