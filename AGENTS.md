# OCMS Backend Agent Guide

This is the root guide for AI agents working in the OCMS backend repository.

## Project Snapshot

`OCMS-Backend` is the Express API for the Online Campus Management System.

Stack:

- Node.js ESM
- Express 5
- Prisma 6
- MySQL
- Zod
- JWT
- bcrypt / bcryptjs

## Clone & Adapt Protocol

- Find the closest existing route, controller, service, schema, Prisma model, or query pattern before creating a new one.
- Keep students, exams, auth, and future modules structurally consistent.
- Extract shared behavior instead of copy-pasting it a third time.
- Do not edit `dist/` when source files exist under `src/`.

## Living Docs Protocol

A backend change is incomplete until docs match the code.

Before finishing:

1. Review modified files.
2. Detect new routes, controllers, services, Prisma models, Zod schemas, middleware, or seed changes.
3. Update the relevant file under `docs/`.
4. Append a concise versioned entry to `CHANGELOG.md`.
5. Run the smallest relevant verification command.

## Test & Verification Enforcement

- Every behavior change needs an automated test or a clear note explaining why it could not be tested.
- Run `npm run build` after backend source edits.
- Run `npm run lint` when practical; document pre-existing lint blockers.
- Add test tooling before relying on manual checks as this API grows.

## Backend Standards

- Routes only wire HTTP paths and middleware.
- Controllers should be thin: parse request context, call services/query code, and return responses.
- Business logic belongs in services.
- Prisma query composition belongs in focused services/query modules, not giant controllers.
- Use Zod schemas for request validation.
- Use Prisma only; never build SQL strings manually.
- Use `select` to return only fields the frontend needs.
- List endpoints must paginate. Never return all rows for tables.
- Search, filtering, sorting, and pagination must happen at the API/database level for real data.
- Do not trust frontend role checks; enforce auth/RBAC in backend middleware or service guards.
- All errors should flow through the shared error middleware.
- A controller over 300 lines is a refactor warning. A 1,000+ line controller is unacceptable.

## Performance First

- List endpoints must accept `page`, `pageSize`, `search`, `sort`, and resource-specific filters.
- List responses should return `{ data, meta }`, where `meta` includes total, page, pageSize, and pageCount.
- Use Prisma `select`, `include` intentionally, and indexes in schema/migrations where filters need them.
- Avoid N+1 query patterns.
- Use transactions for multi-record writes.

## Documentation Map

- `CONTEXT.md` - domain glossary.
- `PRODUCT.md` - product purpose and principles.
- `docs/README.md` - documentation index.
- `docs/domain/` - campus domain concepts.
- `docs/backend/` - Express, Prisma, auth, validation, and error handling.
- `docs/operations/` - backend local development and database workflows.
- `.cursor/skills/` - local backend project skills.
- `.ai/guidelines/` - compact rule files.
- `CHANGELOG.md` - chronological backend documentation/change log.

## Hot Paths

| File | Role |
| :--- | :--- |
| `src/app.js` | Express app setup and route mounting |
| `src/server.js` | API server entrypoint |
| `src/routes/*.routes.js` | HTTP route wiring |
| `src/controllers/*.controller.js` | Current controller layer |
| `src/middlewares/error.middleware.js` | Shared error and 404 handling |
| `src/config/db.js` | Prisma client/database access |
| `prisma/schema.prisma` | MySQL schema |
| `prisma/seed.js` | Seed data |

## Skill Routing

Use the local skill before working in that area:

- Express routes/controllers/services: `.cursor/skills/express-api-development/SKILL.md`
- Prisma/MySQL/schema/query work: `.cursor/skills/prisma-mysql-development/SKILL.md`
- JWT/RBAC/auth: `.cursor/skills/auth-jwt-rbac-development/SKILL.md`

## Do Not

- Do not create giant controllers.
- Do not fetch all rows for table endpoints.
- Do not make frontend-only authorization the source of truth.
- Do not hardcode SQL.
- Do not edit generated/build output when source files exist.
