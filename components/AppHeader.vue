<template>
  <div>
    <header class="app-header">
      <div class="header-content">
        <div class="header-left">
          <div class="header-brand">
            <img src="/images/npwhite.png" alt="PLTD Tahuna" class="logo-img" />
          </div>
          <div class="header-title">
            <span class="header-app-name">Aplikasi Preventive Maintenance PLTD Tahuna</span>
          </div>
        </div>
        
        <div class="header-right">
          <AppNotificationBell />
          <div class="header-user mobile-header-user">
          <div class="user-info">
            <div class="header-user-avatar">
              <img 
                v-if="user?.picture && !imgError" 
                :src="user.picture" 
                alt="User" 
                referrerpolicy="no-referrer"
                @error="imgError = true"
              />
              <span v-else>{{ (user?.name || 'U').charAt(0).toUpperCase() }}</span>
            </div>
            <div class="user-details">
              <span class="header-user-name">{{ user?.name || 'User' }}</span>
              <span class="header-user-role">Preventive Maintenance</span>
            </div>
          </div>
          <button class="btn-logout" @click="handleLogout" title="Sign Out">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </button>
          </div>
        </div>
      </div>
    </header>

    <div class="header-user desktop-header-user">
      <div class="user-info">
        <div class="header-user-avatar">
          <img 
            v-if="user?.picture && !imgError" 
            :src="user.picture" 
            alt="User" 
            referrerpolicy="no-referrer"
            @error="imgError = true"
          />
          <span v-else>{{ (user?.name || 'U').charAt(0).toUpperCase() }}</span>
        </div>
        <div class="user-details">
          <span class="header-user-name">{{ user?.name || 'User' }}</span>
          <span class="header-user-role">Preventive Maintenance</span>
        </div>
      </div>
      <button class="btn-logout" @click="handleLogout" title="Sign Out">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
          <polyline points="16 17 21 12 16 7"/>
          <line x1="21" y1="12" x2="9" y2="12"/>
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { getUser, logout } from '~/utils/auth'

const user = ref<any>({})
const imgError = ref(false)

onMounted(() => {
  const u = getUser()
  if (u) user.value = u
})

const handleLogout = () => {
  logout()
}
</script>

<style scoped>
.logo-img {
  height: 36px;
  object-fit: contain;
}

.header-left {
  display: flex;
  align-items: center;
  height: 100%;
}

.header-brand {
  display: flex;
  align-items: center;
  padding-left: var(--space-4);
}

.header-title {
  display: flex;
  align-items: center;
}

.header-app-name {
  font-size: 0.9rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  letter-spacing: -0.01em;
}

@media (max-width: 480px) {
  .header-app-name {
    display: none;
  }
}

@media (min-width: 768px) {
  .header-brand {
    width: var(--sidebar-width);
    padding-left: 1.5rem;
    flex-shrink: 0;
  }
  
  .header-title {
    padding-left: var(--space-4);
  }
  
  .header-app-name {
    font-size: 1.05rem;
  }
}

.header-right {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding-right: var(--space-4);
}

.header-user {
  display: flex;
  align-items: center;
  gap: 0.75rem;
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
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.9);
}

.header-user-role {
  font-size: 0.65rem;
  color: rgba(255, 255, 255, 0.4);
  font-weight: 400;
}

.header-user-avatar {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary-500), var(--primary-700));
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border: 2px solid rgba(255, 255, 255, 0.1);
  color: white;
  font-weight: 700;
  font-size: 0.85rem;
  box-shadow: 0 0 12px var(--primary-glow);
}

.header-user-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.btn-logout {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.08);
  width: 34px;
  height: 34px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  color: var(--gray-400);
}

.btn-logout:hover {
  background: rgba(239, 68, 68, 0.15);
  border-color: rgba(239, 68, 68, 0.3);
  color: var(--danger);
}

@media (max-width: 640px) {
  .user-details {
    display: none;
  }
}

@media (max-width: 767px) {
  .desktop-header-user {
    display: none !important;
  }
}

@media (min-width: 768px) {
  .mobile-header-user {
    display: none !important;
  }
  
  .header-user.desktop-header-user {
    position: fixed;
    bottom: 0;
    left: 0;
    width: var(--sidebar-width);
    padding: 1.25rem 1.5rem;
    background: transparent;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
    justify-content: space-between;
    z-index: 102;
  }
  
  :deep(.app-menu) {
    padding-bottom: 80px; 
  }
}
</style>
