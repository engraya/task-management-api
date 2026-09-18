# 6. Configuration and environments

[Home](README.md) · [Setup](02-project-setup.md) · [Deployment](16-ci-cd-and-deployment.md)

Configuration separates deploy-specific values from behavior. A database hostname changes between host development, Compose, and CI; the service code should not need to change with it.

## Application variables

Source: [env.validation.ts](../src/config/env.validation.ts), [AuthModule](../src/auth/auth.module.ts), [PrismaService](../src/prisma/prisma.service.ts), and [main.ts](../src/main.ts).

| Variable          | Purpose                                                   | Required/default                                | Consumer                              |
| ----------------- | --------------------------------------------------------- | ----------------------------------------------- | ------------------------------------- |
| NODE_ENV          | Environment label                                         | development; allows development/test/production | Joi configuration; tests/image set it |
| PORT              | HTTP listener                                             | 3000; Joi number                                | bootstrap                             |
| DATABASE_URL      | PostgreSQL connection and optional schema query parameter | Required string                                 | PrismaService, Prisma CLI, seed       |
| JWT_SECRET        | Signing/verifying key                                     | Required, minimum 16 characters                 | JwtModule, JwtStrategy                |
| JWT_EXPIRES_IN    | Token lifetime                                            | 15m string                                      | JwtModule sign options                |
| CORS_ORIGIN       | Browser origin allowed by CORS                            | http://localhost:3000                           | bootstrap                             |
| TEST_DATABASE_URL | Override dedicated test DB                                | Optional, fallback local test DB on 5433        | test/setup.ts only                    |

Joi verifies DATABASE_URL is a string, not that a PostgreSQL server is reachable. JWT_EXPIRES_IN is only checked as a string, not as a valid duration. ConfigService's generic type argument is a compile-time annotation, not an extra runtime validator. PORT has no explicit port-range rule.

Safe example shape:

```env
NODE_ENV=development
PORT=3000
DATABASE_URL="postgresql://<user>:<password>@localhost:5432/<database>?schema=public"
JWT_SECRET="<replace-with-a-strong-random-secret>"
JWT_EXPIRES_IN=15m
CORS_ORIGIN=http://localhost:3000
```

Generate an application secret locally rather than copying a sample value:

```sh
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Do not paste generated output into committed documentation. Minimum length is a validation rule, not proof of entropy.

## Four loading mechanisms

**Application:** ConfigModule.forRoot loads the normal dotenv configuration and validates it; inherited process environment values can supply settings. There is no custom per-environment file selection in AppModule. Do not assume NODE_ENV=test makes Nest read `.env.test`.

**Prisma CLI and seed:** [prisma.config.ts](../prisma.config.ts) imports dotenv/config, identifies schema and migrations, reads DATABASE_URL, and configures seed execution. The seed independently loads dotenv and constructs an adapter with the URL's schema. CLI configuration is not Nest's ConfigService.

**Tests:** [test/setup.ts](../test/setup.ts) explicitly sets NODE_ENV, DATABASE_URL, and fixed test JWT values. DATABASE_URL comes from TEST_DATABASE_URL or the dedicated fallback; an existing development DATABASE_URL is overwritten. The committed `.env.test` is not explicitly loaded by these Vitest configs/setup. Point TEST_DATABASE_URL only to a dedicated database because tests create/delete records.

**Containers/CI:** Compose supplies literal API environment entries; changing the host `.env` does not replace those literals. GitHub Actions supplies its own job environment and service database. Docker sets NODE_ENV=production in the runner stage.

## Infrastructure-only settings

Compose/CI use POSTGRES_DB, POSTGRES_USER, and POSTGRES_PASSWORD to initialize PostgreSQL containers. They are not Nest environment-validation fields. CD reads GitHub's actor/repository context and GITHUB_TOKEN for registry authentication. These do not configure the running API or its database.

## Secret handling and operational implications

`.env` is ignored by Git; `.env.example` and `.env.test` are tracked. Docker excludes `.env` and `.env.*` except the example. Tracked test/Compose/seed values are demonstration settings, not evidence of production secrets. This guide does not reproduce private `.env` contents. A real secret committed accidentally should be rotated and removed from exposure; ignoring its filename later does not invalidate it.

Changing JWT_SECRET invalidates previously signed tokens because verification uses the new key. Expiration is supplied when issuing tokens; shortening configuration does not rewrite existing tokens. A CORS change affects browser access, not server-to-server authorization.

## Common mistakes

- Editing `.env` and expecting hard-coded Compose values to change.
- Using a dev database for TEST_DATABASE_URL.
- Assuming an environment label automatically changes bootstrap behavior.
- Confusing a valid URL string with successful connectivity.

## What to remember

- Configuration loading differs between app, CLI, tests, and containers.
- Required settings fail early, but not every semantic error is validated.
- Secrets must be private and independently generated.
- Test overrides deliberately separate test and development databases.
- Process configuration changes can affect existing clients and deployment health.

## Check your understanding

1. Which loader reads TEST_DATABASE_URL?
2. Why does changing CORS_ORIGIN not secure a public endpoint?
3. What happens to an old token after a signing-key change?
