import { useState } from 'react';
import { formatMonth } from '../utils/format';

export interface BarDatum {
    label: string;
    value: number;
    color: string;
}

/** Horizontal bars with direct labels: identity is never carried by color alone. */
export function BarList({
    data,
    unit = '',
    total,
}: {
    data: BarDatum[];
    unit?: string;
    total?: number;
}) {
    const max = Math.max(1, ...data.map((d) => d.value));
    const sum = total ?? data.reduce((s, d) => s + d.value, 0);
    return (
        <ul className="space-y-2.5">
            {data.map((d) => (
                <li
                    key={d.label}
                    className="grid grid-cols-[7.5rem_1fr_auto] items-center gap-3 text-sm"
                    title={`${d.label}: ${d.value}${unit}`}
                >
                    <span className="truncate">{d.label}</span>
                    <span className="h-3 rounded-r bg-slate-100 dark:bg-slate-800/80">
                        <span
                            className="block h-full rounded-r transition-[width]"
                            style={{
                                width: `${(d.value / max) * 100}%`,
                                minWidth: d.value ? 3 : 0,
                                background: d.color,
                            }}
                        />
                    </span>
                    <span className="tabular-nums">
                        {d.value.toLocaleString()}
                        {unit}
                        {sum > 0 && (
                            <span className="muted"> · {Math.round((d.value / sum) * 100)}%</span>
                        )}
                    </span>
                </li>
            ))}
        </ul>
    );
}

/** Grouped monthly columns (added vs completed) with a hover tooltip and a table fallback. */
export function MonthlyChart({
    data,
}: {
    data: { month: string; added: number; completed: number }[];
}) {
    const [hover, setHover] = useState<number | null>(null);
    const [asTable, setAsTable] = useState(false);
    const max = Math.max(1, ...data.flatMap((d) => [d.added, d.completed]));
    const series = [
        { key: 'added' as const, label: 'Added', color: 'var(--status-not-started)' },
        { key: 'completed' as const, label: 'Completed', color: 'var(--status-in-progress)' },
    ];

    return (
        <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-4 text-sm">
                {series.map((s) => (
                    <span key={s.key} className="inline-flex items-center gap-1.5">
                        <span
                            className="size-3 rounded-sm"
                            style={{ background: s.color }}
                            aria-hidden="true"
                        />{' '}
                        {s.label}
                    </span>
                ))}
                <button
                    className="muted ml-auto text-xs hover:underline"
                    onClick={() => setAsTable((t) => !t)}
                >
                    {asTable ? 'Show chart' : 'Show as table'}
                </button>
            </div>
            {asTable ? (
                <table className="w-full text-sm">
                    <thead>
                        <tr className="text-left">
                            <th className="py-1">Month</th>
                            <th className="py-1 text-right">Added</th>
                            <th className="py-1 text-right">Completed</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((d) => (
                            <tr
                                key={d.month}
                                className="border-t border-slate-200 dark:border-slate-700"
                            >
                                <td className="py-1">{d.month}</td>
                                <td className="py-1 text-right tabular-nums">{d.added}</td>
                                <td className="py-1 text-right tabular-nums">{d.completed}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            ) : (
                <div className="relative" onMouseLeave={() => setHover(null)}>
                    <div
                        className="flex h-44 items-end gap-1 border-b pb-px"
                        style={{ borderColor: 'var(--chart-grid)' }}
                        role="img"
                        aria-label={`Games added and completed per month: ${data.map((d) => `${formatMonth(d.month)} ${d.added} added, ${d.completed} completed`).join('; ')}`}
                    >
                        {data.map((d, i) => (
                            <div
                                key={d.month}
                                className={`flex h-full flex-1 items-end justify-center gap-0.5 rounded-t ${hover === i ? 'bg-slate-500/10' : ''}`}
                                onMouseEnter={() => setHover(i)}
                            >
                                {series.map((s) => (
                                    <span
                                        key={s.key}
                                        className="w-full max-w-4 rounded-t"
                                        style={{
                                            height: `${(d[s.key] / max) * 100}%`,
                                            minHeight: d[s.key] ? 2 : 0,
                                            background: s.color,
                                        }}
                                    />
                                ))}
                            </div>
                        ))}
                    </div>
                    <div className="mt-1 flex gap-1 text-[11px]">
                        {data.map((d, i) => (
                            <span
                                key={d.month}
                                className={`muted flex-1 text-center ${i % 2 && data.length > 8 ? 'max-sm:invisible' : ''}`}
                            >
                                {formatMonth(d.month)}
                            </span>
                        ))}
                    </div>
                    {hover !== null && (
                        <div
                            className="card pointer-events-none absolute top-0 z-10 px-3 py-2 text-xs shadow-lg"
                            style={{
                                left: `clamp(0px, calc(${((hover + 0.5) / data.length) * 100}% - 4rem), calc(100% - 8rem))`,
                            }}
                        >
                            <strong>{data[hover].month}</strong>
                            <div>Added: {data[hover].added}</div>
                            <div>Completed: {data[hover].completed}</div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
