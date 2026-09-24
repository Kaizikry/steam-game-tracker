import axios, { AxiosError } from 'axios';
import { useAppStore } from '../store/useAppStore';
import type {
    FileImportResult,
    Game,
    GameFilters,
    GameList,
    GameStatus,
    ImportHistoryEntry,
    ImportResult,
    Stats,
    Tag,
    User,
    UserSettings,
} from '../types';

export const http = axios.create({
    baseURL: `${import.meta.env.VITE_API_URL ?? ''}/api`,
    timeout: 90_000,
});

http.interceptors.request.use((req) => {
    const token = useAppStore.getState().token;
    if (token) req.headers.Authorization = `Bearer ${token}`;
    return req;
});

interface Envelope<T> {
    success: boolean;
    data: T;
    error: { code: string; message: string } | null;
}

/** Pulls the server's error message out of an axios error. */
export function errorMessage(err: unknown): string {
    if (err instanceof AxiosError) {
        const body = err.response?.data as Envelope<unknown> | undefined;
        if (body?.error?.message) return body.error.message;
        if (err.code === 'ECONNABORTED') return 'The request timed out';
        if (!err.response) return 'Cannot reach the server. Is the backend running?';
    }
    return err instanceof Error ? err.message : 'Something went wrong';
}

export const isUnauthorized = (err: unknown) =>
    err instanceof AxiosError && err.response?.status === 401;

const unwrap = async <T>(p: Promise<{ data: Envelope<T> }>) => (await p).data.data;

export function filtersToParams(f: GameFilters) {
    const params: Record<string, string> = { sort: f.sort, order: f.order };
    if (f.search.trim()) params.search = f.search.trim();
    if (f.statuses.length) params.status = f.statuses.join(',');
    if (f.tagIds.length) params.tags = f.tagIds.join(',');
    if (f.playtime) params.playtime = f.playtime;
    return params;
}

export const api = {
    createSession: () => unwrap<{ token: string; user: User }>(http.post('/auth/anonymous')),
    me: () => unwrap<User>(http.get('/auth/user')),
    deleteAccount: () => unwrap(http.delete('/auth/user')),

    games: (filters: GameFilters) =>
        unwrap<GameList>(http.get('/games', { params: filtersToParams(filters) })),
    game: (id: string) => unwrap<Game>(http.get(`/games/${id}`)),
    updateGame: (
        id: string,
        body: { status?: GameStatus; notes?: string | null; tagIds?: string[] },
    ) => unwrap<Game>(http.put(`/games/${id}`, body)),
    updateStatus: (id: string, status: GameStatus) =>
        unwrap<Game>(http.patch(`/games/${id}/status`, { status })),
    deleteGame: (id: string) => unwrap(http.delete(`/games/${id}`)),
    refreshGame: (id: string) => unwrap<Game>(http.post(`/games/${id}/refresh`)),
    bulkUpdate: (body: {
        ids: string[];
        status?: GameStatus;
        addTagIds?: string[];
        removeTagIds?: string[];
    }) => unwrap<{ matched: number; updated: number }>(http.post('/games/bulk-update', body)),
    clearLibrary: () => unwrap(http.delete('/games')),

    tags: () => unwrap<Tag[]>(http.get('/tags')),
    createTag: (body: { name: string; color?: string }) => unwrap<Tag>(http.post('/tags', body)),
    updateTag: (id: string, body: { name?: string; color?: string }) =>
        unwrap<Tag>(http.put(`/tags/${id}`, body)),
    deleteTag: (id: string) => unwrap(http.delete(`/tags/${id}`)),

    importSteam: (body: { profile: string; includeFreeToPlay: boolean; autoCategorize: boolean }) =>
        unwrap<ImportResult>(http.post('/import/steam', body)),
    importHistory: () => unwrap<ImportHistoryEntry[]>(http.get('/import/history')),
    importFile: (body: { format: 'json' | 'csv'; content: string; overwrite: boolean }) =>
        unwrap<FileImportResult>(http.post('/import', body)),

    exportData: async (format: 'json' | 'csv') => {
        const res = await http.post('/export', { format }, { responseType: 'blob' });
        const disposition = String(res.headers['content-disposition'] ?? '');
        const filename =
            disposition.match(/filename="([^"]+)"/)?.[1] ?? `steam-tracker-export.${format}`;
        return { blob: res.data as Blob, filename };
    },

    stats: () => unwrap<Stats>(http.get('/stats')),
    settings: () => unwrap<UserSettings>(http.get('/settings')),
    updateSettings: (body: Partial<UserSettings>) =>
        unwrap<UserSettings>(http.put('/settings', body)),
};
