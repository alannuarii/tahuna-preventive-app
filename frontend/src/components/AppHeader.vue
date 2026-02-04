<template>
  <header class="app-header">
    <div class="container header-content">
      <div class="header-logo">
        <span class="header-logo-icon">⚡</span>
        PLTD Tahuna
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
        <div class="header-user-avatar" style="background-color: #ddd;"></div>
        <span class="header-user-name">User</span>
      </div>
    </div>
  </header>
</template>

<script setup>
import { useRoute } from 'vue-router'

const route = useRoute()

const isActive = (path) => {
  return route.path.startsWith(path)
}
</script>
