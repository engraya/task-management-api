# 9. Authorization and security

[Home](README.md) · [Authentication](08-authentication.md) · [Technical debt](improvements-and-technical-debt.md)

Authentication identifies a caller; authorization checks a requested action against that caller's permissions. This repository implements project membership checks, but not a complete role or resource-ownership policy.

## Current access decisions

[ProjectMemberGuard](../src/projects/guards/project-member.guard.ts) reads request.user.id and selects `request.params.projectId ?? request.params.id`. It looks up the compound projectId/userId membership key, throws 403 if absent, and stores the membership on request.projectMembership if found. Current controllers/services do not use that attached role to make further owner-only decisions.

| Operation group                            | Current protection                                                        |
| ------------------------------------------ | ------------------------------------------------------------------------- |
| Register/login/health                      | Public with respect to JWT; throttling still applies to controller routes |
| Read/update self                           | JWT; user ID comes from token, not request body                           |
| Create/list projects                       | JWT; new project associates caller; list filters caller's memberships     |
| Read/update/delete project, manage members | JWT + membership in named project                                         |
| Task/label/comment routes                  | JWT + membership in URL project                                           |
| Assign task                                | Additionally checks assignee membership in the actual task's project      |
| Attach label                               | Additionally checks label belongs to the actual task's project            |

## Role gap

ProjectRole has OWNER and MEMBER values, and project creation stores OWNER for the creator. Yet any member can update/delete the project, add members with either role, change membership roles by upsert, and remove members. The last owner can be removed or demoted. That is current behavior, not enforced RBAC.

**Recommended improvement, not currently implemented:** decide the policy explicitly, require OWNER for administrative operations, and preserve at least one owner through concurrency-safe changes. Add negative tests for MEMBER callers as well as positive owner tests.

## Nested-resource authorization gap

A nested path expresses a relationship but does not automatically enforce it. For example, TasksController.findOne extracts taskId and calls TasksService.findOne(taskId). The guard validated membership in the URL's projectId, but the service fetches by task ID alone. It never checks that the task belongs to that project.

The same structural problem affects task update/status/assignment/delete/label-link operations; label update/delete by labelId; comment creation/listing by taskId; and comment deletion by commentId. Comment deletion does not check the URL task or comment author either. A legitimate member of one project could supply an unrelated resource ID and reach data/actions outside that project's boundary. UUID unpredictability is not a permission check.

List/create task operations that pass projectId into Prisma are scoped to that project. Label list/create also use it. The task assignment and label-attachment checks enforce useful child relationships but still do not connect the caller's authorized URL project to the task being changed.

**Recommended improvement, not currently implemented:** carry projectId into child service methods and query by both child ID and parent relationship. For comments, verify task belongs to project and comment belongs to task; add any author/owner deletion policy the product requires. Return a consistent unauthorized-resource response. Tests should use two projects, two users, and mismatched IDs for every nested read/write route.

## Currently implemented protections

- bcrypt cost-10 password hashing; explicit safe user projections in auth/profile/member/task responses.
- Global JWT guard, expiration verification, and database-backed membership checks.
- Runtime DTO validation, unknown-field rejection, and UUID parsing where parameters are explicitly decorated.
- Prisma structured queries; no raw user-concatenated SQL is used in these services.
- Helmet headers and configured CORS with credentials enabled.
- Global throttler configuration of 100 requests per 60,000 ms. The installed guard tracks request.ip and keys by controller/handler plus tracker and throttler name, so this is a default per-handler/IP allowance, not one combined budget across the whole API. Storage is local to the process, not a shared cluster-wide rate store.
- Joi required secret/database settings; local private environment files excluded from image input.
- Non-root container user and Prisma disconnect on framework shutdown.

These protections do not compensate for missing authorization. Input validation can reject malformed IDs and still accept a valid unauthorized ID.

## Recommended production improvements

First repair parent scoping and role policy. Then strengthen login-specific brute-force controls, runtime claim/account checks where required, and credential lifecycle operations. Review bcrypt's password input limits before designing a long-password policy, rather than relying only on minimum character count. Limit body sizes and text lengths according to product needs.

TLS termination, secure token storage in clients, secret rotation, restricted database networking, and least-privilege database accounts need deployment decisions. CORS is a browser mechanism, not an API firewall. Browser XSS can expose bearer tokens; this backend does not render user content or implement frontend escaping. Cookie-based CSRF defenses are not configured because auth currently uses an explicit bearer header; adding cookie authentication would require revisiting that threat model.

Swagger is enabled unconditionally; decide its production exposure. URL logging can record sensitive search/query strings; redact future sensitive parameters. Dependency vulnerability scanning and production audit logging are not configured in the workflows. Review proxy/tracker behavior before deploying behind a reverse proxy.

These are repository findings and engineering recommendations, not a penetration-test result or a statement about a live deployment.

## Common mistakes

- Equating membership in any named project with access to an arbitrary child ID.
- Trusting caller-supplied roles because they passed enum validation.
- Treating CORS or unguessable UUIDs as authorization.
- Assuming local in-memory rate limits aggregate across replicas.

## What to remember

- Membership is enforced; owner-only privileges are not.
- Parent-child relationships must be checked in queries or policies.
- Service relationship checks protect only the invariants they explicitly test.
- Defense layers are useful but cannot replace resource authorization.
- Security regression tests need hostile combinations of otherwise valid IDs.

## Check your understanding

1. Why can a valid project membership coexist with an unauthorized task request?
2. What prevents a MEMBER from promoting someone to OWNER today?
3. Why does a foreign key not solve this authorization problem?
