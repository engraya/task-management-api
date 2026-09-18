# 14. Observability, performance, and integration boundaries

[Home](README.md) · [Database](07-database-and-data-modeling.md) · [Production](17-production-readiness.md)

## What logging actually records

[RequestLoggerMiddleware](../src/common/middleware/request-logger.middleware.ts) logs method and original URL when a request enters the configured routes, then calls next. Forgetting next would leave request processing stalled. It records arrival, not proof of successful completion.

[LoggingInterceptor](../src/common/interceptors/logging.interceptor.ts) captures a start time after guards, then uses RxJS tap on successful result emission to log method, URL, statusCode, and elapsed milliseconds. Its timing excludes earlier guard work, including membership queries. It has no error callback/finalize handler, so rejected execution does not produce the same completion log. Guard failures occur before this interceptor starts.

Together these give useful local diagnostics but not a full access log, audit trail, or distributed trace. URLs include query strings; avoid introducing secrets there and consider redaction for sensitive searches. Bodies and authorization headers are not explicitly logged by these components.

Bootstrap logs startup URLs/failures. Prisma's custom filter sends errors but does not emit structured diagnostic fields itself. Request IDs, JSON log formatting, centralized log export, metrics, traces, slow-query telemetry, and durable audit events are **not currently implemented**. The presence of @nestjs/observe in package.json does not establish any of these integrations.

## Health versus readiness

GET `/api/v1/health` returns status ok and an ISO timestamp, wrapped in data. It makes no database query. An application can answer it after losing database connectivity, so it is a liveness-style check rather than database readiness. Docker and CI use it as their HTTP smoke check. It still passes through the controller throttling guard, so frequent probes can interact with its limiter.

## Current performance choices

Task and comment lists are bounded by a maximum limit of 100. Task detail limits comments to five. Prisma select avoids transferring password hashes and unnecessary user fields. Schema indexes support several foreign-key/filter paths, and a shared PrismaService reuses the adapter rather than constructing clients for each request.

There is no explicit connection-pool size, statement timeout, or retry configuration in PrismaService. The driver/adapter supplies its own behavior; the repository does not define deployment-specific tuning. Adding replicas increases the aggregate connection demand on PostgreSQL.

Project and label lists are unbounded. Task lists include labels and assignee data, so the size of relation collections still matters. Search uses case-insensitive substring matches on title/description, which ordinary single-field indexes may not accelerate. Offset pagination can become expensive for deep pages and is sensitive to concurrent inserts/deletes. Ordering only by createdAt also lacks a tie-breaker for equal timestamps.

The services do not contain obvious per-item query loops, but `include` alone is not proof of a single SQL query or absence of N+1 behavior across future callers. Measure actual queries. FindMany plus count does extra work on every paginated request; whether that is worthwhile depends on product needs and table size.

## Caching and background processing

Redis, application response caches, cache TTLs/invalidation, queues, brokers, cron jobs, domain-event handlers, outbox tables, and workers are **not currently implemented**. Their absence is intentional documentation scope, not a missing chapter describing hidden behavior.

`await prisma.task.create(...)` is asynchronous I/O inside the request: the response still waits for it. A background job would be independently scheduled, processed, retried, and observed after or apart from the request. Saving dueDate does not schedule one. RxJS result processing is not durable event delivery.

**Possible future improvement:** if notifications are required, first define delivery semantics and retries. A transactional outbox can store a pending event alongside a database write, then a worker delivers it; this prevents a crash between write and enqueue from losing the notification. This architecture is not present today and is unnecessary merely to document existing CRUD.

**Possible future caching:** measure hot reads before caching them. Keys must include project/user scope as appropriate, TTLs need an explicit freshness policy, and writes/membership changes need invalidation. Incorrect caching can leak private project data or retain access after membership removal.

## External services and libraries

PostgreSQL is the application's external persistence integration. It authenticates through the connection URL, receives Prisma queries through PrismaPg, and returns data/errors. Development uses Compose or a configured database; tests use a dedicated database; a production database host is not specified. Error translation and shutdown behavior are explained in the [error chapter](10-validation-responses-and-errors.md) and [bootstrap](05-application-bootstrap.md).

GHCR is a build-time image publishing integration authenticated with GitHub's token, not a service called while creating tasks. HTTPie is a client artifact format and Swagger describes the API; neither is an outbound business API. No SMTP, storage provider, payment gateway, or external OAuth provider is configured.

## Recommended measurement sequence

Reproduce a representative workload, measure end-to-end latency including guards, inspect SQL plans and query counts, then optimize the demonstrated bottleneck. Candidate changes include composite indexes for project/order queries, stable cursor pagination, bounded project lists, appropriate search indexes, and pool limits. Each has write cost, complexity, and maintenance tradeoffs; no benchmark in this repository proves one is necessary yet.

## What to remember

- Arrival logs and success logs measure different stages.
- Health does not prove current database readiness.
- Bounded page size does not bound every related payload.
- Async functions are not background jobs.
- Performance changes should follow measurements and preserve authorization scope.

## Check your understanding

1. Why does interceptor timing omit membership-query latency?
2. Why might a cached task list be unsafe after membership removal?
3. What would make a reminder durable across process restarts?
