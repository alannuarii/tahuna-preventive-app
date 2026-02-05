<template>
  <div class="pagination-container">
    <!-- Mobile View -->
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

    <!-- Desktop View -->
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
            @click="$emit('change', page)"
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

<script setup>
import { computed } from 'vue'

const props = defineProps({
  currentPage: { type: Number, required: true },
  totalPages: { type: Number, required: true },
  total: { type: Number, required: true }
})

defineEmits(['change'])

const visiblePages = computed(() => {
  const total = props.totalPages
  const current = props.currentPage
  const delta = 1 

  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)

  const pages = []
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
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 1rem;
  border-top: 1px solid #e5e7eb;
  background-color: white;
  width: 100%;
}

/* Base Buttons */
button {
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid #d1d5db;
  background-color: white;
  color: #374151;
  border-radius: 0.375rem;
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background-color: #f3f4f6;
}

button:hover:not(:disabled) {
  background-color: #f9fafb;
}

/* Mobile Styling */
.pagination-mobile {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  gap: 1rem;
}

.pagination-text {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}

.btn-pagination {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
}

/* Desktop Styling */
.pagination-desktop {
  display: none; /* Hidden by default (mobile first) */
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.pagination-info {
  font-size: 0.875rem;
  color: #374151;
}

.pagination-controls {
  display: flex;
  gap: 0.25rem;
  align-items: center;
}

.btn-page {
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  font-weight: 500;
  min-width: 2rem;
}

.btn-page.active {
  background-color: #2563eb; /* Primary Blue */
  color: white;
  border-color: #2563eb;
}

.btn-icon {
  padding: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
}

.pagination-dots {
  padding: 0.5rem;
  color: #6b7280;
  font-size: 0.875rem;
}

/* Responsive Media Query */
@media (min-width: 640px) {
  .pagination-mobile {
    display: none;
  }
  
  .pagination-desktop {
    display: flex;
  }
}
</style>
