# Living Docs Protocol

Every code change must update documentation and `CHANGELOG.md`.

Before finishing:

1. Review changed files.
2. Detect new endpoints, services, Prisma models, schemas, pages, forms, tables, dialogs, and components.
3. Update the relevant `docs/` file.
4. Add a SemVer changelog entry.
5. Run the smallest relevant verification command.

SemVer:

- Major: framework, auth/RBAC, database, or destructive data architecture changes.
- Minor: new modules, endpoints, models, pages, reusable systems.
- Patch: fixes, refactors, validation changes, UI tweaks, docs-only changes.
