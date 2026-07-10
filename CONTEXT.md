# OCMS Domain Glossary

Canonical language for the Online Campus Management System.

## Core Terms

- **User** - Login account with a role and status.
- **Role** - Named permission bundle assigned to users.
- **Permission** - Capability stored in role permissions JSON and enforced by backend auth/RBAC logic.
- **Department** - Academic or administrative grouping for students and courses.
- **Student** - Learner record linked to a user and department.
- **Teacher** - Academic staff member. Frontend screens exist; backend model/API coverage should be verified before using as source of truth.
- **Course** - Academic course linked to departments and exams.
- **Exam Schedule** - Scheduled exam event for a course.
- **Exam Result** - Student score record for a course and optional exam schedule.
- **Course Exam** - Exam definition with questions JSON.
- **Attendance** - Attendance-taking and reporting domain. Frontend screens exist; backend coverage should be verified.
- **Invoice / Payment** - Finance domain for billing and payment tracking. Frontend screens exist; backend coverage should be verified.

## Naming Rules

- Use backend model names when documenting persistence.
- Use UI module names when documenting screens.
- Mark frontend-only/mock-data areas clearly until backend APIs exist.
