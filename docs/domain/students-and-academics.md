# Students & Academics

## Core Records

- Students are linked to users and departments.
- Courses can belong to departments.
- Exam schedules belong to courses.
- Exam results belong to students and courses, with optional exam schedules.
- Course exams store question data in JSON.

## Rules

- Student list endpoints must paginate.
- Student search/filter must happen in the backend for API data.
- Score calculations should live in backend services, not frontend components.
- Academic status changes require confirmation and backend authorization.
