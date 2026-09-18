# Quick reference

[Home](README.md) · [Detailed setup](02-project-setup.md) · [All 28 endpoints](11-api-design.md)

## Locations and entry points

| Item                      | Location                                                             |
| ------------------------- | -------------------------------------------------------------------- |
| HTTP bootstrap            | [src/main.ts](../src/main.ts)                                        |
| Root module/global guards | [src/app.module.ts](../src/app.module.ts)                            |
| Environment validation    | [src/config/env.validation.ts](../src/config/env.validation.ts)      |
| Prisma lifecycle          | [src/prisma/prisma.service.ts](../src/prisma/prisma.service.ts)      |
| Models                    | [prisma/schema.prisma](../prisma/schema.prisma)                      |
| CLI/seed configuration    | [prisma.config.ts](../prisma.config.ts)                              |
| Test environment          | [test/setup.ts](../test/setup.ts)                                    |
| Exporter                  | [scripts/export-api.mjs](../scripts/export-api.mjs)                  |
| Containers                | [Dockerfile](../Dockerfile), [Compose](../docker-compose.yml)        |
| Workflows                 | [CI](../.github/workflows/ci.yml), [CD](../.github/workflows/cd.yml) |

Modules: Auth, Users, Projects, Tasks, Labels, Comments, shared Prisma. Models: User, Project, ProjectMember, Label, Task, TaskLabel, Comment.

## Commands

All npm scripts below are declared in [package.json](../package.json).

| Command                                      | Purpose                                                   |
| -------------------------------------------- | --------------------------------------------------------- |
| npm ci                                       | Locked installation                                       |
| npm start                                    | Nest compile/start                                        |
| npm run start:dev                            | Watch/restart                                             |
| npm run start:debug                          | Debugger/watch                                            |
| npm run build                                | Compile app                                               |
| npm run start:prod                           | Run compiled app; no migration in this host script        |
| npm run typecheck                            | Non-emitting TypeScript check                             |
| npm run lint                                 | Type-aware source/test lint                               |
| npm run format                               | Rewrite source/test formatting                            |
| npm run prisma:generate                      | Generate query client                                     |
| npm run prisma:format                        | Format schema                                             |
| npm run prisma:validate                      | Validate schema                                           |
| npm run prisma:studio                        | Browse records                                            |
| npm run prisma:migrate -- --name change_name | Create/apply development migration                        |
| npm run prisma:migrate:deploy                | Apply committed migrations                                |
| npm run prisma:migrate:status                | Inspect migration state                                   |
| npm run prisma:migrate:reset                 | Destructive development DB reset                          |
| npm run prisma:db:push                       | Sync schema without migration history                     |
| npm run prisma:db:pull                       | Introspect database into schema; review resulting changes |
| npm run prisma:seed                          | Optional development seed via tsx                         |
| npm run test:db:start                        | Start/wait for test-profile database                      |
| npm run test:db:migrate                      | Migrate fixed local test database                         |
| npm run test:db:stop                         | Stop test DB                                              |
| npm test                                     | Unit plus database integration suite                      |
| npm run test:e2e                             | HTTP suite                                                |
| npm run test:watch                           | Vitest watch                                              |
| npm run test:debug                           | Vitest debugger, no file parallelism                      |
| npm run test:cov                             | Default-suite V8 coverage                                 |
| npm run docs:export                          | Build and regenerate API JSON                             |
| npm run deploy                               | Declared nest deploy command; no target documented        |
| docker compose up -d postgres                | Development DB only                                       |
| docker compose up --build -d                 | API and development DB                                    |
| docker compose ps                            | Service health/status                                     |
| docker compose logs --tail=100 api           | API/migration logs                                        |
| docker compose down                          | Remove stack containers/network; preserve named volume    |

## Runtime reference

| Setting              | Value/meaning                                                             |
| -------------------- | ------------------------------------------------------------------------- |
| Node                 | ^24.15.0; Docker/CI pin 24.20.0                                           |
| API default          | http://localhost:3000/api/v1                                              |
| Swagger              | /api/docs and /api/docs-json                                              |
| Auth header          | Authorization: Bearer <access-token>                                      |
| Token response       | data.accessToken                                                          |
| Pagination           | page 1, limit 20, maximum 100                                             |
| Status               | TODO, IN_PROGRESS, IN_REVIEW, DONE                                        |
| Priority             | LOW, MEDIUM, HIGH, URGENT                                                 |
| Roles                | OWNER, MEMBER; owner-only policy not enforced                             |
| Throttle             | 100 requests / 60000 ms per default handler/IP key, process-local storage |
| Test DB host default | localhost:5433, dedicated task_management_test                            |

Environment variables: NODE_ENV, PORT, DATABASE_URL, JWT_SECRET, JWT_EXPIRES_IN, CORS_ORIGIN; TEST_DATABASE_URL for test setup. See [full configuration table](06-configuration-and-environment.md) for defaults and loading rules. Never paste live credentials into this reference.

## Fast navigation by symptom

- Setup/connection: [debugging](19-debugging-guide.md).
- 401/token lifecycle: [authentication](08-authentication.md).
- 403 or unexpected cross-project success: [authorization](09-authorization-and-security.md).
- 400/null/unknown fields: [validation](10-validation-responses-and-errors.md).
- Container startup: [Docker](15-docker-and-containers.md).
- Published image versus live deployment: [CI/CD](16-ci-cd-and-deployment.md).
