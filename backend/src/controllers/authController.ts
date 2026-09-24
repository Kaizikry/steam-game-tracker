import type { Request, Response } from 'express';
import { prisma } from '../db';
import { signToken, userIdOf } from '../middleware/auth';
import { AppError, sendOk } from '../utils/response';

const publicUser = {
    id: true,
    steamId: true,
    steamUsername: true,
    displayName: true,
    profileUrl: true,
    profileImage: true,
    createdAt: true,
    lastImport: true,
} as const;

/** Creates an anonymous account. Its token is the only credential, so exports matter. */
export async function createSession(_req: Request, res: Response) {
    const user = await prisma.user.create({
        data: { settings: { create: {} } },
        select: publicUser,
    });
    sendOk(res, { token: signToken(user.id), user }, 201);
}

/** Returns the current user and records today's visit for streak tracking. */
export async function getCurrentUser(req: Request, res: Response) {
    const userId = userIdOf(req);
    const today = new Date(new Date().toISOString().slice(0, 10));
    const user = await prisma.user.findUnique({ where: { id: userId }, select: publicUser });
    if (!user) throw new AppError(401, 'UNAUTHORIZED', 'Session no longer exists');
    await prisma.activityDay.upsert({
        where: { userId_day: { userId, day: today } },
        create: { userId, day: today },
        update: {},
    });
    const gameCount = await prisma.game.count({ where: { userId } });
    sendOk(res, { ...user, gameCount });
}

/** GDPR right to erasure: removes the user and everything that cascades from it. */
export async function deleteAccount(req: Request, res: Response) {
    await prisma.user.delete({ where: { id: userIdOf(req) } });
    sendOk(res, { deleted: true });
}

/** Clears the library but keeps the account and settings. */
export async function clearLibrary(req: Request, res: Response) {
    const userId = userIdOf(req);
    await prisma.$transaction([
        prisma.game.deleteMany({ where: { userId } }),
        prisma.tag.deleteMany({ where: { userId } }),
        prisma.importHistory.deleteMany({ where: { userId } }),
    ]);
    sendOk(res, { cleared: true });
}
