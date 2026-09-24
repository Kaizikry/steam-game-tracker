import type { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../db';
import { userIdOf } from '../middleware/auth';
import { exportCsv, exportJson } from '../services/dataService';
import { getStats } from '../services/statsService';
import { GAME_STATUSES } from '../types';
import { sendOk } from '../utils/response';

export async function stats(req: Request, res: Response) {
    sendOk(res, await getStats(userIdOf(req)));
}

const settingsSchema = z
    .object({
        theme: z.enum(['light', 'dark', 'auto']),
        defaultViewType: z.enum(['kanban', 'grid', 'list']),
        language: z.string().min(2).max(10),
        privacyOptIn: z.boolean(),
        emailNotifications: z.boolean(),
        includeFreeToPlay: z.boolean(),
        monthlyCompletionGoal: z.number().int().min(0).max(100),
        statusLabels: z.partialRecord(z.enum(GAME_STATUSES), z.string().trim().min(1).max(30)),
    })
    .partial();

export async function getSettings(req: Request, res: Response) {
    const userId = userIdOf(req);
    sendOk(
        res,
        await prisma.userSettings.upsert({ where: { userId }, create: { userId }, update: {} }),
    );
}

export async function updateSettings(req: Request, res: Response) {
    const userId = userIdOf(req);
    const input = settingsSchema.parse(req.body);
    sendOk(
        res,
        await prisma.userSettings.upsert({
            where: { userId },
            create: { userId, ...input },
            update: input,
        }),
    );
}

export async function exportData(req: Request, res: Response) {
    const { format } = z
        .object({ format: z.enum(['json', 'csv']).default('json') })
        .parse(req.body ?? {});
    const userId = userIdOf(req);
    const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `steam-tracker-export-${stamp}.${format}`;
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    if (format === 'csv') {
        res.type('text/csv').send(await exportCsv(userId));
    } else {
        res.type('application/json').send(JSON.stringify(await exportJson(userId), null, 2));
    }
}
