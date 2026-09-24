import type { NextFunction, Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { AppError } from '../utils/response';

const fail = (res: Response, status: number, code: string, message: string, details?: unknown) =>
    res.status(status).json({
        success: false,
        data: null,
        error: { code, message, ...(details ? { details } : {}) },
        timestamp: new Date().toISOString(),
    });

export function notFoundHandler(req: Request, res: Response) {
    fail(res, 404, 'NOT_FOUND', `No route for ${req.method} ${req.path}`);
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
    if (err instanceof AppError) return fail(res, err.status, err.code, err.message);
    if (err instanceof ZodError) {
        const first = err.issues[0];
        return fail(
            res,
            400,
            'INVALID_REQUEST',
            `${first.path.join('.') || 'body'}: ${first.message}`,
            err.issues,
        );
    }
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
        if (err.code === 'P2002') return fail(res, 409, 'CONFLICT', 'That already exists');
        if (err.code === 'P2025') return fail(res, 404, 'NOT_FOUND', 'Record not found');
        if (err.code === 'P2003') return fail(res, 401, 'UNAUTHORIZED', 'Session no longer exists');
    }
    const e = err as { type?: string; status?: number };
    if (e?.type === 'entity.too.large')
        return fail(res, 413, 'PAYLOAD_TOO_LARGE', 'Request body is too large');
    if (e?.type === 'entity.parse.failed')
        return fail(res, 400, 'INVALID_REQUEST', 'Malformed JSON body');

    console.error(err);
    fail(res, 500, 'INTERNAL_ERROR', 'Something went wrong');
}
