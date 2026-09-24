import type { MouseEvent } from 'react';
import type { Game } from '../types';
import { formatHours } from '../utils/format';
import { GameCover } from './GameCover';
import { TagChip } from './TagChip';

export interface CardHandlers {
    onOpen: (game: Game) => void;
    onToggleSelect: (game: Game) => void;
    onContextMenu: (game: Game, e: MouseEvent) => void;
}

interface Props extends CardHandlers {
    game: Game;
    selected: boolean;
    selectionMode: boolean;
    dragging?: boolean;
    /** Board layout: small thumbnail beside the text so more cards fit per column. */
    compact?: boolean;
}

export function GameCard({
    game,
    selected,
    selectionMode,
    dragging,
    compact,
    onOpen,
    onToggleSelect,
    onContextMenu,
}: Props) {
    return (
        <article
            className={`card group relative overflow-hidden transition-shadow ${dragging ? 'shadow-2xl ring-2 ring-steam-accent' : 'hover:shadow-md'} ${selected ? 'ring-2 ring-sky-500' : ''}`}
            onContextMenu={(e) => {
                e.preventDefault();
                onContextMenu(game, e);
            }}
        >
            <button
                className={`w-full text-left ${compact ? 'flex items-stretch' : 'block'}`}
                onClick={(e) => (selectionMode || e.shiftKey ? onToggleSelect(game) : onOpen(game))}
                aria-label={`${game.title}, ${formatHours(game.hoursPlayed)}`}
            >
                {compact ? (
                    <div className="w-28 shrink-0 self-start sm:w-32">
                        <GameCover src={game.coverArtUrl} title={game.title} />
                    </div>
                ) : (
                    <GameCover src={game.coverArtUrl} title={game.title} />
                )}
                <div className={`min-w-0 space-y-1.5 ${compact ? 'px-2.5 py-2' : 'p-2.5'}`}>
                    <h3 className="line-clamp-2 text-sm leading-snug font-semibold">
                        {game.title}
                    </h3>
                    <p className="muted text-xs">
                        {formatHours(game.hoursPlayed)}
                        {game.isFreeToPlay && ' · Free'}
                        {game.notes && ' · 📝'}
                    </p>
                    {game.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                            {game.tags.slice(0, compact ? 2 : 3).map((t) => (
                                <TagChip key={t.id} tag={t} />
                            ))}
                            {game.tags.length > (compact ? 2 : 3) && (
                                <span className="muted text-xs">
                                    +{game.tags.length - (compact ? 2 : 3)}
                                </span>
                            )}
                        </div>
                    )}
                </div>
            </button>
            <label
                className={`absolute top-1 left-1 flex size-7 cursor-pointer items-center justify-center rounded-md bg-black/60 transition-opacity ${selectionMode || selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 focus-within:opacity-100'}`}
            >
                <input
                    type="checkbox"
                    className="size-4 accent-sky-500"
                    checked={selected}
                    onChange={() => onToggleSelect(game)}
                    aria-label={`Select ${game.title}`}
                />
            </label>
        </article>
    );
}
