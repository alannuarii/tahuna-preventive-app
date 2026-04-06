import { createSignal, onMount } from "solid-js";
import { engines, gantiOliHours, pmCycles } from "./pmCycles"; // Wait, pmCycles logic might need moving or combining. Let's create proper utils.

export const useMaintenanceData = () => {
    const [serviceHours, setServiceHours] = createSignal<any[]>([]);
    const [isLoading, setIsLoading] = createSignal(false);

    // Oil change cycles per unit
    const gantiOliCycles = [500, 250, 250, 500, 500, 250, 250];
    const overhaulCycles = [6000, 6000, 6000, 5000, 5000, 6000, 6000];

    const refreshServiceHours = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/service-hours');
            if (res.ok) setServiceHours(await res.json());
        } finally {
            setIsLoading(false);
        }
    };

    // Initial fetch only on client
    onMount(() => {
        refreshServiceHours();
    });

    const fetchPMSchedule = async (startDate: string | null = null, endDate: string | null = null) => {
        const query = new URLSearchParams();
        if (startDate) query.append('start', startDate);
        if (endDate) query.append('end', endDate);
        const res = await fetch(`/api/pm/schedule?${query.toString()}`);
        return await res.json();
    };

    return {
        serviceHours,
        isLoading,
        refreshServiceHours,
        gantiOliCycles,
        overhaulCycles,
        fetchPMSchedule
    };
};
