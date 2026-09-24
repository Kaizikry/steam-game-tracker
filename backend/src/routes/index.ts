import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as auth from '../controllers/authController';
import * as games from '../controllers/gamesController';
import * as imports from '../controllers/importController';
import * as misc from '../controllers/miscController';
import * as tags from '../controllers/tagsController';
import { requireAuth } from '../middleware/auth';

const limit = (windowMs: number, limit: number) =>
    rateLimit({
        windowMs,
        limit,
        standardHeaders: 'draft-8',
        legacyHeaders: false,
        message: {
            success: false,
            data: null,
            error: { code: 'RATE_LIMITED', message: 'Too many requests, slow down' },
        },
    });

export function buildRouter(opts: { rateLimits: boolean }) {
    const noop: ReturnType<typeof limit> = ((_req, _res, next) => next()) as ReturnType<
        typeof limit
    >;
    const sessionLimit = opts.rateLimits ? limit(60 * 60 * 1000, 20) : noop;
    const steamLimit = opts.rateLimits ? limit(60 * 1000, 5) : noop;
    const enrichLimit = opts.rateLimits ? limit(60 * 1000, 30) : noop;

    const r = Router();

    r.get('/health', (_req, res) =>
        res.json({ success: true, data: { status: 'ok' }, error: null }),
    );

    r.post('/auth/anonymous', sessionLimit, auth.createSession);
    r.use(requireAuth);
    r.get('/auth/user', auth.getCurrentUser);
    r.delete('/auth/user', auth.deleteAccount);
    r.post('/auth/logout', (_req, res) =>
        res.json({ success: true, data: { loggedOut: true }, error: null }),
    );

    r.get('/games', games.list);
    r.post('/games/bulk-update', games.bulkUpdate);
    r.delete('/games', auth.clearLibrary);
    r.get('/games/:id', games.get);
    r.put('/games/:id', games.update);
    r.patch('/games/:id/status', games.updateStatus);
    r.delete('/games/:id', games.remove);
    r.post('/games/:id/refresh', enrichLimit, games.refresh);
    r.post('/games/:gameId/tags', tags.addToGame);
    r.delete('/games/:gameId/tags/:tagId', tags.removeFromGame);

    r.get('/tags', tags.list);
    r.post('/tags', tags.create);
    r.put('/tags/:id', tags.update);
    r.delete('/tags/:id', tags.remove);

    r.post('/import/steam', steamLimit, imports.importSteam);
    r.get('/import/history', imports.history);
    r.get('/import/status/:importId', imports.status);
    r.post('/import', imports.importFromFile);
    r.post('/export', misc.exportData);

    r.get('/stats', misc.stats);
    r.get('/settings', misc.getSettings);
    r.put('/settings', misc.updateSettings);

    return r;
}
