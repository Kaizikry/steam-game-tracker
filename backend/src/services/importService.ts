import type { Prisma } from '@prisma/client';
import { prisma } from '../db';
import type { ImportResult, ImportSettings } from '../types';
import { AppError } from '../utils/response';
import { coverArtUrl, minutesToHours, steamService, type SteamService } from './steamService';

type LibraryGame = Awaited<ReturnType<SteamService['getLibrary']>>[number];

/** Splits a Steam library into rows to create and rows to update, keyed by app id. */
export function planLibrarySync(
    library: LibraryGame[],
    existing: { steamId: number; hoursPlayed: number; title: string }[],
    settings: ImportSettings,
    now = new Date(),
) {
    const existingById = new Map(existing.map((g) => [g.steamId, g]));
    const toCreate: Omit<Prisma.GameCreateManyInput, 'userId'>[] = [];
    const toUpdate: { steamId: number; data: Prisma.GameUpdateManyMutationInput }[] = [];
    const seen = new Set<number>();

    for (const g of library) {
        if (seen.has(g.appid)) continue;
        seen.add(g.appid);
        const hours = minutesToHours(g.playtime_forever);
        const lastPlayedAt = g.rtime_last_played ? new Date(g.rtime_last_played * 1000) : null;
        const prev = existingById.get(g.appid);
        if (!prev) {
            const status =
                settings.autoCategorize && g.playtime_forever > 0 ? 'IN_PROGRESS' : 'NOT_STARTED';
            toCreate.push({
                steamId: g.appid,
                title: (g.name || `App ${g.appid}`).slice(0, 255),
                coverArtUrl: coverArtUrl(g.appid),
                hoursPlayed: hours,
                isFreeToPlay: g.isFreeToPlay,
                lastPlayedAt,
                status,
                statusUpdatedAt: now,
            });
        } else if (prev.hoursPlayed !== hours || (g.name && prev.title !== g.name)) {
            toUpdate.push({
                steamId: g.appid,
                data: {
                    hoursPlayed: hours,
                    lastPlayedAt,
                    ...(g.name ? { title: g.name.slice(0, 255) } : {}),
                },
            });
        }
    }
    return { toCreate, toUpdate, total: seen.size };
}

export async function importSteamLibrary(
    userId: string,
    profileInput: string,
    settings: ImportSettings,
    steam: SteamService = steamService,
): Promise<ImportResult> {
    const history = await prisma.importHistory.create({
        data: { userId, source: 'steam', status: 'in_progress' },
    });

    try {
        const steamId = await steam.resolveSteamId(profileInput);
        const [profile, library] = await Promise.all([
            steam.getProfile(steamId).catch(() => null),
            steam.getLibrary(steamId, settings.includeFreeToPlay),
        ]);

        const existing = await prisma.game.findMany({
            where: { userId },
            select: { steamId: true, hoursPlayed: true, title: true },
        });
        const plan = planLibrarySync(library, existing, settings);
        const now = new Date();

        await prisma.$transaction([
            prisma.game.createMany({
                data: plan.toCreate.map((g) => ({ ...g, userId })),
                skipDuplicates: true,
            }),
            ...plan.toUpdate.map((u) =>
                prisma.game.updateMany({ where: { userId, steamId: u.steamId }, data: u.data }),
            ),
            prisma.user.update({
                where: { id: userId },
                data: {
                    steamId,
                    lastImport: now,
                    steamUsername: profile?.personaName ?? undefined,
                    displayName: profile?.personaName ?? undefined,
                    profileUrl: profile?.profileUrl ?? undefined,
                    profileImage: profile?.avatar ?? undefined,
                },
            }),
            prisma.importHistory.update({
                where: { id: history.id },
                data: {
                    status: 'completed',
                    totalGamesImported: plan.total,
                    newGamesAdded: plan.toCreate.length,
                },
            }),
        ]);

        return {
            importId: history.id,
            totalGamesImported: plan.total,
            newGamesAdded: plan.toCreate.length,
            updatedGames: plan.toUpdate.length,
        };
    } catch (err) {
        await prisma.importHistory.update({
            where: { id: history.id },
            data: {
                status: 'failed',
                errorMessage: err instanceof Error ? err.message : 'Unknown error',
            },
        });
        if (err instanceof AppError) throw err;
        throw new AppError(500, 'IMPORT_FAILED', 'Import failed unexpectedly');
    }
}
