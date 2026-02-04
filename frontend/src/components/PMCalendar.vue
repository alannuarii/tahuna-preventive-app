<template>
  <div class="calendar">
    <div class="calendar-header">
      <button class="calendar-nav-btn" @click="prevMonth">←</button>
      <h3 class="calendar-title">{{ monthYear }}</h3>
      <button class="calendar-nav-btn" @click="nextMonth">→</button>
    </div>
    
    <div class="calendar-weekdays">
      <div v-for="day in weekdays" :key="day" class="calendar-weekday">
        {{ day }}
      </div>
    </div>
    
    <div class="calendar-grid">
      <div 
        v-for="(day, index) in calendarDays" 
        :key="index"
        class="calendar-day"
        :class="{
          'other-month': !day.isCurrentMonth,
          'today': day.isToday
        }"
      >
        <div class="calendar-day-number">{{ day.date }}</div>
        
        <div class="calendar-events">
          <div 
            v-for="event in day.events.slice(0, 3)" 
            :key="event.id"
            class="calendar-event"
            :class="getEventColorClass(event)"
            @click="handleEventClick(event)"
            :title="event.title"
          >
            {{ event.title }}
          </div>
          <div 
            v-if="day.events.length > 3" 
            class="calendar-event"
            style="background: var(--gray-400);"
          >
            +{{ day.events.length - 3 }} lagi
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  events: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['event-click'])

const currentDate = ref(new Date())

const weekdays = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']

const monthNames = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
]

const monthYear = computed(() => {
  const month = monthNames[currentDate.value.getMonth()]
  const year = currentDate.value.getFullYear()
  return `${month} ${year}`
})

const calendarDays = computed(() => {
  const year = currentDate.value.getFullYear()
  const month = currentDate.value.getMonth()
  
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startDay = firstDay.getDay()
  const daysInMonth = lastDay.getDate()
  
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const days = []
  
  // Previous month days
  const prevMonth = new Date(year, month, 0)
  const prevMonthDays = prevMonth.getDate()
  for (let i = startDay - 1; i >= 0; i--) {
    days.push({
      date: prevMonthDays - i,
      isCurrentMonth: false,
      isToday: false,
      events: []
    })
  }
  
  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    const dayDate = new Date(year, month, i)
    const dateStr = dayDate.toISOString().slice(0, 10)
    
    days.push({
      date: i,
      isCurrentMonth: true,
      isToday: dayDate.getTime() === today.getTime(),
      events: props.events.filter(e => e.start === dateStr)
    })
  }
  
  // Next month days (fill to complete 6 rows)
  const remaining = 42 - days.length
  for (let i = 1; i <= remaining; i++) {
    days.push({
      date: i,
      isCurrentMonth: false,
      isToday: false,
      events: []
    })
  }
  
  return days
})

const prevMonth = () => {
  currentDate.value = new Date(
    currentDate.value.getFullYear(),
    currentDate.value.getMonth() - 1,
    1
  )
}

const nextMonth = () => {
  currentDate.value = new Date(
    currentDate.value.getFullYear(),
    currentDate.value.getMonth() + 1,
    1
  )
}

const unitColors = {
  1: 'event-red',
  4: 'event-green',
  5: 'event-blue',
  6: 'event-yellow',
  7: 'event-purple',
  8: 'event-orange',
  9: 'event-teal'
}

const getEventColorClass = (event) => {
  const unit = event.extendedProps?.unit
  return unitColors[unit] || 'event-indigo'
}

const handleEventClick = (event) => {
  emit('event-click', event)
}
</script>
