import 'dotenv/config';
import prisma from './config/db';
import { createApp } from './app';
const app = createApp();
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
    console.log(`OCMS API listening on port ${PORT}`);
});
async function shutdown(signal) {
    console.log(`${signal} received. Closing OCMS API.`);
    server.close(async () => {
        await prisma.$disconnect();
        process.exit(0);
    });
}
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
export default app;
