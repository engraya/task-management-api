# 18. Development workflows and rebuilding the project

[Home](README.md) · [Setup](02-project-setup.md) · [Testing](13-testing.md) · [Roadmap](learning-roadmap.md)

## How to add an endpoint in an existing feature

Start with the behavior: identify caller permissions, parent relationships, request shape, response shape, and failure cases. Add a DTO with runtime validators and Swagger examples. Add a controller method using the project's decorators and `.js` import conventions. Implement the service operation with an explicit scope and safe data selection. Reuse shared infrastructure but do not repeat the existing unscoped-child pattern.

For example, a proposed task archive endpoint (not currently implemented) would need a schema/product decision first: what archive means, whether lists omit archived tasks, and who may archive. Merely adding a boolean and PATCH handler would leave those rules ambiguous.

Write tests where the change creates meaningful behavior risk: malformed input, unauthorized caller, cross-project ID, missing row, and the successful change. Regenerate JSON API exports after controller/DTO changes and update the corresponding learning chapter.

## How to add a feature module

Follow `src/<feature>/<feature>.module.ts`, controller, service, and dto layout. Register the controller/provider, export only providers needed by other modules, and import the feature in AppModule. Global PrismaService and ConfigService are available through their existing modules. If a route is project-scoped, import ProjectsModule for the guard, then also enforce resource scoping in the service.

Global authentication protects new controller routes automatically unless Public is applied. Public must be deliberate. ApiBearerAuth describes security to Swagger but does not enforce it. A service called directly from a test or future worker bypasses HTTP guards, so decide where reusable authorization belongs.

## How to change the database

1. Edit [schema.prisma](../prisma/schema.prisma), considering nullability, defaults, uniqueness, deletion actions, and existing rows.
2. Format and validate with `npm run prisma:format` and `npm run prisma:validate`.
3. Create a development migration: `npm run prisma:migrate -- --name describe_change`.
4. Read the generated SQL before accepting destructive or expensive operations.
5. Run `npm run prisma:generate` and adapt service/DTO types.
6. Apply migrations to the dedicated test database and verify behavior.
7. Commit schema and migration together; use migrate deploy in release environments.

Do not edit an already-applied migration casually or use db push as a substitute for reviewable production history. A required new column may require staged backfill/default handling for existing rows.

## How to add configuration or an integration

Add the variable's Joi validation/default, a placeholder in the environment example, and entries in this guide's configuration table. Pass it through the environments that actually need it: Compose, CI, or eventual hosting. Tests should supply deterministic values. Never add real tokens to examples.

For a proposed outbound integration, introduce a provider with explicit request/response/error boundaries, timeouts, and a mockable dependency. Identify whether failure should fail the HTTP request or become retryable background work. No current email/storage/payment integration exists to copy; the architecture and product policy must be designed rather than assumed.

## How to write tests using existing conventions

Use a Nest testing module and useValue substitute for isolated service decisions, as TasksService's test does. Use real Prisma against TEST_DATABASE_URL for constraints/nested writes. Use Supertest and a configured test app for routes, guards, validation, and envelopes. Track records and clean them up in dependency order. Keep independent cases independent instead of extending a long stateful flow unnecessarily.

When modifying global HTTP behavior, first address the known test/main bootstrap mismatch so tests execute the same configuration. A test that skips the relevant guard/pipe cannot verify that behavior.

## A plausible reconstruction sequence

The repository does not record the author's full historical build sequence. The following is a teaching sequence that could recreate a similar application, not a claim about actual chronology.

| Stage | Build                                                      | Why this order / completion evidence                          |
| ----- | ---------------------------------------------------------- | ------------------------------------------------------------- |
| 1     | Node/npm manifest, TypeScript ESM config, Nest root/health | Establish an executable application before feature complexity |
| 2     | Joi environment validation and PostgreSQL connectivity     | Fail early on invalid configuration                           |
| 3     | Prisma models, migration, shared service lifecycle         | Establish persistence and relationships                       |
| 4     | User registration/login and global JWT guard               | Give protected operations an identity                         |
| 5     | Projects and atomic OWNER membership                       | Establish collaboration scope                                 |
| 6     | Membership/role/parent policies                            | Define access boundaries before adding nested operations      |
| 7     | Tasks, status, assignment                                  | Model work and business checks                                |
| 8     | Labels, task links, comments                               | Extend relationships without duplicating definitions          |
| 9     | Pagination/filtering and safe projections                  | Bound lists and expose useful data                            |
| 10    | Shared validation, errors, logs, Swagger                   | Make behavior understandable to clients/operators             |
| 11    | Unit/integration/HTTP tests alongside each feature         | Prove behavior at its relevant boundary                       |
| 12    | Multi-stage image, Compose, CI smoke tests                 | Verify packaging and reproducibility                          |
| 13    | Gated publishing and production operations                 | Complete delivery, security, and recovery policy              |

Stages 6 and 13 deliberately include improvements beyond current code. Learning from a repository means preserving good ideas while correcting its demonstrated gaps. Run tests throughout the sequence rather than postponing all testing until the end.

## Preparing a production change

Review endpoint compatibility, permissions, schema impact, migration/recovery plan, environment additions, and evidence from appropriate tests. Build and smoke-test the exact artifact. Update API exports and prose for changed contracts. This is a proposed workflow; current CD does not gate publication on CI or deploy a host.

## Common mistakes

- Adding DTO type annotations without runtime validation.
- Copying a nested route without propagating the parent ID into its query.
- Adding a model without generating/migrating both application and test environments.
- Documenting a proposed behavior as if it already shipped.

## What to remember

- Start with behavior and boundaries, then files.
- Follow existing structure without copying known vulnerabilities.
- Schema, client generation, migrations, and tests evolve together.
- New configuration needs every execution context considered.
- Reconstruction order is a teaching hypothesis, not repository history.

## Check your understanding

1. What must change beyond the controller when adding a nested resource?
2. Which files would a new environment setting affect?
3. How would you prove an endpoint cannot modify another project's resource?
