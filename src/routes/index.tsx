import { createMemo, createSignal, onMount, Show } from 'solid-js';
import { useNavigate } from '@solidjs/router';
import { useMaintenanceData } from '~/lib/useMaintenanceData';
import MaintenanceTable from '~/components/MaintenanceTable';
import PMCalendar from '~/components/PMCalendar';
import SegmentedControl from '~/components/SegmentedControl';

export default function PreventiveIndex() {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = createSignal('table');
  const [startDate, setStartDate] = createSignal('');
  const [endDate, setEndDate] = createSignal('');

  const { serviceHours, isLoading, overhaulCycles, gantiOliCycles, fetchPMSchedule } = useMaintenanceData();

  const [pmSchedule, setPmSchedule] = createSignal<any[]>([]);
  const [pending, setPending] = createSignal(false);

  const getEngineName = (unit: number) => `Unit ${unit}`;

  const loadSchedule = async () => {
    setPending(true);
    try {
      setPmSchedule(await fetchPMSchedule(startDate() ? startDate() : null, endDate() ? endDate() : null));
    } finally {
      setPending(false);
    }
  };

  onMount(() => {
    loadSchedule();
  });

  const tableData = createMemo(() => {
    const sh = serviceHours();
    if (!sh || sh.length === 0) return [];
    
    return sh.map((item: any, index: number) => {
      const pm = pmSchedule()?.find(pm => pm.extendedProps?.unit === item.unit) || {
        title: 'No PM Scheduled',
        id: '',
        extendedProps: { daysFromToday: 0, targetHours: 0, currentHours: 0 }
      };
      
      return {
        ...item,
        gantiOliCycles: gantiOliCycles[index] || 250,
        overhaulCycles: overhaulCycles[index] || 6000,
        mesin: getEngineName(item.unit),
        pm
      };
    });
  });

  const handleEventClick = (event: any) => {
    const eventData = {
      id: event.id,
      pm: event.title.split(' ')[0],
      unit: event.extendedProps.unit,
      ...event.extendedProps
    };
    localStorage.setItem('selectedEvent', JSON.stringify(eventData));
    navigate(`/detail/${event.id}`);
  };

  const viewOptions = [
    {
      value: 'table',
      label: 'Data',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="8" y1="6" x2="21" y2="6"/>
          <line x1="8" y1="12" x2="21" y2="12"/>
          <line x1="8" y1="18" x2="21" y2="18"/>
          <line x1="3" y1="6" x2="3.01" y2="6"/>
          <line x1="3" y1="12" x2="3.01" y2="12"/>
          <line x1="3" y1="18" x2="3.01" y2="18"/>
        </svg>
      )
    },
    {
      value: 'calendar',
      label: 'Kalender',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
      )
    }
  ];

  return (
    <div class="animate-fade-in">
      <div class="page-header">
        <h1 class="home-title m-0">Jadwal Preventive Maintenance</h1>
        <div class="page-header-actions">
          <SegmentedControl 
            options={viewOptions} 
            value={viewMode()} 
            onChange={setViewMode} 
          />
        </div>
      </div>

      <Show when={viewMode() === 'calendar'}>
        <div class="filter-bar">
          <input 
            type="date" 
            value={startDate()}
            onInput={(e) => setStartDate(e.currentTarget.value)}
            class="form-input form-input-sm"
            placeholder="Start"
          />
          <input 
            type="date" 
            value={endDate()}
            onInput={(e) => setEndDate(e.currentTarget.value)}
            class="form-input form-input-sm"
            placeholder="End"
          />
          <button class="btn btn-primary btn-sm" onClick={loadSchedule}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            Filter
          </button>
        </div>
      </Show>
      
      <Show when={isLoading() || pending()}>
        <div class="loading-container">
          <div class="spinner spinner-lg"></div>
          <p class="mt-4 text-muted">Memuat data...</p>
        </div>
      </Show>
      
      <Show when={!isLoading() && !pending() && viewMode() === 'table'}>
        <MaintenanceTable data={tableData()} />
      </Show>
      
      <Show when={!isLoading() && !pending() && viewMode() === 'calendar'}>
        <PMCalendar events={pmSchedule()} onEventClick={handleEventClick} />
      </Show>
    </div>
  );
}
