<template>
  <div class="app-wrapper">
    <AppHeader v-if="!isAuthPage" />
    
    <main class="app-content" :class="{ 'no-padding': isAuthPage }">
      <div class="container" :class="{ 'fluid': isAuthPage }">
        <router-view></router-view>
      </div>
    </main>
    
    <AppMenu v-if="!isAuthPage" />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AppHeader from './components/AppHeader.vue'
import AppMenu from './components/AppMenu.vue'

const route = useRoute()

const isAuthPage = computed(() => {
  return ['Login', 'LoginSuccess'].includes(route.name)
})
</script>

<style>
/* Utility for full screen auth */
.app-content.no-padding {
  padding-top: 0;
  padding-bottom: 0;
}
.container.fluid {
  max-width: 100%;
  padding: 0;
}
</style>
