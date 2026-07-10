## Backend Rules

- Keep routes thin and controllers thinner.
- Move business logic to services.
- Use Zod for request validation.
- Use Prisma for database access; no manual SQL strings.
- List endpoints must paginate, filter, search, and sort at the API/database level.
- Use Prisma `select` to return only fields required by the UI.
- Enforce auth/RBAC on the backend.
- A controller over 300 lines is a refactor warning.
- A 1,000+ line controller is unacceptable.

## Performance Rules

- Do not return all rows for table endpoints.
- Return `{ data, meta }` for paginated lists.
- Use transactions for multi-record writes.
- Add indexes for repeated filter/sort paths.

## Verification

- Run `npm run build` after source edits.
- Run `npm run lint` when practical and report pre-existing blockers.
