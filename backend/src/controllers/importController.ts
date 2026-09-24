import type { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../db';
import { userIdOf } from '../middleware/auth';
import { importFile } from '../services/dataService';
import { importSteamLibrary } from '../services/importService';
import { notFound, sendOk } from '../utils/response';

const steamImportSchema = z.object({
    profile: z.string().trim().min(1, 'Steam ID or profile URL is required').max(200),
    includeFreeToPlay: z.boolean().default(true),
    autoCategorize: z.boolean().default(true),
});

const fileImportSchema = z.object({
    format: z.enum(['json', 'csv']),
    content: z.string().min(1, 'File is empty'),
    overwrite: z.boolean().default(false),
});

export async function importSteam(req: Request, res: Response) {
    const { profile, ...settings } = steamImportSchema.parse(req.body);
    const userId = userIdOf(req);
    await prisma.userSettings.upsert({
        where: { userId },
        create: { userId, includeFreeToPlay: settings.includeFreeToPlay },
        update: { includeFreeToPlay: settings.includeFreeToPlay },
    });
    sendOk(res, await importSteamLibrary(userId, profile, settings));
}

export async function history(req: Request, res: Response) {
    sendOk(
        res,
        await prisma.importHistory.findMany({
            where: { userId: userIdOf(req) },
            orderBy: { importedAt: 'desc' },
            take: 20,
        }),
    );
}

export async function status(req: Request, res: Response) {
    const record = await prisma.importHistory.findFirst({
        where: { id: String(req.params.importId), userId: userIdOf(req) },
    });
    if (!record) throw notFound('Import');
    sendOk(res, record);
}

export async function importFromFile(req: Request, res: Response) {
    const { format, content, overwrite } = fileImportSchema.parse(req.body);
    sendOk(res, await importFile(userIdOf(req), format, content, overwrite));
}
