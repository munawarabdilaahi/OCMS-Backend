# Users, Roles & Permissions

## Model

Users have one role. Roles store permissions as JSON.

## Rules

- Backend RBAC is the source of truth.
- Frontend role helpers are for display/navigation only.
- Permission changes require confirmation dialogs and tests.
- JWT payloads should not be trusted without server verification.
