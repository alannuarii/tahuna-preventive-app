import { createRouter, createWebHistory } from 'vue-router'
import PreventiveIndex from '../views/PreventiveIndex.vue'
import PreventiveDetail from '../views/PreventiveDetail.vue'
import PreventiveRealisasi from '../views/PreventiveRealisasi.vue'
import PreventiveRealisasiInput from '../views/PreventiveRealisasiInput.vue'
import Login from '../views/Login.vue'
import LoginSuccess from '../views/LoginSuccess.vue'

const routes = [
    {
        path: '/',
        redirect: '/preventive'
    },
    {
        path: '/login',
        name: 'Login',
        component: Login,
        meta: { guest: true }
    },
    {
        path: '/login/success',
        name: 'LoginSuccess',
        component: LoginSuccess,
        meta: { guest: true }
    },
    {
        path: '/preventive',
        name: 'PreventiveIndex',
        component: PreventiveIndex,
        meta: { requiresAuth: true }
    },
    {
        path: '/preventive/detail/:id',
        name: 'PreventiveDetail',
        component: PreventiveDetail,
        meta: { requiresAuth: true }
    },
    {
        path: '/preventive/realisasi',
        name: 'PreventiveRealisasi',
        component: PreventiveRealisasi,
        meta: { requiresAuth: true }
    },
    {
        path: '/preventive/realisasi/input',
        name: 'PreventiveRealisasiInput',
        component: PreventiveRealisasiInput,
        meta: { requiresAuth: true }
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

// Helper function to get cookie value
const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
};

router.beforeEach((to, from, next) => {
    const isAuthenticated = !!getCookie('auth_token');

    if (to.meta.requiresAuth && !isAuthenticated) {
        next('/login');
    } else if (to.meta.guest && isAuthenticated) {
        next('/preventive');
    } else {
        next();
    }
});

export default router
