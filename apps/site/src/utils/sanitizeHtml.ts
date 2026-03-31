/**
 * Удаляет встроенные стили из HTML контента
 * Это нужно для SEO: встроенные стили выглядят как автоматически сгенерированный контент
 */
export const sanitizeHtmlRemoveStyles = (html: string): string => {
    if (!html) return ''
    
    // Убираем атрибуты style
    return html
        .replace(/\s+style\s*=\s*["'][^"']*["']/gi, '')  // style="..."
        .replace(/\s+style\s*=\s*{[^}]*}/gi, '')          // style={...}
        .replace(/\s+style\s*:\s*[^;]*;?/gi, '')          // style: ...;
}

/**
 * Норамлизирует текст из блоков, убирая избыточные пробелы и HTML-теги
 */
export const normalizeBlockText = (text: string): string => {
    if (!text) return ''
    return text
        .replace(/<[^>]*>/g, ' ')  // Убираем HTML теги
        .replace(/\s+/g, ' ')       // Норамлизируем пробелы
        .trim()
}
