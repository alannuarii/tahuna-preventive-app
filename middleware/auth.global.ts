export default defineNuxtRouteMiddleware((to, from) => {
  // Izinkan akses ke halaman login dan semua rute auth agar tidak terjadi infinite redirect loop
  if (to.path.startsWith('/login') || to.path.startsWith('/auth/')) {
    return
  }

  // Nuxt 3 useCookie bisa membaca cookie dari sisi SSR maupun Client
  const token = useCookie('auth_token')

  // Jika tidak token yang valid, arahkan secara paksa ke halaman login
  if (!token.value) {
    return navigateTo('/login')
  }
})
