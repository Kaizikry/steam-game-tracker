import { useCallback, useMemo, useRef, useState, type MouseEvent } from 'react';
import { Link } from 'react-router-dom';
import { BulkActionBar } from '../components/BulkActionBar';
import { ContextMenu } from '../components/ContextMenu';
import { FilterBar } from '../components/FilterBar';
import { GridView } from '../components/GridView';
import { KanbanBoard } from '../components/KanbanBoard';
import { ListView } from '../components/ListView';
import { useGames, useMe, useSetStatus } from '../hooks/useApi';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { errorMessage } from '../services/api';
import { useAppStore } from '../store/useAppStore';
import { toast } from '../store/useToastStore';
import type { Game, ViewType } from '../types';

const VIEW_ORDER: ViewType[] = ['kanban', 'grid', 'list'];

export function GamesPage() {
    const { data, isLoading, error, isFetching } = useGames();
    const { data: me } = useMe();
    const { viewType, setViewType, selectedIds, toggleSelected, setSelected, openGame } =
        useAppStore();
    const setStatus = useSetStatus();
    const searchRef = useRef<HTMLInputElement>(null);
    const [menu, setMenu] = useState<{ game: Game; x: number; y: number } | null>(null);
    const games = useMemo(() => data?.items ?? [], [data]);

    const shortcuts = useMemo(
        () => ({
            '/': () => searchRef.current?.focus(),
            v: () =>
                setViewType(VIEW_ORDER[(VIEW_ORDER.indexOf(viewType) + 1) % VIEW_ORDER.length]),
            Escape: () => setSelected([]),
        }),
        [viewType, setViewType, setSelected],
    );
    useKeyboardShortcuts(shortcuts);

    const handlers = {
        onOpen: (g: Game) => openGame(g.id),
        onToggleSelect: (g: Game) => toggleSelected(g.id),
        onContextMenu: (g: Game, e: MouseEvent) => setMenu({ game: g, x: e.clientX, y: e.clientY }),
    };
    const closeMenu = useCallback(() => setMenu(null), []);

    if (me?.gameCount === 0) {
        return (
            <div className="card mx-auto max-w-md space-y-3 p-6 text-center">
                <h1 className="text-xl font-bold">Your library is empty</h1>
                <p className="muted">Import your Steam games to start organizing them.</p>
                <Link to="/" className="btn-primary">
                    Import from Steam
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <h1 className="sr-only">Games</h1>
            <FilterBar searchRef={searchRef} total={data?.total} />
            <BulkActionBar visibleIds={games.map((g) => g.id)} />
            {error && (
                <p role="alert" className="text-red-500">
                    {errorMessage(error)}
                </p>
            )}
            {isLoading ? (
                <p className="muted">Loading games…</p>
            ) : games.length === 0 ? (
                <p className="muted py-10 text-center">No games match these filters.</p>
            ) : (
                <div className={isFetching ? 'opacity-80 transition-opacity' : ''}>
                    {viewType === 'kanban' && (
                        <KanbanBoard games={games} selectedIds={selectedIds} {...handlers} />
                    )}
                    {viewType === 'grid' && (
                        <GridView games={games} selectedIds={selectedIds} {...handlers} />
                    )}
                    {viewType === 'list' && (
                        <ListView games={games} selectedIds={selectedIds} {...handlers} />
                    )}
                </div>
            )}
            {viewType === 'kanban' && games.length > 0 && (
                <p className="muted text-center text-xs">
                    Drag cards between columns · right-click for quick actions · shift-click to
                    select several · press ? for shortcuts
                </p>
            )}
            {menu && (
                <ContextMenu
                    {...menu}
                    onClose={closeMenu}
                    onOpen={() => openGame(menu.game.id)}
                    onStatus={(status) =>
                        setStatus.mutate(
                            { ids: [menu.game.id], status },
                            { onError: (e) => toast.error(errorMessage(e)) },
                        )
                    }
                />
            )}
        </div>
    );
}
