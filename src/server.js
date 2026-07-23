import 'dotenv/config';
import { createApp } from './app.js';

const REQUIRED_ENV_VARS = ['JWT_SECRET', 'JWT_REFRESH_SECRET', 'DATABASE_URL'];

for (const variable of REQUIRED_ENV_VARS) {
    if (!process.env[variable]) {
        console.error(`FATAL: ${variable} is not set in environment variables.`);
        process.exit(1);
    }
}

for (const key of ['JWT_SECRET', 'JWT_REFRESH_SECRET']) {
    if (process.env[key].length < 32) {
        console.error(`FATAL: ${key} must be at least 32 characters long.`);
        process.exit(1);
    }
}

const PLACEHOLDER_PATTERNS = ['CHANGE_ME', 'replace-with', 'your-secret', 'changethis', 'placeholder'];

if (process.env.NODE_ENV === 'production') {
    for (const key of ['JWT_SECRET', 'JWT_REFRESH_SECRET']) {
        const secret = process.env[key];
        const isPlaceholder = PLACEHOLDER_PATTERNS.some(p => secret.toLowerCase().includes(p.toLowerCase()));
        if (isPlaceholder) {
            console.error(`FATAL: ${key} contains a known placeholder value. Set a strong random secret before running in production.`);
            process.exit(1);
        }
    }

    const dbUrl = process.env.DATABASE_URL || '';
    if (dbUrl.includes(':password@') || dbUrl.includes(':root@')) {
        console.error('FATAL: DATABASE_URL contains default credentials. Update the password before running in production.');
        process.exit(1);
    }
}

const app = createApp();
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`OCMS API listening on port ${PORT}`);
});
