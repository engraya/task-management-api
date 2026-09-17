# Task Management API

A REST API for collaborative project and task management, built with NestJS 12, TypeScript, Prisma 7, and PostgreSQL. Users can create projects, manage membership, assign tasks, organize work with labels, and discuss tasks through comments.

## Features

- User registration, login with JWT access tokens, and profile updates.
- Projects with `OWNER` and `MEMBER` membership roles.
- Tasks with priorities, due dates, assignees, and status updates.
- Search and filtering by status, priority, assignee, and label.
- Project labels and paginated task comments.
- Global authentication, request validation, rate limiting, Helmet headers, and configurable CORS.
- Swagger documentation, request logging, and a public health endpoint.
- PostgreSQL migrations, an isolated test database, Docker, and GitHub Actions workflows.

## Requirements

- Node.js 24.15 or later within the 24.x release line. CI and Docker use 24.20.0.
- npm and PostgreSQL 17, or Docker Compose for the included database services.

## Local setup

### 1. Install dependencies

```sh
npm ci
```

### 2. Configure the environment

Copy [.env.example](.env.example) to `.env`:

```sh
# macOS / Linux
cp .env.example .env
```

```powershell
# PowerShell
Copy-Item .env.example .env
```

| Variable            | Purpose                          | Default / requirement                                                |
| ------------------- | -------------------------------- | -------------------------------------------------------------------- |
| `NODE_ENV`          | Runtime environment              | `development`, `test`, or `production`; defaults to `development`.   |
| `PORT`              | HTTP port                        | `3000`.                                                              |
| `DATABASE_URL`      | PostgreSQL connection URL        | Required. The example targets `task_management` on `localhost:5432`. |
| `JWT_SECRET`        | Access-token signing secret      | Required, at least 16 characters. Replace the example value.         |
| `JWT_EXPIRES_IN`    | Access-token lifetime            | `15m`.                                                               |
| `CORS_ORIGIN`       | Allowed frontend origin          | `http://localhost:3000`.                                             |
| `TEST_DATABASE_URL` | Dedicated database used by tests | Defaults to `task_management_test` on `localhost:5433`; see Testing. |

Generate a signing secret with:

```sh
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

### 3. Start PostgreSQL and apply migrations

```sh
docker compose up -d postgres
npm run prisma:generate
npm run prisma:migrate:deploy
```

The bundled development database uses database `task_management`, username `postgres`, and password `postgres`, matching `.env.example`. If using your own database, update `DATABASE_URL` accordingly.

### 4. Start the API

```sh
npm run start:dev
```

| Resource   | Default URL                           |
| ---------- | ------------------------------------- |
| API base   | `http://localhost:3000/api/v1`        |
| Swagger UI | `http://localhost:3000/api/docs`      |
| Health     | `http://localhost:3000/api/v1/health` |

The health endpoint returns application status and a timestamp. It does not execute a database health query.

## Authentication and first project

Register through `POST /api/v1/auth/register`:

```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "example-password-123"
}
```

Names require at least two characters; passwords require at least eight. Registration and login both return an access token and the user inside the global `data` response wrapper:

```json
{
  "data": {
    "accessToken": "<jwt>",
    "user": {
      "id": "<user-uuid>",
      "email": "jane@example.com",
      "name": "Jane Doe"
    }
  }
}
```

For subsequent logins, send `email` and `password` to `POST /api/v1/auth/login`. Protected requests require `Authorization: Bearer <jwt>`. In Swagger, select **Authorize** and enter the token. When it expires, log in again; refresh-token and logout endpoints are not implemented.

Create a project through `POST /api/v1/projects`:

```json
{
  "name": "Website Relaunch",
  "description": "Rebuild the marketing site"
}
```

The creator becomes an `OWNER` member. Use the returned `data.id` in `POST /api/v1/projects/<projectId>/tasks`:

```json
{
  "title": "Write onboarding documentation",
  "description": "Document the registration flow",
  "priority": "HIGH",
  "dueDate": "2026-12-01T12:00:00.000Z"
}
```

