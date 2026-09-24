import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(3001),
    DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
    STEAM_API_KEY: z.string().default(''),
    JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
    FRONTEND_URL: z.string().default('http://localhost:5173'),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
    console.error('Invalid environment configuration:');
    for (const issue of parsed.error.issues)
        console.error(`  ${issue.path.join('.')}: ${issue.message}`);
    process.exit(1);
}

export const config = {
    ...parsed.data,
    // Comma-separated list allows several frontend origins (e.g. preview deployments).
    corsOrigins: parsed.data.FRONTEND_URL.split(',').map((o) => o.trim()),
};
