import type { Prisma } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../db';
import { GAME_STATUSES } from '../types';
import { notFound } from '../utils/response';
import { statusChangeFields } from '../utils/status';
import { steamService } from './steamService';

export const PLAYTIME_BUCKETS = ['under1', '1to10', 'over10'] as const;

export const gameQuerySchema = z.object({
    search: z.string().trim().max(100).optional(),
    status: z
        .string()
        .optional()
        .transform((s) => (s ? s.split(',').filter(Boolean) : undefined))
        .pipe(z.array(z.enum(GAME_STATUSES)).optional()),
    tags: z
        .string()
        .optional()
        .transform((s) => (s ? s.split(',').filter(Boolean) : undefined)),
    playtime: z.enum(PLAYTIME_BUCKETS).optional(),
    sort: z
        .enum(['title', 'hoursPlayed', 'createdAt', 'updatedAt', 'lastPlayedAt'])
        .default('title'),
    order: z.enum(['asc', 'desc']).default('asc'),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(5000).default(5000),
});
export type GameQuery = z.infer<typeof gameQuerySchema>;

export function buildGameWhere(userId: string, q: GameQuery): Prisma.GameWhereInput {
    const where: Prisma.GameWhereInput = { userId };
    if (q.search) where.title = { contains: q.search, mode: 'insensitive' };
    if (q.status?.length) where.status = { in: q.status };
    // A game must carry every selected tag.
    if (q.tags?.length) where.AND = q.tags.map((id) => ({ tags: { some: { id } } }));
    if (q.playtime === 'under1') where.hoursPlayed = { lt: 1 };
    if (q.playtime === '1to10') where.hoursPlayed = { gte: 1, lte: 10 };
    if (q.playtime === 'over10') where.hoursPlayed = { gt: 10 };
    return where;
}

const tagSelect = {
    select: { id: true, name: true, color: true },
    orderBy: { name: 'asc' as const },
};

export async function listGames(userId: string, q: GameQuery) {
    const where = buildGameWhere(userId, q);
    const orderBy: Prisma.GameOrderByWithRelationInput[] = [
        q.sort === 'lastPlayedAt'
            ? { lastPlayedAt: { sort: q.order, nulls: 'last' } }
            : { [q.sort]: q.order },
        { id: 'asc' },
    ];
    const [items, total] = await prisma.$transaction([
        prisma.game.findMany({
            where,
            orderBy,
            skip: (q.page - 1) * q.pageSize,
            take: q.pageSize,
            include: { tags: tagSelect },
        }),
        prisma.game.count({ where }),
    ]);
    return { items, total, page: q.page, pageSize: q.pageSize };
}

async function findOwned(userId: string, id: string) {
    const game = await prisma.game.findFirst({
        where: { id, userId },
        select: { id: true, status: true },
    });
    if (!game) throw notFound('Game');
    return game;
}

export async function getGame(userId: string, id: string) {
    const game = await prisma.game.findFirst({
        where: { id, userId },
        include: {
            tags: tagSelect,
            achievements: {
                orderBy: [{ unlockedAt: { sort: 'desc', nulls: 'last' } }, { name: 'asc' }],
            },
        },
    });
    if (!game) throw notFound('Game');
    return game;
}

export const updateGameSchema = z.object({
    status: z.enum(GAME_STATUSES).optional(),
    notes: z.string().max(500, 'Notes are limited to 500 characters').nullable().optional(),
    tagIds: z.array(z.string()).max(50).optional(),
});

export async function updateGame(
    userId: string,
    id: string,
    input: z.infer<typeof updateGameSchema>,
) {
    const current = await findOwned(userId, id);
    const data: Prisma.GameUpdateInput = {};
    if (input.status && input.status !== current.status)
        Object.assign(data, statusChangeFields(input.status));
    if (input.notes !== undefined) {
        data.notes = input.notes?.trim() ? input.notes : null;
        data.notesUpdatedAt = new Date();
    }
    if (input.tagIds) {
        const owned = await prisma.tag.findMany({
            where: { userId, id: { in: input.tagIds } },
            select: { id: true },
        });
        data.tags = { set: owned };
    }
    await prisma.game.update({ where: { id }, data });
    return getGame(userId, id);
}

