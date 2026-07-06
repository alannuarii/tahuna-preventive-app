export const useAuth = () => {
  const token = useCookie('auth_token')
  
  const user = computed(() => {
    if (!token.value) return null
    try {
      const base64Url = token.value.split('.')[1]
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
      }).join(''))
      return JSON.parse(jsonPayload)
    } catch (e) {
      return null
    }
  })

  const isGuest = computed(() => {
    return user.value?.role === 'guest'
  })

  return { user, isGuest }
}