Optionally supply `assigneeId` with a project member's UUID. Task titles require at least three characters. Update status with `PATCH /projects/<projectId>/tasks/<taskId>/status` and a body such as `{ "status": "IN_PROGRESS" }`.

## API routes

All paths below are relative to `/api/v1`. Registration, login, and health are public; other routes require authentication. Project resource routes use a membership guard.

| Resource        | Endpoints                                                                                                                                                                                              |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Authentication  | `POST /auth/register`, `POST /auth/login`                                                                                                                                                              |
| Current user    | `GET /users/me`, `PATCH /users/me`                                                                                                                                                                     |
| Projects        | `POST /projects`, `GET /projects`, `GET /projects/:id`, `PATCH /projects/:id`, `DELETE /projects/:id`                                                                                                  |
| Membership      | `POST /projects/:id/members`, `DELETE /projects/:id/members/:userId`                                                                                                                                   |
| Tasks           | `POST /projects/:projectId/tasks`, `GET /projects/:projectId/tasks`, `GET /projects/:projectId/tasks/:taskId`, `PATCH /projects/:projectId/tasks/:taskId`, `DELETE /projects/:projectId/tasks/:taskId` |
| Task status     | `PATCH /projects/:projectId/tasks/:taskId/status`                                                                                                                                                      |
| Task assignment | `PATCH /projects/:projectId/tasks/:taskId/assign`                                                                                                                                                      |
| Labels          | `POST /projects/:projectId/labels`, `GET /projects/:projectId/labels`, `PATCH /projects/:projectId/labels/:labelId`, `DELETE /projects/:projectId/labels/:labelId`                                     |
| Task labels     | `POST /projects/:projectId/tasks/:taskId/labels`, `DELETE /projects/:projectId/tasks/:taskId/labels/:labelId`                                                                                          |
| Comments        | `POST /projects/:projectId/tasks/:taskId/comments`, `GET /projects/:projectId/tasks/:taskId/comments`, `DELETE /projects/:projectId/tasks/:taskId/comments/:commentId`                                 |
| Health          | `GET /health`                                                                                                                                                                                          |

`GET /projects` lists the authenticated user's projects. Membership roles are stored, but the current project guard checks membership only: project updates, deletion, and membership management are not restricted to owners.

Use the DTOs in [src](src) and Swagger for payload details. Unknown request fields are rejected. The global request limit is 100 requests per 60 seconds per tracker using the default throttler behavior.

### Filtering and pagination

Task status values are `TODO`, `IN_PROGRESS`, `IN_REVIEW`, and `DONE`. Priority values are `LOW`, `MEDIUM`, `HIGH`, and `URGENT`.

Task lists accept `search`, `status`, `priority`, `assigneeId`, `labelId`, `page`, and `limit`. Search matches title and description without case sensitivity. Results are ordered by creation time, newest first.

```http
GET /api/v1/projects/<projectId>/tasks?status=TODO&priority=HIGH&page=1&limit=20
Authorization: Bearer <jwt>
```

Task and comment pagination defaults to page `1`, limit `20`, with a maximum limit of `100`. Their HTTP responses use this shape:

```json
{
  "data": {
    "items": [],
    "meta": {
      "page": 1,
      "limit": 20,
      "total": 0,
      "totalPages": 0
    }
  }
}
```

## Testing

Tests use [test/setup.ts](test/setup.ts) to select `TEST_DATABASE_URL`, falling back to a dedicated local database on port `5433`. They override the application's `DATABASE_URL` and set test JWT values.

```sh
npm run test:db:start
npm run test:db:migrate
npm run typecheck
npm run lint
npm test
npm run test:e2e
npm run test:cov
npm run test:db:stop
```

`npm test` includes database-backed integration tests, so prepare the database before running it. To use another dedicated test database, set `TEST_DATABASE_URL` and apply migrations to that database first. `test:db:migrate` always targets the default local test database; it does not read `TEST_DATABASE_URL`.

## Docker

```sh
docker compose up --build -d
```

The Compose API service waits for PostgreSQL, then runs its configured migration command before starting the compiled application. API port `3000` and database port `5432` are published; application database data persists in the `postgres_data` volume.

