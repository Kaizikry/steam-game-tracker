import type { RefObject } from 'react';
import { useStatusLabels, useTags } from '../hooks/useApi';
import { DEFAULT_FILTERS, useAppStore } from '../store/useAppStore';
import { GAME_STATUSES, type PlaytimeFilter, type SortField, type ViewType } from '../types';
import { StatusDot } from './StatusBadge';

const views: { id: ViewType; label: string; icon: string }[] = [
    { id: 'kanban', label: 'Board view', icon: '▥' },
    { id: 'grid', label: 'Grid view', icon: '▦' },
    { id: 'list', label: 'List view', icon: '☰' },
];

export function FilterBar({
    searchRef,
    total,
}: {
    searchRef: RefObject<HTMLInputElement | null>;
    total?: number;
}) {
    const { filters, setFilters, resetFilters, viewType, setViewType } = useAppStore();
    const labels = useStatusLabels();
    const { data: tags = [] } = useTags();
    const active =
        filters.search ||
        filters.statuses.length ||
        filters.tagIds.length ||
        filters.playtime ||
        filters.sort !== DEFAULT_FILTERS.sort ||
        filters.order !== DEFAULT_FILTERS.order;

    const toggleStatus = (s: (typeof GAME_STATUSES)[number]) =>
        setFilters({
            statuses: filters.statuses.includes(s)
                ? filters.statuses.filter((x) => x !== s)
                : [...filters.statuses, s],
        });

    return (
        <div className="card space-y-3 p-3">
            <div className="flex flex-wrap items-center gap-2">
                <div className="relative min-w-48 flex-1">
                    <input
                        ref={searchRef}
                        type="search"
                        className="input pr-8"
                        placeholder="Search games…  ( / )"
                        value={filters.search}
                        onChange={(e) => setFilters({ search: e.target.value })}
                        aria-label="Search games by title"
                    />
                </div>
                <select
                    className="input w-auto"
                    value={filters.playtime}
                    onChange={(e) => setFilters({ playtime: e.target.value as PlaytimeFilter })}
                    aria-label="Filter by play time"
                >
                    <option value="">Any play time</option>
                    <option value="under1">Under 1 hour</option>
                    <option value="1to10">1–10 hours</option>
                    <option value="over10">10+ hours</option>
                </select>
                <select
                    className="input w-auto"
                    value={`${filters.sort}:${filters.order}`}
                    onChange={(e) => {
                        const [sort, order] = e.target.value.split(':') as [
                            SortField,
                            'asc' | 'desc',
                        ];
                        setFilters({ sort, order });
                    }}
                    aria-label="Sort games"
                >
                    <option value="title:asc">Title A–Z</option>
                    <option value="title:desc">Title Z–A</option>
                    <option value="hoursPlayed:desc">Most played</option>
                    <option value="hoursPlayed:asc">Least played</option>
                    <option value="lastPlayedAt:desc">Recently played</option>
                    <option value="createdAt:desc">Recently added</option>
                    <option value="updatedAt:desc">Recently updated</option>
                </select>
                <div
                    className="flex rounded-lg border border-slate-300 dark:border-slate-600"
                    role="group"
                    aria-label="View type"
                >
                    {views.map((v) => (
                        <button
                            key={v.id}
                            className={`px-3 py-2 text-sm first:rounded-l-lg last:rounded-r-lg ${viewType === v.id ? 'bg-sky-600 text-white dark:bg-sky-500 dark:text-slate-950' : 'hover:bg-slate-100 dark:hover:bg-steam-700'}`}
                            onClick={() => setViewType(v.id)}
                            aria-pressed={viewType === v.id}
                            title={`${v.label} (v cycles)`}
                        >
                            <span aria-hidden="true">{v.icon}</span>
                            <span className="sr-only">{v.label}</span>
                        </button>
                    ))}
                </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-sm">
                {GAME_STATUSES.map((s) => (
                    <button
                        key={s}
                        onClick={() => toggleStatus(s)}
                        aria-pressed={filters.statuses.includes(s)}
                        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 ${filters.statuses.includes(s) ? 'border-sky-500 bg-sky-500/15' : 'border-slate-300 dark:border-slate-600'}`}
                    >
                        <StatusDot status={s} /> {labels[s]}
                    </button>
                ))}
                {tags.length > 0 && (
                    <select
                        className="rounded-full border border-slate-300 bg-transparent px-3 py-1 dark:border-slate-600 dark:bg-steam-800"
                        value=""
                        onChange={(e) =>
                            e.target.value &&
                            setFilters({ tagIds: [...filters.tagIds, e.target.value] })
                        }
                        aria-label="Filter by tag"
                    >
                        <option value="">+ Tag filter</option>
                        {tags
                            .filter((t) => !filters.tagIds.includes(t.id))
                            .map((t) => (
                                <option key={t.id} value={t.id}>
                                    {t.name}
                                </option>
                            ))}
                    </select>
                )}
                {filters.tagIds.map((id) => {
                    const tag = tags.find((t) => t.id === id);
                    return (
                        <button
                            key={id}
                            className="inline-flex items-center gap-1 rounded-full border border-sky-500 bg-sky-500/15 px-3 py-1"
                            onClick={() =>
                                setFilters({ tagIds: filters.tagIds.filter((x) => x !== id) })
                            }
                            aria-label={`Remove tag filter ${tag?.name ?? ''}`}
                        >
                            <span
                                className="size-2 rounded-full"
                                style={{ background: tag?.color }}
                            />{' '}
                            {tag?.name ?? 'Unknown tag'} ✕
                        </button>
                    );
                })}
                <span className="muted ml-auto">
                    {total !== undefined && `${total.toLocaleString()} games`}
                </span>
                {active ? (
                    <button
                        className="text-sky-600 hover:underline dark:text-sky-400"
                        onClick={resetFilters}
                    >
                        Clear filters
                    </button>
                ) : null}
            </div>
        </div>
    );
}
