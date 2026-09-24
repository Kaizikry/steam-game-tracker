import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { invalidateLibrary, keys, useGame, useStatusLabels, useUpdateGame } from '../hooks/useApi';
import { api, errorMessage } from '../services/api';
import { useAppStore } from '../store/useAppStore';
import { toast } from '../store/useToastStore';
import { GAME_STATUSES, type GameStatus } from '../types';
import {
    formatDate,
    formatHours,
    formatRelative,
    steamRunUrl,
    steamStoreUrl,
} from '../utils/format';
import { GameCover } from './GameCover';
import { Modal } from './Modal';
import { NotesEditor } from './NotesEditor';
import { StatusDot } from './StatusBadge';
import { TagPicker } from './TagPicker';

export function GameDetailModal() {
    const { openGameId, openGame } = useAppStore();
    const close = () => openGame(null);
    if (!openGameId) return null;
    return <GameDetail id={openGameId} onClose={close} />;
}

function GameDetail({ id, onClose }: { id: string; onClose: () => void }) {
    const { data: game, isLoading, error } = useGame(id);
    const labels = useStatusLabels();
    const update = useUpdateGame();
    const qc = useQueryClient();
    const refreshed = useRef(false);

    const refresh = useMutation({
        mutationFn: () => api.refreshGame(id),
        onSuccess: (g) => qc.setQueryData(keys.game(id), g),
        onError: (e) => toast.error(errorMessage(e)),
    });
    const remove = useMutation({
        mutationFn: () => api.deleteGame(id),
        onSuccess: () => {
            toast.success('Game removed from your tracker');
            onClose();
            return invalidateLibrary(qc);
        },
    });

    // Fetch store details (release date, rating, achievements) the first time a game is opened.
    useEffect(() => {
        if (
            game &&
            !refreshed.current &&
            !game.releaseDate &&
            game.steamRating === null &&
            !game.description
        ) {
            refreshed.current = true;
            refresh.mutate();
        }
    }, [game, refresh]);

    // Number keys 1-4 set the status while the modal is open.
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement;
            if (
                !game ||
                ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) ||
                e.metaKey ||
                e.ctrlKey
            )
                return;
            const status = GAME_STATUSES[Number(e.key) - 1];
            if (status && status !== game.status) update.mutate({ id, status });
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [game, id, update]);

    const save = (
        patch: { status?: GameStatus; notes?: string | null; tagIds?: string[] },
        message?: string,
    ) =>
        update.mutate(
            { id, ...patch },
            {
                onSuccess: () => message && toast.success(message),
                onError: (e) => toast.error(errorMessage(e)),
            },
        );

    const unlocked = game?.achievements?.filter((a) => a.unlockedAt).length ?? 0;
    const totalAch = game?.achievements?.length ?? 0;

    return (
        <Modal title={game?.title ?? 'Game details'} onClose={onClose} wide>
            {isLoading && <p className="p-6">Loading…</p>}
            {error && <p className="p-6 text-red-500">{errorMessage(error)}</p>}
            {game && (
                <>
                    <div className="relative">
                        <GameCover src={game.coverArtUrl} title={game.title} banner />
                        <button
                            onClick={onClose}
                            className="absolute top-2 right-2 flex size-9 items-center justify-center rounded-full bg-black/70 text-white hover:bg-black"
                            aria-label="Close"
                        >
                            ✕
                        </button>
                    </div>
                    <div className="space-y-6 p-5">
                        <header className="space-y-2">
                            <h2 className="text-2xl font-bold">{game.title}</h2>
                            {game.description && (
                                <p className="muted text-sm">{game.description}</p>
                            )}
                            <div className="flex flex-wrap gap-2">
                                <a className="btn-primary" href={steamRunUrl(game.steamId)}>
                                    ▶ Open in Steam
                                </a>
                                <a
                                    className="btn-secondary"
                                    href={steamStoreUrl(game.steamId)}
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    Store page ↗
                                </a>
                                <button
                                    className="btn-secondary"
                                    onClick={() => refresh.mutate()}
                                    disabled={refresh.isPending}
                                >
                                    {refresh.isPending
                                        ? 'Fetching from Steam…'
                                        : '↻ Refresh details'}
                                </button>
                            </div>
                        </header>

                        <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                            <Info label="Hours played" value={formatHours(game.hoursPlayed)} />
                            <Info label="Last played" value={formatDate(game.lastPlayedAt)} />
                            <Info label="Released" value={formatDate(game.releaseDate)} />
                            <Info
                                label="Steam rating"
                                value={
                                    game.steamRating !== null
                                        ? `${game.steamRating}% positive`
                                        : '—'
                                }
                            />
                        </dl>

                        <section className="space-y-2">
                            <h3 className="font-semibold">Status</h3>
                            <div
                                className="grid grid-cols-2 gap-2 sm:grid-cols-4"
                                role="radiogroup"
                                aria-label="Status"
                            >
                                {GAME_STATUSES.map((s, i) => (
                                    <button
                                        key={s}
                                        role="radio"
                                        aria-checked={game.status === s}
                                        onClick={() =>
                                            s !== game.status &&
                                            save({ status: s }, `Moved to ${labels[s]}`)
                                        }
                                        className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${game.status === s ? 'border-sky-500 bg-sky-500/15 font-semibold' : 'border-slate-300 hover:bg-slate-100 dark:border-slate-600 dark:hover:bg-steam-700'}`}
                                    >
                                        <StatusDot status={s} /> {labels[s]}
                                        <kbd className="muted ml-auto text-xs">{i + 1}</kbd>
                                    </button>
                                ))}
                            </div>
                            <p className="muted text-xs">
                                Status changed {formatRelative(game.statusUpdatedAt)}
                                {game.completedAt && ` · completed ${formatDate(game.completedAt)}`}
                            </p>
                        </section>

                        <section className="space-y-2">
                            <h3 className="font-semibold">Notes</h3>
                            <NotesEditor
                                key={game.notesUpdatedAt ?? 'new'}
                                initial={game.notes ?? ''}
                                updatedAt={game.notesUpdatedAt}
                                saving={update.isPending}
                                onSave={(notes) => save({ notes }, 'Notes saved')}
                            />
                        </section>

                        <section className="space-y-2">
                            <h3 className="font-semibold">Tags</h3>
                            <TagPicker
                                selected={game.tags}
                                onChange={(tagIds) => save({ tagIds })}
                            />
                        </section>

                        <section className="space-y-2">
                            <h3 className="font-semibold">Achievements</h3>
                            {totalAch === 0 ? (
                                <p className="muted text-sm">
                                    {refresh.isPending
                                        ? 'Checking Steam…'
                                        : 'No achievement data (the game may have none, or your profile hides them).'}
                                </p>
                            ) : (
                                <>
                                    <div className="flex items-center gap-3 text-sm">
                                        <div
                                            className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700"
                                            role="progressbar"
                                            aria-valuenow={unlocked}
                                            aria-valuemin={0}
                                            aria-valuemax={totalAch}
                                            aria-label="Achievements unlocked"
                                        >
                                            <div
                                                className="h-full rounded-full"
                                                style={{
                                                    width: `${(unlocked / totalAch) * 100}%`,
                                                    background: 'var(--status-completed)',
                                                }}
                                            />
                                        </div>
                                        <span className="tabular-nums">
                                            {unlocked}/{totalAch} (
                                            {Math.round((unlocked / totalAch) * 100)}%)
                                        </span>
                                    </div>
                                    <details className="text-sm">
                                        <summary className="cursor-pointer">
                                            Show achievements
                                        </summary>
                                        <ul className="mt-2 max-h-60 space-y-1 overflow-y-auto">
                                            {game.achievements!.map((a) => (
                                                <li
                                                    key={a.id}
                                                    className={a.unlockedAt ? '' : 'muted'}
                                                >
                                                    {a.unlockedAt ? '🏆' : '🔒'}{' '}
                                                    <strong>{a.name}</strong>
                                                    {a.description && ` · ${a.description}`}
                                                    {a.unlockedAt && (
                                                        <span className="muted">
                                                            {' '}
                                                            · {formatDate(a.unlockedAt)}
                                                        </span>
                                                    )}
                                                </li>
                                            ))}
                                        </ul>
                                    </details>
                                </>
                            )}
                        </section>

                        <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 pt-4 text-xs dark:border-slate-700">
                            <span className="muted">
                                Added {formatDate(game.createdAt)} · Updated{' '}
                                {formatRelative(game.updatedAt)} · App ID {game.steamId}
                            </span>
                            <button
                                className="text-red-600 hover:underline dark:text-red-400"
                                onClick={() =>
                                    confirm(
                                        `Remove "${game.title}" from the tracker? A Steam re-import will add it back.`,
                                    ) && remove.mutate()
                                }
                            >
                                Remove from tracker
                            </button>
                        </footer>
                    </div>
                </>
            )}
        </Modal>
    );
}

function Info({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-lg bg-slate-100 p-3 dark:bg-steam-900/60">
            <dt className="muted text-xs">{label}</dt>
            <dd className="font-semibold">{value}</dd>
        </div>
    );
}
