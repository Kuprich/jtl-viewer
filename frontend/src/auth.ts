const STORAGE_KEY = 'jtl_auth'

export const UNAUTHORIZED_EVENT = 'auth:unauthorized'

export function getAuthToken(): string | null {
  return localStorage.getItem(STORAGE_KEY)
}

export function getUsername(): string | null {
  const token = getAuthToken()
  if (!token) return null
  try {
    return atob(token).split(':')[0] || null
  } catch {
    return null
  }
}

export function isAuthenticated(): boolean {
  return getAuthToken() !== null
}

export function setAuthToken(user: string, password: string): void {
  localStorage.setItem(STORAGE_KEY, btoa(`${user}:${password}`))
}

export function clearAuthToken(): void {
  localStorage.removeItem(STORAGE_KEY)
}