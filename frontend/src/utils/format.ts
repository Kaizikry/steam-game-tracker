export function formatHours(hours: number): string {
    if (hours === 0) return 'Never played';
    if (hours < 1) return `${Math.round(hours * 60)} min`;
    return `${hours.toLocaleString(undefined, { maximumFractionDigits: 1 })} h`;
}

export function formatDate(iso: string | null | undefined): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

export function formatRelative(iso: string | null | undefined, now = Date.now()): string {
    if (!iso) return 'never';
    const diff = Math.round((now - new Date(iso).getTime()) / 1000);
    if (diff < 60) return 'just now';
    const units: [number, Intl.RelativeTimeFormatUnit][] = [
        [60 * 60 * 24 * 365, 'year'],
        [60 * 60 * 24 * 30, 'month'],
        [60 * 60 * 24 * 7, 'week'],
        [60 * 60 * 24, 'day'],
        [60 * 60, 'hour'],
        [60, 'minute'],
    ];
    const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });
    for (const [secs, unit] of units) {
        if (diff >= secs) return rtf.format(-Math.floor(diff / secs), unit);
    }
    return 'just now';
}

export const formatMonth = (key: string) => {
    const [y, m] = key.split('-').map(Number);
    return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString(undefined, {
        month: 'short',
        timeZone: 'UTC',
    });
};

export const steamStoreUrl = (appId: number) => `https://store.steampowered.com/app/${appId}`;
export const steamRunUrl = (appId: number) => `steam://run/${appId}`;

export function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}
