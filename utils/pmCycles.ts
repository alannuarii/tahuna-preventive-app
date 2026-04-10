// PM Cycles Data - Maintenance intervals every 125 hours (client-side copy)
export const pmCycles = [
  { min: 0, max: 125, pm: "P1" },
  { min: 125, max: 250, pm: "P2" },
  { min: 250, max: 375, pm: "P1" },
  { min: 375, max: 500, pm: "P3" },
  { min: 500, max: 625, pm: "P1" },
  { min: 625, max: 750, pm: "P2" },
  { min: 750, max: 875, pm: "P1" },
  { min: 875, max: 1000, pm: "P3" },
  { min: 1000, max: 1125, pm: "P1" },
  { min: 1125, max: 1250, pm: "P2" },
  { min: 1250, max: 1375, pm: "P1" },
  { min: 1375, max: 1500, pm: "P4" },
  { min: 1500, max: 1625, pm: "P1" },
  { min: 1625, max: 1750, pm: "P2" },
  { min: 1750, max: 1875, pm: "P1" },
  { min: 1875, max: 2000, pm: "P3" },
  { min: 2000, max: 2125, pm: "P1" },
  { min: 2125, max: 2250, pm: "P2" },
  { min: 2250, max: 2375, pm: "P1" },
  { min: 2375, max: 2500, pm: "P3" },
  { min: 2500, max: 2625, pm: "P1" },
  { min: 2625, max: 2750, pm: "P2" },
  { min: 2750, max: 2875, pm: "P1" },
  { min: 2875, max: 3000, pm: "P5" },
]

// Oil change hours calculation
export const gantiOliHours = (sh: number, unit: number) => {
  const excludedUnits = [4, 5, 8, 9]

  if (sh <= 125) return 125
  if (sh > 125 && sh <= 250) return 250

  if (sh > 250 && sh <= 375 && !excludedUnits.includes(unit)) return 375
  if (sh > 375 && sh <= 500 && !excludedUnits.includes(unit)) return 500

  return null
}

export const engines = [
  { unit: 1, mesin: "SWD 6FHD 240" },
  { unit: 4, mesin: "Deutz TBD 616 V12" },
  { unit: 5, mesin: "Deutz TBD 616 V12" },
  { unit: 6, mesin: "Mitsubishi S16R PTA-S" },
  { unit: 7, mesin: "Mitsubishi S16R PTA-S" },
  { unit: 8, mesin: "Cummins KTA50-G8" },
  { unit: 9, mesin: "Cummins KTA50-G8" },
]

