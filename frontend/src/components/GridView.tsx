import { useState } from 'react';
import type { Game } from '../types';
import { GameCard, type CardHandlers } from './GameCard';

const PAGE = 120;

export function GridView({
    games,
    selectedIds,
    ...handlers
}: CardHandlers & { games: Game[]; selectedIds: string[] }) {
    const [limit, setLimit] = useState(PAGE);
    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
                {games.slice(0, limit).map((g) => (
                    <GameCard
                        key={g.id}
                        game={g}
                        selected={selectedIds.includes(g.id)}
                        selectionMode={selectedIds.length > 0}
                        {...handlers}
                    />
                ))}
            </div>
            {games.length > limit && (
                <div className="text-center">
                    <button className="btn-secondary" onClick={() => setLimit((l) => l + PAGE)}>
                        Show more ({games.length - limit} more)
                    </button>
                </div>
            )}
        </div>
    );
}
