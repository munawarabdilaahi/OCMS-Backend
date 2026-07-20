import 'dotenv/config';
import { createApp } from './app.js';

const REQUIRED_ENV_VARS = ['JWT_SECRET', 'DATABASE_URL'];

for (const variable of REQUIRED_ENV_VARS) {
    if (!process.env[variable]) {
        console.error(`FATAL: ${variable} is not set in environment variables.`);
        process.exit(1);
    }
}

if (process.env.JWT_SECRET.length < 32) {
    console.error('FATAL: JWT_SECRET must be at least 32 characters long.');
    process.exit(1);
}

const app = createApp();
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`OCMS API listening on port ${PORT}`);
});
