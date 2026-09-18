# 19. Debugging guide

[Home](README.md) · [Configuration](06-configuration-and-environment.md) · [Testing](13-testing.md)

Debug by locating the first failed boundary: process/configuration, dependency connection, routing, guard, validation, service, database, or response handling. A status code is a clue, not the whole explanation. Use development data for investigations.

## Startup and database failures

| Symptom                                | Reasoning and checks                                                                                                             |
| -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Node engine/install failure            | Compare node --version with package.json; use npm ci with matching manifest/lockfile                                             |
| Joi validation error                   | Check required variable names and JWT secret length without printing secret values; determine which environment loader is active |
| DATABASE_URL is required               | PrismaService and Prisma CLI have their own reads; ensure URL is available in the process actually running                       |
| Connection refused                     | Confirm database service is healthy and host/port match the caller's network context                                             |
| Authentication/database does not exist | Check DB user/database provisioning against the URL; a listening port does not prove credentials are correct                     |
| Missing table/column                   | Inspect migrate status against the same URL; client generation alone does not apply SQL                                          |
| Generated client/type mismatch         | Regenerate after schema changes, rebuild, and check that database migrations match                                               |
| Port already in use                    | Identify the existing process/container using the configured PORT; stop the intended old instance or choose another port         |

Useful non-destructive checks:

```powershell
node --version
docker compose ps
docker compose logs --tail=100 postgres
npm run prisma:migrate:status
```

For migration failure, inspect the first SQL/database error and target schema. Do not repeatedly reset a valuable database or edit migration history to hide the symptom. A failed production migration may need deliberate recovery outside this guide's implemented automation.

## HTTP failures

**401:** verify the request sends `Authorization: Bearer <token>` using data.accessToken, not the whole auth response. Check expiry and whether the issuing/verifying processes share JWT_SECRET. Login can also return 401 for wrong credentials; the common message intentionally avoids distinguishing a missing user.

**403:** identify the guard/service. ProjectMemberGuard checks the token's user against the URL project; task assignment checks the assignee against the actual task project; label attachment checks label/project compatibility. Being OWNER in one project grants no membership in another. The present child-scoping bug also means some unauthorized combinations incorrectly succeed; success is not proof of correct access control.

**400:** inspect the response's validation messages and the corresponding DTO. Check uppercase enum values, actual UUIDs, page/limit bounds, date strings, and unknown fields. Do not submit assigneeId to generic task PATCH. Guards run before pipes, so some malformed project paths may yield 403 first.

**404:** verify the route prefix and actual method, then distinguish routing failure from service/P2025 missing-record handling. There is no GET label-by-ID route or comment edit route. The fixed seed project identifier can fail UUID parsing; use an API-created project for route experiments.

**409:** inspect unique business keys: email, label name within project, or another constrained pair. Registration's pre-check does not eliminate races; database uniqueness remains authoritative.

**429:** the throttler rejected the request. Wait for its window and check whether probes or many clients behind the same tracker are consuming limits. Public routes are not exempt just because they skip JWT.

**500:** check database connectivity, missing referenced rows, and unsupported Prisma error mappings. The Prisma filter deliberately returns generic messages for known codes other than P2002/P2025, including foreign-key failures. Local logs may not contain structured detail because the filter does not log it; use a debugger in development rather than exposing raw database errors to clients.

## Response surprises

The API wraps success in data; reading `response.id` instead of `response.data.id` produces client bugs. Paginated results are data.items, not data itself. Delete returns a record with 200. Task detail contains only five recent comments. Optional null values and implicit conversion do not behave like strict raw JSON validation; inspect the pipe and service conversion together.

CORS failures are browser-specific. Compare the page origin with CORS_ORIGIN; a successful command-line request does not prove browser permission. Conversely, CORS success does not establish JWT authorization.

## Tests and containers

When tests cannot connect, check TEST_DATABASE_URL and the test database (default port 5433). `test:db:migrate` ignores custom TEST_DATABASE_URL; migrate that custom database explicitly. An early task e2e failure may leave token/projectId unset and cause later assertions to fail. Start with the first failing case. The task unit spec can run independently to separate service logic from environment failure.

For a container that exits, read `docker compose logs --tail=100 api`: startup runs migrations before Node, so the server may never have started. Check literal Compose environment entries, PostgreSQL health, image generation, and the first migration error. The health check assumes port 3000; changing PORT requires aligning checks/port mappings. `docker compose down` preserves named DB data and therefore does not reset existing database credentials/schema initialization.

If CI differs from local results, compare Node versions, locked dependencies, clean build/client generation, Linux path case sensitivity, and database ports. CI's host test database uses 5432; local default tests use 5433. CI also builds/runs the production dependency image, which can catch packaging errors absent from host tests.

## Debugger workflow

Use `npm run start:debug`, attach a Node debugger to the reported inspector endpoint, and set breakpoints in the relevant guard, controller, and service. Inspect IDs/predicates and execution order; avoid dumping credentials. For tests, test:debug pauses Vitest and disables file parallelism. Source maps are enabled by tsconfig to connect generated execution to TypeScript source.

## What to remember

- Find the first failed boundary, not just the last visible error.
- Environment selection and network context explain many connection issues.
- Guard order affects expected error codes.
- Source tests and production image startup exercise different things.
- Destructive reset is not a general debugging tool.

## Check your understanding

1. Why might a missing foreign-key target produce 500?
2. Why can host tests pass while container startup fails?
3. Why does changing .env sometimes have no effect on Compose?
