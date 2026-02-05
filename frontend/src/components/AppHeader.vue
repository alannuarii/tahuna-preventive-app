<template>
  <header class="app-header">
    <div class="container header-content">
      <div class="header-logo">
        <img src="/images/npwhite.png" alt="PLTD Tahuna" class="logo-img" />
      </div>
      
      <nav class="header-nav">
        <router-link to="/preventive" class="header-nav-link" :class="{ active: isActive('/preventive') && !isActive('/preventive/realisasi') }">
          <span class="icon">📅</span> Schedule
        </router-link>
        <router-link to="/preventive/realisasi" class="header-nav-link" :class="{ active: isActive('/preventive/realisasi') }">
          <span class="icon">✅</span> Realisasi
        </router-link>
      </nav>
      
      <div class="header-user">
        <div class="user-info">
          <div class="header-user-avatar">
            <img 
              v-if="user.picture && !imageLoadError" 
              :src="user.picture" 
              alt="User" 
              referrerpolicy="no-referrer"
              @error="imageLoadError = true"
            />
            <span v-else>{{ userStore.initials }}</span>
          </div>
          <div class="user-details">
            <span class="header-user-name">{{ user.name || 'User' }}</span>
            <span class="header-user-role">PLTD Tahuna</span>
          </div>
        </div>
        <button class="btn-logout" @click="logout" title="Sign Out">
          <span class="icon">↪️</span>
        </button>
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const user = ref({})
const imageLoadError = ref(false)

const isActive = (path) => {
  return route.path.startsWith(path)
}

// Helper function to get cookie value
const getCookie = (name) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
};

// Helper function to delete cookie
const deleteCookie = (name) => {
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
};

// Simple JWT decode fallback if library missing
const parseJwt = (token) => {
    try {
        return JSON.parse(atob(token.split('.')[1]));
    } catch (e) {
        return {};
    }
};

onMounted(() => {
  const token = getCookie('auth_token');
  if (token) {
    user.value = parseJwt(token);
  }
})

const userStore = computed(() => {
    const name = user.value.name || 'User';
    return {
        initials: name.charAt(0).toUpperCase()
    }
})

const logout = () => {
  deleteCookie('auth_token');
  router.push('/login');
}
</script>

<style scoped>
.logo-img {
  height: 40px;
  object-fit: contain;
}

.header-user {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.user-details {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
}

.header-user-name {
  font-weight: 600;
  font-size: 0.9rem;
  color: white;
}

.header-user-role {
  font-size: 0.75rem;
  color: rgba(255,255,255,0.7);
}

.header-user-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: rgba(255,255,255,0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border: 1px solid rgba(255,255,255,0.3);
  color: white;
  font-weight: bold;
}

.header-user-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.btn-logout {
  background: rgba(255,255,255,0.1);
  border: none;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-logout:hover {
  background: rgba(255,255,255,0.2);
}

/* Mobile responsive adjustments */
@media (max-width: 640px) {
  .user-details {
    display: none;
  }
}
</style>
