import { useState } from 'react';
import { useSetStatus, useStatusLabels } from '../hooks/useApi';
import { useAppStore } from '../store/useAppStore';
import { GAME_STATUSES, type Game, type GameStatus, type SortField } from '../types';
import { formatDate, formatHours } from '../utils/format';
import type { CardHandlers } from './GameCard';
import { TagChip } from './TagChip';

const PAGE = 200;

const columns: { field: SortField | null; label: string; className?: string }[] = [
    { field: 'title', label: 'Title' },
    { field: null, label: 'Status' },
    { field: 'hoursPlayed', label: 'Hours', className: 'text-right' },
    { field: 'lastPlayedAt', label: 'Last played', className: 'hidden md:table-cell' },
    { field: 'createdAt', label: 'Added', className: 'hidden lg:table-cell' },
    { field: 'updatedAt', label: 'Updated', className: 'hidden lg:table-cell' },
    { field: null, label: 'Tags', className: 'hidden sm:table-cell' },
];

export function ListView({
    games,
    selectedIds,
    onOpen,
    onToggleSelect,
    onContextMenu,
}: CardHandlers & { games: Game[]; selectedIds: string[] }) {
    const { filters, setFilters, setSelected } = useAppStore();
    const labels = useStatusLabels();
    const setStatus = useSetStatus();
    const [limit, setLimit] = useState(PAGE);
    const allSelected = games.length > 0 && games.every((g) => selectedIds.includes(g.id));

    const sortBy = (field: SortField) =>
        setFilters(
            filters.sort === field
                ? { order: filters.order === 'asc' ? 'desc' : 'asc' }
                : { sort: field, order: field === 'title' ? 'asc' : 'desc' },
        );

    return (
        <div className="card overflow-x-auto">
            <table className="w-full text-sm">
                <thead className="border-b border-slate-200 text-left dark:border-slate-700">
                    <tr>
                        <th className="w-10 p-3">
                            <input
                                type="checkbox"
                                className="size-4 accent-sky-500"
                                checked={allSelected}
                                onChange={() =>
                                    setSelected(allSelected ? [] : games.map((g) => g.id))
                                }
                                aria-label="Select all games"
                            />
                        </th>
                        {columns.map((c) => (
                            <th
                                key={c.label}
                                className={`p-3 font-semibold ${c.className ?? ''}`}
                                aria-sort={
                                    c.field && filters.sort === c.field
                                        ? filters.order === 'asc'
                                            ? 'ascending'
                                            : 'descending'
                                        : undefined
                                }
                            >
                                {c.field ? (
                                    <button
                                        className="hover:underline"
                                        onClick={() => sortBy(c.field!)}
                                    >
                                        {c.label}
                                        {filters.sort === c.field &&
                                            (filters.order === 'asc' ? ' ▲' : ' ▼')}
                                    </button>
                                ) : (
                                    c.label
                                )}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {games.slice(0, limit).map((g) => (
                        <tr
                            key={g.id}
                            className={`border-b border-slate-100 last:border-0 hover:bg-slate-50 dark:border-slate-700/50 dark:hover:bg-steam-700/40 ${selectedIds.includes(g.id) ? 'bg-sky-500/10' : ''}`}
                            onContextMenu={(e) => {
                                e.preventDefault();
                                onContextMenu(g, e);
                            }}
                        >
                            <td className="p-3">
                                <input
                                    type="checkbox"
                                    className="size-4 accent-sky-500"
                                    checked={selectedIds.includes(g.id)}
                                    onChange={() => onToggleSelect(g)}
                                    aria-label={`Select ${g.title}`}
                                />
                            </td>
                            <td className="max-w-xs p-3">
                                <button
                                    className="text-left font-medium hover:underline"
                                    onClick={() => onOpen(g)}
                                >
                                    {g.title}
                                </button>
                            </td>
                            <td className="p-3">
                                <select
                                    className="rounded border border-slate-300 bg-transparent px-1.5 py-1 text-xs dark:border-slate-600 dark:bg-steam-800"
                                    value={g.status}
                                    onChange={(e) =>
                                        setStatus.mutate({
                                            ids: [g.id],
                                            status: e.target.value as GameStatus,
                                        })
                                    }
                                    aria-label={`Status of ${g.title}`}
                                >
                                    {GAME_STATUSES.map((s) => (
                                        <option key={s} value={s}>
                                            {labels[s]}
                                        </option>
                                    ))}
                                </select>
                            </td>
                            <td className="p-3 text-right whitespace-nowrap tabular-nums">
                                {formatHours(g.hoursPlayed)}
                            </td>
                            <td className="hidden p-3 whitespace-nowrap md:table-cell">
                                {formatDate(g.lastPlayedAt)}
                            </td>
                            <td className="hidden p-3 whitespace-nowrap lg:table-cell">
                                {formatDate(g.createdAt)}
                            </td>
                            <td className="hidden p-3 whitespace-nowrap lg:table-cell">
                                {formatDate(g.updatedAt)}
                            </td>
                            <td className="hidden p-3 sm:table-cell">
                                <div className="flex flex-wrap gap-1">
                                    {g.tags.map((t) => (
                                        <TagChip key={t.id} tag={t} />
                                    ))}
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {games.length > limit && (
                <div className="p-3 text-center">
                    <button className="btn-secondary" onClick={() => setLimit((l) => l + PAGE)}>
                        Show more ({games.length - limit} more)
                    </button>
                </div>
            )}
        </div>
    );
}
