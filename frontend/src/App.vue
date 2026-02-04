<template>
  <div class="app-wrapper">
    <AppHeader />
    
    <main class="app-content">
      <div class="container">
        <router-view></router-view>
      </div>
    </main>
    
    <AppMenu />
  </div>
</template>

<script setup>
import AppHeader from './components/AppHeader.vue'
import AppMenu from './components/AppMenu.vue'
</script>
