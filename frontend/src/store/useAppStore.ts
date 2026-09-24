import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { GameFilters, Theme, ViewType } from '../types';

export const DEFAULT_FILTERS: GameFilters = {
    search: '',
    statuses: [],
    tagIds: [],
    playtime: '',
    sort: 'title',
    order: 'asc',
};

interface AppState {
    token: string | null;
    theme: Theme;
    viewType: ViewType;
    filters: GameFilters;
    selectedIds: string[];
    openGameId: string | null;
    setToken: (token: string | null) => void;
    setTheme: (theme: Theme) => void;
    setViewType: (view: ViewType) => void;
    setFilters: (patch: Partial<GameFilters>) => void;
    resetFilters: () => void;
    toggleSelected: (id: string) => void;
    setSelected: (ids: string[]) => void;
    openGame: (id: string | null) => void;
}

export const useAppStore = create<AppState>()(
    persist(
        (set) => ({
            token: null,
            theme: 'dark',
            viewType: 'kanban',
            filters: DEFAULT_FILTERS,
            selectedIds: [],
            openGameId: null,
            setToken: (token) => set({ token }),
            setTheme: (theme) => set({ theme }),
            setViewType: (viewType) => set({ viewType }),
            setFilters: (patch) => set((s) => ({ filters: { ...s.filters, ...patch } })),
            resetFilters: () => set({ filters: DEFAULT_FILTERS }),
            toggleSelected: (id) =>
                set((s) => ({
                    selectedIds: s.selectedIds.includes(id)
                        ? s.selectedIds.filter((x) => x !== id)
                        : [...s.selectedIds, id],
                })),
            setSelected: (selectedIds) => set({ selectedIds }),
            openGame: (openGameId) => set({ openGameId }),
        }),
        {
            name: 'sgt-app',
            // Only preferences and the session token survive reloads.
            partialize: (s) => ({
                token: s.token,
                theme: s.theme,
                viewType: s.viewType,
                filters: { ...s.filters, search: '' },
            }),
        },
    ),
);
