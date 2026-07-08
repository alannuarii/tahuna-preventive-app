<template>
  <div class="chat-card animate-fade-in">
    <!-- Chat Header -->
    <div class="chat-header">
      <div class="chat-header-info">
        <div class="chat-avatar-glow">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="glow-icon">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        </div>
        <div class="chat-title-wrapper">
          <h3 class="chat-title">Tahuna AI</h3>
          <span class="chat-subtitle">Asisten Pintar RAG PLTD Tahuna</span>
        </div>
      </div>
      <div class="chat-header-actions">
        <span class="badge" :class="isGuest ? 'badge-warning' : 'badge-primary'">
          {{ isGuest ? 'Guest Mode' : user?.name || 'TL Pemeliharaan' }}
        </span>
        <button 
          class="chat-reset-btn" 
          @click="resetChat" 
          title="Mulai Obrolan Baru"
          :disabled="isPending"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="reset-icon">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
            <path d="M3 3v5h5"></path>
          </svg>
          <span class="reset-text">Reset Chat</span>
        </button>
      </div>
    </div>

    <!-- Messages Container -->
    <div class="chat-messages" ref="messagesContainer">
      <div 
        v-for="(msg, index) in messages" 
        :key="index" 
        class="message-wrapper" 
        :class="msg.sender"
      >
        <div class="message" :class="msg.sender">
          <!-- Bot Avatar -->
          <div v-if="msg.sender === 'bot'" class="bot-avatar">
            AI
          </div>

          <div class="message-content">
            <!-- Bubble -->
            <div 
              class="chat-bubble" 
              :class="msg.sender"
              v-html="msg.sender === 'bot' ? renderMarkdown(msg.text) : parseInline(msg.text)"
            ></div>

          </div>
        </div>
      </div>

      <!-- Typing Indicator -->
      <div v-if="isPending" class="message-wrapper bot">
        <div class="message bot">
          <div class="bot-avatar">AI</div>
          <div class="chat-bubble bot typing">
            <span class="dot"></span>
            <span class="dot"></span>
            <span class="dot"></span>
          </div>
        </div>
      </div>
    </div>

    <!-- Input Bar -->
    <div class="chat-input-bar">
      <form @submit.prevent="sendMessage()" class="chat-form">
        <input 
          v-model="userInput" 
          type="text" 
          placeholder="Tanyakan stok, SOP, atau jadwal PM..." 
          class="form-input chat-input" 
          :disabled="isPending"
          ref="inputField"
        />
        <button 
          type="submit" 
          class="btn btn-primary chat-send-btn" 
          :disabled="!userInput.trim() || isPending"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
          </svg>
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'

definePageMeta({
  middleware: [
    function (to, from) {
      const { user } = useAuth()
      if (user.value?.email !== 'daengpython@gmail.com') {
        return navigateTo('/')
      }
    }
  ]
})

const { user, isGuest } = useAuth()

interface Message {
  sender: 'user' | 'bot'
  text: string
  route?: string
  query?: string
}

const messages = ref<Message[]>([
  { 
    sender: 'bot', 
    text: 'Silakan ketik pertanyaan Anda di bawah ini.' 
  }
])

const userInput = ref('')
const isPending = ref(false)
const messagesContainer = ref<HTMLElement | null>(null)
const inputField = ref<HTMLInputElement | null>(null)

const suggestedQuestions = [
  'Cek status stok filter bbm di gudang',
  'SOP langkah kerja PM P3 mesin Deutz',
  'Jadwal PM terdekat bulan ini',
  'Tampilkan mesin yang sedang downtime'
]

const resetChat = () => {
  if (isPending.value) return
  messages.value = [
    { 
      sender: 'bot', 
      text: 'Silakan ketik pertanyaan Anda di bawah ini.' 
    }
  ]
  userInput.value = ''
}

const scrollToBottom = async () => {
  await nextTick()
  if (messagesContainer.value) {
    messagesContainer.value.scrollTo({
      top: messagesContainer.value.scrollHeight,
      behavior: 'smooth'
    })
  }
}

const sendMessage = async (textOverride?: string) => {
  const queryText = (textOverride || userInput.value).trim()
  if (!queryText || isPending.value) return

  userInput.value = ''
  messages.value.push({ sender: 'user', text: queryText })
  scrollToBottom()

  isPending.value = true

  try {
    const data = await $fetch('/api/chat', {
      method: 'POST',
      body: { messages: messages.value }
    }) as any

    messages.value.push({
      sender: 'bot',
      text: data.text,
      route: data.route,
      query: data.query
    })
  } catch (err: any) {
    console.error('Chat API Error:', err)
    messages.value.push({
      sender: 'bot',
      text: 'Maaf, terjadi kendala saat menghubungkan ke sistem asisten AI. Mohon periksa koneksi internet atau status API Key Gemini Anda.'
    })
  } finally {
    isPending.value = false
    scrollToBottom()
    // Focus back on input field
    nextTick(() => {
      inputField.value?.focus()
    })
  }
}

