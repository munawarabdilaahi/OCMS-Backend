# Auth & JWT

## Stack

The backend uses JWT, bcrypt/bcryptjs, roles, and permissions.

## Rules

- Store passwords hashed only.
- Verify JWTs in backend middleware.
- Do not trust role/permission checks from the frontend.
- Keep auth response payloads minimal.
- Protect user, role, permission, status, and finance endpoints.
- Permission mutations require confirmation in the UI and authorization in the backend.
