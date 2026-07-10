# Product

## Name

OCMS - Online Campus Management System

## Users

- Campus administrators managing users, roles, departments, and settings.
- Academic staff managing students, courses, exams, attendance, and results.
- Finance staff managing invoices and payments.
- Students viewing academic and account information.

## Product Purpose

OCMS centralizes campus operations into a web application with secure access, academic records, exams, attendance, payments, and reporting surfaces.

## Principles

1. **Operational clarity:** Admin users should quickly find the right record and action.
2. **Performance first:** Tables must paginate and filter at the API/database level.
3. **Role-safe workflows:** Frontend visibility is not authorization; backend RBAC is the source of truth.
4. **Reusable UI:** Tables, filters, forms, dialogs, status badges, and action menus are shared systems.
5. **No hidden destructive actions:** Deletion and status changes require confirmation dialogs.