const selectSuggestion = (question: string) => {
  sendMessage(question)
}

onMounted(() => {
  scrollToBottom()
  inputField.value?.focus()
})

// LIGHTWEIGHT IN-PAGE MARKDOWN PARSER FOR RAG ANSWERS
const renderMarkdown = (text: string): string => {
  if (!text) return ''
  const lines = text.split('\n')
  let result: string[] = []
  let inList = false
  let inTable = false

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim()

    // 1. Markdown Tables
    if (line.startsWith('|')) {
      if (inList) {
        result.push('</ul>')
        inList = false
      }
      if (!inTable) {
        result.push('<div class="table-wrapper text-xs mt-2 mb-2"><table class="table">')
        inTable = true
        // Header Row
        const cols = line.split('|').map(c => c.trim()).filter((c, idx, arr) => idx > 0 && idx < arr.length - 1)
        result.push('<thead><tr>' + cols.map(c => `<th>${parseInline(c)}</th>`).join('') + '</tr></thead><tbody>')
        
        // Skip next divider line like |---|---|
        if (i + 1 < lines.length && lines[i + 1].trim().startsWith('|') && lines[i + 1].includes('-')) {
          i++
        }
      } else {
        // Data Row
        const cols = line.split('|').map(c => c.trim()).filter((c, idx, arr) => idx > 0 && idx < arr.length - 1)
        result.push('<tr>' + cols.map(c => `<td>${parseInline(c)}</td>`).join('') + '</tr>')
      }
      continue
    } else if (inTable) {
      result.push('</tbody></table></div>')
      inTable = false
    }

    // 2. Headers
    if (line.startsWith('### ')) {
      if (inList) { result.push('</ul>'); inList = false }
      result.push(`<h4 class="mt-3 mb-1 text-sm font-bold text-gray-900">${parseInline(line.substring(4))}</h4>`)
      continue
    }
    if (line.startsWith('## ')) {
      if (inList) { result.push('</ul>'); inList = false }
      result.push(`<h3 class="mt-4 mb-2 text-base font-bold text-gray-900">${parseInline(line.substring(3))}</h3>`)
      continue
    }
    if (line.startsWith('# ')) {
      if (inList) { result.push('</ul>'); inList = false }
      result.push(`<h2 class="mt-4 mb-2 text-lg font-bold text-gray-900">${parseInline(line.substring(2))}</h2>`)
      continue
    }

    // 3. Bullet Lists
    if (line.startsWith('- ') || line.startsWith('* ')) {
      if (!inList) {
        result.push('<ul class="chat-list text-sm mt-2 mb-2 pl-4">')
        inList = true
      }
      result.push(`<li class="mb-1">${parseInline(line.substring(2))}</li>`)
      continue
    } else if (inList) {
      result.push('</ul>')
      inList = false
    }

    // 4. Empty Line
    if (line === '') {
      result.push('<div class="space-divider py-1"></div>')
      continue
    }

    // 5. Normal Paragraph
    result.push(`<p class="mb-2 leading-relaxed">${parseInline(lines[i])}</p>`)
  }

  if (inList) result.push('</ul>')
  if (inTable) result.push('</tbody></table></div>')

  return result.join('\n')
}

const parseInline = (txt: string): string => {
  let html = txt
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  // Bold: **text**
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
  // Italic: *text*
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>')
  // Inline code: `code`
  html = html.replace(/`(.*?)`/g, '<code class="chat-inline-code">$1</code>')
  return html
}
</script>

<style scoped>
/* Main Chat container occupying responsive remaining height */
.chat-card {
  display: flex;
  flex-direction: column;
  height: calc(100vh - var(--header-height) - var(--menu-height) - 60px);
  margin-bottom: 20px;
  background: transparent;
  border: none;
  box-shadow: none;
}

@media (min-width: 768px) {
  .chat-card {
    height: calc(100vh - var(--header-height) - 70px);
    margin-bottom: 0;
  }
}

