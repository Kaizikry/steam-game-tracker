import type { ReactNode } from 'react';

export function StatCard({
    label,
    value,
    hint,
}: {
    label: string;
    value: ReactNode;
    hint?: ReactNode;
}) {
    return (
        <div className="card p-4">
            <p className="muted text-sm">{label}</p>
            <p className="mt-1 text-2xl font-bold tabular-nums">{value}</p>
            {hint && <p className="muted mt-1 text-xs">{hint}</p>}
        </div>
    );
}
