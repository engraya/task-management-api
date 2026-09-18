# Task Management API: a codebase learning guide

This book explains the repository as it exists: a collaborative project and task API where registered users create projects, add members, assign work, attach labels, and discuss tasks. Each chapter connects engineering concepts to source files and distinguishes implemented behavior from improvements.

## Technology stack

| Area           | Technology found here                   | Purpose                            |
| -------------- | --------------------------------------- | ---------------------------------- |
| Runtime        | Node.js ^24.15.0; CI/image pin 24.20.0  | Execute JavaScript                 |
| Language       | TypeScript ^6.0.2, ESM, ES2023          | Static checking and compilation    |
| Framework      | NestJS 12 / Express                     | Routing and dependency injection   |
| Database       | PostgreSQL 17 in Compose/CI             | Relational persistence             |
| ORM            | Prisma 7.10 range, PostgreSQL adapter   | Typed queries and migrations       |
| Authentication | Passport JWT, Nest JWT, bcrypt          | Bearer tokens and password hashing |
| Validation     | class-validator, class-transformer, Joi | Requests and environment settings  |
| Security       | Helmet, Nest throttler, CORS            | Headers, limiting, browser policy  |
| Documentation  | Nest Swagger, OpenAPI, HTTPie           | API discovery and request examples |
| Testing        | Vitest, Nest testing, Supertest         | Unit, integration, HTTP tests      |
| Tooling        | Oxlint, Prettier, Nest CLI, tsx         | Quality, build, seed execution     |
| Delivery       | Docker, Compose, GitHub Actions, GHCR   | Containers, CI, image publishing   |

Versions above are package declarations/configuration, not claims about latest releases. [package-lock.json](../package-lock.json) controls locked installation.

## Architecture summary

A feature-organized, layered NestJS monolith runs in one process. Controllers translate HTTP input, services implement operations, and shared PrismaService accesses PostgreSQL. Authentication is global; project membership is a route guard. There is no separate repository abstraction over Prisma.

> **Important:** Stored roles are not enforced as owner-only permissions. Several nested resource operations lack parent-resource checks. Read [authorization](09-authorization-and-security.md) before treating this as a production access-control example.

## Documentation map

1. [Project overview and boundaries](01-project-overview.md)
2. [Setup and command behavior](02-project-setup.md)
3. [Folder structure and dependencies](03-folder-structure-and-dependencies.md)
4. [Architecture, language, and design patterns](04-architecture-and-concepts.md)
5. [Application bootstrap](05-application-bootstrap.md)
6. [Configuration and environments](06-configuration-and-environment.md)
7. [Database and data modeling](07-database-and-data-modeling.md)
8. [Authentication](08-authentication.md)
9. [Authorization and security](09-authorization-and-security.md)
10. [Validation, responses, and errors](10-validation-responses-and-errors.md)
11. [API design and all endpoints](11-api-design.md)
12. [Request lifecycle and data-flow walkthroughs](12-request-lifecycle-and-data-flows.md)
13. [Testing](13-testing.md)
14. [Logging, performance, and integration boundaries](14-observability-performance-and-integrations.md)
15. [Docker and containers](15-docker-and-containers.md)
16. [CI, publishing, and deployment](16-ci-cd-and-deployment.md)
17. [Production readiness](17-production-readiness.md)
18. [Development workflows and rebuilding the project](18-development-workflows.md)
19. [Debugging guide](19-debugging-guide.md)
20. [Improvements and technical debt](improvements-and-technical-debt.md)
21. [Learning roadmap](learning-roadmap.md)
22. [Glossary](glossary.md)
23. [Quick reference](reference.md)
24. [API export import/regeneration instructions](api-exports.md)
25. [Feature: current-user profiles](features/users.md)
26. [Feature: projects and membership](features/projects.md)
27. [Feature: tasks](features/tasks.md)
28. [Feature: labels](features/labels.md)
29. [Feature: comments](features/comments.md)

Authentication has its own chapter. Existing [OpenAPI JSON](openapi.json) and [HTTPie collections](httpie-collections.json) are preserved. The former homepage is preserved in the API export chapter.

## Recommended reading order

**First pass:** overview → setup → folders → architecture → bootstrap → configuration → database → request walkthroughs → features.

**Second pass:** authentication → authorization → validation/errors → API → testing → Docker → CI/deployment → production readiness.

**Practice:** use the learning roadmap, implement exercises on a separate branch, and consult the debugging guide and reference. Exercises are suggestions, not features added by this documentation task.

## Evidence and scope

Prepared from source, DTOs, schema and initial SQL migration, tests, scripts, dependency/configuration files, Docker, workflows, and existing docs. Source is authoritative where older prose differs. Historical motivations are labeled as likely reasons. No running production environment is evidenced here. Private environment values are omitted. This task changes documentation only.
