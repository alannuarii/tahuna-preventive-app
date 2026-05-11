<template>
  <div class="container py-6">
    <div class="header-section mb-6">
      <h1 class="font-bold">Spesifikasi Teknis Mesin</h1>
      <p class="text-muted text-sm mt-1">Daftar spesifikasi teknis dari setiap unit mesin pembangkit.</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <NuxtLink 
        v-for="engine in engines" 
        :key="engine.id" 
        :to="`/engine-specifications/${engine.id}`"
        class="engine-card-link"
      >
        <div class="card engine-card glass-hover">
          <div class="card-body flex flex-col gap-4">
            <div class="flex items-center gap-4">
              <div class="icon-wrapper flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-primary-300">
                  <path d="M3 10h18M7 15h1M11 15h1M15 15h1M19 15h1M5 10l1-4h12l1 4M4 20h16a1 1 0 0 0 1-1v-9a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1z"></path>
                </svg>
              </div>
              <div class="flex-1">
                <h3 class="font-bold text-lg mb-1">{{ engine.name }}</h3>
                <span class="badge badge-primary badge-sm">{{ engine.manufacturer }}</span>
              </div>
              <div class="arrow-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M9 18l6-6-6-6"></path>
                </svg>
              </div>
            </div>
            <p class="text-xs text-muted">{{ engine.description }}</p>
          </div>
        </div>
      </NuxtLink>
    </div>
  </div>
</template>

<script setup>
definePageMeta({
  layout: 'default'
})

useHead({
  title: 'Spesifikasi Teknis - PLTD Tahuna'
})

const engines = [
  {
    id: 'swd',
    name: 'SWD 6 FHD 240 / 6 FDHD 240',
    manufacturer: 'Stork Werkspoor',
    description: '4-Stroke diesel engine with trunk pistons and direct fuel injection.'
  },
  {
    id: 'deutz',
    name: 'Deutz MWM TBD 616 V12',
    manufacturer: 'Deutz AG',
    description: 'Empat langkah (Four-stroke), Injeksi langsung, Turbocharging, Intercooling.'
  },
  {
    id: 'mitsubishi',
    name: 'Mitsubishi S16R-PTA-S',
    manufacturer: 'Mitsubishi Heavy Industries',
    description: 'Water-cooled 4-stroke cycle, turbocharged with air cooler.'
  },
  {
    id: 'cummins',
    name: 'Cummins KTA50-G8',
    manufacturer: 'Cummins',
    description: 'V16 cylinder engine widely used for reliable prime & standby power generation.'
  }
]
</script>

<style scoped>
.engine-card-link {
  text-decoration: none;
  display: block;
  transition: transform var(--transition-base);
}

.engine-card-link:hover {
  transform: translateY(-4px);
}

.engine-card {
  height: 100%;
  cursor: pointer;
  transition: all var(--transition-base);
}

.engine-card:hover {
  background: rgba(30, 30, 48, 0.8);
  border-color: var(--primary-400);
  box-shadow: 0 8px 24px rgba(99, 102, 241, 0.15);
}

.icon-wrapper {
  width: 56px;
  height: 56px;
  background: var(--primary-100);
  border-radius: var(--radius-lg);
  flex-shrink: 0;
}

.arrow-icon {
  color: var(--gray-500);
  transition: transform var(--transition-base), color var(--transition-base);
}

.engine-card:hover .arrow-icon {
  transform: translateX(4px);
  color: var(--primary-300);
}

.text-primary-300 {
  color: var(--primary-300);
}
</style>
