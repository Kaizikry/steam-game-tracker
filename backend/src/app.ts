import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './config';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { buildRouter } from './routes';

export function createApp(opts = { rateLimits: config.NODE_ENV !== 'test' }) {
    const app = express();
    app.disable('x-powered-by');
    app.set('trust proxy', 1);

    app.use(helmet());
    app.use(
        cors({ origin: config.corsOrigins, methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] }),
    );
    if (opts.rateLimits) {
        app.use(
            '/api',
            rateLimit({
                windowMs: 60 * 1000,
                limit: 300,
                standardHeaders: 'draft-8',
                legacyHeaders: false,
            }),
        );
    }
    // Import files for large libraries can be a few MB.
    app.use(express.json({ limit: '10mb' }));

    app.use('/api', buildRouter(opts));
    app.use(notFoundHandler);
    app.use(errorHandler);
    return app;
}
