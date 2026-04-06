import { createMemo, createSignal, For, Show } from "solid-js";

interface EventProps {
  id: string;
  title: string;
  start: string;
  extendedProps?: { unit: number };
}

interface PMCalendarProps {
  events: EventProps[];
  onEventClick: (e: EventProps) => void;
}

export default function PMCalendar(props: PMCalendarProps) {
  const [currentDate, setCurrentDate] = createSignal(new Date());

  const weekdays = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
  const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

  const monthYear = createMemo(() => {
    const month = monthNames[currentDate().getMonth()];
    const year = currentDate().getFullYear();
    return `${month} ${year}`;
  });

  const calendarDays = createMemo(() => {
    const year = currentDate().getFullYear();
    const month = currentDate().getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDay = firstDay.getDay();
    const daysInMonth = lastDay.getDate();
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const days: any[] = [];
    
    // Previous month days
    const prevMonth = new Date(year, month, 0);
    const prevMonthDays = prevMonth.getDate();
    for (let i = startDay - 1; i >= 0; i--) {
      days.push({
        date: prevMonthDays - i,
        isCurrentMonth: false,
        isToday: false,
        events: []
      });
    }
    
    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const dayDate = new Date(year, month, i);
      // Ensure local timezone doesn't offset the day when creating string
      const dateStr = [dayDate.getFullYear(), String(dayDate.getMonth() + 1).padStart(2, '0'), String(dayDate.getDate()).padStart(2, '0')].join('-');
      
      days.push({
        date: i,
        isCurrentMonth: true,
        isToday: dayDate.getTime() === today.getTime(),
        events: props.events ? props.events.filter(e => e.start === dateStr) : []
      });
    }
    
    // Next month days (fill to complete 6 rows)
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({
        date: i,
        isCurrentMonth: false,
        isToday: false,
        events: []
      });
    }
    
    return days;
  });

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate().getFullYear(), currentDate().getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate().getFullYear(), currentDate().getMonth() + 1, 1));
  };

  const unitColors: Record<number, string> = {
    1: 'event-red',
    4: 'event-green',
    5: 'event-blue',
    6: 'event-yellow',
    7: 'event-purple',
    8: 'event-orange',
    9: 'event-teal'
  };

  const getEventColorClass = (event: any) => {
    const unit = event.extendedProps?.unit;
    return unitColors[unit] || 'event-indigo';
  };

  return (
    <div class="calendar">
      <div class="calendar-header">
        <button class="calendar-nav-btn" onClick={prevMonth}>←</button>
        <h3 class="calendar-title">{monthYear()}</h3>
        <button class="calendar-nav-btn" onClick={nextMonth}>→</button>
      </div>
      
      <div class="calendar-weekdays">
        <For each={weekdays}>{(day) => (
          <div class="calendar-weekday">{day}</div>
        )}</For>
      </div>
      
      <div class="calendar-grid">
        <For each={calendarDays()}>{(day, index) => (
          <div 
            class="calendar-day"
            classList={{
              'other-month': !day.isCurrentMonth,
              'today': day.isToday
            }}
          >
            <div class="calendar-day-number">{day.date}</div>
            
            <div class="calendar-events">
              <For each={day.events.slice(0, 3)}>{(event: any) => (
                <div 
                  class="calendar-event"
                  classList={{ [getEventColorClass(event)]: true }}
                  onClick={() => props.onEventClick(event)}
                  title={event.title}
                >
                  {event.title}
                </div>
              )}</For>
              <Show when={day.events.length > 3}>
                <div 
                  class="calendar-event"
                  style="background: var(--gray-400);"
                >
                  +{day.events.length - 3} lagi
                </div>
              </Show>
            </div>
          </div>
        )}</For>
      </div>
    </div>
  );
}
