---
name: auth-jwt-rbac-development
description: Use when changing OCMS authentication, JWT handling, login/logout, password hashing, roles, permissions, protected routes, user status, backend authorization, or frontend role-gated navigation.
---

# Auth, JWT & RBAC Development

## Required Reads

- `AGENTS.md`
- `docs/backend/auth-and-jwt.md`
- `docs/domain/users-roles-permissions.md`

## Rules

- Backend authorization is the source of truth.
- Verify JWTs in middleware before protected handlers.
- Do not trust frontend role checks for access control.
- Hash passwords only; never store plaintext.
- Protect user, role, permission, finance, and status mutation endpoints.
- Permission and status changes require confirmation dialogs.
- Keep JWT payloads minimal.

## Verification

Run backend lint/build and add focused auth/RBAC tests when test tooling exists.
