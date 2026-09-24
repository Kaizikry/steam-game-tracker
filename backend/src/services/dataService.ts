import type { GameStatus, Prisma } from '@prisma/client';
import { prisma } from '../db';
import type { FileImportResult } from '../types';
import { parseCsv, toCsv } from '../utils/csv';
import { AppError } from '../utils/response';
import { parseStatus, STATUS_LABELS, statusChangeFields } from '../utils/status';
import { coverArtUrl } from './steamService';

export const EXPORT_VERSION = '1.0';
const CSV_HEADER = [
    'Steam App ID',
    'Title',
    'Status',
    'Hours Played',
    'Date Added',
    'Date Updated',
    'Notes',
    'Tags',
];
const TAG_COLORS = [
    '#3B82F6',
    '#10B981',
    '#F59E0B',
    '#EF4444',
    '#8B5CF6',
    '#EC4899',
    '#14B8A6',
    '#F97316',
];

const isoDate = (d: Date | null | undefined) => (d ? d.toISOString().slice(0, 10) : '');

async function loadExportGames(userId: string) {
    return prisma.game.findMany({
        where: { userId },
        orderBy: { title: 'asc' },
        include: { tags: { select: { name: true }, orderBy: { name: 'asc' } } },
    });
}

export async function exportJson(userId: string) {
    const games = await loadExportGames(userId);
    return {
        version: EXPORT_VERSION,
        exportDate: new Date().toISOString(),
        games: games.map((g) => ({
            id: g.id,
            steamId: g.steamId,
            title: g.title,
            status: g.status.toLowerCase(),
            hoursPlayed: g.hoursPlayed,
            dateAdded: isoDate(g.createdAt),
            dateUpdated: isoDate(g.updatedAt),
            notes: g.notes ?? '',
            tags: g.tags.map((t) => t.name),
        })),
    };
}

export async function exportCsv(userId: string) {
    const games = await loadExportGames(userId);
    return toCsv([
        CSV_HEADER,
        ...games.map((g) => [
            g.steamId,
            g.title,
            STATUS_LABELS[g.status],
            g.hoursPlayed,
            isoDate(g.createdAt),
            isoDate(g.updatedAt),
            g.notes ?? '',
            g.tags.map((t) => t.name).join('|'),
        ]),
    ]);
}

export interface ImportRow {
    row: number;
    steamId?: number;
    title?: string;
    status?: GameStatus;
    hoursPlayed?: number;
    notes?: string;
    tags: string[];
}

/** Parses JSON or CSV export files into normalized rows, collecting per-row validation errors. */
export function parseImportFile(format: 'json' | 'csv', content: string) {
    const rows: ImportRow[] = [];
    const errors: FileImportResult['errors'] = [];

    const pushRow = (row: number, raw: Record<string, unknown>) => {
        const steamIdRaw = raw.steamId;
        const steamId =
            steamIdRaw === undefined || steamIdRaw === '' ? undefined : Number(steamIdRaw);
        if (steamId !== undefined && (!Number.isInteger(steamId) || steamId <= 0)) {
            errors.push({ row, message: `Invalid Steam App ID "${String(steamIdRaw)}"` });
            return;
        }
        const title = typeof raw.title === 'string' ? raw.title.trim().slice(0, 255) : undefined;
        if (!steamId && !title) {
            errors.push({ row, message: 'Row needs a Steam App ID or a title' });
            return;
        }
        let status: GameStatus | undefined;
        if (raw.status !== undefined && raw.status !== '') {
            const parsed = parseStatus(raw.status);
            if (!parsed) {
                errors.push({ row, message: `Unknown status "${String(raw.status)}"` });
                return;
            }
            status = parsed;
        }
        const hours =
            raw.hoursPlayed === undefined || raw.hoursPlayed === ''
                ? undefined
                : Number(raw.hoursPlayed);
        if (hours !== undefined && (!Number.isFinite(hours) || hours < 0)) {
            errors.push({ row, message: `Invalid hours played "${String(raw.hoursPlayed)}"` });
            return;
        }
        const notes = typeof raw.notes === 'string' ? raw.notes : undefined;
        if (notes && notes.length > 500) {
            errors.push({ row, message: 'Notes are longer than 500 characters' });
            return;
        }
        const tags = (
            Array.isArray(raw.tags)
                ? raw.tags
                : typeof raw.tags === 'string'
                  ? raw.tags.split('|')
                  : []
        )
            .map((t) => String(t).trim().slice(0, 50))
            .filter(Boolean);
        rows.push({ row, steamId, title, status, hoursPlayed: hours, notes, tags });
    };

    if (format === 'json') {
        let data: unknown;
        try {
            data = JSON.parse(content);
        } catch {
            throw new AppError(400, 'INVALID_FILE', 'File is not valid JSON');
        }
        const games = (data as { games?: unknown })?.games;
        if (!Array.isArray(games))
            throw new AppError(400, 'INVALID_FILE', 'JSON must contain a "games" array');
        games.forEach((g, i) => {
            if (!g || typeof g !== 'object')
                errors.push({ row: i + 1, message: 'Entry is not an object' });
            else pushRow(i + 1, g as Record<string, unknown>);
        });
    } else {
        let table: string[][];
        try {
            table = parseCsv(content);
        } catch (e) {
            throw new AppError(
                400,
                'INVALID_FILE',
                `CSV could not be parsed: ${(e as Error).message}`,
            );
        }
        if (table.length === 0) throw new AppError(400, 'INVALID_FILE', 'CSV file is empty');
        const header = table[0].map((h) => h.trim().toLowerCase());
        const col = (...names: string[]) => header.findIndex((h) => names.includes(h));
        const idx = {
            steamId: col('steam app id', 'steamid', 'steam id', 'appid'),
            title: col('title', 'name'),
            status: col('status'),
            hoursPlayed: col('hours played', 'hoursplayed', 'hours'),
            notes: col('notes'),
            tags: col('tags'),
        };
        if (idx.title < 0 && idx.steamId < 0) {
            throw new AppError(
                400,
                'INVALID_FILE',
                'CSV header must include a "Title" or "Steam App ID" column',
            );
        }
        table.slice(1).forEach((cells, i) => {
            const get = (j: number) => (j >= 0 ? cells[j] : undefined);
            pushRow(i + 2, {
                steamId: get(idx.steamId),
                title: get(idx.title),
                status: get(idx.status),
                hoursPlayed: get(idx.hoursPlayed),
                notes: get(idx.notes),
                tags: get(idx.tags),
            });
        });
    }
    return { rows, errors };
}

