---
name: express-api-development
description: Use when working on OCMS Express backend routes, controllers, middleware, services, API response shapes, list endpoints, validation wiring, or controller refactors in OCMS-Backend.
---

# Express API Development

## Required Reads

- `AGENTS.md`
- `docs/backend/express-api.md`
- `docs/backend/validation-and-errors.md`

## Rules

- Keep routes as HTTP wiring only.
- Keep controllers thin.
- Extract business logic into services.
- Extract repeated list query behavior into query modules.
- Validate body, params, and query with Zod before mutation.
- Return consistent JSON envelopes.
- Use the shared error middleware.
- Never add to a controller that is already too large without considering a service extraction.

## Verification

Run in `OCMS-Backend`:

```bash
npm run lint
npm run build
```
