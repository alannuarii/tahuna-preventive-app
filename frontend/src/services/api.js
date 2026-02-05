const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const authFetch = async (url, options = {}) => {
    const token = localStorage.getItem('auth_token');
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}${url}`, {
        ...options,
        headers,
    });

    if (response.status === 401) {
        // Token expired or invalid
        localStorage.removeItem('auth_token');
        window.location.href = '/login';
        throw new Error('Unauthorized');
    }

    return response;
};

export const api = {
    getServiceHours: async () => {
        const response = await authFetch('/service-hours');
        if (!response.ok) throw new Error('Failed to fetch service hours');
        const data = await response.json();
        return data.map(item => ({
            ...item,
            waktu: new Date(item.waktu).toISOString()
        }));
    },

    getPMSchedule: async (params) => {
        const query = new URLSearchParams(params).toString();
        const response = await authFetch(`/pm/schedule?${query}`);
        if (!response.ok) throw new Error('Failed to fetch PM schedule');
        return await response.json();
    },

    getMaterials: async (unit) => {
        const response = await authFetch(`/materials?unit=${unit}`);
        if (!response.ok) throw new Error('Failed to fetch materials');
        return await response.json();
    },

    getRealizations: async (params) => {
        const query = new URLSearchParams(params).toString();
        const response = await authFetch(`/pm/realizations?${query}`);
        if (!response.ok) throw new Error('Failed to fetch realizations');
        return await response.json();
    },

    getRealizationDetail: async (id) => {
        const response = await authFetch(`/pm/realizations/${id}`);
        if (!response.ok) throw new Error('Failed to fetch realization detail');
        return await response.json();
    },

    saveRealization: async (data, id = null) => {
        const url = id ? `/pm/realizations/${id}` : `/pm/realizations`;
        const method = id ? 'PUT' : 'POST';

        const response = await authFetch(url, {
            method,
            body: JSON.stringify(data),
        });

        if (!response.ok) throw new Error('Failed to save realization');
        return await response.json();
    },

    deleteRealization: async (id) => {
        const response = await authFetch(`/pm/realizations/${id}`, {
            method: 'DELETE',
        });

        if (!response.ok) throw new Error('Failed to delete realization');
        return await response.json();
    }
}
