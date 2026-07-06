<template>
  <div class="card">
    <div class="card-header flex justify-between items-center">
      <span>{{ label }}</span>
      <button type="button" class="btn btn-sm btn-secondary guest-hide" @click="addItem" style="padding: 2px 8px; font-size: 0.7rem;">
        + Tambah
      </button>
    </div>
    <div class="card-body">
      <div v-if="modelValue.length === 0" class="text-center text-muted text-sm py-3">
        Belum ada item
      </div>
      <div 
        v-else
        v-for="(item, index) in modelValue" 
        :key="index" 
        class="sop-edit-item"
        :class="{ 'is-dragging': draggedIndex === index }"
        :draggable="draggableActive === index"
        @dragstart="dragStart(index, $event)"
        @dragenter="dragEnter(index)"
        @dragend="dragEnd"
        @dragover.prevent
      >
        <!-- Drag Handle -->
        <div 
          class="sop-drag-handle"
          @mousedown="enableDrag(index)"
          @mouseup="disableDrag"
          @mouseleave="disableDrag"
          @touchstart="enableDrag(index)"
          @touchend="disableDrag"
          title="Drag untuk mengatur urutan"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="9" cy="5" r="1" fill="currentColor"/>
            <circle cx="9" cy="12" r="1" fill="currentColor"/>
            <circle cx="9" cy="19" r="1" fill="currentColor"/>
            <circle cx="15" cy="5" r="1" fill="currentColor"/>
            <circle cx="15" cy="12" r="1" fill="currentColor"/>
            <circle cx="15" cy="19" r="1" fill="currentColor"/>
          </svg>
        </div>

        <span v-if="numbered" class="sop-edit-number">{{ index + 1 }}.</span>
        
        <textarea
          :value="item"
          @input="updateItem(index, ($event.target as HTMLTextAreaElement).value)"
          class="form-input form-input-sm sop-edit-textarea"
          rows="2"
        ></textarea>
        
        <div class="sop-edit-actions">
          <button 
            type="button" 
            class="sop-action-btn sop-move-btn" 
            :disabled="index === 0" 
            @click="moveUp(index)" 
            title="Pindah ke Atas"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="18 15 12 9 6 15"/>
            </svg>
          </button>
          
          <button 
            type="button" 
            class="sop-action-btn sop-move-btn" 
            :disabled="index === modelValue.length - 1" 
            @click="moveDown(index)" 
            title="Pindah ke Bawah"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>
          
          <button 
            type="button" 
            class="sop-action-btn sop-edit-remove" 
            @click="removeItem(index)" 
            aria-label="Hapus"
            title="Hapus"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  modelValue: string[]
  label: string
  numbered?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string[]]
}>()

// Reorder via Drag and Drop
const draggedIndex = ref<number | null>(null)
const draggableActive = ref<number | null>(null)

const enableDrag = (index: number) => {
  draggableActive.value = index
}

const disableDrag = () => {
  draggableActive.value = null
}

const dragStart = (index: number, event: DragEvent) => {
  draggedIndex.value = index
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
  }
}

const dragEnter = (index: number) => {
  if (draggedIndex.value === null || draggedIndex.value === index) return
  
  const arr = [...props.modelValue]
  const item = arr.splice(draggedIndex.value, 1)[0]
  arr.splice(index, 0, item)
  
  draggedIndex.value = index
  emit('update:modelValue', arr)
}

const dragEnd = () => {
  draggedIndex.value = null
  draggableActive.value = null
}

// Reorder via Buttons
const moveUp = (index: number) => {
  if (index === 0) return
  const arr = [...props.modelValue]
  const item = arr.splice(index, 1)[0]
  arr.splice(index - 1, 0, item)
  emit('update:modelValue', arr)
}

const moveDown = (index: number) => {
  if (index === props.modelValue.length - 1) return
  const arr = [...props.modelValue]
  const item = arr.splice(index, 1)[0]
  arr.splice(index + 1, 0, item)
  emit('update:modelValue', arr)
}

const addItem = () => {
  emit('update:modelValue', [...props.modelValue, ''])
}

const removeItem = (index: number) => {
  const arr = [...props.modelValue]
  arr.splice(index, 1)
  emit('update:modelValue', arr)
}

const updateItem = (index: number, value: string) => {
  const arr = [...props.modelValue]
  arr[index] = value
  emit('update:modelValue', arr)
}
</script>

<style scoped>
.sop-edit-item {
  display: flex;
  align-items: flex-start;
  gap: var(--space-2);
  margin-bottom: var(--space-2);
  padding: 4px;
  border-radius: var(--radius-md);
  transition: all 0.2s ease;
  border: 1px solid transparent;
}

.sop-edit-item.is-dragging {
  opacity: 0.5;
  background: rgba(59, 130, 246, 0.05);
  border: 1px dashed var(--primary-300, #3b82f6);
}

.sop-drag-handle {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 38px;
  color: var(--gray-400);
  cursor: grab;
  user-select: none;
  transition: color 0.15s ease;
}

.sop-drag-handle:hover {
  color: var(--primary-500, #3b82f6);
}

.sop-drag-handle:active {
  cursor: grabbing;
}

.sop-edit-number {
  flex-shrink: 0;
  width: 20px;
  padding-top: 8px;
  font-size: var(--font-size-xs);
  font-weight: 600;
  color: var(--gray-500);
  text-align: right;
}

.sop-edit-textarea {
  flex: 1;
  font-size: var(--font-size-sm) !important;
  resize: vertical;
  min-height: 38px;
}

.sop-edit-actions {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 4px;
  height: 38px;
}

.sop-action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.15s ease;
}

.sop-move-btn {
  background: var(--gray-100, rgba(0, 0, 0, 0.05));
  color: var(--gray-600);
}

.sop-move-btn:hover:not(:disabled) {
  background: var(--primary-100, rgba(59, 130, 246, 0.1));
  color: var(--primary-600, #2563eb);
}

.sop-move-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.sop-edit-remove {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.sop-edit-remove:hover {
  background: rgba(239, 68, 68, 0.2);
}
</style>
