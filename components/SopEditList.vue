<template>
  <div class="card">
    <div class="card-header flex justify-between items-center">
      <span>{{ label }}</span>
      <button type="button" class="btn btn-sm btn-secondary" @click="addItem" style="padding: 2px 8px; font-size: 0.7rem;">
        + Tambah
      </button>
    </div>
    <div class="card-body">
      <div v-if="modelValue.length === 0" class="text-center text-muted text-sm py-3">
        Belum ada item
      </div>
      <div v-for="(item, index) in modelValue" :key="index" class="sop-edit-item">
        <span v-if="numbered" class="sop-edit-number">{{ index + 1 }}.</span>
        <textarea
          :value="item"
          @input="updateItem(index, ($event.target as HTMLTextAreaElement).value)"
          class="form-input form-input-sm sop-edit-textarea"
          rows="2"
        ></textarea>
        <button type="button" class="sop-edit-remove" @click="removeItem(index)" aria-label="Hapus">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  modelValue: string[]
  label: string
  numbered?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string[]]
}>()

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
}

.sop-edit-number {
  flex-shrink: 0;
  width: 24px;
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

.sop-edit-remove {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  margin-top: 5px;
  border: none;
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.15s ease;
}

.sop-edit-remove:hover {
  background: rgba(239, 68, 68, 0.2);
}
</style>
