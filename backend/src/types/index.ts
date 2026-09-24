import type { GameStatus } from '@prisma/client';

export const GAME_STATUSES = ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'ABANDONED'] as const;
export type { GameStatus };

export interface ImportSettings {
    includeFreeToPlay: boolean;
    /** Put new games with 0 minutes in "Not Started" and the rest in "In Progress". */
    autoCategorize: boolean;
}

export interface ImportResult {
    importId: string;
    totalGamesImported: number;
    newGamesAdded: number;
    updatedGames: number;
}

export interface FileImportResult {
    created: number;
    updated: number;
    skipped: number;
    errors: { row: number; message: string }[];
}
