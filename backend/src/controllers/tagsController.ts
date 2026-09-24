import type { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../db';
import { userIdOf } from '../middleware/auth';
import { notFound, sendOk } from '../utils/response';

const tagSchema = z.object({
    name: z.string().trim().min(1).max(50),
    color: z
        .string()
        .regex(/^#[0-9a-fA-F]{6}$/, 'Color must be a hex value like #3B82F6')
        .optional(),
});

async function findTag(userId: string, id: string) {
    const tag = await prisma.tag.findFirst({ where: { id, userId } });
    if (!tag) throw notFound('Tag');
    return tag;
}

async function findGame(userId: string, id: string) {
    const game = await prisma.game.findFirst({ where: { id, userId }, select: { id: true } });
    if (!game) throw notFound('Game');
    return game;
}

export async function list(req: Request, res: Response) {
    const tags = await prisma.tag.findMany({
        where: { userId: userIdOf(req) },
        orderBy: { name: 'asc' },
        include: { _count: { select: { games: true } } },
    });
    sendOk(
        res,
        tags.map(({ _count, ...t }) => ({ ...t, gameCount: _count.games })),
    );
}

export async function create(req: Request, res: Response) {
    const input = tagSchema.parse(req.body);
    sendOk(res, await prisma.tag.create({ data: { ...input, userId: userIdOf(req) } }), 201);
}

export async function update(req: Request, res: Response) {
    const userId = userIdOf(req);
    const tag = await findTag(userId, String(req.params.id));
    const input = tagSchema.partial().parse(req.body);
    sendOk(res, await prisma.tag.update({ where: { id: tag.id }, data: input }));
}

export async function remove(req: Request, res: Response) {
    const tag = await findTag(userIdOf(req), String(req.params.id));
    await prisma.tag.delete({ where: { id: tag.id } });
    sendOk(res, { deleted: true });
}

export async function addToGame(req: Request, res: Response) {
    const userId = userIdOf(req);
    const { tagId } = z.object({ tagId: z.string() }).parse(req.body);
    const [game, tag] = await Promise.all([
        findGame(userId, String(req.params.gameId)),
        findTag(userId, tagId),
    ]);
    await prisma.game.update({
        where: { id: game.id },
        data: { tags: { connect: { id: tag.id } } },
    });
    sendOk(res, { added: true });
}

export async function removeFromGame(req: Request, res: Response) {
    const userId = userIdOf(req);
    const [game, tag] = await Promise.all([
        findGame(userId, String(req.params.gameId)),
        findTag(userId, String(req.params.tagId)),
    ]);
    await prisma.game.update({
        where: { id: game.id },
        data: { tags: { disconnect: { id: tag.id } } },
    });
    sendOk(res, { removed: true });
}
