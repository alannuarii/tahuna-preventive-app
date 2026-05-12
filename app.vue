<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup lang="ts">
const { fetchEngines } = useEngines()
const { fetchPmCycles } = usePmCycles()

onMounted(() => {
  fetchEngines()
  fetchPmCycles()
})
</script>
