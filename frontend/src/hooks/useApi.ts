import {
    keepPreviousData,
    useMutation,
    useQuery,
    useQueryClient,
    type QueryClient,
} from '@tanstack/react-query';
import { useMemo } from 'react';
import { api } from '../services/api';
import { useAppStore } from '../store/useAppStore';
import {
    DEFAULT_STATUS_LABELS,
    type Game,
    type GameFilters,
    type GameList,
    type GameStatus,
    type UserSettings,
} from '../types';
import { useDebouncedValue } from './useDebouncedValue';

export const keys = {
    me: ['me'] as const,
    games: ['games'] as const,
    gameList: (f: GameFilters) => ['games', 'list', f] as const,
    game: (id: string) => ['games', 'detail', id] as const,
    tags: ['tags'] as const,
    stats: ['stats'] as const,
    settings: ['settings'] as const,
    importHistory: ['importHistory'] as const,
};

/** Everything derived from the library (lists, stats, tag counts) is stale after a write. */
export function invalidateLibrary(qc: QueryClient) {
    return Promise.all([
        qc.invalidateQueries({ queryKey: keys.games }),
        qc.invalidateQueries({ queryKey: keys.stats }),
        qc.invalidateQueries({ queryKey: keys.tags }),
        qc.invalidateQueries({ queryKey: keys.me }),
    ]);
}

export const useMe = (enabled = true) =>
    useQuery({ queryKey: keys.me, queryFn: api.me, enabled, retry: false });

export function useGames() {
    const filters = useAppStore((s) => s.filters);
    const search = useDebouncedValue(filters.search, 200);
    const effective = useMemo(() => ({ ...filters, search }), [filters, search]);
    return useQuery({
        queryKey: keys.gameList(effective),
        queryFn: () => api.games(effective),
        placeholderData: keepPreviousData,
    });
}

export const useGame = (id: string | null) =>
    useQuery({ queryKey: keys.game(id ?? ''), queryFn: () => api.game(id!), enabled: !!id });

export const useTags = () => useQuery({ queryKey: keys.tags, queryFn: api.tags });
export const useStats = () => useQuery({ queryKey: keys.stats, queryFn: api.stats });
export const useSettings = () =>
    useQuery({ queryKey: keys.settings, queryFn: api.settings, staleTime: 5 * 60_000 });
export const useImportHistory = () =>
    useQuery({ queryKey: keys.importHistory, queryFn: api.importHistory });

export function useStatusLabels(): Record<GameStatus, string> {
    const { data } = useSettings();
    return useMemo(() => ({ ...DEFAULT_STATUS_LABELS, ...(data?.statusLabels ?? {}) }), [data]);
}

/** Moves games between columns immediately; rolls back if the server refuses. */
export function useSetStatus() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async ({
            ids,
            status,
        }: {
            ids: string[];
            status: GameStatus;
        }): Promise<void> => {
            if (ids.length === 1) await api.updateStatus(ids[0], status);
            else await api.bulkUpdate({ ids, status });
        },
        onMutate: async ({ ids, status }) => {
            await qc.cancelQueries({ queryKey: keys.games });
            const snapshot = qc.getQueriesData<GameList>({ queryKey: ['games', 'list'] });
            const now = new Date().toISOString();
            qc.setQueriesData<GameList>({ queryKey: ['games', 'list'] }, (old) =>
                old
                    ? {
                          ...old,
                          items: old.items.map((g) =>
                              ids.includes(g.id) ? { ...g, status, statusUpdatedAt: now } : g,
                          ),
                      }
                    : old,
            );
            return { snapshot };
        },
        onError: (_err, _vars, ctx) =>
            ctx?.snapshot.forEach(([key, data]) => qc.setQueryData(key, data)),
        onSettled: () => invalidateLibrary(qc),
    });
}

export function useUpdateGame() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({
            id,
            ...body
        }: {
            id: string;
            status?: GameStatus;
            notes?: string | null;
            tagIds?: string[];
        }) => api.updateGame(id, body),
        onSuccess: (game: Game) => {
            qc.setQueryData(keys.game(game.id), game);
            return invalidateLibrary(qc);
        },
    });
}

export function useUpdateSettings() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (patch: Partial<UserSettings>) => api.updateSettings(patch),
        onSuccess: (settings) => qc.setQueryData(keys.settings, settings),
    });
}
