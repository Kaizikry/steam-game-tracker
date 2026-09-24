import type { Response } from 'express';

export class AppError extends Error {
    constructor(
        public status: number,
        public code: string,
        message: string,
    ) {
        super(message);
    }
}

export const notFound = (what: string) => new AppError(404, 'NOT_FOUND', `${what} not found`);

export function sendOk<T>(res: Response, data: T, status = 200) {
    res.status(status).json({
        success: true,
        data,
        error: null,
        timestamp: new Date().toISOString(),
    });
}