The API environment in [docker-compose.yml](docker-compose.yml) is hard-coded, including the sample JWT secret and database credentials. Editing `.env` alone does not change those container values; update the Compose environment for your deployment.

```sh
docker compose ps
docker compose logs --tail=100 api
docker compose down
```

`docker compose down` preserves the named database volume. The standalone Docker image starts the app without running migrations; migration execution is configured separately in Compose.

## Development commands

| Command                         | Purpose                                   |
| ------------------------------- | ----------------------------------------- |
| `npm run start:dev`             | Development server with file watching.    |
| `npm run start:debug`           | Development server with debugging.        |
| `npm run build`                 | Compile the application into `dist/`.     |
| `npm run start:prod`            | Run compiled output; build first.         |
| `npm run typecheck`             | Check TypeScript without emitting files.  |
| `npm run lint`                  | Run type-aware Oxlint.                    |
| `npm run format`                | Format source and test TypeScript.        |
| `npm run test:watch`            | Watch tests with Vitest.                  |
| `npm run prisma:generate`       | Generate Prisma Client.                   |
| `npm run prisma:validate`       | Validate the Prisma schema.               |
| `npm run prisma:format`         | Format the Prisma schema.                 |
| `npm run prisma:migrate`        | Create/apply development migrations.      |
| `npm run prisma:migrate:deploy` | Apply committed migrations.               |
| `npm run prisma:migrate:status` | Inspect migration status.                 |
| `npm run prisma:studio`         | Browse database records in Prisma Studio. |
| `npm run prisma:migrate:reset`  | Reset the database, deleting its data.    |

A sample [seed script](prisma/seed.ts) exists, but `prisma.config.ts` does not currently configure `migrations.seed`. The legacy package seed entry also references `ts-node`, which is not declared as a dependency. Seeding therefore needs configuration before using `npm run prisma:seed`; normal setup and tests do not require it. Register your own account through the API to get started.

## Project structure

```text
src/
  auth/       Registration, login, JWT strategy, and global auth guard
  users/      Current-user profile
  projects/   Project CRUD, membership, and membership guard
  tasks/      Task CRUD, assignment, status, labels, and filtering
  labels/     Project labels
  comments/   Task comments
  common/     Validation DTOs, filters, interceptors, and logging
  config/     Environment validation
  prisma/     Database client lifecycle
  main.ts     HTTP setup and Swagger
prisma/
  schema.prisma
  migrations/
  seed.ts
test/         Test setup, fixtures, and end-to-end tests
```

## CI and container publishing

[CI](.github/workflows/ci.yml) runs on pushes and pull requests to `main` and `develop`. It installs dependencies, generates Prisma Client, applies migrations to PostgreSQL 17, runs lint and both test suites, compiles the application, builds the Docker image, and verifies that the production container can run migrations and serve its health endpoint.

[CD](.github/workflows/cd.yml) runs on pushes to `main` and publishes images to `ghcr.io/engraya/task-management-api` with SHA and `latest` tags. It runs independently of CI and does not deploy to a running server.

## Troubleshooting

| Symptom                                           | Check                                                                                                                   |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Startup environment validation fails              | Set `DATABASE_URL` and a JWT secret of at least 16 characters.                                                          |
| Prisma cannot connect                             | Check PostgreSQL, credentials, and the port. Use `localhost` for host-run processes and `postgres` for the Compose API. |
| Missing database tables                           | Run `npm run prisma:migrate:deploy` against the application's database.                                                 |
| Tests cannot connect                              | Start and migrate the dedicated test database on port `5433`, or configure `TEST_DATABASE_URL`.                         |
| Protected request returns `401`                   | Use `data.accessToken` from login or registration as the bearer token.                                                  |
| Project request returns `403`                     | Confirm that the user belongs to the project.                                                                           |
| Task assignment or label attachment returns `403` | Assignees must be project members; attached labels must belong to the task's project.                                   |
| Request returns `429`                             | Wait for the rate-limit window to reset.                                                                                |

## License

This package is private and marked `UNLICENSED` in [package.json](package.json).
