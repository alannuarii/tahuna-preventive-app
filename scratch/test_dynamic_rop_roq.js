import pg from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;
const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

async function query(sql, params = []) {
  const res = await pool.query(sql, params);
  return res.rows;
}

const intervalToCycle = {
  125: 'P1',
  250: 'P2',
  500: 'P3',
  1500: 'P4',
  3000: 'P5',
};

const cycleToLevel = {
  'P1': 1,
  'P2': 2,
  'P3': 3,
  'P4': 4,
  'P5': 5,
};

// Paste generatePMSchedule from server/utils/pmSchedule.ts
const generateRandomId = (length = 8) => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

const generatePMSchedule = (units, cycles, startDateStr = null, endDateStr = null, downtimes = [], averages = []) => {
  const colorsByUnit = {
    1: "#FF5733",
    4: "#33FF57",
    5: "#3357FF",
    6: "#F1C40F",
    7: "#9B59B6",
    8: "#E67E22",
    9: "#1ABC9C",
    14: "#FF0000"
  };

  const fiveYearHours = 24 * 1825; // default 5 years in hours
  const maxIterations = 1000;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let baseDate = new Date(today);
  let endDate = endDateStr ? new Date(endDateStr) : new Date(baseDate.getTime() + fiveYearHours * 60 * 60 * 1000);
  endDate.setHours(23, 59, 59, 999);

  let allSchedules = [];

  units.forEach(({ unit, jamoperasi, ganti_oli }) => {
    let currentOverhaul = jamoperasi % 3000;
    let currentGantiOli = parseFloat(ganti_oli || 0);
    let currentBaseDate = new Date(baseDate);

    const cycleInterval = [4, 5, 8, 9].includes(unit) ? 250 : 500;

    let lastResetOverhaul = currentOverhaul - currentGantiOli;
    while (lastResetOverhaul < 0) lastResetOverhaul += 3000;
    
    let gridOverhaul = (Math.round(lastResetOverhaul / cycleInterval) * cycleInterval) % 3000;

    let nextTargetGantiOli = 125;
    if (currentGantiOli <= 125) nextTargetGantiOli = 125;
    else if (currentGantiOli <= 250) nextTargetGantiOli = 250;
    else if (cycleInterval === 500 && currentGantiOli <= 375) nextTargetGantiOli = 375;
    else if (cycleInterval === 500 && currentGantiOli <= 500) nextTargetGantiOli = 500;
    else nextTargetGantiOli = cycleInterval;

    for (let i = 0; i < maxIterations; i++) {
      let stepGantiOli = i === 0 ? nextTargetGantiOli : 125;
      
      let targetOverhaul = gridOverhaul + stepGantiOli;
      while (targetOverhaul > 3000) targetOverhaul -= 3000;
      if (targetOverhaul <= 0) targetOverhaul += 3000;

      const pmCycle = cycles.find(cycle => cycle.max === targetOverhaul);
      if (!pmCycle) break;

      let hoursNeeded = 0;
      if (i === 0) {
        hoursNeeded = nextTargetGantiOli - currentGantiOli;
      } else {
        hoursNeeded = 125;
      }

      let simDate = new Date(currentBaseDate.getTime());
      let pmDate = new Date(currentBaseDate.getTime());
      let isInfiniteDowntime = false;

      while (hoursNeeded > 0) {
        simDate.setDate(simDate.getDate() + 1);
        
        const activeDowntime = downtimes.find(d => {
          if (d.unit !== unit) return false;
          const dStart = new Date(d.start_date);
          dStart.setHours(0,0,0,0);
          if (simDate < dStart) return false;
          
          if (d.end_date) {
            const dEnd = new Date(d.end_date);
            dEnd.setHours(23,59,59,999);
            return simDate <= dEnd;
          } else {
            return true;
          }
        });
        
        const avgData = averages.find(a => a.unit.toString() === unit.toString());
        const dailyAverage = avgData && avgData.avg_jam_kerja ? parseFloat(avgData.avg_jam_kerja) : 24;

        if (!activeDowntime) {
          hoursNeeded -= dailyAverage;
        } else if (!activeDowntime.end_date) {
          isInfiniteDowntime = true;
          break;
        }
        
        if (simDate.getFullYear() - today.getFullYear() > 10) {
           break;
        }
      }
      
      if (isInfiniteDowntime) break;
      
      pmDate = new Date(simDate.getTime());
      pmDate.setHours(0, 0, 0, 0);

      if (pmDate > endDate) break;

      const eventId = generateRandomId(10);

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
      });

      gridOverhaul = targetOverhaul;
      currentBaseDate = new Date(pmDate);
    }
  });

  if (startDateStr) {
    const startDateFilter = new Date(startDateStr);
    startDateFilter.setHours(0, 0, 0, 0);
    allSchedules = allSchedules.filter(schedule => {
      const scheduleDate = new Date(schedule.start);
      return scheduleDate >= startDateFilter && scheduleDate <= endDate;
    });
  }

  return allSchedules;
};

