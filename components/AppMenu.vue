<template>
  <div class="app-menu">
    <div class="menu-content">
      <NuxtLink 
        to="/" 
        class="menu-item" 
        :class="{ active: isActive('/', true) }"
      >
        <span class="menu-item-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="7" height="7"></rect>
            <rect x="14" y="3" width="7" height="7"></rect>
            <rect x="14" y="14" width="7" height="7"></rect>
            <rect x="3" y="14" width="7" height="7"></rect>
          </svg>
        </span>
        <span class="menu-item-label">Dashboard</span>
      </NuxtLink>
      
      <NuxtLink 
        to="/jadwal" 
        class="menu-item" 
        :class="{ active: isActive('/jadwal') }"
      >
        <span class="menu-item-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
        </span>
        <span class="menu-item-label">Jadwal</span>
      </NuxtLink>
      
      <NuxtLink 
        to="/realisasi" 
        class="menu-item"
        :class="{ active: isActive('/realisasi') }"
      >
        <span class="menu-item-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
        </span>
        <span class="menu-item-label">Realisasi</span>
      </NuxtLink>

      <NuxtLink 
        to="/sop" 
        class="menu-item desktop-only-nav"
        :class="{ active: isActive('/sop') }"
      >
        <span class="menu-item-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
            <polyline points="10 9 9 9 8 9"/>
          </svg>
        </span>
        <span class="menu-item-label">SOP</span>
      </NuxtLink>

      <NuxtLink 
        to="/material" 
        class="menu-item"
        :class="{ active: isActive('/material') }"
      >
        <span class="menu-item-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
            <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
            <line x1="12" y1="22.08" x2="12" y2="12"/>
          </svg>
        </span>
        <span class="menu-item-label">Material</span>
      </NuxtLink>

      <NuxtLink 
        to="/engine-specifications" 
        class="menu-item desktop-only-nav"
        :class="{ active: isActive('/engine-specifications') }"
      >
        <span class="menu-item-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect>
            <rect x="9" y="9" width="6" height="6"></rect>
            <line x1="9" y1="1" x2="9" y2="4"></line>
            <line x1="15" y1="1" x2="15" y2="4"></line>
            <line x1="9" y1="20" x2="9" y2="23"></line>
            <line x1="15" y1="20" x2="15" y2="23"></line>
            <line x1="20" y1="9" x2="23" y2="9"></line>
            <line x1="20" y1="15" x2="23" y2="15"></line>
            <line x1="1" y1="9" x2="4" y2="9"></line>
            <line x1="1" y1="15" x2="4" y2="15"></line>
          </svg>
        </span>
        <span class="menu-item-label">Spesifikasi</span>
      </NuxtLink>

      <NuxtLink 
        v-if="user?.email === 'daengpython@gmail.com'"
        to="/chat" 
        class="menu-item desktop-only-nav"
        :class="{ active: isActive('/chat') }"
      >
        <span class="menu-item-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        </span>
        <span class="menu-item-label">Tahuna AI</span>
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const { user } = useAuth()

const isActive = (path: string, exact?: boolean) => {
  if (exact) return route.path === path
  return route.path.startsWith(path)
}
</script>

<style scoped>
@media (max-width: 767px) {
  .desktop-only-nav {
    display: none !important;
  }
}
.app-menu {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(12, 12, 20, 0.85);
  backdrop-filter: blur(24px) saturate(180%);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  z-index: 100;
  padding-bottom: env(safe-area-inset-bottom, 0px);
}

.menu-content {
  display: flex;
  align-items: center;
  justify-content: space-around;
  max-width: 500px;
  margin: 0 auto;
  padding: 0.5rem 1rem;
}

.menu-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  gap: 3px;
  padding: 0.5rem 0;
  color: var(--gray-400);
  font-size: 0.65rem;
  font-weight: 500;
  border-radius: 1rem;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  text-decoration: none;
  position: relative;
  letter-spacing: 0.02em;
}

.menu-item:hover {
  color: var(--gray-600);
}

.menu-item.active {
  color: var(--primary-300);
}

.menu-item.active .menu-item-icon {
  transform: translateY(-2px);
}

.menu-item.active::after {
  content: '';
  position: absolute;
  bottom: -3px;
  left: 50%;
  transform: translateX(-50%);
  width: 5px;
  height: 5px;
  background: var(--primary-400);
  border-radius: 50%;
  box-shadow: 0 0 10px rgba(99, 102, 241, 0.6);
  animation: pulseGlowDot 2s ease-in-out infinite;
}

@keyframes pulseGlowDot {
  0%, 100% { box-shadow: 0 0 6px rgba(99, 102, 241, 0.5); }
  50% { box-shadow: 0 0 14px rgba(99, 102, 241, 0.8); }
}

.menu-item-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.menu-item-icon svg {
  width: 22px;
  height: 22px;
}

.menu-item-label {
  font-size: 0.6rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

@media (min-width: 768px) {
  .app-menu {
    top: var(--header-height);
    bottom: 0;
    width: var(--sidebar-width);
    left: 0;
    right: auto;
    border-top: none;
    border-right: 1px solid rgba(255, 255, 255, 0.06);
    background: rgba(12, 12, 20, 0.5);
    backdrop-filter: blur(20px);
    padding-bottom: 0;
  }

  .menu-content {
    flex-direction: column;
    justify-content: flex-start;
    max-width: none;
    padding: 1.5rem 1rem;
    gap: 0.5rem;
  }

  .menu-item {
    flex-direction: row;
    justify-content: flex-start;
    width: 100%;
    flex: none;
    padding: 0.75rem 1rem;
    font-size: 0.85rem;
    border-radius: 0.75rem;
    gap: 0.75rem;
  }

  .menu-item:hover {
    background: rgba(255, 255, 255, 0.04);
  }

  .menu-item.active {
    background: rgba(99, 102, 241, 0.1);
  }

  .menu-item.active .menu-item-icon {
    transform: none;
  }

  .menu-item.active::after {
    top: 50%;
    left: 0;
    bottom: auto;
    transform: translateY(-50%);
    width: 3px;
    height: 55%;
    border-radius: 0 4px 4px 0;
    background: var(--primary-400);
    box-shadow: 0 0 12px rgba(99, 102, 241, 0.6);
    animation: none;
  }

  .menu-item-icon svg {
    width: 20px;
    height: 20px;
  }

  .menu-item-label {
    font-size: 0.85rem;
    text-transform: none;
    letter-spacing: normal;
    font-weight: 500;
  }
}
</style>
