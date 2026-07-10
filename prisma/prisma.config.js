import { defineConfig } from 'prisma';

export default defineConfig({
  datasources: {
    db: {
      provider: 'mysql',
      url: process.env.DATABASE_URL,
    },
  },
});
