# Feature: tasks

[Home](../README.md) · [Labels](labels.md) · [Comments](comments.md) · [API](../11-api-design.md)

## Purpose, files, and model

Tasks are work items within a project. [TasksController](../../src/tasks/tasks.controller.ts) exposes routes; [TasksService](../../src/tasks/tasks.service.ts) handles queries and relationship checks; [DTOs](../../src/tasks/dto) describe input. TasksModule imports ProjectsModule for membership protection. Task stores creator, optional assignee, status, priority, due date, and text. TaskLabel links classification, while Comment stores discussion.

## Operation map

All paths begin `/api/v1/projects/:projectId/tasks` and require JWT plus membership in the URL project.

| Method/suffix                   | Method       | Behavior                                                              |
| ------------------------------- | ------------ | --------------------------------------------------------------------- |
| POST (base)                     | create       | Validate optional assignee membership, create with caller as creator  |
| GET (base)                      | findAll      | Filter, paginate, count; include assignee and labels                  |
| GET /:taskId                    | findOne      | Return task, creator/assignee summaries, labels, latest five comments |
| PATCH /:taskId                  | update       | Title, description, priority, dueDate                                 |
| PATCH /:taskId/status           | updateStatus | Set any valid TaskStatus                                              |
| PATCH /:taskId/assign           | assign       | Load task, verify target user's membership, update assignee           |
| DELETE /:taskId                 | remove       | Delete task and cascade discussion/links                              |
| POST /:taskId/labels            | attachLabel  | Ensure actual task/label project match, upsert link                   |
| DELETE /:taskId/labels/:labelId | detachLabel  | Delete composite-key link                                             |

For child-ID operations the service does not verify that the task belongs to the authorized URL project. This is the [nested-resource authorization gap](../09-authorization-and-security.md), not a complete access boundary.

## Creation and updates

CreateTaskDto requires title (minimum three characters), accepts optional description, priority enum, date string, and UUID assigneeId. TasksService explicitly builds the Prisma data object rather than copying arbitrary input. The creatorId comes from authentication. A provided assignee must be a ProjectMember; failure produces 403. The date string becomes a JavaScript Date. Defaults supply TODO/MEDIUM when not specified.

Generic update intentionally omits assigneeId using OmitType and excludes status because CreateTaskDto never contains status. Dedicated assignment/status endpoints separate those behaviors. There is no unassign endpoint and AssignTaskDto requires a UUID. There is no explicit due-date clearing operation: undefined/null falls through the service's truthiness check without clearing the stored date. Status updates have no transition restriction, history record, or completion-time field.

## Listing: turning query strings into database predicates

QueryTaskDto inherits page=1, limit=20, max limit=100 and skip calculation. It adds search, status, priority, assigneeId, and labelId. The service builds a typed Prisma.TaskWhereInput:

- projectId always scopes the list.
- Status, priority, and assignee match directly when provided.
- Search adds an OR between title/description substring matches, case-insensitively.
- labelId adds an existence condition on taskLabels.

All applicable groups combine as AND: a task must be in the project and satisfy the filters, with the search's internal OR. There is no user-selected sort; createdAt descending is fixed. Pagination and count run through a transaction and return items plus page/limit/total/totalPages metadata. An empty list reports totalPages 0. Detail responses include at most five comments; use the comment list for older discussion.

## Assignment and label links

Assign loads the actual task first, throws 404 when absent, then queries membership using that task's projectId and target assigneeId. Only then does it update. The unit tests cover this rule. It is a business integrity check, separate from proving the caller may access that actual task.

AttachLabel loads task and label, rejects missing/wrong-project labels with 403, and uses a compound-key upsert with an empty update. Repeated attachment does not create duplicate links. Detachment uses delete, so repeating it can return 404. Reads/checks/writes are separate operations; concurrent membership or label changes can race with them.

## Concrete flow

POST a title and optional assignee → global JWT guard → project membership guard → DTO/UUID pipes → TasksController.create → TasksService.create → optional membership lookup → Task insert → wrapped 201 response. No queue, notification, or reminder follows the insert. Database persistence is the side effect.

## Common mistakes

- Sending assigneeId in generic PATCH rather than the assignment route.
- Assuming a status enum implements a workflow state machine.
- Assuming a due date schedules work.
- Assuming all comments are included in task detail.
- Treating the URL project as validated against every child resource.

## What to remember

- Task creation ties work to project and authenticated creator.
- Assignment and label attachment enforce specific relationship rules.
- Listing combines project scoping, filters, pagination, and relation projections.
- Status changes are unrestricted among enum values.
- Nested child authorization needs strengthening.

## Check your understanding

1. How do search OR conditions combine with priority filtering?
2. Why is assignment separate from generic update?
3. Why can repeat attachment succeed while repeat detachment fails?
