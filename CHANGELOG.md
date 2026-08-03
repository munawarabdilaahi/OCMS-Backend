# Changelog

All notable OCMS backend changes will be documented in this file.

## [v0.2.1] - 2026-08-02

### Bug Fixes

- **Startup:** Fixed false "OCMS API listening on port 5000" message that printed before the real `EADDRINUSE` fatal when the port was already taken. Express 5's `app.listen(callback)` registers the callback as an `'error'` listener too, so the listen callback ran even when binding failed. `src/server.js` now attaches an explicit `server.on('listening')` handler and no longer passes a callback to `app.listen()`, so success is reported only on a real bind and the error handler prints the actual error. Port 5000 unchanged.

## [v0.2.0] - 2026-08-01

### Changes

- **Audit logs:** Added read-only audit-log module with `GET /api/audit-logs` and `GET /api/audit-logs/:id` (Admin/SuperAdmin only), mounted in `src/app.js`.
- **Dashboard:** `/api/dashboard/admin` now also authorized for `Registrar` and `Accountant`, matching the frontend dashboard role mapping.

### Technical Debt & Notes

- Audit entries are written by `src/middlewares/audit.middleware.js`; the new list endpoint exposes them for admin review.

## [v0.1.0] - 2026-07-10

### Changes

- **Docs:** Added backend AI guidance with `AGENTS.md`, `.ai` rules, domain/product context, and backend documentation scaffold.
- **Docs:** Added Express, Prisma/MySQL, auth/JWT, validation/error, local development, and migration/seed standards.
- **Skills:** Added local backend skills for Express API work, Prisma/MySQL, and auth/RBAC.

### Technical Debt & Notes

- Existing controllers should be refactored incrementally toward services/query modules before more behavior is added.
