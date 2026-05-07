import fs from 'fs'

const data = JSON.parse(fs.readFileSync('scratch/sop_data_raw.json', 'utf8'))

const listrikKeywords = [
  'baterai', 'terminal', 'kabel', 'busbar', 'panel', 'sinkron', 'bushing', 'trafo', 
  'tegangan', 'sensor', 'varistor', 'dioda', 'exciter', 'isolasi', 'generator', 
  'megger', 'motor fan', 'starter', 'kontaktor', 'relay', 'meter', 'arus', 'fuse', 
  'pt pump', 'belitan', 'vernis', 'pt pump'
]

function classifyStep(step) {
  const lower = step.toLowerCase()
  const isListrik = listrikKeywords.some(keyword => lower.includes(keyword))
  return isListrik ? 'Listrik' : 'Mekanik'
}

const results = data.map(row => {
  const mekanik = []
  const listrik = []
  
  if (Array.isArray(row.pelaksanaan)) {
    row.pelaksanaan.forEach(step => {
      if (classifyStep(step) === 'Listrik') {
        listrik.push(step)
      } else {
        mekanik.push(step)
      }
    })
  }
  
  return {
    id: row.id,
    mesin: row.mesin,
    jenis_pm: row.jenis_pm,
    pelaksanaan_count: row.pelaksanaan ? row.pelaksanaan.length : 0,
    mekanik_count: mekanik.length,
    listrik_count: listrik.length,
    mekanik,
    listrik
  }
})

fs.writeFileSync('scratch/split_preview.json', JSON.stringify(results, null, 2))
console.log("Split preview written to scratch/split_preview.json")

// Show a preview for SWD P1 (ID: 1)
const swdP1 = results.find(r => r.id === 1)
console.log("\nSWD P1 (ID: 1) SPLIT PREVIEW:")
console.log("MEKANIK:")
console.log(swdP1.mekanik)
console.log("\nLISTRIK:")
console.log(swdP1.listrik)
