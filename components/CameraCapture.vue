<template>
  <Teleport to="#teleports">
  <div v-if="isOpen" class="camera-overlay">
    <!-- Header -->
    <div class="camera-header">
      <button class="camera-ctrl-btn" @click="closeCamera" aria-label="Tutup Kamera">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>

      <span class="camera-title">{{ title }}</span>

      <button
        class="camera-ctrl-btn"
        :class="{ 'torch-active': isTorchOn }"
        @click="toggleTorch"
        :disabled="facingMode !== 'environment'"
        :title="facingMode !== 'environment' ? 'Flash hanya tersedia pada kamera belakang' : (isTorchOn ? 'Matikan Flash' : 'Aktifkan Flash')"
        aria-label="Toggle Flash"
      >
        <!-- Flash On icon -->
        <svg v-if="isTorchOn" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="none">
          <path d="M13 2L4.5 13.5H11L10 22L19.5 10.5H13L13 2Z"/>
        </svg>
        <!-- Flash Off icon -->
        <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M13 2L4.5 13.5H11L10 22L19.5 10.5H13L13 2Z"/>
          <line x1="2" y1="2" x2="22" y2="22"/>
        </svg>
      </button>
    </div>

    <!-- Viewfinder -->
    <div class="camera-viewfinder">
      <video
        ref="video"
        autoplay
        playsinline
        muted
        class="camera-video"
        :style="{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }"
      ></video>

      <!-- Corner brackets overlay -->
      <div class="camera-brackets">
        <div class="bracket top-left">
          <span class="bracket-line h"></span>
          <span class="bracket-line v"></span>
        </div>
        <div class="bracket top-right">
          <span class="bracket-line h"></span>
          <span class="bracket-line v"></span>
        </div>
        <div class="bracket bottom-left">
          <span class="bracket-line h"></span>
          <span class="bracket-line v"></span>
        </div>
        <div class="bracket bottom-right">
          <span class="bracket-line h"></span>
          <span class="bracket-line v"></span>
        </div>
      </div>

      <!-- Capture flash animation -->
      <div v-if="isFlashing" class="camera-flash"></div>

      <!-- Error state -->
      <div v-if="cameraError" class="camera-error-state">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        <p>{{ cameraError }}</p>
        <button class="camera-retry-btn" @click="startCamera">Coba Lagi</button>
      </div>
    </div>

    <!-- Footer Controls -->
    <div class="camera-footer">
      <div class="camera-ctrl-btn secondary" style="visibility: hidden;"></div>

      <!-- Shutter -->
      <button
        class="camera-shutter"
        :class="{ capturing: isCapturing }"
        @click="takePhoto"
        :disabled="!!cameraError || isCapturing"
        aria-label="Ambil Foto"
      >
        <div class="camera-shutter-inner"></div>
      </button>

      <button class="camera-ctrl-btn secondary" @click="switchCamera" aria-label="Putar Kamera">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
          <path d="M3 3v5h5"/>
          <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/>
          <path d="M16 21v-5h5"/>
        </svg>
      </button>
    </div>

    <!-- Hidden canvas -->
    <canvas ref="canvas" style="display: none;"></canvas>
  </div>
  </Teleport>
</template>

<script setup>
import { ref, watch, onBeforeUnmount, nextTick } from 'vue'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: 'FOTO MATERIAL'
  }
})

const emit = defineEmits(['update:isOpen', 'capture'])

const video = ref(null)
const canvas = ref(null)
const stream = ref(null)
const facingMode = ref('environment')
const cameraError = ref('')
const isCapturing = ref(false)
const isFlashing = ref(false)
const isTorchOn = ref(false)

watch(() => props.isOpen, async (newVal) => {
  if (newVal) {
    cameraError.value = ''
    await nextTick()
    startCamera()
    // Prevent body scroll when camera is open
    document.body.style.overflow = 'hidden'
  } else {
    stopCamera()
    document.body.style.overflow = ''
  }
})

const startCamera = async () => {
  try {
    if (stream.value) stopCamera()
    cameraError.value = ''

    const s = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { ideal: facingMode.value },
        width: { ideal: 1920 },
        height: { ideal: 1080 }
      },
      audio: false
    })

    stream.value = s

    await nextTick()
    if (video.value) {
      video.value.srcObject = s
    }
  } catch (err) {
    console.error('Camera error:', err)
    if (err.name === 'NotAllowedError') {
      cameraError.value = 'Akses kamera ditolak. Harap izinkan di pengaturan browser.'
    } else if (err.name === 'NotFoundError') {
      cameraError.value = 'Kamera tidak ditemukan di perangkat ini.'
    } else {
      cameraError.value = 'Tidak dapat membuka kamera. Silakan coba lagi.'
    }
  }
}

const stopCamera = () => {
  if (stream.value) {
    stream.value.getTracks().forEach(t => t.stop())
    stream.value = null
  }
  isTorchOn.value = false
}

const toggleTorch = async () => {
  if (facingMode.value !== 'environment' || !stream.value) return
  const track = stream.value.getVideoTracks()[0]
  if (!track) return
  try {
    const newState = !isTorchOn.value
    await track.applyConstraints({ advanced: [{ torch: newState }] })
    isTorchOn.value = newState
  } catch (e) {
    console.warn('Torch not supported on this device:', e)
  }
}

const switchCamera = () => {
  isTorchOn.value = false
  facingMode.value = facingMode.value === 'environment' ? 'user' : 'environment'
  startCamera()
}