/**
 * Merges rows into the library. Without `overwrite`, existing games only receive values for
 * fields the user hasn't set yet (status still "Not Started", empty notes); tags are always added.
 */
export async function importFile(
    userId: string,
    format: 'json' | 'csv',
    content: string,
    overwrite: boolean,
): Promise<FileImportResult> {
    const { rows, errors } = parseImportFile(format, content);
    const result: FileImportResult = { created: 0, updated: 0, skipped: 0, errors };

    const existing = await prisma.game.findMany({
        where: { userId },
        select: { id: true, steamId: true, title: true, status: true, notes: true },
    });
    const bySteamId = new Map(existing.map((g) => [g.steamId, g]));
    const byTitle = new Map(existing.map((g) => [g.title.toLowerCase(), g]));

    const tagNames = [...new Set(rows.flatMap((r) => r.tags))];
    const existingTags = await prisma.tag.findMany({
        where: { userId },
        select: { id: true, name: true },
    });
    const tagIdByName = new Map(existingTags.map((t) => [t.name.toLowerCase(), t.id]));
    const newTagNames = tagNames.filter((n) => !tagIdByName.has(n.toLowerCase()));
    if (newTagNames.length) {
        await prisma.tag.createMany({
            data: newTagNames.map((name, i) => ({
                userId,
                name,
                color: TAG_COLORS[(existingTags.length + i) % TAG_COLORS.length],
            })),
            skipDuplicates: true,
        });
        for (const t of await prisma.tag.findMany({
            where: { userId },
            select: { id: true, name: true },
        })) {
            tagIdByName.set(t.name.toLowerCase(), t.id);
        }
    }

    const ops: Prisma.PrismaPromise<unknown>[] = [];
    const now = new Date();
    for (const r of rows) {
        const match =
            (r.steamId && bySteamId.get(r.steamId)) ||
            (r.title && byTitle.get(r.title.toLowerCase()));
        const tagConnect = r.tags
            .map((n) => ({ id: tagIdByName.get(n.toLowerCase())! }))
            .filter((t) => t.id);

        if (match && !match.id) {
            result.skipped++; // duplicate of a row created earlier in this file
        } else if (match) {
            const data: Prisma.GameUpdateInput = {};
            if (
                r.status &&
                r.status !== match.status &&
                (overwrite || match.status === 'NOT_STARTED')
            ) {
                Object.assign(data, statusChangeFields(r.status, now));
            }
            if (
                r.notes !== undefined &&
                r.notes !== (match.notes ?? '') &&
                (overwrite || !match.notes)
            ) {
                data.notes = r.notes || null;
                data.notesUpdatedAt = now;
            }
            if (tagConnect.length) data.tags = { connect: tagConnect };
            if (Object.keys(data).length) {
                ops.push(prisma.game.update({ where: { id: match.id }, data }));
                result.updated++;
            } else {
                result.skipped++;
            }
        } else if (r.steamId) {
            const status = r.status ?? 'NOT_STARTED';
            ops.push(
                prisma.game.create({
                    data: {
                        userId,
                        steamId: r.steamId,
                        title: r.title || `App ${r.steamId}`,
                        coverArtUrl: coverArtUrl(r.steamId),
                        hoursPlayed: r.hoursPlayed ?? 0,
                        notes: r.notes || null,
                        notesUpdatedAt: r.notes ? now : null,
                        ...statusChangeFields(status, now),
                        tags: { connect: tagConnect },
                    },
                }),
            );
            bySteamId.set(r.steamId, {
                id: '',
                steamId: r.steamId,
                title: r.title ?? '',
                status,
                notes: null,
            });
            result.created++;
        } else {
            result.skipped++;
            result.errors.push({
                row: r.row,
                message: `"${r.title}" is not in your library and has no Steam App ID`,
            });
        }
    }

    await prisma.$transaction(ops);
    await prisma.importHistory.create({
        data: {
            userId,
            source: format,
            totalGamesImported: rows.length,
            newGamesAdded: result.created,
            status: 'completed',
        },
    });
    return result;
}