.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-3) 0;
  background: transparent;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.chat-header-info {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.chat-header-actions {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.chat-avatar-glow {
  width: 38px;
  height: 38px;
  border-radius: 12px;
  background: linear-gradient(135deg, var(--primary-500), #818cf8);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: 0 0 14px var(--primary-glow);
}

.glow-icon {
  filter: drop-shadow(0 0 4px rgba(255,255,255,0.6));
}

.chat-title-wrapper {
  display: flex;
  flex-direction: column;
}

.chat-title {
  font-size: 0.95rem;
  font-weight: 700;
  color: white;
  margin: 0;
}

.chat-subtitle {
  font-size: 0.68rem;
  color: var(--gray-400);
}

/* Chat Messages Scroll Window */
.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-4) 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.message-wrapper {
  display: flex;
  width: 100%;
}

.message-wrapper.user {
  justify-content: flex-end;
}

.message-wrapper.bot {
  justify-content: flex-start;
}

.message {
  display: flex;
  max-width: 85%;
  gap: var(--space-2);
}

.message.user {
  flex-direction: row-reverse;
}

/* Avatar for Bot */
.bot-avatar {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  background: linear-gradient(135deg, #4f46e5, #06b6d4);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  font-weight: 700;
  box-shadow: 0 0 8px rgba(99, 102, 241, 0.4);
  flex-shrink: 0;
}

.message-content {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

/* Speech bubbles styles */
.chat-bubble {
  padding: 12px 16px;
  border-radius: var(--radius-lg);
  font-size: 0.85rem;
  line-height: 1.5;
}

.chat-bubble.user {
  background: linear-gradient(135deg, var(--primary-600), var(--primary-800));
  color: white;
  border-top-right-radius: 2px;
  box-shadow: 0 2px 10px rgba(99,102,241,0.25);
}

.chat-bubble.bot {
  background: var(--bg-surface);
  border: 1px solid rgba(255, 255, 255, 0.06);
  color: var(--gray-700);
  border-top-left-radius: 2px;
}



/* Typing pulse animation */
.typing {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 14px 20px;
}

.typing .dot {
  width: 6px;
  height: 6px;
  background-color: var(--primary-300);
  border-radius: 50%;
  animation: typingPulse 1.4s infinite ease-in-out both;
}

.typing .dot:nth-child(1) { animation-delay: -0.32s; }
.typing .dot:nth-child(2) { animation-delay: -0.16s; }

@keyframes typingPulse {
  0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
  40% { transform: scale(1.1); opacity: 1; box-shadow: 0 0 8px var(--primary-glow); }
}

/* Frequently Asked Questions suggestions */
.suggestions-wrapper {
  padding: 0 0 var(--space-3) 0;
  border-top: 1px solid transparent;
}

.suggestions-title {
  font-size: 0.72rem;
  color: var(--gray-500);
  margin-bottom: var(--space-2);
  font-weight: 500;
}

.suggestions-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.suggestion-btn {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  padding: 6px 12px;
  border-radius: 20px;
  color: var(--gray-600);
  font-size: 0.75rem;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.suggestion-btn:hover {
  background: var(--primary-100);
  border-color: var(--primary-400);
  color: var(--primary-300);
  transform: translateY(-1px);
}

/* Chat Input Bar Pinned bottom */
.chat-input-bar {
  padding: var(--space-3) 0;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  background: transparent;
}

.chat-form {
  display: flex;
  gap: var(--space-3);
  width: 100%;
}

.chat-input {
  flex: 1;
  background-color: var(--bg-input) !important;
  border: 1px solid rgba(255, 255, 255, 0.08) !important;
  padding: 10px 14px !important;
  font-size: 0.85rem !important;
  border-radius: var(--radius-xl) !important;
  color: white !important;
}

.chat-input:focus {
  border-color: var(--primary-400) !important;
  box-shadow: 0 0 10px var(--primary-glow) !important;
}

.chat-send-btn {
  border-radius: var(--radius-xl);
  width: 42px;
  height: 42px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

/* Markdown formatting within chat-bubble */
:deep(.chat-bubble p) {
  margin-bottom: 6px;
}
:deep(.chat-bubble p:last-child) {
  margin-bottom: 0;
}

:deep(.chat-list) {
  padding-left: 20px;
}

:deep(.chat-inline-code) {
  font-family: 'JetBrains Mono', 'SF Mono', monospace;
  font-size: 0.75rem;
  background: rgba(0,0,0,0.3);
  padding: 2px 5px;
  border-radius: 4px;
  color: #38bdf8;
  border: 1px solid rgba(255,255,255,0.05);
}

:deep(.space-divider) {
  height: 4px;
}

/* Styled table inside chat bubble */
:deep(.table-wrapper) {
  border-radius: var(--radius-md);
  border: 1px solid var(--glass-border);
  overflow-x: auto;
  width: 100%;
}

:deep(.table) {
  font-size: 0.75rem;
  text-align: left;
}

:deep(.table th) {
  padding: 6px 10px;
  background: rgba(0,0,0,0.4);
  color: var(--gray-600);
}

:deep(.table td) {
  padding: 6px 10px;
  color: var(--gray-700);
  background: rgba(255,255,255,0.01);
}

/* Premium Reset Chat Button */
.chat-reset-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: 6px 14px;
  background: rgba(239, 68, 68, 0.08);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: var(--radius-full);
  color: #fca5a5;
  font-family: var(--font-family);
  font-size: 0.72rem;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast);
  outline: none;
}

.chat-reset-btn:hover:not(:disabled) {
  background: rgba(239, 68, 68, 0.18);
  border-color: #f87171;
  color: #ffffff;
  box-shadow: 0 0 10px rgba(239, 68, 68, 0.35);
}

.chat-reset-btn:hover:not(:disabled) .reset-icon {
  transform: rotate(-180deg);
}

.chat-reset-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.reset-icon {
  transition: transform var(--transition-slow) ease-in-out;
}

@media (max-width: 480px) {
  .chat-reset-btn {
    padding: 5px 10px;
    gap: 4px;
  }
  .reset-text {
    display: none;
  }
}
</style>