// Material kebutuhan per unit per PM cycle
// cycle = siklus dasar dimulai, material juga digunakan pada siklus yang lebih tinggi
// P1 → digunakan di P1, P2, P3, P4, P5
// P2 → digunakan di P2, P3, P4, P5
// P3 → digunakan di P3, P4, P5
// P4 → digunakan di P4, P5
// P5 → digunakan di P5 saja
export const fastMovingMaterials = [
  {
    unit: 1,
    mesin: "SWD 6FHD 240",
    material: [
      { nama: "Lube Oil Filter", part_number: "LF3414", jumlah: 4, satuan: "buah", cycle: "P3" },
      { nama: "Fuel Filter", part_number: "BF 1018/1", jumlah: 2, satuan: "buah", cycle: "P2" },
      { nama: "Lube Oil", part_number: "Pertamina Meditran S SAE 40", jumlah: 209, satuan: "liter", cycle: "P3" },
    ],
  },
  {
    unit: 4,
    mesin: "Deutz TBD 616 V12",
    material: [
      { nama: "Lube Oil Filter", part_number: "0118-2001", jumlah: 1, satuan: "buah", cycle: "P3" },
      { nama: "Fuel Filter", part_number: "0117-4423", jumlah: 1, satuan: "buah", cycle: "P2" },
      { nama: "Air Filter", part_number: "0118-0870", jumlah: 2, satuan: "buah", cycle: "P5" },
      { nama: "Lube Oil", part_number: "Pertamina Meditran S SAE 40", jumlah: 70, satuan: "liter", cycle: "P2" },
    ],
  },
  {
    unit: 5,
    mesin: "Deutz TBD 616 V12",
    material: [
      { nama: "Lube Oil Filter", part_number: "0118-2001", jumlah: 1, satuan: "buah", cycle: "P3" },
      { nama: "Fuel Filter", part_number: "0117-4423", jumlah: 1, satuan: "buah", cycle: "P2" },
      { nama: "Air Filter", part_number: "0118-0870", jumlah: 2, satuan: "buah", cycle: "P5" },
      { nama: "Lube Oil", part_number: "Pertamina Meditran S SAE 40", jumlah: 70, satuan: "liter", cycle: "P2" },
    ],
  },
  {
    unit: 6,
    mesin: "Mitsubishi S16R PTA-S",
    material: [
      { nama: "Lube Oil Filter", part_number: "37540-11100", jumlah: 4, satuan: "buah", cycle: "P2" },
      { nama: "Fuel Filter", part_number: "32562-60300", jumlah: 4, satuan: "buah", cycle: "P2" },
      { nama: "Air Filter", part_number: "47220-38802", jumlah: 4, satuan: "buah", cycle: "P5" },
      { nama: "Lube Oil Filter Bypass", part_number: "37540-02100", jumlah: 1, satuan: "buah", cycle: "P2" },
      { nama: "Racor Filter", part_number: "2020TM", jumlah: 2, satuan: "buah", cycle: "P1" },
      { nama: "Lube Oil", part_number: "Pertamina Meditran SX SAE 15W-40", jumlah: 320, satuan: "liter", cycle: "P3" },
    ],
  },
  {
    unit: 7,
    mesin: "Mitsubishi S16R PTA-S",
    material: [
      { nama: "Lube Oil Filter", part_number: "37540-11100", jumlah: 4, satuan: "buah", cycle: "P2" },
      { nama: "Fuel Filter", part_number: "32562-60300", jumlah: 4, satuan: "buah", cycle: "P2" },
      { nama: "Air Filter", part_number: "47220-38802", jumlah: 4, satuan: "buah", cycle: "P5" },
      { nama: "Lube Oil Filter Bypass", part_number: "37540-02100", jumlah: 1, satuan: "buah", cycle: "P2" },
      { nama: "Racor Filter", part_number: "2020TM", jumlah: 2, satuan: "buah", cycle: "P1" },
      { nama: "Lube Oil", part_number: "Pertamina Meditran SX SAE 15W-40", jumlah: 320, satuan: "liter", cycle: "P3" },
    ],
  },
  {
    unit: 8,
    mesin: "Cummins KTA50-G8",
    material: [
      { nama: "Lube Oil Filter", part_number: "LF3325", jumlah: 5, satuan: "buah", cycle: "P2" },
      { nama: "Fuel Filter", part_number: "FS1006", jumlah: 2, satuan: "buah", cycle: "P2" },
      { nama: "Air Filter", part_number: "AF25278", jumlah: 2, satuan: "buah", cycle: "P4" },
      { nama: "Lube Oil Filter Bypass", part_number: "LF777", jumlah: 2, satuan: "buah", cycle: "P2" },
      { nama: "Racor Filter", part_number: "2020TM", jumlah: 1, satuan: "buah", cycle: "P1" },
      { nama: "Water Filter", part_number: "WF2076", jumlah: 2, satuan: "buah", cycle: "P3" },
      { nama: "Lube Oil", part_number: "Pertamina Meditran SX SAE 15W-40", jumlah: 180, satuan: "liter", cycle: "P2" },
    ],
  },
  {
    unit: 9,
    mesin: "Cummins KTA50-G8",
    material: [
      { nama: "Lube Oil Filter", part_number: "LF3325", jumlah: 5, satuan: "buah", cycle: "P2" },
      { nama: "Fuel Filter", part_number: "FS1006", jumlah: 2, satuan: "buah", cycle: "P2" },
      { nama: "Air Filter", part_number: "AF25278", jumlah: 2, satuan: "buah", cycle: "P4" },
      { nama: "Lube Oil Filter Bypass", part_number: "LF777", jumlah: 2, satuan: "buah", cycle: "P2" },
      { nama: "Racor Filter", part_number: "2020TM", jumlah: 1, satuan: "buah", cycle: "P1" },
      { nama: "Water Filter", part_number: "WF2076", jumlah: 2, satuan: "buah", cycle: "P3" },
      { nama: "Lube Oil", part_number: "Pertamina Meditran SX SAE 15W-40", jumlah: 180, satuan: "liter", cycle: "P2" },
    ],
  },
]


// Helper: mengembalikan range siklus PM yang menggunakan material ini
// Contoh: cycle "P1" → "P1 – P5", cycle "P3" → "P3 – P5", cycle "P5" → "P5"
export const getCycleRange = (baseCycle: string): string => {
  const level = parseInt(baseCycle.replace('P', ''))
  if (isNaN(level)) return baseCycle
  if (level >= 5) return 'P5'
  return `${baseCycle} – P5`
}