async function main() {
  try {
    console.log('Generating PM Schedules for the next 120 days...');
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);
    const end = new Date(today.getTime() + 120 * 24 * 60 * 60 * 1000);
    const endStr = end.toISOString().slice(0, 10);

    const sqlQuery = `
      SELECT unit, overhaul AS jamoperasi, ganti_oli FROM (
        SELECT unit, overhaul, ganti_oli
        FROM service_hour
        ORDER BY id DESC
        LIMIT 7
      ) AS subquery
      ORDER BY unit ASC;
    `;
    const units = await query(sqlQuery);
    const cycles = await query(`SELECT min_hours as min, max_hours as max, pm_type as pm FROM pm_cycle_definitions ORDER BY min_hours ASC`);
    const downtimes = await query(`SELECT unit, status, start_date, end_date FROM engine_downtime`);
    
    let averages = [];
    try {
      averages = await query(`
        SELECT unit, AVG(CAST(jam_kerja AS NUMERIC)) as avg_jam_kerja
        FROM pengusahaan_harian
        WHERE waktu >= CURRENT_DATE - INTERVAL '90 days'
          AND unit IN ('1', '4', '5')
        GROUP BY unit
      `);
    } catch (e) {
      console.error("Failed to fetch historical averages:", e);
    }

    const schedules = generatePMSchedule(units, cycles, todayStr, endStr, downtimes, averages);
    console.log(`Generated ${schedules.length} PM events.`);

    // Load configs
    const configs = await query(`
      SELECT mmc.material_id, mmc.unit, mmc.qty_per_pm, mmc.interval_pm
      FROM machine_material_configs mmc
    `);

    // Load materials and current stock
    const materials = await query(`
      SELECT 
        m.id,
        m.name,
        m.part_number,
        m.unit AS satuan,
        COALESCE(mi.current_stock, 0) AS current_stock,
        COALESCE(mi.lead_time_days, 30) AS lead_time_days
      FROM materials m
      LEFT JOIN material_inventory mi ON mi.material_id = m.id
    `);

    // Organize configs by material_id
    const configMap = new Map();
    configs.forEach(c => {
      if (!configMap.has(c.material_id)) {
        configMap.set(c.material_id, []);
      }
      configMap.get(c.material_id).push({
        unit: c.unit,
        qty: parseFloat(c.qty_per_pm),
        level: cycleToLevel[intervalToCycle[c.interval_pm]] || 1,
      });
    });

    console.log('\n--- DYNAMIC ROP/ROQ CALCULATION RESULTS ---');

    const results = [];

    materials.forEach(mat => {
      const matConfigs = configMap.get(mat.id) || [];
      if (matConfigs.length === 0) return; // skip materials with no config

      let demand30 = 0;
      let demand45 = 0;
      let demand90 = 0;

      schedules.forEach(sched => {
        const schedUnit = sched.extendedProps.unit;
        const titleMatch = sched.title.match(/P(\d)/i);
        if (!titleMatch) return;
        const schedLevel = parseInt(titleMatch[1]);
        
        // Find matching configs for this unit and scheduled PM level
        const matching = matConfigs.filter(c => c.unit === schedUnit && schedLevel >= c.level);
        
        const daysFromToday = sched.extendedProps.daysFromToday;
        
        matching.forEach(c => {
          if (daysFromToday <= 30) demand30 += c.qty;
          if (daysFromToday <= 45) demand45 += c.qty;
          if (daysFromToday <= 90) demand90 += c.qty;
        });
      });

      const ss = demand45 - demand30;
      const rop = demand45; // ROP = demand30 + ss = demand45
      const roq = demand90 * 1.05;
      const currentStock = parseFloat(mat.current_stock);

      let status = 'SAFE';
      if (currentStock <= ss) {
        status = 'CRITICAL';
      } else if (currentStock <= rop) {
        status = 'REORDER';
      }

      results.push({
        name: mat.name,
        current_stock: currentStock,
        ss,
        rop,
        roq: parseFloat(roq.toFixed(2)),
        status,
      });
    });

    console.table(results);

  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

main();
