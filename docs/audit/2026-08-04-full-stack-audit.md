# OCMS Full-Stack Audit — Security, Performance, Database & UX

**Scope:** OCMS-Backend (Express 5 / Prisma 6 / MySQL) and OCMS-Frontend (Next.js 15 / React 19)
**Date:** 2026-08-04
**Method:** Manual source review, no live target tested — see [Methodology](#methodology--scope)

Both codebases show real engineering discipline for a learning project — consistent RBAC middleware on every route, correct password hashing, atomic payment transactions, a working refresh-token rotation scheme, and a genuine design-token system on the frontend. The problems below are almost all narrow and fixable, not systemic rewrites. Six of them are worth fixing before this system holds anyone's real data.

**Totals: 6 Critical · 17 High · 34 Medium · 22 Low/informational (79 findings)**

## Contents

1. [Security & role management](#1-security--role-management)
2. [Database architecture](#2-database-architecture)
3. [Performance](#3-performance)
4. [Frontend UI/UX & accessibility](#4-frontend-uiux--accessibility)
5. [Prioritized fix order](#5-prioritized-fix-order)
6. [Methodology & scope](#methodology--scope)

---

## Executive summary

**The three critical findings that matter most:**

1. **Anyone on the internet can self-register as a "Teacher" and read the entire course catalog.** Public registration accepts `roleName: "Teacher"` with no approval step, and a fail-open bug in the course listing query means an account with no linked teacher profile gets *no* filter applied instead of an empty result. See [SEC-1](#sec-1-critical).
2. **Every new student/teacher account ships with a shared, hardcoded password.** `'campus123'` / `'Campus123'` is baked into the client bundle, and the backend's own validators would accept a 1-character replacement anyway. See [SEC-2](#sec-2-critical).
3. **Delete is silently broken across most of the admin CRUD screens.** A one-line copy/paste mistake — wiring the row action straight to the guard function instead of the state setter — means clicking "Delete" on Campuses, Faculties, Programs, Levels, Semesters, Academic Years, and Universities does nothing, with no error shown. See [UX-1](#ux-1-critical).

The other three Critical items — a bcrypt hash leaking through an unfiltered Prisma `include`, an access token that legally outlives its own cookie by 96×, and a status-field casing bug that makes unpaid invoices invisible to the finance dashboard — are each two or three lines to fix once you know where to look.

Two frontend-reported risks turned out, after cross-checking against the backend's actual route guards, to already be handled: CSRF protection is real (enforced via Origin/Referer validation, not a missing token), and the backend correctly rejects a Student role from reading the class roster even though the frontend page doesn't guard it client-side. Both are called out explicitly in their sections so the reasoning is on record, not just the conclusion.

---

## 1. Security & role management

Covers authentication, password handling, authorization/RBAC across both repos, injection risk, CSRF, rate limiting, secrets, audit logging, and CORS. Findings from the backend and frontend audits are merged and cross-checked against each other, so a risk one side flagged as "needs verifying" is resolved one way or the other rather than left open.

### Critical

#### SEC-1 (Critical)
**Self-registered "Teacher" accounts get unfiltered read access to every course**
`auth.service.js:16` · `rbac.js:3-14` · `course.service.js:74-98`

- **Chain:** `PUBLIC_ROLES` includes `'Teacher'`, so `POST /api/auth/register` instantly creates an `ACTIVE` Teacher-role account with no admin approval and no linked `Teacher` profile row.
- **Impact:** `getTeacherInfo()` returns `{ teacherId: null }` for that account (not `null`), and `getCourses()`/`getCourseById()` only scope results when `teacherId !== null` — so the condition is false and **no filter is applied at all**. Every other service in the codebase treats this same null-teacher state as "deny," making this an isolated fail-open bug, not the general pattern.
- **Fix:** Restrict `PUBLIC_ROLES` to `['Student']` only — Teacher accounts should go through the existing admin-only `POST /teachers` flow. Independently, fix `course.service.js` to treat `teacherId === null` the same as an empty course list, matching every other service.

#### SEC-2 (Critical)
**Every new account is provisioned with a shared, guessable, hardcoded password**
`StudentForm.jsx:71` · `TeacherForm.jsx:78` · `user/student/teacher.validator.js`

- **Chain:** The frontend hardcodes `password: 'campus123'` (students) and `'Campus123'` (teachers) directly in the create-account form, visible to anyone reading the shipped JS.
- **Impact:** Every student and teacher in the system starts on one of two publicly-known passwords with no visible forced-rotation flow. It's not even a defense-in-depth backstop: the backend's own password validators for admin-created accounts accept `z.string().min(1)` — a single character — so raising this on the client alone wouldn't help either.
- **Fix:** Generate a random one-time password (or invitation/activation token) *server-side* and never let the frontend choose credentials. Separately, align `user.validator.js`/`student.validator.js`/`teacher.validator.js` with the stronger policy already used for self-registration.

#### SEC-3 (Critical)
**Access tokens outlive their intended lifetime by up to 96×, and logout doesn't revoke them**
`auth.service.js:9,300-315` · `auth.controller.js:15` · `auth.middleware.js`

- **Chain:** The access-token cookie is set with `maxAge: 15 * 60 * 1000` (15 minutes) — clearly the intended session model. But the JWT it carries is signed with `JWT_EXPIRES_IN = '1d'`, so the token itself stays cryptographically valid for a full day regardless of the cookie. `logout()` only revokes the refresh token and session rows in the database; `authenticate()` never checks a revocation list for the access token itself.
- **Impact:** Any copy of the raw access token — via XSS, a proxy/access log, browser devtools, a shared machine — keeps working for up to 24 hours, including after the user clicks "logout."
- **Fix:** Set `JWT_EXPIRES_IN` to match the cookie's real intent (e.g. `'15m'`). If longer-lived tokens are ever needed, add a server-side revocation check (store and check the token's `jti`) so logout is actually effective.

#### SEC-4 (Critical)
**Bcrypt password hashes are returned to API clients via an unfiltered Prisma `include`**
`exam.service.js:169-173, 325-329`

- **Chain:** `submitExamResult()` and `getExamResults()` both use `include: { student: { include: { user: true } } }` — pulling the *entire* `User` row, hash included — and the controller returns it to the client unmodified.
- **Impact:** Every other read path in the codebase is careful about this (a shared `serializeUser()` strips the hash before responding, and other services use targeted `select`), which makes this a clear, isolated regression rather than a systemic habit — but it leaks working bcrypt hashes to any Teacher/Admin calling the exam-results endpoints.
- **Fix:** Replace `include: { user: true } }` with a targeted `select: { name: true, email: true }` in both locations — this fixes the over-fetch and the leak in one change.

### High

#### SEC-5 (High)
**The "dynamic permissions" system is entirely decorative — two unrelated permission models exist and neither is enforced end-to-end**
`role.service.js` · `auth.service.js:32` · `lib/roles.js`

- **Chain:** The `Role.permissions` JSON column is written by the Role CRUD API and read back exactly once, to echo it in the login response. No middleware, controller, or service anywhere checks it to make an access decision — every real check is a hardcoded role-*name* list like `authorize('Admin','SuperAdmin')`. Separately, the frontend has its own hardcoded `ROLE_PERMISSIONS` map in `lib/roles.js` that isn't fetched from the backend at all.
- **Impact:** Creating a custom role through the Role Management screen (e.g. "Librarian" with hand-picked permissions) grants it **zero real access** anywhere: no backend route recognizes the new name, and the frontend sidebar/route guards don't know it exists either. The feature looks configurable and isn't.
- **Fix:** Either build real permission-checking middleware that reads the role's stored `permissions` JSON (matching what `docs/domain/users-roles-permissions.md` already describes), or be explicit that roles are a fixed list and the Permissions screen is read-only reference material.

#### SEC-6 (High)
**Any logged-in Student can read any course's exam content, enrolled or not**
`exam.service.js:87-98, 254-292`

- **Chain:** `getCourseExams()`/`getCourseExamById()` only scope results when `roleName === 'Teacher'`. There's no equivalent branch for Student, so the only filter left is an optional, attacker-controlled `?course_id=` query parameter.
- **Impact:** A Student can call these endpoints for any course in the system and receive the full `questions` JSON field — the exam content itself — for courses they were never enrolled in. Notably, the sibling function `submitExamResult()` in the same file correctly checks enrollment first; the read path was simply missed.
- **Fix:** Add the same enrolled-course-ID scoping already implemented correctly in `getExamResults()` (line 301-303) and `enrollment.service.js:69-72`.

#### SEC-7 (High)
**Admin/SuperAdmin roles can be deleted via direct API call despite being hidden in the UI**
`RolesList.jsx:121,128` · `role.service.js:40-56`

- **Chain:** The frontend hides Edit/Delete buttons for roles named `'Admin'` or `'SuperAdmin'` — a UI-only check. `deleteRole()` on the backend only blocks deletion if the role currently has users assigned (`userCount > 0`); it never checks the role's name or a "built-in" flag.
- **Impact:** If every user is first moved out of the Admin or SuperAdmin role, a direct `DELETE /api/roles/:id` call succeeds — even though the UI never exposes a path to trigger it. This is exactly the "frontend visibility is not authorization" gap the project's own `PRODUCT.md` warns about, and here the backend genuinely lacks the matching guard.
- **Fix:** Block delete/rename of built-in role names inside `role.service.js` itself, independent of current user count.

#### SEC-8 (High)
**No privilege distinction between Admin and SuperAdmin for the most sensitive operations**
`rbac.js:29-35` · `user.routes.js` · `role.routes.js`

- **Chain:** `requireAdmin()` and nearly every sensitive route treat the two role names as pure peers via `authorize('Admin','SuperAdmin')`.
- **Impact:** A plain Admin can promote any user — including themselves — to SuperAdmin, and can edit the Role table itself. If two tiers were meant to exist (the two separate names strongly suggest so), nothing in the code currently reflects that hierarchy.
- **Fix:** Gate role-assignment and role-definition mutations to SuperAdmin only, or explicitly document that the two are intentionally peers.

#### SEC-9 (High)
**Login, registration, password-reset and token-refresh events are never written to the audit log**
`audit.middleware.js:9` · `auth.routes.js`

- **Chain:** `auditLog()` only writes a row `if (req.user)`. The auth routes correctly don't run `authenticate()` before login/register/reset/refresh (the caller isn't logged in yet) — which also means `req.user` is always undefined at the point the wrapped response fires.
- **Impact:** The exact events an incident responder would want first — who logged in, from where, how many failed attempts happened before a breach — are silently never recorded, despite being wired up to look like they are. Only routes that already run `authenticate()` first (logout, sessions) actually log correctly.
- **Fix:** Give `auditLog` a variant that records the attempted identity from `req.body` when `req.user` isn't set yet.

#### SEC-10 (High)
**Frontend route/menu gating and the frontend's own permission model are two separate, hand-maintained lists**
`lib/roles.js` · `lib/navigation.js`

- **Chain:** `lib/roles.js` defines `ROLE_PERMISSIONS`/`hasPermission()`. `lib/navigation.js` defines a completely separate `roles: [...]` array per nav item — the one `ProtectedRoute`/`Sidebar` actually check. Each nav item also carries a `permissions: [...]` field that no guarding code ever reads.
- **Impact:** Two independently-edited "who can do what" lists (on top of the backend's own third, hardcoded list per SEC-5) can silently drift apart with no test catching it — `__tests__/roles.test.js` only covers the unused one.
- **Fix:** Derive `ProtectedRoute`/`Sidebar` gating from `lib/roles.js`'s `hasPermission()`, using the already-defined-but-ignored `permissions` field on each nav item.

#### SEC-11 (High)
**List endpoints use `include` instead of the project's own documented `select` convention**
`campus.service.js:94-102` · `department/faculty/university.service.js`

- **Chain:** `docs/backend/prisma-and-mysql.md` states plainly: "Use `select` for list endpoints." `listCampuses`/`listDepartments`/`listFaculties`/`listUniversities` all ignore this and use `include` with no top-level `select`.
- **Impact:** Every column of these unusually wide tables (20–35 columns, several with embedded JSON blobs — see DB-13) is fetched for every row on every paginated list request, even though the list-view serializers only use a handful of fields.
- **Fix:** Add a top-level `select` restricted to list-view fields in these four services — the single highest-leverage backend performance fix available.

### Resolved cross-checks

> **CSRF protection.** The frontend audit initially flagged that `services/api.js` never attaches an `X-CSRF-Token` header despite cookie-based auth. Checking the backend resolved this: `csrf.middleware.js` is mounted globally in `app.js` and validates the `Origin`/`Referer` header against an allowlist on every non-safe method — a token-free CSRF defense that doesn't require the frontend to do anything. Combined with `sameSite: 'lax'` cookies, this is real, working defense-in-depth, not a gap.
>
> **Student access to the attendance roster.** `TakeAttendance.jsx` has no client-side role check and is reachable via the `/attendance` nav prefix, which includes the Student role. Checking the route guards resolved this too: `GET /students` and `POST /attendance/bulk` both require `authorize('Admin','SuperAdmin','Teacher','Registrar')` / `('Admin','SuperAdmin','Teacher')` — Student is excluded from both. A Student who navigates to that page today gets a confusing broken screen (failed requests, no data), not real data exposure. Still worth a client-side guard for the UX (see UX-14), but it is not a security hole.

### Medium

| ID | Finding | Location |
|---|---|---|
| SEC-12 | Admin-created accounts (via `POST /users`, `/students`, `/teachers`) accept a 1-character password — compounds directly with SEC-2. | user/student/teacher.validator.js |
| SEC-13 | `resolveRole()` has no built-in guard against a caller-supplied `role_id`; it's only safe today because Zod strips the unknown field from the public register schema — a single future schema change reopens self-registration-as-Admin. | auth.service.js:57-67 |
| SEC-14 | `updateUser()` never validates a supplied `role_id` actually exists (unlike `createUser`); surfaces as a raw FK error instead of a clean 400. | user.service.js:75-104 |
| SEC-15 | XSS mitigation is a 3-pass regex tag-stripper, not real output encoding — meaningful defense-in-depth today, but shouldn't be the only line of defense if the frontend ever renders stored fields unescaped. | sanitize.middleware.js:1-8 |
| SEC-16 | The same global sanitizer runs on every request body including `password`, silently stripping `<`/`>` before hashing with no field exclusion list. | sanitize.middleware.js:25-35 |
| SEC-17 | 3 of 6 defined rate limiters (`strictAuthLimiter`, `apiLimiter`, `crudLimiter`) are exported but never wired up — payments, deletes, and other writes share only the generous global 200-req/15-min budget. | rateLimit.middleware.js |
| SEC-18 | Audit log is a plain table with no hash-chaining or write-once storage — tamper-evidence relies entirely on no route exposing edit/delete, not on the data layer. | prisma/schema.prisma (AuditLog) |
| SEC-19 | Role/status changes in the Users admin screen skip the confirmation dialog the project's own docs require for permission changes — only account deletion gets one. | UsersList.jsx:86-113 |
| SEC-20 | No security headers configured on the frontend at all — no CSP, `X-Frame-Options`, `Referrer-Policy`, or HSTS via `next.config.js`. | next.config.js |
| SEC-21 | `ProtectedRoute` fails *open* — any authenticated route not explicitly listed in nav config is granted access by default rather than denied. | ProtectedRoute.jsx:10-18 |
| SEC-22 | Public self-registration also accepts a `'Staff'` role value that doesn't exist in the seeded role list — currently a dead, unreachable branch rather than exploitable, but worth removing. | auth.service.js:16 |
| SEC-23 | Unbounded recursion in the request sanitizer (no depth cap, unlike the audit-log redactor which caps at depth 5) — a deeply nested JSON body within the existing 1 MB limit could throw a stack overflow. | sanitize.middleware.js:10-23 |
| SEC-24 | Swagger/OpenAPI UI is mounted unconditionally, including in production, giving anyone the full API surface map with no auth gate. | app.js:85-88 |

### Low & informational

| ID | Finding | Location |
|---|---|---|
| SEC-25 | CSRF's Origin/Referer check will also 403 legitimate non-browser Bearer-token clients (mobile apps, server-to-server callers) that don't send those headers — not a vulnerability, but a likely source of confusing integration bugs. | csrf.middleware.js:30-35 |
| SEC-26 | `.env.example`'s default `root:changeme` DB password isn't covered by the production startup blocklist (which does catch `:password@` and `:root@`). | .env.example:2 · server.js:32-36 |
| SEC-27 | Prisma unique-constraint error messages are cleaned up via a brittle string-replace tied to one specific constraint name — silently stops working, and leaks a raw internal identifier, if the format ever changes. | error.middleware.js:14-15 |
| SEC-28 | Two purpose-built RBAC helpers (`canTeacherAccessCourse`, `canTeacherAccessStudent`) are defined but never called anywhere — dead code, not a risk. | rbac.js:22-27, 37-45 |
| SEC-29 | Password-reset token travels via URL query string — a common, generally acceptable pattern for email links, but worth pairing with a stricter `Referrer-Policy` given SEC-20. | ResetPassword.jsx:27 |
| SEC-30 | An unused `STORAGE_KEY` constant and a stale test asserting a bearer-token flow that no longer exists both point to a leftover design from before the app moved to cookie-based auth. | AuthContext.jsx:6 · services.test.js |
| SEC-31 | No account-level lockout after repeated failed logins — only IP-based rate limiting. A reasonable tradeoff for this project's scale, noted for completeness. | rateLimit.middleware.js |
| SEC-32 | Server-side error logs drop the stack trace in production too (not just the client response) — safe, but reduces operators' own debugging context unless logs feed a proper aggregator. | error.middleware.js:36 |
| SEC-33 | Client-side password minimum length is inconsistent between Login (6 chars) and Reset (8 chars) — cosmetic, since the backend is the real source of truth. | Login.jsx:17 · ResetPassword.jsx:17 |

### What's done well — security

- Zero raw SQL anywhere — every query goes through Prisma's parameterized builder, which eliminates classic SQL injection as a risk category entirely.
- `authenticate` is applied centrally via `router.use()` across all 22 route files, with `authorize(role...)` consistently chained on business routes rather than scattered ad hoc checks.
- `authorize()` re-validates the user's role and active status against the live database on every request — a suspended user's still-valid JWT stops working immediately, not just after it expires.
- Refresh-token rotation includes real reuse detection: presenting an already-revoked refresh token revokes *all* sessions for that user, the correct advanced response to suspected token theft.
- bcrypt at 12 rounds; passwords and tokens are consistently redacted from logs and API responses via a shared `serializeUser()` and an explicit audit-log redaction list.
- JWT verification pins the algorithm to HS256 and checks issuer/audience — defends against classic "alg: none" and algorithm-confusion attacks that catch many junior implementations.
- CORS uses an explicit origin allowlist with credentials, not a wildcard — a very common misconfiguration this project avoids.
- Cookie flags are correct throughout: `httpOnly`, `secure` in production, `sameSite=lax`, and the refresh-token cookie is path-scoped to `/api/auth` only.
- The server refuses to boot on missing or placeholder `JWT_SECRET`/`JWT_REFRESH_SECRET`/`DATABASE_URL`, with extra production-only checks against known default values — a fail-fast habit many production apps skip.
- Ownership-based scoping ("a Student only sees their own invoices/payments/attendance/results") is implemented correctly and repeatedly across services — SEC-6 is the one gap in an otherwise consistent pattern.
- No `dangerouslySetInnerHTML`, no `eval()`, no secrets leaking via `NEXT_PUBLIC_*`, and no credentials or tokens ever logged to the console anywhere in the frontend.
- `window.confirm()` is never used — every destructive action goes through a real, accessible confirmation dialog.

---

## 2. Database architecture

Covers the Prisma schema, indexing, query patterns, transaction safety, and connection handling in OCMS-Backend. The schema itself is thoughtfully modeled — proper foreign keys almost everywhere, conservative cascade rules, and composite unique constraints doing double duty as business rules — so most findings here are about consistency (enums vs. free text, `select` vs. `include`) rather than structural problems.

### Critical

#### DB-2 (Critical)
**Invoice's default status is mixed-case and silently invisible to every uppercase filter in the app**
`schema.prisma:323` · `invoice.service.js:44-68,177,180` · `dashboard.service.js:32`

- **Chain:** `Invoice.status` is a free-text `String @default("Pending")`. `createInvoice()` never sets `status` explicitly, so every new invoice falls back to this mixed-case default — but every place that later *reads* status (dashboard totals, "outstanding balance" queries, the Zod validator) filters against uppercase `'PENDING'`.
- **Impact:** A brand-new unpaid invoice is invisible to financial reporting and the admin dashboard until its first payment recalculates the balance through a different, correctly-uppercase code path. This is the clearest concrete illustration in the codebase of why status columns need to be enums, not strings.
- **Fix:** Set the schema default to `'PENDING'` immediately; convert `status` to a real Prisma `enum` so this class of bug becomes impossible to reintroduce (see DB-3).

> **Cross-referenced:** The other Critical database-layer finding — bcrypt hashes leaking via an unfiltered `include` in `exam.service.js` — is a credential-exposure issue first and a query-efficiency issue second, so it's written up in full under [Security → SEC-4](#sec-4-critical) rather than repeated here.

### High

#### DB-3 (High)
**Inconsistent enum adoption for status columns**
`schema.prisma` — 13 models

- **Chain:** Some models correctly use Prisma enums (`Attendance`, `Course`, `CourseExam`, `ExamSchedule`, `ExamResult`, `FeeStructure`, `University`, `Payment.payment_method`) — but 13 others (`AcademicYear`, `Campus`, `Department`, `Enrollment`, `Faculty`, `Invoice`, `Level`, `Payment.status`, `Program`, `Semester`, `Student`, `Teacher`, `User`) use bare `String` with values enforced only by application convention.
- **Impact:** Free-text status invites exactly the class of bug in DB-2, plus `'DELETED'` is used as a soft-delete value for `User`/`Student`/`Teacher` without being declared as valid anywhere in the schema.
- **Fix:** Convert all status columns to Prisma enums, starting with `Invoice` and `Payment` since they're financial.

#### DB-5 (High)
**Bulk attendance is N+1 and unwrapped in a transaction**
`attendance.service.js:214-269`

- **Chain:** For each record in a bulk-submit array, the loop sequentially awaits an enrollment check, a lookup for an existing record, then a create or update — up to 3 round-trips per student. Submitting attendance for a 40-student class issues roughly 120 sequential database calls. Failures are swallowed with `catch { continue; }` and nothing is rolled back.
- **Impact:** A "bulk" operation can partially succeed with no report of which records failed, and the sequential round-trips make the endpoint's latency scale linearly with class size.
- **Fix:** Pre-fetch enrolled student IDs and existing records in two batched `findMany({ in: [...] })` calls, then write inside a single `prisma.$transaction`; surface per-record failures instead of swallowing them.

#### DB-6 (High)
**Missing indexes on columns used in hot filter/sort paths**
`schema.prisma` — Invoice, Payment, ExamSchedule, AuditLog

- **Chain:** `Invoice.due_date` and `Invoice.status`, `Payment.status` and `Payment.created_at`, `ExamSchedule.exam_date`, and `AuditLog.resource` (searched via `contains`) all lack an `@@index`, despite being filtered or sorted on in dashboard and reporting queries.
- **Impact:** These queries will degrade to table scans as the corresponding tables grow — notably, `Campus`/`Department`/`Faculty` *do* have `@@index([status])`, showing the indexing strategy was applied inconsistently rather than by a single rule.
- **Fix:** Add `@@index` to the six columns listed above.

A fourth High finding — wide list endpoints using `include` instead of the documented `select` convention — is filed as [SEC-11](#sec-11-high) above, since it's the same violation the security audit flagged from the API-surface side.

### Medium

| ID | Finding | Location |
|---|---|---|
| DB-7 | Money and score fields use bare `Decimal` with no explicit precision, defaulting to `DECIMAL(65,30)` — the type family (Decimal over Float) is the right call and avoids rounding errors, it just needs a scale. | schema.prisma (Invoice, Payment, Transaction, FeeStructure, ExamResult) |
| DB-8 | `academic_year`/`semester` are stored as free-text strings on `FeeStructure`, `Invoice`, and `Course` instead of real foreign keys to the existing `AcademicYear`/`Semester` tables, so they can silently drift out of sync. | schema.prisma |
| DB-9 | `register()`/`login()` perform three sequential, unwrapped writes (user → session → refresh token) instead of one transaction — recoverable today, but inconsistent with the rest of the codebase's transaction discipline. | auth.service.js:158-176 |
| DB-10 | Name/code "uniqueness" checks in 9 services (campus, department, faculty, university, program, level, academic-year, semester, role) are a `findFirst`-then-`create` pattern with no backing `@@unique` constraint on `name` — a real (if low-traffic) race condition. | *.service.js |
| DB-11 | `listRoles()` is the one list endpoint in the codebase with no pagination at all — low risk given roles are a small admin-managed set, but inconsistent with the other ~18 list services. | role.service.js:4 |
| DB-12 | No `compression` middleware anywhere in the Express stack — combines with DB-11/SEC-11's over-fetching to make already-oversized list responses larger on the wire than they need to be. | app.js · package.json |
| DB-13 | `Campus` (35 columns, 3 JSON blobs), `Faculty` (~25), `Department` (~20), and `University` (~30) mix hot, frequently-queried fields with rarely-used descriptive metadata on one table — a natural candidate for splitting into a companion "Details" table. | schema.prisma |

### Low & informational

| ID | Finding | Location |
|---|---|---|
| DB-14 | Two update functions fetch a full `User` row (via `include`) purely to read one field — wasted I/O, no leak since the object isn't returned. | teacher.service.js:55 · student.service.js:151 |
| DB-15 | No caching layer exists for near-static reference data (universities, campuses, departments, faculties, academic years, semesters, levels, programs, roles) — all re-queried from MySQL on every request that needs them. | package.json |
| DB-16 | No explicit database connection-pool tuning — fine for a single-instance deployment, worth revisiting once multiple app instances share one MySQL server. | .env.example:2 |
| DB-17 | Only two migrations exist, with non-standard (non-timestamped) folder names, suggesting the migration history was manually rebaselined at some point — no destructive statements found in either. | prisma/migrations/ |

### What's done well — database

- Cascade behavior is deliberately conservative: core academic/financial foreign keys use `RESTRICT`, and `CASCADE` is scoped narrowly to auth ephemera (sessions, refresh tokens, verification tokens) that genuinely should disappear with the user. No accidental-data-loss cascade paths were found.
- Composite unique constraints on `Attendance`, `Enrollment`, and `ExamResult` do double duty — enforcing real business rules *and* acting as a race-condition safety net, with Prisma's `P2002` cleanly translated into a 409 response instead of a 500.
- The pagination utility is implemented correctly (clamped page/limit, sane defaults) and used consistently across roughly 18 of 19 list services, always paired with a parallel `Promise.all([findMany, count])`.
- `dashboard.service.js` is the best-written file in the service layer: parallelized independent queries, database-level `groupBy`/`aggregate` instead of summing in JavaScript, and targeted `select` throughout — a ready-made model for fixing SEC-11/DB-6.
- The Prisma client is a correct singleton via `globalThis`, avoiding the classic dev-hot-reload connection-exhaustion problem.
- The payment → invoice-balance → transaction write path is properly atomic via `prisma.$transaction`, as are student/teacher account creation and deletion.
- Money fields correctly use `Decimal` rather than `Float`, avoiding floating-point rounding errors on financial data — DB-7 just asks for an explicit precision on top of an already-correct type choice.

---

## 3. Performance

Covers both the Express API and the Next.js frontend. The single biggest architectural fact to understand here: the frontend is built as a client-rendered single-page app *inside* Next.js, which forfeits most of the framework's headline performance features.

### High

#### PERF-1 (High)
**The app is architected as a client-side SPA inside Next.js, forfeiting server rendering — but code-splitting still works**
`app/[[...segments]]/page.jsx` · `app/app-shell.jsx` · `ProtectedRoute.jsx:34`

- **What's happening:** Instead of Next.js's normal file-based routing, the entire app lives behind one catch-all route (`app/[[...segments]]/page.jsx`) that renders a single `'use client'` component, `AppShell`. In Next.js, once a component tree crosses into a client component, everything beneath it is client-rendered too — so all ~118 files under `app/`, `components/`, `features/`, and `layouts/` are effectively client components, regardless of whether they declare `'use client'` themselves.
- **Why it matters:** Next.js's headline performance wins — rendering a page with its data already baked in on the server, streaming HTML as it becomes ready, shipping less JavaScript for pages that don't need interactivity — all require Server Components. This app gets none of them. It's worse than a neutral SPA, too: `ProtectedRoute` renders `null` (not even a loading spinner) until client-side auth state resolves, so the server-rendered HTML for ~95% of the app's pages — everything but login/forgot/reset — is a blank page. Users see nothing until JS downloads, hydrates, and a `/me` request resolves.
- **What's already right:** `lib/routes.js` uses `React.lazy()` per feature route inside a `Suspense` boundary, so feature-level code splitting genuinely works today — visiting Students doesn't download the Payments bundle. The "one giant bundle" risk is real for the shared shell/auth/theme code, not for feature code.
- **Fix:** A cheap interim fix: swap `ProtectedRoute`'s blank `null` for the existing `PageLoader`. The larger fix — moving to real per-route Next.js pages — is a bigger, worthwhile lift once the app's data needs stabilize, not a this-week task.

#### PERF-2 (High)
**Five of six major list screens fetch the entire table and paginate/filter/sort it in the browser**
StudentsList · TeachersList · CoursesList · PaymentsList · UsersList

- **Chain:** `getStudents()`, `getTeachers()`, and the equivalents for Courses/Payments/Users are called with no params, and TanStack Table's client-side row models handle sorting, filtering, and pagination over the full in-memory result.
- **Impact:** This directly violates the project's own documented standard — both `AGENTS.md` and `docs/frontend/tables-and-filters.md` say server-side pagination is the default and client-side filtering over large datasets should be avoided. It works fine at today's data volumes and will degrade — large payload, slow initial parse, laggy filter keystrokes — as real data accumulates.
- **Fix:** `DepartmentsList.jsx` already implements the correct pattern in this same codebase — sending `page`/`pageSize`/`search`/`status` to the API and reading back a `total` count. Apply that exact pattern to the other five screens.

#### PERF-3 (High)
**No client-side data cache — every navigation refetches from scratch**
`services/*.service.js` (18 files)

- **Chain:** Every service function is a thin, uncached `axios` wrapper. There's no SWR, React Query, or Next.js fetch-cache layer anywhere — leaving a list and coming back re-issues the full request even if nothing changed seconds ago.
- **Impact:** More perceived latency and redundant load on the API than necessary, especially for near-static reference data (departments, programs, academic years) that gets re-fetched on every form that needs a dropdown of it.
- **Fix:** Adopt TanStack Query or SWR for GET requests — the existing services already return plain promises, so this is a wrapping change, not a rewrite.

### Medium

| ID | Finding | Location |
|---|---|---|
| PERF-4 | No `compression` middleware on the backend (same finding as DB-12) — compounds with the over-fetch issues above. | app.js |
| PERF-5 | The shared axios instance has no request `timeout` — a hung backend call leaves the UI spinning with no client-side cutoff. | services/api.js:5-11 |
| PERF-6 | `TakeAttendance` loads every student in the system on mount regardless of the selected course, instead of fetching just the enrolled roster. | TakeAttendance.jsx:26-37 |
| PERF-7 | Inline arrow functions passed as row-action props (`onDelete={(s) => ...}`) bust the column-definition `useMemo` in the Students/Teachers data tables on every unrelated parent re-render. | StudentsList.jsx:81 · TeachersList.jsx:69 |
| PERF-8 | No caching layer for near-static reference data on either side of the stack (same underlying gap as DB-15, felt on both frontend and backend). | services/*.service.js |

### Low & informational

| ID | Finding | Location |
|---|---|---|
| PERF-9 | `recharts` is a dependency imported only by three dashboard sub-components that are never actually rendered anywhere in the app today — dead code, and a bundle-size trap for whoever wires them back in without noticing. | components/dashboard/ |
| PERF-10 | One raw `<img>` tag instead of `next/image` — low impact today since the asset is an 888-byte SVG, but worth the habit before real photo/avatar assets are added. | AuthLayout.jsx:6 |
| PERF-11 | Array index used as the React `key` on real, reorderable result data (not just static skeletons). | StudentResultDetails.jsx:86 |
| PERF-12 | No list virtualization anywhere — not painful yet since tables are still client-paginated to 5-10 visible rows, but will matter once PERF-2 is fixed and page sizes grow. | — |
| PERF-13 | `dashboard-data.js` exists as an empty, unused file. | features/dashboard/dashboard-data.js |

### What's done well — performance

- `DepartmentsList.jsx` implements textbook server-side pagination and filtering — exactly the pattern the project's own docs call for, and a ready-made template sitting in the same codebase as PERF-2.
- `AttendanceReport.jsx` parallelizes independent requests with `Promise.all` and sends real filter parameters to the server — no request waterfall.
- `AuthContext.jsx` memoizes its context value and wraps handlers in `useCallback` correctly — the textbook way to stop every `useAuth()` consumer app-wide from re-rendering on unrelated changes.
- Icon and UI-library imports (`lucide-react`, Radix) are already tree-shake-friendly — named per-icon imports throughout, no whole-library imports found.
- No large image assets exist anywhere in the app; asset weight is a non-issue at the current stage.
- The backend's `dashboard.service.js` is the best-optimized file in the whole service layer — parallel queries, database-level aggregation, targeted `select` throughout.
- The Prisma client singleton correctly prevents connection-pool exhaustion under development hot-reloading.

---

## 4. Frontend UI/UX & accessibility

Checked against the project's own `DESIGN.md` and `docs/frontend/` standards. The foundations here are genuinely solid — correct Radix usage, a real design-token system, broad `EmptyState` adoption — and the gap is almost entirely about reusing what already exists rather than the primitives being wrong. The clearest evidence: the reference implementation (Students) and the pattern everyone else should have copied (Departments) both already exist in this codebase.

### Critical

#### UX-1 (Critical)
**Delete is silently broken on 7 of 10 CRUD list screens**
7 list screens, e.g. `CampusesList.jsx:332`

- **Chain:** Each list screen keeps a `deleteTarget` state opened via a confirmation dialog, plus a `handleDelete()` that guards on `if (!deleteTarget) return;`. The row action is supposed to call `setDeleteTarget(row)` first. In **Academic Years, Campuses, Levels, Faculties, Semesters, Programs, and Universities**, the row's `onDelete` is instead wired straight to `handleDelete` itself — which then reads the still-null `deleteTarget` and returns immediately.
- **Impact:** Clicking "Delete" on any of these seven screens does nothing at all — no dialog, no error, no feedback. Registrars/admins currently cannot delete academic years, campuses, levels, faculties, semesters, programs, or universities from the UI. The correct wiring exists right in the same codebase: `DepartmentsList.jsx:131`, `StudentsList.jsx:81`, and `TeachersList.jsx:69` all correctly use `onDelete={(item) => setDeleteTarget(item)}`.
- **Fix:** A 1-line change in each of the 7 files — copy the wiring from Departments/Students/Teachers.

### High

#### UX-2 (High)
**No shared data-table primitive exists — and UX-1 is the direct, shipped cost of that gap**
no `components/ui/data-table.*` exists · 18 duplicated `SortButton` definitions

- **Chain:** `StudentsDataTable.jsx` and `TeachersDataTable.jsx` are near line-for-line duplicates of each other, and 18 separate feature files each define their own local `function SortButton`. `docs/frontend/tables-and-filters.md` explicitly calls for shared wrappers (table shell, toolbar, pagination, row actions, empty state) and `DESIGN.md` explicitly says "do not copy/paste whole table implementations per module."
- **Impact:** This isn't just a style nit — UX-1 happened *because* seven screens each hand-copied and slightly mis-edited the same delete-wiring logic instead of sharing one implementation. Any future fix or tweak has to be hand-applied across as many as 18 files.
- **Fix:** Extract a generic `DataTable` primitive (shell + toolbar + pagination + empty-state slot + row actions) into `components/ui/`, using the two existing tables as templates.

#### UX-3 (High)
**Zero uses of `aria-describedby` anywhere — validation errors aren't linked to their fields**
every form in the product

- **Chain:** Confirmed via a repo-wide search: no form anywhere associates its error message with its input programmatically. Inputs get `aria-invalid`, but the error text is just a plain sibling `<p>`.
- **Impact:** A screen-reader user who tabs to an invalid field hears "invalid" with no indication of why, and has to hunt for the message elsewhere on the page. This affects every form in the product — Students, Teachers, Settings, Login, all of it.
- **Fix:** Give each error message an `id` and pass `aria-describedby={id}` on the matching input — a small, mechanical, high-value fix.

#### UX-4 (High)
**The mobile navigation drawer has no focus trap, no Escape handler, and no visible close button**
`DashboardLayout.jsx:33-51`

- **Chain:** The mobile off-canvas sidebar is a hand-built `<div>` using a CSS transform, with a click-only overlay to dismiss — not the Radix `Dialog` already used correctly everywhere else in the app.
- **Impact:** A keyboard-only user on a narrow viewport who opens the mobile menu can tab focus straight into the page content hidden behind it, has no Escape key to close it, and has no way to close it at all except clicking a nav link or the mouse-only overlay. This can leave a keyboard user effectively stuck.
- **Fix:** Rebuild the mobile drawer on the existing `components/ui/dialog.jsx` (Radix) primitive, which already provides focus-trap, Escape, and ARIA behavior for free.

#### UX-5 (High)
**The Users create/edit dialog bypasses the project's own form standard, and has no label/input association**
`UsersList.jsx:86-113, 196-198,205`

- **Chain:** Unlike Students/Teachers/Login/Settings — which all use React Hook Form + Zod — this dialog validates manually with `toast.error()` calls, never checks email format at all, and its `<Label>`/`<Input>` pairs have no `htmlFor`/`id` linking them.
- **Impact:** Any non-empty string is accepted as an email; errors surface only as toasts instead of next to the field; clicking a field's label doesn't focus the input, and screen readers won't announce the field's name when it receives focus.
- **Fix:** Port this dialog onto the `useForm + zodResolver` pattern already established elsewhere, and add matching `id`/`htmlFor` pairs.

### Medium

| ID | Finding | Location |
|---|---|---|
| UX-6 | Status badges hand-roll their own color map per feature (6+ files) instead of using shared `Badge` variants — the same amber means "PENDING" in Payments but "INACTIVE" in Students/Teachers/Users, with no single source of truth for what a color means. | badge.jsx · 6 feature files |
| UX-7 | Shared support components exist but are barely adopted: `PageHeader` used in 2 of ~19 screens, `PageLoader` only at the route level, `TableSkeleton` in 1 list screen, and `LiveRegion` — built specifically for accessibility announcements — has zero usages anywhere. | components/common/ |
| UX-8 | Two "Skip to content" links stack in the tab order on every dashboard page (a global one plus `DashboardLayout`'s own duplicate), and the global one's target doesn't exist at all on the three auth screens, so it silently does nothing there. | DashboardLayout.jsx:26-31 · app/layout.jsx:14 |
| UX-9 | Sidebar links never set `aria-current="page"` — the active page is only indicated visually, with no programmatic signal for assistive technology. | lib/router.jsx:10-17 |
| UX-10 | The collapsed, icon-only sidebar relies solely on the native `title` attribute for labels — unreliable for screen readers and invisible on touch devices. | Sidebar.jsx:46-61 |
| UX-11 | Dark mode flashes the light theme on every hard refresh (FOUC) — the theme class is applied inside a `useEffect` instead of a blocking inline script before first paint; `suppressHydrationWarning` shows the risk was known but not fully addressed. | ThemeProvider.jsx:15-26 |
| UX-12 | Required-field indication is inconsistent — one screen manually appends " *" to labels, every other form shows nothing until after a failed submit. | TakeAttendance.jsx:84,93 vs. others |
| UX-13 | A native `<select>` is hand-styled to mimic the shared `Select` component instead of reusing it — visually and behaviorally inconsistent with every other filter dropdown. | FacultiesList.jsx:285-310 |
| UX-14 | `TakeAttendance` has no client-side role guard even though the backend correctly rejects Student callers (see the resolved cross-check in Security) — worth adding purely so a Student sees a proper "not available" state instead of a broken page full of failed requests. | TakeAttendance.jsx |

### Low & informational

| ID | Finding | Location |
|---|---|---|
| UX-15 | Dense tables (Students, Teachers, Payments, Faculties, Users) have no card/stacked fallback on narrow screens — just a horizontal scroll with no affordance hinting more columns exist off-screen. | table.jsx:2-5 |
| UX-16 | Form field mini-components (`FieldError`, `SelectField`, `TextField`) are copy-pasted verbatim in multiple forms instead of living once in `components/ui/`. | StudentForm.jsx:18-39 · TeacherForm.jsx:16-36 |
| UX-17 | The theme toggle only cycles light/dark — once clicked, a user loses the "system" auto-tracking option except by returning to Settings. A defensible minor tradeoff, not a bug. | ThemeToggle.jsx:4-10 |
| UX-18 | Two stray non-English debug strings shipped in production UI code (a Somali-language dev comment and an empty-state fallback string) — harmless, but worth a cleanup pass. | dropdown-menu.jsx:17 · Sidebar.jsx:64 |

### What's done well — UI/UX & accessibility

- Radix primitives are used correctly and idiomatically throughout `components/ui/` — dialogs, dropdowns, and selects get real focus-trap, keyboard, and ARIA behavior "for free" rather than being reimplemented by hand.
- `window.confirm()` appears zero times in the codebase — every destructive action goes through the real, accessible `ConfirmationDialog`, in full compliance with the project's own rule.
- `EmptyState` is broadly and consistently adopted across roughly 19 feature files — the single best-executed piece of the shared design system.
- The CSS design-token system (`styles/index.css`) is a proper semantic-token architecture, independently tuned for light and dark mode rather than a naive color invert.
- Status is never communicated by color alone — every badge renders the actual status word as text, satisfying `DESIGN.md`'s explicit rule even where the color values behind it (UX-6) aren't centrally governed.
- Icon-only buttons consistently carry accessible names via `sr-only` text or `aria-label` — applied correctly and consistently, unlike some of the other accessibility gaps above.
- React Hook Form + Zod is the norm, not the exception, and the shared `Input`/`Textarea`/`SelectTrigger` primitives bake in invalid-state styling automatically for every form that uses them.
- Responsive grid discipline is consistent everywhere it's applied — stat grids, info grids, and form grids all collapse cleanly to a single column on small screens using the same breakpoint convention.
- Dark mode preference persistence and OS-level detection both work correctly — UX-11's flash-on-refresh is the one real bug in an otherwise solid implementation.
- Design-token discipline is strong in feature code generally — a repo-wide scan for arbitrary/magic Tailwind values turned up almost nothing outside the status-badge color maps.

---

## 5. Prioritized fix order

Ordered by how much damage each item could do relative to how quickly it can be fixed — not strictly by severity. Several Critical items are one- or two-line changes; some Medium items are a bigger lift and can wait.

### Fix now — small, contained changes, a good first session

- [ ] **Rewire the 7 broken delete buttons** — copy the working pattern from Departments/Students/Teachers. `UX-1`
- [ ] **Strip password hash from exam-result queries** — swap `include: { user: true }` for a targeted `select`. `SEC-4`
- [ ] **Fix Invoice's default status casing** — one line; consider the enum conversion alongside it. `DB-2 / DB-3`
- [ ] **Remove hardcoded student/teacher passwords** — generate one server-side instead. `SEC-2`
- [ ] **Restrict public self-registration to Student** — plus fix the fail-open course-listing bug. `SEC-1`
- [ ] **Align access-token lifetime with its cookie** — `JWT_EXPIRES_IN='15m'` to match reality. `SEC-3`

### Fix soon — this month, contained but touch more than one file

- [ ] **Decide the real RBAC model** — enforce `Role.permissions` for real, or formally commit to the hardcoded-role-list design and say so in the docs. `SEC-5`
- [ ] **Protect built-in roles & add an Admin/SuperAdmin tier** — `SEC-7, SEC-8`
- [ ] **Scope student exam-content access to enrollment** — `SEC-6`
- [ ] **Fix audit logging for unauthenticated auth events** — `SEC-9`
- [ ] **Add missing indexes; start converting status columns to enums** — `DB-3, DB-6`
- [ ] **Extract a shared DataTable primitive** — the permanent fix behind UX-1. `UX-2`
- [ ] **Wire up `aria-describedby` and label associations** — `UX-3, UX-5`
- [ ] **Roll out server-side pagination to the remaining 5 list screens** — copy the working DepartmentsList pattern. `PERF-2`

### Later — real improvements, no urgency

- [ ] **Add a client-side data cache** — React Query or SWR. `PERF-3`
- [ ] **Reconsider the routing architecture** — only if/when server rendering starts to matter. `PERF-1`
- [ ] **Add compression middleware** — `DB-12 / PERF-4`
- [ ] **Rebuild the mobile nav drawer on Radix Dialog** — `UX-4`
- [ ] **Consolidate status-badge colors into the token system** — `UX-6`
- [ ] **Add security headers to next.config.js** — `SEC-20`
- [ ] **Work through the remaining Medium/Low items** — at your own pace, none are urgent on their own.

---

## Methodology & scope

This was a manual, static source-code review of both repositories as they exist on disk — no server was started, no live requests were sent, and no penetration testing was performed. Findings are based on reading the actual application, middleware, schema, and route-registration code, cross-referenced against the project's own documentation (`PRODUCT.md`, `DESIGN.md`, and the `docs/` trees in both repos) to check whether the implementation matches its own stated intent.

Where a finding from one repo depended on behavior in the other — most notably CSRF handling and role-based route access — it was checked directly against the other repo's source rather than left as a guess, and the resolution is called out explicitly in the relevant section rather than silently dropped.

- Severity reflects concrete, traceable impact (a specific attack, a specific bug, a specific user-facing failure), not a generic checklist score.
- No dependency-vulnerability scan (e.g. `npm audit`) or automated security scanner was run as part of this review.
- No load testing or real-data-volume testing was performed — performance findings are based on reading query and rendering patterns, not measured benchmarks.

*Audit of OCMS-Backend & OCMS-Frontend · compiled 2026-08-04*
