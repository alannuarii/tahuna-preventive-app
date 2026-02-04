<template>
  <div class="app-menu">
    <div class="menu-content">
      <router-link 
        to="/preventive" 
        class="menu-item" 
        :class="{ active: isActive('/preventive') && !isActive('/preventive/realisasi') }"
      >
        <span class="menu-item-icon">📅</span>
        <span>Jadwal</span>
      </router-link>
      
      <router-link 
        to="/preventive/realisasi" 
        class="menu-item"
        :class="{ active: isActive('/preventive/realisasi') }"
      >
        <span class="menu-item-icon">✓</span>
        <span>Realisasi</span>
      </router-link>
    </div>
  </div>
</template>

<script setup>
import { useRoute } from 'vue-router'

const route = useRoute()

const isActive = (path) => {
  return route.path.startsWith(path)
}
</script>
