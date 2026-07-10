# Prisma & MySQL

## Key Files

- `OCMS-Backend/prisma/schema.prisma`
- `OCMS-Backend/prisma/seed.js`
- `OCMS-Backend/src/config/db.js`

## Query Rules

- Use Prisma Client for database access.
- Use `select` for list endpoints.
- Use `include` only when the response actually needs relation data.
- Paginate every table endpoint.
- Add indexes when filtering/sorting columns become hot paths.
- Use transactions for multi-record writes.
- Keep score, payment, and status mutations in backend services.

## Migration Workflow

- Use `npm run prisma:migrate` for development migrations.
- Run `npm run prisma:generate` after schema changes when needed.
- Update docs when models or relationships change.
