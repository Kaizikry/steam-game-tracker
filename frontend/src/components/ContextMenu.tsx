import { useEffect, useRef } from 'react';
import { useStatusLabels } from '../hooks/useApi';
import { GAME_STATUSES, type Game, type GameStatus } from '../types';
import { steamStoreUrl } from '../utils/format';
import { StatusDot } from './StatusBadge';

interface Props {
    game: Game;
    x: number;
    y: number;
    onClose: () => void;
    onOpen: () => void;
    onStatus: (s: GameStatus) => void;
}

export function ContextMenu({ game, x, y, onClose, onOpen, onStatus }: Props) {
    const ref = useRef<HTMLDivElement>(null);
    const labels = useStatusLabels();

    useEffect(() => {
        ref.current?.querySelector('button')?.focus();
        const close = (e: Event) => {
            if (e instanceof KeyboardEvent && e.key !== 'Escape') return;
            if (e instanceof MouseEvent && ref.current?.contains(e.target as Node)) return;
            onClose();
        };
        document.addEventListener('mousedown', close);
        document.addEventListener('keydown', close);
        window.addEventListener('scroll', onClose, true);
        return () => {
            document.removeEventListener('mousedown', close);
            document.removeEventListener('keydown', close);
            window.removeEventListener('scroll', onClose, true);
        };
    }, [onClose]);

    const left = Math.min(x, window.innerWidth - 220);
    const top = Math.min(y, window.innerHeight - 260);
    const item =
        'flex w-full items-center gap-2 rounded px-3 py-1.5 text-left text-sm hover:bg-slate-100 focus:bg-slate-100 dark:hover:bg-steam-700 dark:focus:bg-steam-700';

    return (
        <div
            ref={ref}
            role="menu"
            aria-label={`Actions for ${game.title}`}
            className="card fixed z-50 w-52 p-1 shadow-xl"
            style={{ left, top }}
        >
            <button
                role="menuitem"
                className={item}
                onClick={() => {
                    onOpen();
                    onClose();
                }}
            >
                Open details
            </button>
            <div className="my-1 border-t border-slate-200 dark:border-slate-700" />
            {GAME_STATUSES.filter((s) => s !== game.status).map((s) => (
                <button
                    role="menuitem"
                    key={s}
                    className={item}
                    onClick={() => {
                        onStatus(s);
                        onClose();
                    }}
                >
                    <StatusDot status={s} /> Move to {labels[s]}
                </button>
            ))}
            <div className="my-1 border-t border-slate-200 dark:border-slate-700" />
            <a
                role="menuitem"
                className={item}
                href={steamStoreUrl(game.steamId)}
                target="_blank"
                rel="noreferrer"
                onClick={onClose}
            >
                View on Steam ↗
            </a>
        </div>
    );
}
