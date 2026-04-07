<template>
  <div class="pagination-container">
    <div class="pagination-mobile">
      <button 
        @click="$emit('change', currentPage - 1)" 
        :disabled="currentPage === 1"
        class="btn-pagination"
      >
        Previous
      </button>
      
      <span class="pagination-text">
        Page {{ currentPage }}
      </span>

      <button 
        @click="$emit('change', currentPage + 1)" 
        :disabled="currentPage === totalPages"
        class="btn-pagination"
      >
        Next
      </button>
    </div>

    <div class="pagination-desktop">
      <div class="pagination-info">
        Showing <strong>{{ (currentPage - 1) * 10 + 1 }}</strong> to <strong>{{ Math.min(currentPage * 10, total) }}</strong> of <strong>{{ total }}</strong> results
      </div>
      
      <div class="pagination-controls">
        <button 
          @click="$emit('change', currentPage - 1)" 
          :disabled="currentPage === 1"
          class="btn-icon"
          title="Previous"
        >
          &lt;
        </button>
        
        <template v-for="(page, index) in visiblePages" :key="index">
          <span v-if="page === '...'" class="pagination-dots">...</span>
          <button 
            v-else
            @click="$emit('change', page as number)"
            class="btn-page"
            :class="{ active: page === currentPage }"
          >
            {{ page }}
          </button>
        </template>
        
        <button 
          @click="$emit('change', currentPage + 1)" 
          :disabled="currentPage === totalPages"
          class="btn-icon"
          title="Next"
        >
          &gt;
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  currentPage: number
  totalPages: number
  total: number
}>()

defineEmits<{
  change: [page: number]
}>()

const visiblePages = computed(() => {
  const total = props.totalPages
  const current = props.currentPage
  const delta = 1

  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)

  const pages: (number | string)[] = []
  pages.push(1)

  let left = Math.max(2, current - delta)
  let right = Math.min(total - 1, current + delta)

  if (current <= 3) right = 4
  if (current >= total - 2) left = total - 3

  if (left > 2) pages.push('...')
  for (let i = left; i <= right; i++) pages.push(i)
  if (right < total - 1) pages.push('...')
  pages.push(total)

  return pages
})
</script>

<style scoped>
.pagination-container {
  margin-top: var(--space-4);
  padding: var(--space-4);
}

.pagination-mobile {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.pagination-desktop {
  display: none;
}

@media (min-width: 640px) {
  .pagination-mobile { display: none; }
  .pagination-desktop {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
}

.pagination-info {
  font-size: var(--font-size-sm);
  color: var(--gray-500);
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: var(--space-1);
}

.btn-pagination {
  padding: var(--space-2) var(--space-4);
  background: var(--bg-elevated);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  color: var(--gray-600);
  font-size: var(--font-size-sm);
  font-family: var(--font-family);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn-pagination:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.btn-pagination:hover:not(:disabled) {
  background: var(--bg-hover);
  border-color: var(--primary-500);
  color: var(--primary-300);
}

.btn-page {
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  color: var(--gray-500);
  font-size: var(--font-size-sm);
  font-family: var(--font-family);
  cursor: pointer;
  transition: all 0.2s;
}

.btn-page:hover {
  background: var(--bg-hover);
  color: var(--gray-800);
}

.btn-page.active {
  background: var(--primary-500);
  color: white;
  box-shadow: 0 0 12px var(--primary-glow);
  border-color: transparent;
}

.pagination-dots {
  color: var(--gray-400);
  padding: 0 4px;
}

.pagination-text {
  font-size: var(--font-size-sm);
  color: var(--gray-500);
}
</style>
