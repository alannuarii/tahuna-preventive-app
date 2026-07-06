<template>
  <div :class="{ 'is-guest': isGuest }">
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>

<script setup lang="ts">
const { fetchEngines } = useEngines()
const { fetchPmCycles } = usePmCycles()
const { isGuest } = useAuth()

onMounted(() => {
  fetchEngines()
  fetchPmCycles()
})
</script>
