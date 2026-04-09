<template>
  <div class="segmented-control" ref="containerRef">
    <div
      class="seg-indicator"
      :style="{
        left: indicatorStyle.left,
        width: indicatorStyle.width,
      }"
    />
    <button
      v-for="option in options"
      :key="option.value"
      class="seg-btn"
      :class="{ active: modelValue === option.value }"
      @click="$emit('update:modelValue', option.value)"
    >
      <span class="seg-icon" v-html="option.icon"></span>
      <span class="seg-label">{{ option.label }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
interface SegmentOption {
  value: string
  label: string
  icon: string
}

const props = defineProps<{
  options: SegmentOption[]
  modelValue: string
}>()

defineEmits<{
  'update:modelValue': [value: string]
}>()

const containerRef = ref<HTMLDivElement>()
const indicatorStyle = ref({ left: '0px', width: '0px' })

const updateIndicator = () => {
  if (!containerRef.value) return
  const activeIndex = props.options.findIndex(o => o.value === props.modelValue)
  if (activeIndex === -1) return
  const buttons = containerRef.value.querySelectorAll<HTMLButtonElement>('.seg-btn')
  const btn = buttons[activeIndex]
  if (btn) {
    indicatorStyle.value = {
      left: `${btn.offsetLeft}px`,
      width: `${btn.offsetWidth}px`,
    }
  }
}

watch(() => props.modelValue, () => {
  nextTick(updateIndicator)
})

onMounted(() => {
  nextTick(updateIndicator)
})
</script>

<style scoped>
.segmented-control {
  position: relative;
  display: flex;
  background: var(--bg-elevated);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-xl);
  padding: 4px;
  gap: 0;
  width: 100%;
  overflow: hidden;
}

.seg-indicator {
  position: absolute;
  top: 4px;
  bottom: 4px;
  border-radius: calc(var(--radius-xl) - 2px);
  background: linear-gradient(135deg, var(--primary-500), var(--primary-600));
  box-shadow: 
    0 0 16px var(--primary-glow),
    0 2px 8px rgba(0, 0, 0, 0.3);
  transition: left 0.35s cubic-bezier(0.34, 1.56, 0.64, 1),
              width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 1;
}

.seg-btn {
  position: relative;
  z-index: 2;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 0.65rem 0.5rem;
  background: transparent;
  border: none;
  border-radius: calc(var(--radius-xl) - 2px);
  cursor: pointer;
  font-family: var(--font-family);
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--gray-400);
  transition: color 0.25s ease;
  white-space: nowrap;
  -webkit-tap-highlight-color: transparent;
  user-select: none;
}

.seg-btn:active {
  transform: scale(0.97);
}

.seg-btn.active {
  color: white;
  font-weight: 600;
}

.seg-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

.seg-icon :deep(svg) {
  width: 16px;
  height: 16px;
}

.seg-label {
  font-size: 0.78rem;
  letter-spacing: 0.01em;
}

@media (max-width: 767px) {
  .seg-label {
    display: none;
  }
}

@media (min-width: 768px) {
  .segmented-control {
    width: auto;
    min-width: 240px;
  }

  .seg-btn {
    padding: 0.5rem 1rem;
    font-size: 0.82rem;
  }
}
</style>
