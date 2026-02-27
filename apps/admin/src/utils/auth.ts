
interface TokenPayload {
  sub: string
  email: string
  exp: number
  iat: number
}

function decodeToken(token: string): TokenPayload | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    
    const payload = parts[1]
    const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')))
    return decoded as TokenPayload
  } catch {
    return null
  }
}

export function isTokenExpired(token: string | null): boolean {
  if (!token) return true
  
  const decoded = decodeToken(token)
  if (!decoded || !decoded.exp) return true
  
  const now = Math.floor(Date.now() / 1000)
  return decoded.exp < now
}

export function getToken(): string | null {
  return localStorage.getItem('admin_token')
}

export function setToken(token: string): void {
  localStorage.setItem('admin_token', token)
}

export function getEmail(): string | null {
  return localStorage.getItem('admin_email')
}

export function setEmail(email: string): void {
  localStorage.setItem('admin_email', email)
}

export function removeAuth(): void {
  localStorage.removeItem('admin_token')
  localStorage.removeItem('admin_email')
}

export function isAuthenticated(): boolean {
  const token = getToken()
  return token !== null && !isTokenExpired(token)
}

export function getTokenInfo(): TokenPayload | null {
  const token = getToken()
  if (!token) return null
  return decodeToken(token)
}

export function getTokenExpirationTime(): number | null {
  const info = getTokenInfo()
  if (!info || !info.exp) return null
  return info.exp * 1000
}

export function getTokenRemainingTime(): number | null {
  const expTime = getTokenExpirationTime()
  if (!expTime) return null
  
  const now = Date.now()
  const remaining = Math.floor((expTime - now) / 1000)
  return remaining > 0 ? remaining : 0
}
