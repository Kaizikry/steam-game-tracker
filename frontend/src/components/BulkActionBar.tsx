import { useMutation, useQueryClient } from '@tanstack/react-query';
import { invalidateLibrary, useSetStatus, useStatusLabels, useTags } from '../hooks/useApi';
import { api, errorMessage } from '../services/api';
import { useAppStore } from '../store/useAppStore';
import { toast } from '../store/useToastStore';
import { GAME_STATUSES, type GameStatus } from '../types';

export function BulkActionBar({ visibleIds }: { visibleIds: string[] }) {
    const { selectedIds, setSelected } = useAppStore();
    const labels = useStatusLabels();
    const { data: tags = [] } = useTags();
    const setStatus = useSetStatus();
    const qc = useQueryClient();
    const tagMutation = useMutation({
        mutationFn: (body: { addTagIds?: string[]; removeTagIds?: string[] }) =>
            api.bulkUpdate({ ids: selectedIds, ...body }),
        onSuccess: (r) => {
            toast.success(`Updated tags on ${r.matched} games`);
            return invalidateLibrary(qc);
        },
        onError: (e) => toast.error(errorMessage(e)),
    });

    if (selectedIds.length === 0) return null;

    return (
        <div
            className="card sticky top-2 z-20 flex flex-wrap items-center gap-2 border-sky-500/60 p-3 shadow-lg"
            role="region"
            aria-label="Bulk actions"
        >
            <strong className="text-sm">{selectedIds.length} selected</strong>
            <select
                className="input w-auto"
                value=""
                onChange={(e) => {
                    const status = e.target.value as GameStatus;
                    if (!status) return;
                    setStatus.mutate(
                        { ids: selectedIds, status },
                        {
                            onSuccess: () =>
                                toast.success(
                                    `Moved ${selectedIds.length} games to ${labels[status]}`,
                                ),
                            onError: (err) => toast.error(errorMessage(err)),
                        },
                    );
                    setSelected([]);
                }}
                aria-label="Set status for selected games"
            >
                <option value="">Set status…</option>
                {GAME_STATUSES.map((s) => (
                    <option key={s} value={s}>
                        {labels[s]}
                    </option>
                ))}
            </select>
            {tags.length > 0 && (
                <>
                    <select
                        className="input w-auto"
                        value=""
                        onChange={(e) =>
                            e.target.value && tagMutation.mutate({ addTagIds: [e.target.value] })
                        }
                        aria-label="Add tag to selected games"
                    >
                        <option value="">Add tag…</option>
                        {tags.map((t) => (
                            <option key={t.id} value={t.id}>
                                {t.name}
                            </option>
                        ))}
                    </select>
                    <select
                        className="input w-auto"
                        value=""
                        onChange={(e) =>
                            e.target.value && tagMutation.mutate({ removeTagIds: [e.target.value] })
                        }
                        aria-label="Remove tag from selected games"
                    >
                        <option value="">Remove tag…</option>
                        {tags.map((t) => (
                            <option key={t.id} value={t.id}>
                                {t.name}
                            </option>
                        ))}
                    </select>
                </>
            )}
            <div className="ml-auto flex gap-2">
                <button
                    className="btn-secondary"
                    onClick={() => setSelected([...new Set([...selectedIds, ...visibleIds])])}
                >
                    Select all ({visibleIds.length})
                </button>
                <button className="btn-secondary" onClick={() => setSelected([])}>
                    Clear
                </button>
            </div>
        </div>
    );
}
