# Learning roadmap

[Home](README.md) · [Reconstruction workflow](18-development-workflows.md) · [Glossary](glossary.md)

Use this as a course through the repository. Read, predict runtime behavior, inspect the cited source, then test your prediction in a disposable environment. Exercises are proposed practice; they are not implemented changes. Do not practice destructive operations against valuable data.

## Level 1: HTTP and a running application

Read [overview](01-project-overview.md), [setup](02-project-setup.md), and [API](11-api-design.md). Inspect [HealthController](../src/app.controller.ts) and [UsersController](../src/users/users.controller.ts). Learn HTTP methods, paths, headers, status codes, JSON, and the data envelope.

**Exercise:** start locally, request health, register, retrieve your profile, and explain why an unauthenticated profile request fails. Predict the difference between registration's 201 and login's 200 before sending them.

**Milestone:** explain how a client selects an endpoint and obtains data without discussing database internals yet.

## Level 2: language and backend structure

Read [folders/dependencies](03-folder-structure-and-dependencies.md), [architecture](04-architecture-and-concepts.md), [bootstrap](05-application-bootstrap.md), and [configuration](06-configuration-and-environment.md). Inspect AppModule, PrismaModule, AuthModule, and main.ts. Learn classes, constructor properties, ESM, async/await, dependency injection, decorator metadata, guards, pipes, and interceptors.

**Exercise:** draw which object supplies TasksService's Prisma dependency. Explain what exists after TypeScript compilation and what is erased. Trace where PORT and JWT_SECRET enter execution without exposing their values.

**Milestone:** distinguish JavaScript behavior, TypeScript checking, Nest orchestration, and third-party library work.

## Level 3: relational modeling and features

Read [database](07-database-and-data-modeling.md), [projects](features/projects.md), [tasks](features/tasks.md), [labels](features/labels.md), [comments](features/comments.md), and [profiles](features/users.md). Inspect schema.prisma, the SQL migration, and service query objects. Learn primary/foreign keys, join models, indexes, uniqueness, nested writes, transactions, projections, and pagination.

**Exercise:** create two projects, two labels with the same name in different projects, a task, and a comment. Predict which deletes cascade. Compare TaskLabel to ProjectMember and explain why only one has a role. Repeat seed only in a disposable database and explain duplicate task creation from the code.

**Milestone:** sketch all seven models and translate three Prisma operations into conceptual SQL.

## Level 4: identity, permission, and input boundaries

Read [authentication](08-authentication.md), [authorization](09-authorization-and-security.md), [validation/errors](10-validation-responses-and-errors.md), and [flows](12-request-lifecycle-and-data-flows.md). Inspect AuthService, JwtStrategy, ProjectMemberGuard, DTOs, and PrismaExceptionFilter.

**Exercise:** on your own local data, design tests for a caller using a valid project they belong to with another project's resource ID. Explain the missing relationship check before proposing a fix. Compare invalid UUID, missing row, and unauthorized row outcomes. Never direct these experiments at data or systems you do not control.

**Milestone:** explain why a signed token, a valid DTO, and a foreign key together still do not guarantee resource authorization.

## Level 5: verification and diagnostics

Read [testing](13-testing.md), [observability/performance](14-observability-performance-and-integrations.md), and [debugging](19-debugging-guide.md). Inspect the assignment unit test, project integration test, HTTP test bootstrap, middleware, and interceptors.

**Exercise:** identify Arrange/Act/Assert in each test type. Add a negative authorization test on a learning branch before changing behavior. Explain which failures the success-only interceptor misses. Compare test and production ValidationPipe options.

**Milestone:** choose the smallest meaningful test boundary for a change and diagnose the first failing stage rather than patching symptoms.

## Level 6: containers, releases, and operations

Read [Docker](15-docker-and-containers.md), [CI/deployment](16-ci-cd-and-deployment.md), [production readiness](17-production-readiness.md), and [technical debt](improvements-and-technical-debt.md). Inspect Dockerfile, Compose, and both workflows.

**Exercise:** explain host versus service networking, follow image build layers, and draw CI/CD triggers. Propose a CI-gated publishing flow and distinguish application rollback from restoring data. Sketch a readiness/backup plan for a hypothetical host, labeling it as new architecture.

**Milestone:** describe exactly what this repository can validate/publish today and what a production operator still must supply.

## Final capstone: rebuild with understanding

Follow the [reconstruction sequence](18-development-workflows.md) in a separate project/branch. Implement identity, project scoping, owner policy, tasks, labels, and comments with their tests. Add migrations, shared HTTP configuration, container packaging, and gated artifact publication. Compare choices with this repository and explain benefits/tradeoffs rather than copying files blindly.

You are ready to explain the codebase when you can trace registration, project creation, assignment, filtered lists, comment deletion, startup, shutdown, and image publication without opening source—and identify where the present implementation's guarantees stop.
