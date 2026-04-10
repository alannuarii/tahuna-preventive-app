<template>
  <div class="notification-wrapper" ref="wrapperRef">
    <button class="btn-notification" @click="toggleDropdown" title="Notifikasi Laporan WA">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
        <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
      </svg>
      <!-- Indikator pesan baru (tanpa angka) -->
      <span v-if="hasUnread" class="notification-indicator"></span>
    </button>
    
    <!-- Dropdown -->
    <div v-show="isOpen" class="notification-dropdown animate-fade-in">
      <div class="dropdown-header">
        <h4 class="m-0 text-sm font-semibold">Notifikasi</h4>
        <button v-if="hasUnread" class="btn-refresh" @click="fetchNotifications" title="Refresh">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="23 4 23 10 17 10"></polyline>
            <polyline points="1 20 1 14 7 14"></polyline>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
          </svg>
        </button>
      </div>
      
      <div class="dropdown-body">
        <div v-if="loading" class="text-center py-4 text-muted text-xs">
          Memuat...
        </div>
        <div v-else-if="notifications.length === 0" class="text-center py-4 text-muted text-xs">
          Tidak ada notifikasi baru
        </div>
        <div v-else class="notification-list">
          <div 
            v-for="item in notifications" 
            :key="item.id" 
            class="notification-item"
            @click="goToRealisasi(item.id)"
          >
            <div class="notification-icon">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
            </div>
            <div class="notification-content">
              <p class="notification-text">Laporan WA baru diterima, klik untuk verifikasi.</p>
              <span class="notification-time">{{ formatDate(item.created_at) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const isOpen = ref(false)
const wrapperRef = ref<HTMLElement | null>(null)
const notifications = ref<any[]>([])
const loading = ref(false)
const router = useRouter()

const hasUnread = computed(() => notifications.value.length > 0)

const fetchNotifications = async () => {
  loading.value = true
  try {
    const res = await fetch('/api/notifications')
    if (res.ok) {
      const data = await res.json()
      notifications.value = data.notifications || []
    }
  } catch (err) {
    console.error('Failed to fetch notifications:', err)
  } finally {
    loading.value = false
  }
}

let intervalId: any = null

onMounted(() => {
  fetchNotifications()
  // Poll every 30 seconds
  intervalId = setInterval(fetchNotifications, 30000)
  
  // Close dropdown on outside click
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  if (intervalId) clearInterval(intervalId)
  document.removeEventListener('click', handleClickOutside)
})

const toggleDropdown = () => {
  isOpen.value = !isOpen.value
  if (isOpen.value) fetchNotifications()
}

const handleClickOutside = (e: MouseEvent) => {
  if (wrapperRef.value && !wrapperRef.value.contains(e.target as Node)) {
    isOpen.value = false
  }
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' ' + d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })
}

const goToRealisasi = (id: number) => {
  isOpen.value = false
  router.push({ path: '/realisasi/input', query: { notificationId: id.toString() } })
}
</script>

<style scoped>
.notification-wrapper {
  position: relative;
  z-index: 100;
}

.btn-notification {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.08);
  width: 38px;
  height: 38px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  color: var(--gray-300);
  position: relative;
}

.btn-notification:hover {
  background: rgba(255, 255, 255, 0.12);
  color: white;
}

.notification-indicator {
  position: absolute;
  top: 8px;
  right: 10px;
  width: 8px;
  height: 8px;
  background-color: var(--danger);
  border-radius: 50%;
  border: 2px solid var(--bg-surface);
  box-shadow: 0 0 8px rgba(239, 68, 68, 0.6);
  animation: pulse-red 2s infinite;
}

@keyframes pulse-red {
  0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
  70% { transform: scale(1.1); box-shadow: 0 0 0 6px rgba(239, 68, 68, 0); }
  100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
}

.notification-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 280px;
  background: var(--bg-surface);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  box-shadow: 0 10px 25px rgba(0,0,0,0.3);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.dropdown-header {
  padding: var(--space-3) var(--space-4);
  border-bottom: 1px solid var(--glass-border);
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(255, 255, 255, 0.02);
}

.btn-refresh {
  background: transparent;
  border: none;
  color: var(--gray-400);
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
}
.btn-refresh:hover {
  background: rgba(255, 255, 255, 0.05);
  color: white;
}

.dropdown-body {
  max-height: 300px;
  overflow-y: auto;
}

.notification-item {
  display: flex;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  border-bottom: 1px solid rgba(255,255,255,0.03);
  cursor: pointer;
  transition: background 0.2s;
}

.notification-item:hover {
  background: rgba(255, 255, 255, 0.05);
}

.notification-icon {
  color: var(--primary-400);
  background: rgba(59, 130, 246, 0.1);
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.notification-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.notification-text {
  font-size: var(--font-size-xs);
  color: var(--gray-300);
  margin: 0;
  line-height: 1.3;
}

.notification-time {
  font-size: 0.65rem;
  color: var(--gray-500);
}
</style>
