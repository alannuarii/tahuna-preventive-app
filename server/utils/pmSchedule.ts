// Random ID generator
export const generateRandomId = (length = 8) => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
  let result = ""
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// Generate PM schedule for all units
export const generatePMSchedule = (units: any[], cycles: any[], startDateStr: string | null = null, endDateStr: string | null = null, downtimes: any[] = [], averages: any[] = []) => {
  const colorsByUnit: Record<number, string> = {
    1: "#FF5733",
    4: "#33FF57",
    5: "#3357FF",
    6: "#F1C40F",
    7: "#9B59B6",
    8: "#E67E22",
    9: "#1ABC9C",
    14: "#FF0000"
  }

  const fiveYearHours = 24 * 1825 // default 5 years in hours
  const maxIterations = 1000

  // Today's date reset to start of day (00:00)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  let baseDate = new Date(today)

  // Parse end date, if not provided use default 5 years from baseDate
  let endDate = endDateStr ? new Date(endDateStr) : new Date(baseDate.getTime() + fiveYearHours * 60 * 60 * 1000)
  endDate.setHours(23, 59, 59, 999)

  let allSchedules: any[] = []

  units.forEach(({ unit, jamoperasi, ganti_oli }) => {
    let currentOverhaul = jamoperasi % 3000
    let currentGantiOli = parseFloat(ganti_oli || 0)
    let currentBaseDate = new Date(baseDate)

    const cycleInterval = [4, 5, 8, 9].includes(unit) ? 250 : 500

    let lastResetOverhaul = currentOverhaul - currentGantiOli
    while (lastResetOverhaul < 0) lastResetOverhaul += 3000
    
    // Snap to the nearest oil change cycle (250 or 500) to find the true baseline
    let gridOverhaul = (Math.round(lastResetOverhaul / cycleInterval) * cycleInterval) % 3000

    let nextTargetGantiOli = 125
    if (currentGantiOli <= 125) nextTargetGantiOli = 125
    else if (currentGantiOli <= 250) nextTargetGantiOli = 250
    else if (cycleInterval === 500 && currentGantiOli <= 375) nextTargetGantiOli = 375
    else if (cycleInterval === 500 && currentGantiOli <= 500) nextTargetGantiOli = 500
    else nextTargetGantiOli = cycleInterval // Overdue

    for (let i = 0; i < maxIterations; i++) {
      let stepGantiOli = i === 0 ? nextTargetGantiOli : 125
      
      let targetOverhaul = gridOverhaul + stepGantiOli
      while (targetOverhaul > 3000) targetOverhaul -= 3000
      if (targetOverhaul <= 0) targetOverhaul += 3000

      const pmCycle = cycles.find(cycle => cycle.max === targetOverhaul)
      if (!pmCycle) break

      let hoursNeeded = 0
      if (i === 0) {
        hoursNeeded = nextTargetGantiOli - currentGantiOli
      } else {
        hoursNeeded = 125
      }

      let simDate = new Date(currentBaseDate.getTime())
      let pmDate = new Date(currentBaseDate.getTime())
      let isInfiniteDowntime = false

      while (hoursNeeded > 0) {
        simDate.setDate(simDate.getDate() + 1)
        
        // check if simDate is within any downtime
        const activeDowntime = downtimes.find(d => {
          if (d.unit !== unit) return false
          const dStart = new Date(d.start_date)
          dStart.setHours(0,0,0,0)
          if (simDate < dStart) return false
          
          if (d.end_date) {
            const dEnd = new Date(d.end_date)
            dEnd.setHours(23,59,59,999)
            return simDate <= dEnd
          } else {
            return true // ongoing indefinitely
          }
        })
        
        const avgData = averages.find(a => a.unit.toString() === unit.toString())
        const dailyAverage = avgData && avgData.avg_jam_kerja ? parseFloat(avgData.avg_jam_kerja) : 24

        if (!activeDowntime) {
          hoursNeeded -= dailyAverage
        } else if (!activeDowntime.end_date) {
          // If the machine is down indefinitely, we cannot schedule this PM
          isInfiniteDowntime = true
          break
        }
        
        // Safe bound to avoid infinite loops (10 years)
        if (simDate.getFullYear() - today.getFullYear() > 10) {
           break
        }
      }
      
      if (isInfiniteDowntime) break // stop scheduling for this unit
      
      pmDate = new Date(simDate.getTime())
      pmDate.setHours(0, 0, 0, 0)

      if (pmDate > endDate) break

      const eventId = generateRandomId(10)

      allSchedules.push({
        id: eventId,
        title: `${pmCycle.pm} Unit ${unit}`,
        start: pmDate.toISOString().slice(0, 10),
        allDay: true,
        color: colorsByUnit[unit] || "#000000",
        extendedProps: {
          currentHours: currentGantiOli,
          targetHours: stepGantiOli,
          daysFromToday: (pmDate.getTime() - today.getTime()) / (1000 * 3600 * 24),
          unit: unit,
          url: `/detail/${eventId}`,
        },
      })

      gridOverhaul = targetOverhaul
      currentBaseDate = new Date(pmDate)
    }
  })

  // Filter by start date range if provided
  if (startDateStr) {
    const startDateFilter = new Date(startDateStr)
    startDateFilter.setHours(0, 0, 0, 0)
    allSchedules = allSchedules.filter(schedule => {
      const scheduleDate = new Date(schedule.start)
      return scheduleDate >= startDateFilter && scheduleDate <= endDate
    })
  }

  return allSchedules
}
