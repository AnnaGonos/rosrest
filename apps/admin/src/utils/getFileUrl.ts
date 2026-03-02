export function getFileUrl(url: string): string {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('/uploads')) {
    const base = (import.meta as any).env.VITE_FILES_BASE_URL || 'https://document.rosrest.com';
    return base + url;
  }
  if (url.startsWith('//')) return `${window.location.protocol}${url}`;
  return url;
}