const takePhoto = async () => {
  if (!video.value || !canvas.value || isCapturing.value) return

  isCapturing.value = true
  isFlashing.value = true
  setTimeout(() => { isFlashing.value = false }, 200)

  const videoEl = video.value
  const canvasEl = canvas.value

  canvasEl.width = videoEl.videoWidth || 1280
  canvasEl.height = videoEl.videoHeight || 720

  const ctx = canvasEl.getContext('2d')

  if (facingMode.value === 'user') {
    ctx.translate(canvasEl.width, 0)
    ctx.scale(-1, 1)
  }

  ctx.drawImage(videoEl, 0, 0, canvasEl.width, canvasEl.height)

  canvasEl.toBlob(blob => {
    if (!blob) {
      isCapturing.value = false
      return
    }
    const file = new File([blob], `material_photo_${Date.now()}.jpg`, { type: 'image/jpeg' })
    emit('capture', file)
    isCapturing.value = false
    closeCamera()
  }, 'image/jpeg', 0.92)
}

const closeCamera = () => {
  stopCamera()
  document.body.style.overflow = ''
  emit('update:isOpen', false)
}

onBeforeUnmount(() => {
  stopCamera()
  document.body.style.overflow = ''
})
</script>

<style>
/* Full-screen overlay — using fixed + very high z-index, bypassing any parent stacking context */
.camera-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 99999;
  display: flex;
  flex-direction: column;
  background: #000;
  color: #fff;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

/* ── Header ───────────────────────────────────────── */
.camera-header {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

.camera-title {
  font-size: 0.85rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #fff;
}

/* ── Viewfinder ───────────────────────────────────── */
.camera-viewfinder {
  flex: 1;
  position: relative;
  overflow: hidden;
  background: #0a0a0a;
}

.camera-video {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* ── Corner brackets ──────────────────────────────── */
.camera-brackets {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.bracket {
  position: absolute;
  width: 44px;
  height: 44px;
}

.bracket.top-left    { top: 10%; left: 10%; }
.bracket.top-right   { top: 10%; right: 10%; }
.bracket.bottom-left { bottom: 10%; left: 10%; }
.bracket.bottom-right{ bottom: 10%; right: 10%; }

.bracket-line {
  position: absolute;
  background: #34d399;
  border-radius: 2px;
}

.bracket-line.h { height: 3px; width: 44px; }
.bracket-line.v { width: 3px; height: 44px; }

/* top-left corner */
.top-left .bracket-line.h { top: 0; left: 0; }
.top-left .bracket-line.v { top: 0; left: 0; }

/* top-right corner */
.top-right .bracket-line.h { top: 0; right: 0; }
.top-right .bracket-line.v { top: 0; right: 0; }

/* bottom-left corner */
.bottom-left .bracket-line.h { bottom: 0; left: 0; }
.bottom-left .bracket-line.v { bottom: 0; left: 0; }

/* bottom-right corner */
.bottom-right .bracket-line.h { bottom: 0; right: 0; }
.bottom-right .bracket-line.v { bottom: 0; right: 0; }

/* ── Flash animation ──────────────────────────────── */
.camera-flash {
  position: absolute;
  inset: 0;
  background: #fff;
  opacity: 0.7;
  animation: flash 0.2s ease-out forwards;
  pointer-events: none;
}

@keyframes flash {
  0%   { opacity: 0.8; }
  100% { opacity: 0; }
}

/* ── Error state ──────────────────────────────────── */
.camera-error-state {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  background: rgba(0, 0, 0, 0.85);
  color: #ccc;
  text-align: center;
  padding: 32px;
}

.camera-error-state p {
  font-size: 0.9rem;
  line-height: 1.5;
  max-width: 280px;
}

.camera-retry-btn {
  margin-top: 8px;
  padding: 10px 24px;
  background: #34d399;
  color: #000;
  border: none;
  border-radius: 24px;
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
}

/* ── Footer controls ──────────────────────────────── */
.camera-footer {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 28px 40px;
  padding-bottom: max(28px, env(safe-area-inset-bottom));
  background: rgba(0, 0, 0, 0.92);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

/* ── Common button ──────────────────────────────────*/
.camera-ctrl-btn {
  width: 46px;
  height: 46px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.15);
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s, transform 0.1s;
  -webkit-tap-highlight-color: transparent;
}

.camera-ctrl-btn:hover,
.camera-ctrl-btn:focus-visible {
  background: rgba(255, 255, 255, 0.28);
}

.camera-ctrl-btn:active {
  transform: scale(0.92);
}

.camera-ctrl-btn.secondary {
  background: rgba(255, 255, 255, 0.12);
}

.camera-ctrl-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.camera-ctrl-btn.torch-active {
  background: #facc15;
  color: #000;
}

.camera-ctrl-btn.torch-active:hover {
  background: #fde047;
}

/* ── Shutter button ───────────────────────────────── */
.camera-shutter {
  width: 76px;
  height: 76px;
  border-radius: 50%;
  border: 4px solid rgba(255, 255, 255, 0.9);
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: border-color 0.15s, transform 0.1s;
  -webkit-tap-highlight-color: transparent;
  padding: 0;
}

.camera-shutter:active:not(:disabled),
.camera-shutter.capturing {
  transform: scale(0.9);
  border-color: rgba(255, 255, 255, 0.5);
}

.camera-shutter:disabled {
  opacity: 0.5;
  cursor: default;
}

.camera-shutter-inner {
  width: 58px;
  height: 58px;
  border-radius: 50%;
  background: #fff;
  transition: transform 0.1s;
}

.camera-shutter:active:not(:disabled) .camera-shutter-inner,
.camera-shutter.capturing .camera-shutter-inner {
  transform: scale(0.88);
}
</style>
