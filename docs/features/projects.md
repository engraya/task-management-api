# Feature: projects and membership

[Home](../README.md) · [Database](../07-database-and-data-modeling.md) · [Authorization](../09-authorization-and-security.md)

## Purpose and implementation

Projects organize work and define who participates. ProjectMember is an explicit join model because participation carries a role and joinedAt timestamp. Source: [controller](../../src/projects/projects.controller.ts), [service](../../src/projects/projects.service.ts), [module](../../src/projects/projects.module.ts), [membership guard](../../src/projects/guards/project-member.guard.ts), and [DTOs](../../src/projects/dto).

## Operations

| Method and path under /api/v1        | Handler/service behavior                                   |
| ------------------------------------ | ---------------------------------------------------------- |
| POST /projects                       | create → nested project and OWNER membership insertion     |
| GET /projects                        | findMine → findAllForUser filters membership, newest first |
| GET /projects/:id                    | findOne → include members and safe user summaries          |
| PATCH /projects/:id                  | update → optional name/description changes                 |
| DELETE /projects/:id                 | remove → physical delete with database cascades            |
| POST /projects/:id/members           | addMember → upsert unique project/user pair and role       |
| DELETE /projects/:id/members/:userId | removeMember → delete compound-key membership              |

All require JWT. Individual project/member routes additionally use ProjectMemberGuard. Create/list do not need an existing project membership; create establishes one and list restricts results to the caller.

CreateProjectDto requires name length at least three and allows description. UpdateProjectDto makes those fields optional. AddMemberDto requires UUID userId and OWNER/MEMBER role. There is no invitation workflow or email lookup: the client supplies an already-existing user ID.

## Atomic creation flow

The controller passes the DTO and CurrentUser.id to ProjectsService.create. Prisma receives a project create with `members.create` containing the creator and OWNER role. The nested write commits both records together and returns the project plus memberships. TransformInterceptor returns `{ data: project }` with status 201. There is no notification or other external side effect.

Why atomic? A project with no members would not appear in anyone's normal project list. Separate writes could leave such a record if the second operation failed. A likely design reason for nested creation is to make this initial relationship reliable in one operation.

## Membership semantics and limits

Upsert means “update the matching row if present, otherwise create it.” The compound unique key makes repeated membership calls target the same logical membership. Repeating the same role is state-idempotent even though the endpoint is POST and returns 201 by default. Removing an already-removed membership results in a missing-record error rather than silently succeeding.

OWNER is stored but not enforced. Any member can delete the project, change roles, or remove the last owner. Removing a member does not clear their existing task assignments because Task.assignee references User, not ProjectMember. Missing target users can trigger a foreign-key error mapped to generic 500. These are current limitations, with fixes prioritized in [technical debt](../improvements-and-technical-debt.md).

Project deletion cascades into tasks, comments, labels, links, and memberships. It does not delete the users. There is no archive/restore or soft-delete facility. Project lists are unpaginated and do not support a search parameter.

## Common mistakes

- Splitting initial project/membership creation without a transaction.
- Treating upsert as authorization.
- Forgetting cascade scope during delete.
- Assuming removal of membership removes the User or unassigns tasks.

## What to remember

- Membership is the bridge between users and projects.
- Creation atomically establishes OWNER membership.
- List queries restrict by caller membership.
- Administrative operations currently allow every member.
- Deletion is physical and cascading.

## Check your understanding

1. Why is role stored on membership rather than User?
2. Why can a project become inaccessible after member removal?
3. Which changes would need tests to enforce a last-owner invariant?
