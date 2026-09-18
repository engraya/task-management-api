# 3. Folder structure and dependencies

[Home](README.md) · [Architecture](04-architecture-and-concepts.md)

## Source map

```text
src/
  main.ts                  HTTP bootstrap
  app.module.ts            module composition/global guards
  app.controller.ts        HealthController
  auth/                    login/register, JWT, decorators, DTOs
  users/                   current-user profile
  projects/                projects, membership, guard
  tasks/                   tasks, status, assignment, label links
  labels/                  project label definitions
  comments/                task discussion
  common/dto/              pagination
  common/filters/          Prisma error mapping
  common/interceptors/     logs and success wrapper
  common/middleware/       incoming request logging
  config/                  environment validation and Swagger
  prisma/                  injectable client lifecycle
prisma/
  schema.prisma
  migrations/
  seed.ts
test/
  fixtures/
  setup.ts
  *.e2e-spec.ts
scripts/export-api.mjs
.github/workflows/
docs/
```

Features generally contain a module, controller, service, and DTOs. Auth adds strategies/guards/decorators. Projects exports its guard to tasks, labels, and comments. Service specs live beside services; HTTP tests and fixtures live in test.

The root prisma directory describes/evolves the database. src/prisma integrates its client with Nest. dist and node_modules are generated/installed outputs. Assistant-tool directories are development aids, not registered runtime services; they do not establish a Prisma Platform or Composer deployment.

## Dependency responsibilities

| Area             | Direct dependencies                                           | Evidence and purpose                            |
| ---------------- | ------------------------------------------------------------- | ----------------------------------------------- |
| Framework        | @nestjs/common, core, platform-express                        | Decorators, DI, Express bootstrap               |
| Configuration    | @nestjs/config, joi, dotenv                                   | AppModule settings; Prisma CLI/seed environment |
| Database         | @prisma/client, @prisma/adapter-pg, prisma                    | Queries, transport, CLI/migrations              |
| Identity         | @nestjs/jwt, @nestjs/passport, passport, passport-jwt, bcrypt | AuthService and JwtStrategy                     |
| Input            | class-validator, class-transformer                            | DTO validation/conversion                       |
| Security         | helmet, @nestjs/throttler                                     | Bootstrap headers/global throttling             |
| Documentation    | @nestjs/swagger                                               | Metadata, Swagger UI, mapped DTO classes        |
| Metadata/streams | reflect-metadata, rxjs                                        | Decorator metadata and interceptor Observables  |
| Testing          | vitest, @vitest/coverage-v8, @nestjs/testing, supertest       | Runner, coverage, test modules, HTTP assertions |
| Build            | typescript, @nestjs/cli, @nestjs/schematics, tsx              | Compile/scaffold/run seed                       |
| Quality          | oxlint, oxlint-tsgolint, prettier                             | Type-aware lint and formatting                  |
| Portability      | cross-env                                                     | Test migration environment assignment           |
| Types            | @types/*                                                      | Compile-time declarations                       |

@nestjs/observe, or, and @nestjs/mau are declared, but inspected source does not wire a monitoring integration, import or, or establish a hosted deployment. source-map-support is declared tooling support; this is not evidence of custom runtime initialization. The deploy script is `nest deploy`, not a documented production target.

## Important configuration

[tsconfig.json](../tsconfig.json) enables strict checks, NodeNext ESM resolution, decorator metadata, and ES2023 output. [tsconfig.build.json](../tsconfig.build.json) narrows compilation to application source. [nest-cli.json](../nest-cli.json) identifies src and clears output before rebuilding.

[Oxlint](../.oxlintrc.json) rejects floating promises but allows explicit any. [Prettier](../.prettierrc) selects single quotes/trailing commas. Vitest configs split spec and e2e-spec filenames. [test/jest-e2e.json](../test/jest-e2e.json) is a leftover config referencing ts-jest; active scripts use Vitest and no Jest toolchain is declared.

## What to remember

- Features group behavior; common shares infrastructure.
- Modules control provider visibility, not folders alone.
- Root prisma and src/prisma have different jobs.
- A dependency does not prove an integration exists.
- Trace controller → service → schema when investigating.

## Check your understanding

1. Where are comment validation and persistence defined?
2. Why does TasksModule import ProjectsModule?
3. What keeps tests out of the production build?
