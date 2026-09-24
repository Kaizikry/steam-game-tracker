export const GAME_STATUSES = ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'ABANDONED'] as const;
export type GameStatus = (typeof GAME_STATUSES)[number];

export const DEFAULT_STATUS_LABELS: Record<GameStatus, string> = {
    NOT_STARTED: 'Not Started',
    IN_PROGRESS: 'In Progress',
    COMPLETED: 'Completed',
    ABANDONED: 'Abandoned',
};

export type ViewType = 'kanban' | 'grid' | 'list';
export type Theme = 'light' | 'dark' | 'auto';
export type PlaytimeFilter = '' | 'under1' | '1to10' | 'over10';
export type SortField = 'title' | 'hoursPlayed' | 'createdAt' | 'updatedAt' | 'lastPlayedAt';

export interface Tag {
    id: string;
    name: string;
    color: string;
    gameCount?: number;
}

export interface Achievement {
    id: string;
    name: string;
    description: string | null;
    unlockedAt: string | null;
}

export interface Game {
    id: string;
    steamId: number;
    title: string;
    description: string | null;
    coverArtUrl: string | null;
    status: GameStatus;
    hoursPlayed: number;
    releaseDate: string | null;
    steamRating: number | null;
    isFreeToPlay: boolean;
    isDLC: boolean;
    lastPlayedAt: string | null;
    notes: string | null;
    notesUpdatedAt: string | null;
    createdAt: string;
    updatedAt: string;
    statusUpdatedAt: string;
    completedAt: string | null;
    tags: Tag[];
    achievements?: Achievement[];
}

export interface GameList {
    items: Game[];
    total: number;
    page: number;
    pageSize: number;
}

export interface GameFilters {
    search: string;
    statuses: GameStatus[];
    tagIds: string[];
    playtime: PlaytimeFilter;
    sort: SortField;
    order: 'asc' | 'desc';
}

export interface User {
    id: string;
    steamId: string | null;
    steamUsername: string | null;
    displayName: string | null;
    profileUrl: string | null;
    profileImage: string | null;
    createdAt: string;
    lastImport: string | null;
    gameCount: number;
}

export interface UserSettings {
    theme: Theme;
    defaultViewType: ViewType;
    language: string;
    privacyOptIn: boolean;
    emailNotifications: boolean;
    includeFreeToPlay: boolean;
    monthlyCompletionGoal: number;
    statusLabels: Partial<Record<GameStatus, string>>;
    updatedAt: string;
}

export interface Stats {
    totalGames: number;
    gamesByStatus: Record<GameStatus, number>;
    totalHoursPlayed: number;
    averageHoursPerGame: number;
    completionRate: number;
    averageHoursToComplete: number;
    mostPlayedGames: Pick<Game, 'id' | 'title' | 'hoursPlayed' | 'status' | 'coverArtUrl'>[];
    playtimeBuckets: Record<'unplayed' | 'under1' | '1to10' | '10to50' | 'over50', number>;
    monthly: { month: string; added: number; completed: number }[];
    goal: { monthlyTarget: number; completedThisMonth: number };
    streakDays: number;
    recentActivity: Pick<Game, 'id' | 'title' | 'status' | 'statusUpdatedAt' | 'coverArtUrl'>[];
}

export interface ImportResult {
    importId: string;
    totalGamesImported: number;
    newGamesAdded: number;
    updatedGames: number;
}

export interface ImportHistoryEntry {
    id: string;
    source: string;
    totalGamesImported: number;
    newGamesAdded: number;
    importedAt: string;
    status: string;
    errorMessage: string | null;
}

export interface FileImportResult {
    created: number;
    updated: number;
    skipped: number;
    errors: { row: number; message: string }[];
}
