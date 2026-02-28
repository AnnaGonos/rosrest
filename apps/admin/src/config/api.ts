const getApiBaseUrl = (): string => {
  if (import.meta.env.DEV) {
    const devUrl = import.meta.env.VITE_API_URL
    if (devUrl) {
      return devUrl
    }
    return 'http://localhost:3002'
  }

  const apiUrl = import.meta.env.VITE_API_URL
  if (apiUrl) {
    return apiUrl
  }

  return '/api'
}

export const API_BASE_URL = getApiBaseUrl()

/**
 * Построить полный URL для API запроса
 * @param endpoint - endpoint без слеша в начале (например: 'admin/login')
 * @returns полный URL
 */
export const buildApiUrl = (endpoint: string): string => {
  const trimmedEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint
  return `${API_BASE_URL}/${trimmedEndpoint}`
}

export const API_ENDPOINTS = {
  ADMIN_LOGIN: buildApiUrl('admin/login'),
  ADMIN_INIT: buildApiUrl('admin/init'),
  ADMIN_RESET_PASSWORD: buildApiUrl('admin/reset-password'),
  ADMIN_FORGOT_PASSWORD: buildApiUrl('admin/forgot-password'),

  DOCUMENTS_LIST: buildApiUrl('documents'),
  DOCUMENTS_CREATE: buildApiUrl('documents'),
  DOCUMENTS_LIST_BY_TYPE: (type: string) => buildApiUrl(`documents?type=${type}`),
  DOCUMENTS_UPDATE: (id: string) => buildApiUrl(`documents/${id}`),
  DOCUMENTS_DELETE: (id: string) => buildApiUrl(`documents/${id}`),

  DOCUMENT_CATEGORIES_LIST: buildApiUrl('document-categories/tree'),
  DOCUMENT_CATEGORIES_CREATE: buildApiUrl('document-categories'),
  DOCUMENT_CATEGORIES_UPDATE: (id: string | number) => buildApiUrl(`document-categories/${id}`),
  DOCUMENT_CATEGORIES_DELETE: (id: string | number) => buildApiUrl(`document-categories/${id}`),

  PARTNERS_LIST: buildApiUrl('partners'),
  PARTNERS_CREATE: buildApiUrl('partners'),
  PARTNERS_UPDATE: (id: string) => buildApiUrl(`partners/${id}`),
  PARTNERS_DELETE: (id: string) => buildApiUrl(`partners/${id}`),

  LIBRARY: buildApiUrl('library'),
  LIBRARY_LIST: buildApiUrl('library'),
  LIBRARY_UPLOAD: buildApiUrl('library/upload'),
  LIBRARY_CATEGORIES: buildApiUrl('library/categories'),

  HOME_SLIDER_LIST: buildApiUrl('home-slider'),
  HOME_SLIDER_CREATE: buildApiUrl('home-slider'),
  HOME_SLIDER_DELETE: (id: string) => buildApiUrl(`home-slider/${id}`),

  AWARDS_LIST: buildApiUrl('awards'),
  AWARDS_CREATE: buildApiUrl('awards'),
  AWARDS_DELETE: (id: string) => buildApiUrl(`awards/${id}`),

  EDUCATION_LIST: buildApiUrl('education'),
  EDUCATION_CREATE: buildApiUrl('education'),
  EDUCATION_UPDATE: (id: string | number) => buildApiUrl(`education/${id}`),
  EDUCATION_DELETE: (id: string | number) => buildApiUrl(`education/${id}`),

  EMPLOYEES_LIST: buildApiUrl('employees'),
  EMPLOYEES_CREATE: buildApiUrl('employees'),
  EMPLOYEES_UPDATE: (id: string) => buildApiUrl(`employees/${id}`),
  EMPLOYEES_DELETE: (id: string) => buildApiUrl(`employees/${id}`),

  events: {
    list: buildApiUrl('events'),
    create: buildApiUrl('events'),
    update: (id: number) => buildApiUrl(`events/${id}`),
    delete: (id: number) => buildApiUrl(`events/${id}`),
    getById: (id: number) => buildApiUrl(`events/${id}`),
  },

  PROJECTS: {
    list: buildApiUrl('projects'),
    create: buildApiUrl('projects'),
    get: (id: string) => buildApiUrl(`projects/${id}`),
    update: (id: string) => buildApiUrl(`projects/${id}`),
    delete: (id: string) => buildApiUrl(`projects/${id}`),
  },

  FOR_JOURNALIST: {
    get: buildApiUrl('for-journalist'),
    create: buildApiUrl('for-journalist'),
    update: (id: string) => buildApiUrl(`for-journalist/${id}`),
    delete: (id: string) => buildApiUrl(`for-journalist/${id}`),
  },

  RAR_MEMBERS: {
    list: buildApiUrl('rar-members'),
    create: buildApiUrl('rar-members'),
    get: (id: string) => buildApiUrl(`rar-members/${id}`),
    update: (id: string) => buildApiUrl(`rar-members/${id}`),
    delete: (id: string) => buildApiUrl(`rar-members/${id}`),
  },

  RAR_SECTIONS: {
    list: buildApiUrl('rar-sections'),
    create: buildApiUrl('rar-sections'),
    get: (id: string) => buildApiUrl(`rar-sections/${id}`),
    update: (id: string) => buildApiUrl(`rar-sections/${id}`),
    delete: (id: string) => buildApiUrl(`rar-sections/${id}`),
  },

  SERVICES: {
    list: buildApiUrl('services'),
    create: buildApiUrl('services'),
    get: (id: string) => buildApiUrl(`services/${id}`),
    update: (id: string) => buildApiUrl(`services/${id}`),
    delete: (id: string) => buildApiUrl(`services/${id}`),
  },

  MONITORING_ZAKON: {
    list: buildApiUrl('monitoring-zakon'),
    create: buildApiUrl('monitoring-zakon'),
    get: (id: string) => buildApiUrl(`monitoring-zakon/${id}`),
    update: (id: string) => buildApiUrl(`monitoring-zakon/${id}`),
    delete: (id: string) => buildApiUrl(`monitoring-zakon/${id}`),
  },

  PAGES: {
    list: buildApiUrl('pages'),
    create: buildApiUrl('pages'),
    get: (id: string) => buildApiUrl(`pages/${id}`),
    getBySlug: (slug: string) => buildApiUrl(`pages/slug/${slug}`),
    update: (id: string) => buildApiUrl(`pages/${id}`),
    delete: (id: string) => buildApiUrl(`pages/${id}`),
  },

  NEWS: {
    list: () => buildApiUrl('news'),
    create: () => buildApiUrl('news'),
    get: (id: string) => buildApiUrl(`news/${id}`),
    update: (id: string) => buildApiUrl(`news/${id}`),
    delete: (id: string) => buildApiUrl(`news/${id}`),
  },

  NEWS_TAGS: buildApiUrl('news-tags'),
  NEWS_TAGS_CREATE: buildApiUrl('news-tags'),
  NEWS_TAGS_UPDATE: (id: number) => buildApiUrl(`news-tags/${id}`),
  NEWS_TAGS_DELETE: (id: number) => buildApiUrl(`news-tags/${id}`),

  SUBSCRIPTIONS: {
    list: buildApiUrl('subscriptions/list'),
    subscribe: buildApiUrl('subscriptions/news/subscribe'),
    unsubscribe: buildApiUrl('subscriptions/news/unsubscribe'),
    delete: (id: number) => buildApiUrl(`subscriptions/${id}`),
    previewWelcome: buildApiUrl('subscriptions/preview/welcome'),
  },
  DIGEST: {
    send: buildApiUrl('digest/send'),
    preview: buildApiUrl('digest/preview'),
  },
}

export default {
  API_BASE_URL,
  buildApiUrl,
  API_ENDPOINTS,
}

