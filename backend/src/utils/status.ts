import { GAME_STATUSES, type GameStatus } from '../types';

/** Accepts "IN_PROGRESS", "in_progress", "In Progress", "in-progress". */
export function parseStatus(input: unknown): GameStatus | null {
    if (typeof input !== 'string') return null;
    const normalized = input
        .trim()
        .toUpperCase()
        .replace(/[\s-]+/g, '_');
    return (GAME_STATUSES as readonly string[]).includes(normalized)
        ? (normalized as GameStatus)
        : null;
}

export const STATUS_LABELS: Record<GameStatus, string> = {
    NOT_STARTED: 'Not Started',
    IN_PROGRESS: 'In Progress',
    COMPLETED: 'Completed',
    ABANDONED: 'Abandoned',
};

/** Fields to set whenever a game's status changes. */
export function statusChangeFields(next: GameStatus, now = new Date()) {
    return {
        status: next,
        statusUpdatedAt: now,
        completedAt: next === 'COMPLETED' ? now : null,
    };
}
