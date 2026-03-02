export function getFileUrl(url: string): string {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('/uploads')) {
    const base = 'https://document.rosrest.com';
    return base + url;
  }
  if (url.startsWith('//')) return `${window.location.protocol}${url}`;
  return url;
}
