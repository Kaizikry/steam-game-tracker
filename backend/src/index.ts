import { config } from './config';
import { createApp } from './app';
import { prisma } from './db';

const app = createApp();
const server = app.listen(config.PORT, () => {
    console.log(`Steam Game Tracker API listening on http://localhost:${config.PORT}`);
    if (!config.STEAM_API_KEY) console.warn('STEAM_API_KEY is not set: Steam import is disabled.');
});

const shutdown = async () => {
    server.close();
    await prisma.$disconnect();
    process.exit(0);
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
