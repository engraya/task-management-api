# Feature: current-user profiles

[Home](../README.md) · [Authentication](../08-authentication.md) · [Database](../07-database-and-data-modeling.md)

## Purpose and files

This feature lets an authenticated user view their account summary and change their display name. [UsersModule](../../src/users/users.module.ts) registers [UsersController](../../src/users/users.controller.ts) and [UsersService](../../src/users/users.service.ts), exporting the service. Persistence is the User model; authentication owns creation and credential verification.

## HTTP and business behavior

| Route (under /api/v1) | Controller/service | Result inside data         |
| --------------------- | ------------------ | -------------------------- |
| GET /users/me         | getMe → findById   | id, email, name, createdAt |
| PATCH /users/me       | updateMe → update  | id, email, name, updatedAt |

Both use global JWT authentication. CurrentUser reads request.user, and the service uses its id. The client cannot choose another account through a path/body ID. UpdateUserDto allows only optional name with minimum two characters; email and password changes are not implemented here.

## Request walkthrough

Send PATCH `/api/v1/users/me` with a bearer token and `{ "name": "Ada Learner" }`. JwtStrategy produces the identity; ValidationPipe checks UpdateUserDto; updateMe passes that identity's ID and DTO to UsersService.update; Prisma updates the User row and selects safe fields; TransformInterceptor wraps the result. The database mutation is the only side effect. A missing update target becomes P2025/404; findById explicitly throws NotFoundException when absent.

The explicit select prevents passwordHash from being fetched into the response projection. Without it, returning a full User record could expose credential verifiers. The global wrapper would not fix that exposure.

## Common mistakes

- Adding email/password to this DTO without designing uniqueness and credential workflows.
- Trusting a caller-supplied userId instead of CurrentUser for self-service routes.
- Assuming a token guarantees the user row still exists; JwtStrategy performs no database lookup.

## What to remember

- This feature handles self-profile only, not a user directory.
- User creation belongs to AuthService.
- Identity comes from the token-derived request context.
- Read and update intentionally return different timestamp fields.
- Explicit projections protect sensitive data.

## Check your understanding

1. Why is there no userId field in UpdateUserDto?
2. What happens when a valid token refers to a removed user?
