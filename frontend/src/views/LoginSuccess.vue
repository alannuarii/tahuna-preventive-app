<template>
  <div class="flex items-center justify-center min-h-screen">
    <div class="text-center">
      <h2 class="text-xl font-semibold mb-2">Login Successful</h2>
      <p>Redirecting...</p>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';

const router = useRouter();
const route = useRoute();

// Helper function to set cookie
const setCookie = (name, value, days) => {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
};

onMounted(() => {
  const token = route.query.token;
  
  if (token) {
    setCookie('auth_token', token, 1); // 1 day
    router.push('/preventive');
  } else {
    router.push('/login');
  }
});
</script>

