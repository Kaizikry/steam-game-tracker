import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { AppError } from '../utils/response';

const TOKEN_TTL = '365d';

export const signToken = (userId: string) =>
    jwt.sign({}, config.JWT_SECRET, { subject: userId, expiresIn: TOKEN_TTL, algorithm: 'HS256' });

/**
 * Sessions are bearer tokens (not cookies), so requests can't be forged cross-site and no
 * CSRF token is needed.
 */
export function requireAuth(req: Request, _res: Response, next: NextFunction) {
    const header = req.headers.authorization;
    const token = header?.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return next(new AppError(401, 'UNAUTHORIZED', 'Missing session token'));
    try {
        const payload = jwt.verify(token, config.JWT_SECRET, { algorithms: ['HS256'] });
        if (typeof payload === 'string' || !payload.sub) throw new Error('bad payload');
        req.userId = payload.sub;
        next();
    } catch {
        next(new AppError(401, 'UNAUTHORIZED', 'Session expired or invalid'));
    }
}

export const userIdOf = (req: Request) => {
    if (!req.userId) throw new AppError(401, 'UNAUTHORIZED', 'Not signed in');
    return req.userId;
};
