# 17. Production readiness

[Home](README.md) · [Security](09-authorization-and-security.md) · [Technical debt](improvements-and-technical-debt.md)

Production readiness means predictable behavior under malicious input, concurrency, failures, deployments, and recovery. This repository demonstrates useful foundations but should not be treated as production-complete, especially for project isolation.

## Evidence-based status

| Concern                         | Status                     | Evidence and practical limit                                                                       |
| ------------------------------- | -------------------------- | -------------------------------------------------------------------------------------------------- |
| Authentication/password storage | Implemented foundation     | JWT expiry and bcrypt; no revocation/account lookup or recovery flows                              |
| Resource authorization          | Partial; high-priority gap | Membership guard exists; child scoping and role enforcement missing                                |
| Input handling                  | Implemented foundation     | DTOs and unknown-field rejection; conversion/null/text-limit edge cases remain                     |
| Schema history/integrity        | Implemented                | Initial migration, foreign keys, unique constraints; release migration policy still needed         |
| Tests                           | Partial                    | Eleven focused cases; limited negative security coverage and bootstrap parity                      |
| Shutdown                        | Partial                    | Nest shutdown hooks and Prisma disconnect; shell PID/signal and traffic draining need verification |
| Liveness                        | Implemented                | Health route and Docker check                                                                      |
| Database readiness              | Missing                    | Health does not query DB                                                                           |
| Rate limiting                   | Partial                    | Default process-local throttler; no shared store or login-specific policy                          |
| Logs                            | Partial                    | Arrival and success logs; no structured error completion/correlation/audit trail                   |
| Metrics/tracing/alerting        | Missing in repository      | No configured backend/exporter/dashboard                                                           |
| Deployment                      | Partial                    | Image build/publication; no running-host rollout                                                   |
| Secrets/TLS/network boundary    | Deployment work missing    | Sample Compose settings; no TLS proxy or secret-management integration                             |
| Backups/disaster recovery       | Missing in repository      | Named volume provides persistence only                                                             |
| Concurrency/idempotency         | Partial                    | Unique constraints/upserts/nested writes; no generic retry keys or version checks                  |
| Scalability                     | Unproven                   | No load evidence, replica config, pool tuning, or distributed rate store                           |

“Missing” refers to repository evidence, not a claim about infrastructure maintained elsewhere.

## Reliability and recovery

A successful startup does not prove ongoing dependency health. Separate liveness (process responds) from readiness (instance can handle required work) so a deployment can stop routing requests during database failure without blindly restarting healthy processes. Set bounded database/network timeouts and define which operations may be retried. Retrying a task create after an uncertain response can duplicate work because no idempotency key exists.

PostgreSQL is the sole durable business store. Configure backup retention, restricted access, and tested restore procedures for the chosen hosting environment. Recovery point objective describes acceptable data loss; recovery time objective describes acceptable downtime. Neither is defined by this repository. A Compose volume alone cannot recover an accidentally deleted project and its cascaded children.

Migrations need an owner and rollout sequence. Destructive schema changes can break old application replicas during deployment. Use reviewed, compatible changes and test with representative data. Startup migration commands are convenient locally but should be evaluated for multi-replica releases and operational failure visibility.

## Scaling and availability

JWT verification does not require shared sessions, which helps multiple replicas authenticate with the same secret. Membership still requires database reads. Each replica adds a pool and its own in-memory rate counters; simply adding replicas can exceed database connection limits and weaken aggregate throttling. No HA database, autoscaler, load balancer, or shared limiter is configured.

Before scaling, measure request latency including guards, database saturation, expensive substring search, unbounded project/label lists, count queries, and relation payloads. A cache is an optional later optimization with authorization-aware invalidation, not a prerequisite to calling this API a monolith.

## Suggested release acceptance work

Repair/test cross-project access and role policy first. Then align test bootstrap with production; verify errors, secret injection, TLS, startup migrations, shutdown signals, readiness, and authenticated smoke tests in the target environment. Establish observable failures, backup restore rehearsal, and a reversible application rollout. These are concrete follow-up work items, not changes performed by this documentation task.

## What to remember

- Security correctness precedes scaling optimizations.
- Health, readiness, and full feature verification are different.
- A volume is persistence, not recovery.
- Multiple replicas change rate-limit and connection assumptions.
- A release plan includes both application and schema compatibility.

## Check your understanding

1. Which current gap could expose another project's task even on one replica?
2. Why might scaling the API make PostgreSQL less reliable?
3. What would you test to prove a backup is useful?
