import { useStatusLabels } from '../hooks/useApi';
import type { GameStatus } from '../types';

export const statusVar = (s: GameStatus) => `var(--status-${s.toLowerCase().replace('_', '-')})`;

export function StatusDot({ status }: { status: GameStatus }) {
    return (
        <span
            className="inline-block size-2.5 shrink-0 rounded-full"
            style={{ background: statusVar(status) }}
            aria-hidden="true"
        />
    );
}

export function StatusBadge({ status }: { status: GameStatus }) {
    const labels = useStatusLabels();
    return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 px-2 py-0.5 text-xs dark:border-slate-600">
            <StatusDot status={status} />
            {labels[status]}
        </span>
    );
}
