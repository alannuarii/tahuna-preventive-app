<template>
  <div class="auth-container" style="background: var(--gray-100); flex-direction: column; display: flex; align-items: center; justify-content: center; min-height: 100vh;">
    <div class="spinner spinner-lg mb-4"></div>
    <h2 style="color: var(--gray-800);">Completing login...</h2>
    <p style="color: var(--gray-500);">Please wait while we redirect you.</p>
  </div>
</template>

<script setup lang="ts">
import Cookies from 'js-cookie'

definePageMeta({
  layout: 'auth'
})

const route = useRoute()
const router = useRouter()

onMounted(() => {
  const token = route.query.token as string
  if (token) {
    Cookies.set('auth_token', token, { expires: 36500 })
    router.replace('/')
  } else {
    router.replace('/login')
  }
})
</script>
