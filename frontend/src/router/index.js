import { createRouter, createWebHistory } from 'vue-router'
import PreventiveIndex from '../views/PreventiveIndex.vue'
import PreventiveDetail from '../views/PreventiveDetail.vue'
import PreventiveRealisasi from '../views/PreventiveRealisasi.vue'
import PreventiveRealisasiInput from '../views/PreventiveRealisasiInput.vue'

const routes = [
    {
        path: '/',
        redirect: '/preventive'
    },
    {
        path: '/preventive',
        name: 'PreventiveIndex',
        component: PreventiveIndex
    },
    {
        path: '/preventive/detail/:id',
        name: 'PreventiveDetail',
        component: PreventiveDetail
    },
    {
        path: '/preventive/realisasi',
        name: 'PreventiveRealisasi',
        component: PreventiveRealisasi
    },
    {
        path: '/preventive/realisasi/input',
        name: 'PreventiveRealisasiInput',
        component: PreventiveRealisasiInput
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

export default router
