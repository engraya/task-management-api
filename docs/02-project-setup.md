# 2. Setup and command behavior

[Home](README.md) · [Configuration](06-configuration-and-environment.md) · [Docker](15-docker-and-containers.md)

## Prerequisites and installation

[package.json](../package.json) requires Node ^24.15.0 (24.x starting at 24.15). CI and Docker pin 24.20.0. Use npm and the committed lockfile. PostgreSQL 17 is configured in Compose/CI. Docker Compose supplies convenient local databases; an independently provisioned PostgreSQL database also works.

Run from the repository root:

```powershell
npm ci
Copy-Item .env.example .env
```

Only copy the environment template on initial setup; preserve an existing personalized file. Set a unique signing secret and the correct database URL. npm ci installs locked dependencies and expects the manifest and lockfile to agree.

```powershell
docker compose up -d postgres
npm run prisma:generate
npm run prisma:migrate:deploy
npm run start:dev
```

Wait for database health before migrations (inspect with `docker compose ps`). Client generation creates the query API, not tables. Migration deployment applies committed SQL using DATABASE_URL. Development startup maps to `nest start --watch`: compilation and restarts lead into [src/main.ts](../src/main.ts), AppModule initialization, Prisma connection, and HTTP listening.

| Resource     | Default URL                         |
| ------------ | ----------------------------------- |
| API          | http://localhost:3000/api/v1        |
| Health       | http://localhost:3000/api/v1/health |
| Swagger UI   | http://localhost:3000/api/docs      |
| Swagger JSON | http://localhost:3000/api/docs-json |

Register through Swagger or [HTTPie](api-exports.md), obtain data.accessToken, and use bearer authorization. Creating your own project avoids needing seed data.

## Commands and runtime behavior

| Command             | Script/behavior                    | Meaning                           |
| ------------------- | ---------------------------------- | --------------------------------- |
| npm start           | nest start                         | Compile/start via CLI             |
| npm run start:dev   | nest start --watch                 | Reload during development         |
| npm run start:debug | nest start --debug --watch         | Attach a Node debugger            |
| npm run build       | nest build                         | Compile into dist                 |
| npm run start:prod  | node dist/main                     | Run previously compiled output    |
| npm run typecheck   | tsc --noEmit --incremental false   | Check types without JS output     |
| npm run lint        | oxlint --type-aware src/ test/     | Static checks                     |
| npm run format      | prettier --write on source/test TS | Mutates formatting                |
| npm run docs:export | Build then scripts/export-api.mjs  | Regenerate two JSON API artifacts |

The build configuration uses src as root, excludes tests, and emits dist/main.js. start:prod does not set NODE_ENV or run migrations. Supply production settings and deploy migrations separately. Docker startup has a different command that does migrate first.

## Schema evolution and seed

`npm run prisma:migrate -- --name describe_change` creates/applies a development migration. Review SQL and commit it; deploy committed migrations in production. Generating the client and evolving the database are independent operations.

`npm run prisma:seed` invokes `tsx prisma/seed.ts` through [prisma.config.ts](../prisma.config.ts). The optional development seed creates example users, one project, one label, and three tasks. Its fixed demonstration credentials must not become production accounts. The label is not attached to a task. Re-running adds tasks because newly generated IDs do not conflict, despite skipDuplicates. The fixed seed project ID is not a typical versioned UUID accepted by route UUID validation; use an API-created project for HTTP exercises.

`prisma:migrate:reset` deletes database data. `prisma:db:push` changes schema without creating migration history. Neither substitutes for production migration deployment. Other inspection commands are in [reference](reference.md).

## Tests

```powershell
npm run test:db:start
npm run test:db:migrate
npm test
npm run test:e2e
npm run test:cov
npm run test:db:stop
```

Tests default to localhost:5433. npm test includes real-database integration tests. TEST_DATABASE_URL can select another dedicated database, but test:db:migrate always targets the default local database; migrate a custom target separately. [.env.test is not automatically loaded by Vitest](13-testing.md).

## Common mistakes

- Generating a client but never migrating tables.
- Running stale compiled output.
- Using Docker service DNS from a host process.
- Resetting or seeding a valuable database.

## What to remember

- Meet the engine requirement and use the lockfile.
- Configure before bootstrapping.
- Database startup, generation, and migrations differ.
- Production host startup does not migrate automatically.
- Tests select a separate database.

## Check your understanding

1. Which commands need PostgreSQL connectivity?
2. Why can tests fail after development migrations succeed?
3. Why does Docker startup differ from start:prod?
