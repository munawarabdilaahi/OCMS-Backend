# Express API

## Structure

- `src/app.js` creates and configures the Express app.
- `src/server.js` starts the server.
- `src/routes/*.routes.js` wires HTTP paths.
- `src/controllers/*.controller.js` handles HTTP request/response.
- Services/query modules should own business logic and Prisma queries as the codebase grows.
- `src/middlewares/error.middleware.js` handles errors and 404s.

## Rules

- Routes stay thin.
- Controllers stay thin.
- Move repeated business logic to services.
- Move repeated list query behavior to query modules.
- Use Zod validation before mutation.
- Return consistent JSON envelopes.
- Do not edit `dist/` when source files exist.

## Controller Size

- Over 300 lines: refactor warning.
- Near or above 1,000 lines: unacceptable.
