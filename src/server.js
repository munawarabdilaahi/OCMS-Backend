import 'dotenv/config';
import { createApp } from './app.js';

const app = createApp();
const PORT = process.env.PORT || 5000;

if (!process.env.JWT_SECRET) {
    console.error('FATAL: JWT_SECRET is not set in environment variables.');
    process.exit(1);
}

app.listen(PORT, () => {
    console.log(`OCMS API listening on port ${PORT}`);
});
