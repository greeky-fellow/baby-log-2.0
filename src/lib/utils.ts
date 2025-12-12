// --- TIME HELPERS ---

export const toLocalIsoString = (date: Date) => {
    const d = new Date(date);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
};

export const getIsoNow = () => {
    return toLocalIsoString(new Date());
};

export const formatTime = (seconds: number) => {
    const rounded = Math.floor(seconds);
    const mins = Math.floor(rounded / 60);
    const secs = Math.floor(rounded % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export const formatTimeAgo = (dateString: string) => {
    if (!dateString) return '-';
    const diff = (new Date().getTime() - new Date(dateString).getTime()) / 1000 / 60;
    if (diff < 1) return 'Just now';
    if (diff < 60) return `${Math.floor(diff)} min ago`;
    const hours = Math.floor(diff / 60);
    return `${hours} hrs ${Math.floor(diff % 60)} min ago`;
};

export const formatTimeShort = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
};

// --- VOLUME HELPERS ---

export const displayVolume = (mlVal: number, volumeUnit: 'ml' | 'oz') => {
    if (volumeUnit === 'ml') return Math.round(mlVal);
    const oz = mlVal / 29.5735;
    return (Math.round(oz * 2) / 2).toFixed(1).replace('.0', '');
};

export const getUnitLabel = (volumeUnit: 'ml' | 'oz') => volumeUnit === 'ml' ? 'mL' : 'oz';

export const adjustVolume = (currentMl: number, operation: 'add' | 'subtract', volumeUnit: 'ml' | 'oz') => {
    if (volumeUnit === 'ml') {
        const delta = 5;
        return operation === 'add' ? currentMl + delta : Math.max(0, currentMl - delta);
    } else {
        const currentOz = currentMl / 29.5735;
        const targetOz = operation === 'add' ? currentOz + 0.5 : Math.max(0, currentOz - 0.5);
        return Math.round(targetOz * 29.5735 / 5) * 5;
    }
};
