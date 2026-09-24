import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import type { Game } from '../types';
import { GameCard } from './GameCard';

const game: Game = {
    id: 'g1',
    steamId: 570940,
    title: 'Elden Ring',
    description: null,
    coverArtUrl: null,
    status: 'IN_PROGRESS',
    hoursPlayed: 45.5,
    releaseDate: null,
    steamRating: null,
    isFreeToPlay: false,
    isDLC: false,
    lastPlayedAt: null,
    notes: 'Stuck at Malenia',
    notesUpdatedAt: null,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    statusUpdatedAt: '2026-01-01T00:00:00Z',
    completedAt: null,
    tags: [{ id: 't1', name: 'Souls-like', color: '#EF4444' }],
};

function setup(selectionMode = false) {
    const handlers = { onOpen: vi.fn(), onToggleSelect: vi.fn(), onContextMenu: vi.fn() };
    render(
        <QueryClientProvider client={new QueryClient()}>
            <GameCard game={game} selected={false} selectionMode={selectionMode} {...handlers} />
        </QueryClientProvider>,
    );
    return handlers;
}

describe('GameCard', () => {
    it('shows key info and opens on click', () => {
        const h = setup();
        expect(screen.getByRole('heading', { name: 'Elden Ring' })).toBeInTheDocument();
        expect(screen.getByText(/45.5 h/)).toBeInTheDocument();
        expect(screen.getByText('Souls-like')).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: /Elden Ring/ }));
        expect(h.onOpen).toHaveBeenCalledWith(game);
    });

    it('selects instead of opening in selection mode or with shift', () => {
        const h = setup(true);
        fireEvent.click(screen.getByRole('button', { name: /Elden Ring/ }));
        expect(h.onToggleSelect).toHaveBeenCalled();
        expect(h.onOpen).not.toHaveBeenCalled();
    });

    it('opens the context menu on right-click', () => {
        const h = setup();
        fireEvent.contextMenu(screen.getByRole('article'));
        expect(h.onContextMenu).toHaveBeenCalled();
    });
});
