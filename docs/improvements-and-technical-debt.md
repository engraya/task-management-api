# Improvements and technical debt

[Home](README.md) · [Security details](09-authorization-and-security.md) · [Production status](17-production-readiness.md)

These findings are based on the checked-in implementation. They are recommendations, not fixes made by this documentation task. Priority reflects correctness/security before optional architectural complexity.

## High priority

| Issue and location                                                                                  | Why it matters                                                                 | Suggested change and proof                                                                                    |
| --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| Nested child lookups use only IDs in TasksService, LabelsService update/remove, and CommentsService | Membership in the URL project does not authorize an unrelated child resource   | Propagate/check parent relationships in every query; two-project negative HTTP tests for reads/writes         |
| ProjectMemberGuard checks no role; ProjectsService manages memberships without owner policy         | Any member can delete a project, promote users, or remove the last owner       | Define OWNER permissions, enforce them, preserve ownership under concurrent operations; role/last-owner tests |
| CD has no CI dependency in workflow configuration                                                   | A failing commit may still publish latest                                      | Gate publishing/promotion on validated commit and retain immutable artifact identity                          |
| Literal sample environment/seed settings in local tooling                                           | Reusing examples as production configuration weakens isolation and credentials | Inject deployment secrets, restrict DB network/accounts, and exclude sample accounts from production          |

## Medium priority

| Issue and location                                       | Why it matters                                                             | Suggested change                                                                    |
| -------------------------------------------------------- | -------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| E2E apps recreate only part of main.ts                   | Production validation/errors can diverge while tests pass                  | Share app-configuration setup and add parity tests                                  |
| Limited eleven-test suite                                | Major permission/error/filter paths untested                               | Prioritize hostile ID combinations, roles, uniqueness/FKs, pagination, token expiry |
| JwtStrategy trusts claims without user lookup/revocation | Tokens can refer to removed accounts and cannot be selectively invalidated | Choose explicit account/token lifecycle policy; validate necessary runtime claims   |
| Generic known-Prisma error mapping                       | Missing referenced users/tasks appear as 500                               | Add deliberate domain pre-checks and safe P2003/error mapping with tests            |
| IsOptional/null and implicit conversion edge cases       | Optional input does not have uniform clear/reject semantics                | Define explicit null/clearing contract and enforce it in DTOs/services              |
| Membership checks and subsequent writes are separate     | Concurrent membership removal may violate assignment expectations          | Decide invariant and use suitable transactional/constraint strategy                 |
| removeMember leaves assigned tasks and can orphan access | User FK does not model membership existence                                | Define unassignment/ownership behavior during removal                               |
| Health only returns a timestamp                          | Database failures can pass deployment probes                               | Add separate readiness with bounded dependency checks                               |
| Default process-local throttling                         | Multiple replicas and proxy trackers alter limits                          | Configure tracker/proxy assumptions and shared storage if scaling                   |
| Success-only logging and no correlation/audit events     | Failures and destructive actions are hard to investigate                   | Structured completion/error logs, request IDs, redaction, appropriate audit records |
| Shell startup and per-container migrations               | Signal forwarding and rollout ordering need explicit handling              | Verify shutdown; use exec/entry script and a release migration policy               |
| No backups/restore/rollout configuration                 | Data deletion and failed releases lack documented recovery                 | Implement host-specific backup rehearsal and artifact/schema recovery plan          |

## Low priority and maintenance

- **Seed repeatability:** [seed.ts](../prisma/seed.ts) upserts users/project/label but creates new task IDs each run. Use deterministic task identity or explicit seed cleanup for disposable databases. Its fixed project ID is not a conventional versioned UUID for route validation. Replace with a valid stable UUID in a future code change. The created label is not attached and the assigned bugLabel variable is unused.
- **Stale root README:** its standalone-image migration statement conflicts with the current Dockerfile CMD. The new [Docker chapter](15-docker-and-containers.md) records the actual behavior; root README was left outside this task's docs-focused changes.
- **Legacy test config:** test/jest-e2e.json references an inactive Jest toolchain. Remove or clearly archive it when consolidating test tooling.
- **Unused/unclear dependencies:** audit `or`, @nestjs/observe, and hosted-deploy tooling against actual needs. A package declaration is not an implementation; removal should be separately tested with the lockfile updated.
- **Index review:** User.email has both unique and nonunique indexes. Evaluate redundancy and migration impact. Other single-column indexes should be measured against actual composite query workloads.
- **Pagination/sort:** add stable tie-breakers, bound currently unpaginated lists, and consider cursor pagination if deep offsets become a measured issue.
- **Input consistency:** explicit email normalization, whitespace policy, text size limits, null handling, and safe date clearing would make contracts easier to reason about.
- **API contract fidelity:** enrich response schemas and maintain exporter/runtime Swagger parity. The exporter adds guard-consumed parent parameters that runtime metadata may omit.
- **Documentation references in source:** comments mentioning “Concepts”/“Part 18.1” do not identify a matching chapter in the current guide. Replace them with stable documentation paths when source comments are next maintained.

## Advanced/future architecture

These are **not currently implemented** and should follow a demonstrated requirement:

- Durable notifications/reminders: queue/worker plus transactional outbox, idempotency, retry limits, and dead-letter handling.
- Caching: scoped keys, invalidation on writes/membership changes, freshness policy, and measured benefit.
- Search optimization: appropriate PostgreSQL indexing or search service if substring queries become a bottleneck.
- Optimistic concurrency: version fields/conditional updates to prevent silent lost edits when required by the UI.
- Observability platform: metrics/traces and service-level objectives tied to user-visible behavior.
- Microservices: only if independent ownership/scaling requirements justify operational and distributed-consistency costs. The existing module count alone is not a reason to split the application.

## What to remember

- Fix permission boundaries before adding architecture.
- Regression tests should prove the behavior of each fix.
- Production settings must replace demonstration settings.
- Test/bootstrap and document/source drift create false confidence.
- Optional performance infrastructure requires evidence and an operational owner.

## Check your understanding

1. Which three changes would you prioritize before serving multiple real teams?
2. Which suggested changes need database migrations?
3. Which improvements should wait for measurements or new product requirements?
