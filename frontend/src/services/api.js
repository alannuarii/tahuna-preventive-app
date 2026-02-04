import { engines } from '../data/static'

// Mock Data
const generateServiceHours = () => {
    return engines.map(e => ({
        unit: e.unit,
        mesin: e.mesin,
        jamoperasi: Math.floor(Math.random() * 5000) + 1000,
        gantiOli: Math.floor(Math.random() * 250),
        waktu: new Date().toISOString()
    }))
}

const mockRealizations = [
    {
        id: 1,
        tanggal_pelaksanaan: '2023-10-15',
        unit: 1,
        mesin: 'SWD 6FHD 240',
        jenis_pm: 'P1',
        catatan: 'Routine Check',
        materials: [
            { id: 1, nama_material: 'Oil Filter', cycle: 'P1', jumlah_standar: 1, jumlah_realisasi: 1, satuan: 'pcs' }
        ]
    },
    {
        id: 2,
        tanggal_pelaksanaan: '2023-11-01',
        unit: 4,
        mesin: 'Deutz MWM 212 V12',
        jenis_pm: 'P2',
        catatan: 'Oil Change',
        materials: []
    }
]

// Mock API functions
export const api = {
    getServiceHours: async () => {
        return new Promise(resolve => {
            setTimeout(() => {
                resolve(generateServiceHours())
            }, 500)
        })
    },

    getPMSchedule: async (params) => {
        return new Promise(resolve => {
            setTimeout(() => {
                // Return some mock schedule events
                const today = new Date()
                resolve([
                    {
                        id: 'evt-1',
                        title: 'P1 Unit 1',
                        start: today.toISOString().split('T')[0],
                        extendedProps: {
                            unit: 1,
                            pm: 'P1',
                            daysFromToday: 0,
                            targetHours: 3000,
                            currentHours: 2990
                        }
                    },
                    {
                        id: 'evt-2',
                        title: 'P2 Unit 4',
                        start: new Date(today.getTime() + 86400000 * 2).toISOString().split('T')[0],
                        extendedProps: {
                            unit: 4,
                            pm: 'P2',
                            daysFromToday: 2,
                            targetHours: 3500,
                            currentHours: 3400
                        }
                    }
                ])
            }, 500)
        })
    },

    getMaterials: async (unit) => {
        return new Promise(resolve => {
            setTimeout(() => {
                resolve({
                    materials: [
                        { nama: 'Filter Oli', jumlah: 2, satuan: 'Pcs', cycle: 'P1' },
                        { nama: 'Filter Udara', jumlah: 1, satuan: 'Set', cycle: 'P2' },
                        { nama: 'Majun', jumlah: 5, satuan: 'Kg', cycle: 'P1' }
                    ]
                })
            }, 400)
        })
    },

    getRealizations: async (params) => {
        return new Promise(resolve => {
            setTimeout(() => {
                resolve({
                    data: mockRealizations,
                    meta: {
                        page: params.page || 1,
                        limit: params.limit || 10,
                        total: mockRealizations.length,
                        totalPages: 1
                    }
                })
            }, 400)
        })
    },

    getRealizationDetail: async (id) => {
        return new Promise(resolve => {
            setTimeout(() => {
                const item = mockRealizations.find(r => r.id == id)
                resolve(item)
            }, 300)
        })
    },

    saveRealization: async (data, id = null) => {
        return new Promise(resolve => {
            setTimeout(() => {
                console.log('Saved realization:', data, id)
                resolve({ success: true })
            }, 800)
        })
    },

    deleteRealization: async (id) => {
        return new Promise(resolve => {
            setTimeout(() => {
                console.log('Deleted realization:', id)
                resolve({ success: true })
            }, 500)
        })
    }
}
