import type { GameStatus } from '@prisma/client';
import { prisma } from '../db';
import { GAME_STATUSES } from '../types';

export interface StatsGame {
    id: string;
    title: string;
    status: GameStatus;
    hoursPlayed: number;
    coverArtUrl: string | null;
    createdAt: Date;
    completedAt: Date | null;
}

const monthKey = (d: Date) =>
    `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
const round1 = (n: number) => Math.round(n * 10) / 10;

/** Last `count` month keys ending with the month of `now`, oldest first. */
export function recentMonths(now: Date, count: number): string[] {
    const keys: string[] = [];
    for (let i = count - 1; i >= 0; i--) {
        keys.push(monthKey(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1))));
    }
    return keys;
}

/** Consecutive days (ending today, or yesterday if not yet active today) the app was used. */
export function computeStreak(days: Date[], now = new Date()): number {
    const set = new Set(days.map((d) => d.toISOString().slice(0, 10)));
    const cursor = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    if (!set.has(cursor.toISOString().slice(0, 10))) cursor.setUTCDate(cursor.getUTCDate() - 1);
    let streak = 0;
    while (set.has(cursor.toISOString().slice(0, 10))) {
        streak++;
        cursor.setUTCDate(cursor.getUTCDate() - 1);
    }
    return streak;
}

export function computeStats(games: StatsGame[], now = new Date(), monthlyGoal = 0) {
    const totalGames = games.length;
    const gamesByStatus = Object.fromEntries(GAME_STATUSES.map((s) => [s, 0])) as Record<
        GameStatus,
        number
    >;
    let totalHoursPlayed = 0;
    for (const g of games) {
        gamesByStatus[g.status]++;
        totalHoursPlayed += g.hoursPlayed;
    }

    const completed = games.filter((g) => g.status === 'COMPLETED');
    const thisMonth = monthKey(now);
    const completedThisMonth = completed.filter(
        (g) => g.completedAt && monthKey(g.completedAt) === thisMonth,
    ).length;

    const months = recentMonths(now, 12);
    const addedByMonth = Object.fromEntries(months.map((m) => [m, 0]));
    const completedByMonth = Object.fromEntries(months.map((m) => [m, 0]));
    for (const g of games) {
        const added = monthKey(g.createdAt);
        if (added in addedByMonth) addedByMonth[added]++;
        if (g.completedAt) {
            const done = monthKey(g.completedAt);
            if (done in completedByMonth) completedByMonth[done]++;
        }
    }

    const playtimeBuckets = { unplayed: 0, under1: 0, '1to10': 0, '10to50': 0, over50: 0 };
    for (const g of games) {
        if (g.hoursPlayed === 0) playtimeBuckets.unplayed++;
        else if (g.hoursPlayed < 1) playtimeBuckets.under1++;
        else if (g.hoursPlayed <= 10) playtimeBuckets['1to10']++;
        else if (g.hoursPlayed <= 50) playtimeBuckets['10to50']++;
        else playtimeBuckets.over50++;
    }

    return {
        totalGames,
        gamesByStatus,
        totalHoursPlayed: round1(totalHoursPlayed),
        averageHoursPerGame: totalGames ? round1(totalHoursPlayed / totalGames) : 0,
        completionRate: totalGames ? round1((completed.length / totalGames) * 100) : 0,
        averageHoursToComplete: completed.length
            ? round1(completed.reduce((sum, g) => sum + g.hoursPlayed, 0) / completed.length)
            : 0,
        mostPlayedGames: [...games]
            .sort((a, b) => b.hoursPlayed - a.hoursPlayed)
            .slice(0, 10)
            .filter((g) => g.hoursPlayed > 0)
            .map(({ id, title, hoursPlayed, status, coverArtUrl }) => ({
                id,
                title,
                hoursPlayed,
                status,
                coverArtUrl,
            })),
        playtimeBuckets,
        monthly: months.map((m) => ({
            month: m,
            added: addedByMonth[m],
            completed: completedByMonth[m],
        })),
        goal: { monthlyTarget: monthlyGoal, completedThisMonth },
    };
}

export async function getStats(userId: string) {
    const [games, settings, activity, recent] = await Promise.all([
        prisma.game.findMany({
            where: { userId },
            select: {
                id: true,
                title: true,
                status: true,
                hoursPlayed: true,
                coverArtUrl: true,
                createdAt: true,
                completedAt: true,
            },
        }),
        prisma.userSettings.findUnique({
            where: { userId },
            select: { monthlyCompletionGoal: true },
        }),
        prisma.activityDay.findMany({
            where: { userId },
            orderBy: { day: 'desc' },
            take: 400,
            select: { day: true },
        }),
        prisma.game.findMany({
            where: { userId },
            orderBy: { statusUpdatedAt: 'desc' },
            take: 8,
            select: {
                id: true,
                title: true,
                status: true,
                statusUpdatedAt: true,
                coverArtUrl: true,
            },
        }),
    ]);
    return {
        ...computeStats(games, new Date(), settings?.monthlyCompletionGoal ?? 0),
        streakDays: computeStreak(activity.map((a) => a.day)),
        recentActivity: recent,
    };
}