export async function deleteGame(userId: string, id: string) {
    await findOwned(userId, id);
    await prisma.game.delete({ where: { id } });
}

export const bulkUpdateSchema = z
    .object({
        ids: z.array(z.string()).min(1).max(5000),
        status: z.enum(GAME_STATUSES).optional(),
        addTagIds: z.array(z.string()).max(50).optional(),
        removeTagIds: z.array(z.string()).max(50).optional(),
    })
    .refine((b) => b.status || b.addTagIds?.length || b.removeTagIds?.length, {
        message: 'Provide a status or tags to change',
    });

export async function bulkUpdate(userId: string, input: z.infer<typeof bulkUpdateSchema>) {
    const games = await prisma.game.findMany({
        where: { userId, id: { in: input.ids } },
        select: { id: true, status: true },
    });
    const ids = games.map((g) => g.id);
    let updated = 0;

    if (input.status) {
        const changing = games.filter((g) => g.status !== input.status).map((g) => g.id);
        const res = await prisma.game.updateMany({
            where: { id: { in: changing } },
            data: statusChangeFields(input.status),
        });
        updated = res.count;
    }

    const tagIdsToCheck = [...(input.addTagIds ?? []), ...(input.removeTagIds ?? [])];
    if (tagIdsToCheck.length) {
        const ownedTags = new Set(
            (
                await prisma.tag.findMany({
                    where: { userId, id: { in: tagIdsToCheck } },
                    select: { id: true },
                })
            ).map((t) => t.id),
        );
        const add = (input.addTagIds ?? []).filter((t) => ownedTags.has(t)).map((id) => ({ id }));
        const remove = (input.removeTagIds ?? [])
            .filter((t) => ownedTags.has(t))
            .map((id) => ({ id }));
        await prisma.$transaction(
            ids.map((id) =>
                prisma.game.update({
                    where: { id },
                    data: { tags: { connect: add, disconnect: remove } },
                }),
            ),
        );
        updated = ids.length;
    }
    return { matched: ids.length, updated };
}

/**
 * Fills release date, description, Steam rating and achievements from Steam on demand
 * (fetching these for a whole library at 1 request/second would take many minutes).
 */
export async function enrichGame(userId: string, id: string) {
    const game = await prisma.game.findFirst({
        where: { id, userId },
        include: { user: { select: { steamId: true } } },
    });
    if (!game) throw notFound('Game');

    const [details, achievements] = await Promise.all([
        steamService.getStoreDetails(game.steamId),
        game.user.steamId
            ? steamService.getAchievements(game.user.steamId, game.steamId)
            : Promise.resolve(null),
    ]);

    await prisma.$transaction([
        prisma.game.update({
            where: { id },
            data: {
                description: details.description ?? game.description,
                releaseDate: details.releaseDate ?? game.releaseDate,
                steamRating: details.steamRating ?? game.steamRating,
                isDLC: details.isDLC ?? game.isDLC,
            },
        }),
        ...(achievements ?? []).map((a) =>
            prisma.achievement.upsert({
                where: { gameId_steamAchievementId: { gameId: id, steamAchievementId: a.apiname } },
                create: {
                    gameId: id,
                    steamAchievementId: a.apiname,
                    name: a.name || a.apiname,
                    description: a.description || null,
                    unlockedAt: a.achieved ? new Date(a.unlocktime * 1000) : null,
                },
                update: {
                    name: a.name || a.apiname,
                    description: a.description || null,
                    unlockedAt: a.achieved ? new Date(a.unlocktime * 1000) : null,
                },
            }),
        ),
    ]);
    return getGame(userId, id);
}
