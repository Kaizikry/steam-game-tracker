import type { Request, Response } from 'express';
import { z } from 'zod';
import { userIdOf } from '../middleware/auth';
import * as games from '../services/gameService';
import { GAME_STATUSES } from '../types';
import { sendOk } from '../utils/response';

const idParam = (req: Request) => String(req.params.id);

export async function list(req: Request, res: Response) {
    sendOk(res, await games.listGames(userIdOf(req), games.gameQuerySchema.parse(req.query)));
}

export async function get(req: Request, res: Response) {
    sendOk(res, await games.getGame(userIdOf(req), idParam(req)));
}

export async function update(req: Request, res: Response) {
    sendOk(
        res,
        await games.updateGame(userIdOf(req), idParam(req), games.updateGameSchema.parse(req.body)),
    );
}

export async function updateStatus(req: Request, res: Response) {
    const { status } = z.object({ status: z.enum(GAME_STATUSES) }).parse(req.body);
    sendOk(res, await games.updateGame(userIdOf(req), idParam(req), { status }));
}

export async function remove(req: Request, res: Response) {
    await games.deleteGame(userIdOf(req), idParam(req));
    sendOk(res, { deleted: true });
}

export async function bulkUpdate(req: Request, res: Response) {
    sendOk(res, await games.bulkUpdate(userIdOf(req), games.bulkUpdateSchema.parse(req.body)));
}

export async function refresh(req: Request, res: Response) {
    sendOk(res, await games.enrichGame(userIdOf(req), idParam(req)));
}
