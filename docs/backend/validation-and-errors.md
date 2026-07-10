# Validation & Errors

## Validation

Use Zod for request validation.

Rules:

- Validate body, params, and query separately.
- Validate pagination and filters on list endpoints.
- Return clear field-level errors where possible.
- Keep validation schemas reusable per resource.

## Error Handling

- Throw or forward errors to the shared error middleware.
- Do not return stack traces to clients.
- Use consistent response shape for API errors.
