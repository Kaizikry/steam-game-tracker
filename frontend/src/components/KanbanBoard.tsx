import { DragDropContext, Draggable, Droppable, type DropResult } from '@hello-pangea/dnd';
import { useMemo, useState } from 'react';
import { useSetStatus, useStatusLabels } from '../hooks/useApi';
import { GAME_STATUSES, type Game, type GameStatus } from '../types';
import { GameCard, type CardHandlers } from './GameCard';
import { statusVar } from './StatusBadge';

const PAGE = 60;

interface Props extends CardHandlers {
    games: Game[];
    selectedIds: string[];
}

/** Four status columns; cards drag between them. Columns render incrementally for big libraries. */
export function KanbanBoard({ games, selectedIds, ...handlers }: Props) {
    const labels = useStatusLabels();
    const setStatus = useSetStatus();
    const [limits, setLimits] = useState<Record<GameStatus, number>>({
        NOT_STARTED: PAGE,
        IN_PROGRESS: PAGE,
        COMPLETED: PAGE,
        ABANDONED: PAGE,
    });

    const columns = useMemo(() => {
        const map = Object.fromEntries(GAME_STATUSES.map((s) => [s, [] as Game[]])) as Record<
            GameStatus,
            Game[]
        >;
        for (const g of games) map[g.status].push(g);
        return map;
    }, [games]);

    const onDragEnd = ({ draggableId, destination, source }: DropResult) => {
        if (!destination || destination.droppableId === source.droppableId) return;
        const status = destination.droppableId as GameStatus;
        // Dragging a selected card moves the whole selection.
        const ids = selectedIds.includes(draggableId) ? selectedIds : [draggableId];
        setStatus.mutate({ ids, status });
    };

    return (
        <DragDropContext onDragEnd={onDragEnd}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                {GAME_STATUSES.map((status) => {
                    const list = columns[status];
                    const visible = list.slice(0, limits[status]);
                    return (
                        <section
                            key={status}
                            aria-label={`${labels[status]} column`}
                            className="flex min-w-0 flex-col rounded-xl bg-slate-200/60 dark:bg-steam-800/60"
                        >
                            <header
                                className="flex items-center justify-between gap-2 border-t-4 px-3 py-2.5"
                                style={{ borderColor: statusVar(status) }}
                            >
                                <h2 className="font-semibold">{labels[status]}</h2>
                                <span className="muted text-sm">{list.length} games</span>
                            </header>
                            <Droppable droppableId={status}>
                                {(provided, snapshot) => (
                                    <div
                                        ref={provided.innerRef}
                                        {...provided.droppableProps}
                                        className={`flex min-h-32 flex-1 flex-col gap-2 p-2 transition-colors ${snapshot.isDraggingOver ? 'bg-sky-500/10' : ''} xl:max-h-[calc(100vh-15rem)] xl:overflow-y-auto`}
                                    >
                                        {visible.map((game, index) => (
                                            <Draggable
                                                key={game.id}
                                                draggableId={game.id}
                                                index={index}
                                                disableInteractiveElementBlocking
                                            >
                                                {(drag, dragSnapshot) => (
                                                    <div
                                                        ref={drag.innerRef}
                                                        {...drag.draggableProps}
                                                        {...drag.dragHandleProps}
                                                        className="relative"
                                                    >
                                                        <GameCard
                                                            game={game}
                                                            selected={selectedIds.includes(game.id)}
                                                            selectionMode={selectedIds.length > 0}
                                                            dragging={dragSnapshot.isDragging}
                                                            compact
                                                            {...handlers}
                                                        />
                                                        {dragSnapshot.isDragging &&
                                                            selectedIds.length > 1 &&
                                                            selectedIds.includes(game.id) && (
                                                                <span className="absolute -top-2 -right-2 rounded-full bg-sky-500 px-2 text-xs font-bold text-white">
                                                                    {selectedIds.length}
                                                                </span>
                                                            )}
                                                    </div>
                                                )}
                                            </Draggable>
                                        ))}
                                        {provided.placeholder}
                                        {list.length === 0 && (
                                            <p className="muted py-6 text-center text-sm">
                                                Drop games here
                                            </p>
                                        )}
                                        {list.length > visible.length && (
                                            <button
                                                className="btn-secondary"
                                                onClick={() =>
                                                    setLimits((l) => ({
                                                        ...l,
                                                        [status]: l[status] + PAGE * 2,
                                                    }))
                                                }
                                            >
                                                Show more ({list.length - visible.length} hidden)
                                            </button>
                                        )}
                                    </div>
                                )}
                            </Droppable>
                        </section>
                    );
                })}
            </div>
        </DragDropContext>
    );
}
