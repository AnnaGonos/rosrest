export type CookieConsentValue = 'accepted' | 'declined'

export const COOKIE_CONSENT_KEY = 'rosrest_cookie_consent'
const COOKIE_CONSENT_NAME = 'rosrest_cookie_consent'
const CONSENT_TTL_DAYS = 180

const isBrowser = () => typeof window !== 'undefined'

const setCookie = (name: string, value: string, days: number) => {
  if (!isBrowser()) {
    return
  }

  const maxAge = days * 24 * 60 * 60
  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; Max-Age=${maxAge}; Path=/; SameSite=Lax`
}

const getCookie = (name: string): string | null => {
  if (!isBrowser()) {
    return null
  }

  const encodedName = `${encodeURIComponent(name)}=`
  const parts = document.cookie.split(';')

  for (const rawPart of parts) {
    const part = rawPart.trim()
    if (part.startsWith(encodedName)) {
      return decodeURIComponent(part.slice(encodedName.length))
    }
  }

  return null
}

const isConsentValue = (value: string | null): value is CookieConsentValue => {
  return value === 'accepted' || value === 'declined'
}

export const getCookieConsent = (): CookieConsentValue | null => {
  if (!isBrowser()) {
    return null
  }

  const fromStorage = window.localStorage.getItem(COOKIE_CONSENT_KEY)
  if (isConsentValue(fromStorage)) {
    return fromStorage
  }

  const fromCookie = getCookie(COOKIE_CONSENT_NAME)
  if (isConsentValue(fromCookie)) {
    return fromCookie
  }

  return null
}

export const isCookieConsentAccepted = (): boolean => {
  return getCookieConsent() === 'accepted'
}

export const saveCookieConsent = (value: CookieConsentValue) => {
  if (!isBrowser()) {
    return
  }

  window.localStorage.setItem(COOKIE_CONSENT_KEY, value)
  setCookie(COOKIE_CONSENT_NAME, value, CONSENT_TTL_DAYS)

  if (value === 'declined') {
    window.sessionStorage.removeItem('mainMenuCache')
  }

  window.dispatchEvent(new CustomEvent('rosrest:cookie-consent-changed', { detail: value }))
}
