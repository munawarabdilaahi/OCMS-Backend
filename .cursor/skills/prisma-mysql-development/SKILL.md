---
name: prisma-mysql-development
description: Use when changing OCMS Prisma schema, MySQL models, migrations, seed data, Prisma queries, pagination/filtering/sorting, transactions, or database-backed list endpoints.
---

# Prisma & MySQL Development

## Required Reads

- `AGENTS.md`
- `docs/backend/prisma-and-mysql.md`
- `docs/domain/glossary.md`

## Rules

- Use Prisma Client for database access.
- Use `select` for list endpoints.
- Paginate table endpoints.
- Filter, search, and sort in the database for real data.
- Use transactions for multi-record writes.
- Add indexes for repeated filter/sort paths.
- Update docs when schema changes.

## Verification

Run in `OCMS-Backend`:

```bash
npm run prisma:generate
npm run build
```
