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
          
          <div class="mobile-user-dropdown" ref="dropdownRef">
            <button class="header-user-trigger" @click="toggleDropdown">
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
              <svg class="chevron-icon" :class="{ 'rotated': dropdownOpen }" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>

            <div v-if="dropdownOpen" class="dropdown-menu animate-dropdown">
              <div class="dropdown-header">
                <span class="header-user-name">{{ user?.name || 'User' }}</span>
                <span class="header-user-role">{{ isGuest ? '' : 'TL Pemeliharaan' }}</span>
              </div>
              
              <div class="dropdown-divider"></div>
              
              <div class="dropdown-links">
                <NuxtLink to="/sop" class="dropdown-item" @click="dropdownOpen = false">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                  </svg>
                  <span>Instruksi Kerja (SOP)</span>
                </NuxtLink>
                
                <NuxtLink to="/engine-specifications" class="dropdown-item" @click="dropdownOpen = false">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect>
                    <rect x="9" y="9" width="6" height="6"></rect>
                    <line x1="9" y1="1" x2="9" y2="4"></line><line x1="15" y1="1" x2="15" y2="4"></line>
                  </svg>
                  <span>Spesifikasi Mesin</span>
                </NuxtLink>
              </div>

              <div class="dropdown-divider"></div>

              <button class="dropdown-item text-danger" @click="handleLogout">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="16 17 21 12 16 7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
                <span>Sign Out</span>
              </button>
            </div>
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
          <span class="header-user-role">{{ isGuest ? '' : 'TL Pemeliharaan' }}</span>
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
import { onMounted, onUnmounted, ref, computed } from 'vue'

const user = ref<any>({})
const isGuest = computed(() => user.value?.role === 'guest')
const imgError = ref(false)
const dropdownOpen = ref(false)
const dropdownRef = ref<HTMLElement | null>(null)

const toggleDropdown = () => {
  dropdownOpen.value = !dropdownOpen.value
}

const handleClickOutside = (e: MouseEvent) => {
  if (dropdownRef.value && !dropdownRef.value.contains(e.target as Node)) {
    dropdownOpen.value = false
  }
}

onMounted(() => {
  const u = getUser()
  if (u) user.value = u
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
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

/* Mobile Dropdown Specific Styles */
.mobile-user-dropdown {
  position: relative;
}

.header-user-trigger {
  display: flex;
  align-items: center;
  gap: 6px;
  background: transparent;
  border: none;
  padding: 0;
  cursor: pointer;
  color: var(--gray-400);
}

.chevron-icon {
  transition: transform 0.2s ease;
  opacity: 0.7;
}

.chevron-icon.rotated {
  transform: rotate(180deg);
}

.dropdown-menu {
  position: absolute;
  top: calc(100% + 12px);
  right: 0;
  width: 240px;
  background: var(--bg-card);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: var(--radius-lg);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6);
  padding: 8px;
  z-index: 9999;
}

.dropdown-header {
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
}

.dropdown-divider {
  height: 1px;
  background: rgba(255, 255, 255, 0.06);
  margin: 6px 4px;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 8px;
  color: var(--gray-300);
  text-decoration: none;
  font-size: 0.85rem;
  font-weight: 500;
  transition: all 0.2s ease;
  width: 100%;
  text-align: left;
  background: transparent;
  border: none;
  cursor: pointer;
}

.dropdown-item:hover {
  background: rgba(255, 255, 255, 0.05);
  color: white;
}

.dropdown-item.text-danger {
  color: #ef4444;
}

.dropdown-item.text-danger:hover {
  background: rgba(239, 68, 68, 0.1);
  color: #fca5a5;
}

.animate-dropdown {
  animation: slideDown 0.2s cubic-bezier(0.4, 0, 0.2, 1) forwards;
  transform-origin: top right;
}

@keyframes slideDown {
  from { opacity: 0; transform: translateY(-8px) scale(0.95); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

/* Maintain original reused styles */
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
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.95);
}

.header-user-role {
  font-size: 0.7rem;
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

@media (max-width: 767px) {
  .desktop-header-user {
    display: none !important;
  }
}

@media (min-width: 768px) {
  .mobile-user-dropdown {
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
