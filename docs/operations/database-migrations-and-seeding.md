# Database Migrations & Seeding

## Commands

From `OCMS-Backend`:

```bash
npm run prisma:migrate
npm run prisma:generate
npm run prisma:studio
```

Seed command is configured in `package.json` as:

```bash
node prisma/seed.js
```

## Rules

- Update `docs/domain/glossary.md` when models are added or renamed.
- Use Prisma migrations for schema changes.
- Keep seed data deterministic.
- Do not write manual SQL unless there is a documented reason.
