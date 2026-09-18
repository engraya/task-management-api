# 13. Testing

[Home](README.md) · [Setup](02-project-setup.md) · [Debugging](19-debugging-guide.md)

Tests ask different questions at different boundaries. A unit test can prove a business branch without PostgreSQL. An integration test proves the query works against actual tables. An HTTP test exercises routing/guards/serialization through a test application. None alone proves the entire production deployment.

## What exists

| File                                                                 | Level                        | What it proves                                                            |
| -------------------------------------------------------------------- | ---------------------------- | ------------------------------------------------------------------------- |
| [tasks.service.spec.ts](../src/tasks/tasks.service.spec.ts)          | Unit, 2 tests                | Assignment rejects nonmembers without update; permits members             |
| [projects.service.spec.ts](../src/projects/projects.service.spec.ts) | Database integration, 1 test | Creating a project creates OWNER membership                               |
| [app.e2e-spec.ts](../test/app.e2e-spec.ts)                           | HTTP, 2 tests                | Health is public; projects reject unauthenticated requests                |
| [tasks.e2e-spec.ts](../test/tasks.e2e-spec.ts)                       | HTTP flow, 6 tests           | Register/login, project/task create, valid/invalid status, comment create |

The eleven test cases do not establish complete endpoint/security coverage. Task HTTP cases share state in sequence, so early failure can cause follow-on failures. Authorization isolation, role restrictions, labels, pagination edge cases, error mappings, and token expiry need broader coverage.

## Configuration and isolated data

[vitest.config.ts](../vitest.config.ts) includes `**/*.spec.ts`; [vitest.config.e2e.ts](../vitest.config.e2e.ts) includes `**/*.e2e-spec.ts`. Both load [test/setup.ts](../test/setup.ts) and enable globals and tsconfig path resolution. The setup overwrites DATABASE_URL with TEST_DATABASE_URL or the dedicated localhost:5433 test database, and assigns test JWT settings. It does not load `.env.test` itself.

`npm test` therefore needs a migrated database because it includes the integration spec. A focused assignment-only test can run without PostgreSQL:

```sh
npm test -- src/tasks/tasks.service.spec.ts
```

For full suites, start and migrate the test database as described in [setup](02-project-setup.md). Test fixtures create records and cleanup removes only their tracked IDs/emails. They do not truncate all tables. Cleanup deletes projects before users to respect creator/comment-author foreign keys. Random UUID email suffixes in the HTTP flow avoid collisions; the user fixture's timestamp email is less robust under very close concurrent creation.

## Reading the assignment unit test

**Arrange:** `vi.resetAllMocks()` clears prior behavior. Test.createTestingModule registers TasksService and substitutes `{ provide: PrismaService, useValue: prismaMock }`. `findUnique` is configured to return a task in project p1; membership lookup returns null.

**Act:** call `service.assign('t1', { assigneeId: 'not-a-member' })`. These strings do not need valid UUIDs because this test invokes the service directly, bypassing HTTP DTO validation.

**Assert:** the Promise rejects with ForbiddenException, and task.update has not been called. The second assertion is crucial: merely returning an error would be insufficient if the service had already changed the assignment. The success case provides a membership and checks the exact update selector/data and returned assignee.

Mocks prove decisions and calls, not SQL validity, foreign keys, decorator wiring, or caller authorization. A mock is a substitute dependency; its functions also act as spies recording how they were called.

## Reading the project integration test

The test module uses real PrismaService, explicitly connects, creates a user fixture, calls ProjectsService.create, then queries membership by the compound key. The OWNER assertion validates that the nested write persisted its relationship. This protects against accidentally removing the nested membership create. It does not simulate a failing second write to prove rollback behavior experimentally.

The user fixture hashes its test password with cost 4 for speed; AuthService uses cost 10. The project fixture helper creates an OWNER membership too, although the shown integration test exercises the real service rather than using that project helper.

## Reading the HTTP flow

Supertest targets app.getHttpServer without requiring a separate listening server process. The app imports AppModule, so real JWT/membership guards and PostgreSQL participate. The flow registers a unique user, logs in, saves data.accessToken, creates a project/task, updates status, rejects an invalid enum, and adds a comment. Cleanup deletes the project and user and closes the app in a finally block.

Tests install a ValidationPipe with whitelist/transform and the response interceptor/prefix. They do not call main.ts and omit production forbidNonWhitelisted/implicit-conversion options, PrismaExceptionFilter, Helmet/CORS, and LoggingInterceptor. Consequently they cannot prove production-equivalent error responses or extra-field rejection. Sharing bootstrap configuration would reduce this drift.

## Commands and coverage

`test:watch` reruns on changes. `test:debug` starts Vitest with inspect-brk and disables file parallelism for debugger use. `test:cov` uses the installed V8 coverage provider with the normal test config; it does not automatically combine a separate e2e run. No repository coverage threshold is configured. `test/jest-e2e.json` is inactive legacy configuration; package scripts use Vitest.

## Useful next tests (not implemented)

Start with two-project cross-resource read/write denials, then MEMBER-versus-OWNER permissions, last-owner protection, unknown input properties using production bootstrap, duplicate/email/FK errors, pagination/filter combinations, and expired tokens. These tests would verify behavior rather than mirror internal lines mechanically.

## Common mistakes

- Running the full suite without a migrated test database.
- Pointing TEST_DATABASE_URL at development/production data.
- Assuming a mock test proves database constraints or guard execution.
- Reading coverage percentage as evidence that hostile cases are covered.

## What to remember

- The default suite mixes unit and integration tests.
- Dependency injection makes the Prisma substitute possible.
- Arrange/Act/Assert separates setup, action, and proof.
- HTTP tests currently differ from main.ts configuration.
- Missing negative authorization cases are the most consequential test gap.

## Check your understanding

1. Why do the assignment unit tests accept non-UUID strings?
2. Why assert update was never called after a forbidden assignment?
3. Which production behavior can pass unnoticed because the test pipe lacks forbidNonWhitelisted?
