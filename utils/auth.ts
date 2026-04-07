import Cookies from 'js-cookie'

export const isAuthenticated = () => {
  return !!Cookies.get('auth_token')
}

export const logout = async () => {
  try {
    await fetch('/auth/logout', { method: 'POST' })
    Cookies.remove('auth_token')
    window.location.href = '/login'
  } catch (e) {
    console.error(e)
  }
}

export const getUser = () => {
  const token = Cookies.get('auth_token')
  if (!token) return null
  try {
    const payload = token.split('.')[1]
    return JSON.parse(atob(payload))
  } catch (e) {
    return null
  }
}
