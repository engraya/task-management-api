# 11. API design and endpoint reference

[Home](README.md) · [API exports](api-exports.md) · [Validation and errors](10-validation-responses-and-errors.md)

All 28 controller operations are listed below. Paths are relative to `/api/v1`. `JWT` means authenticated; `Member` means JWT plus membership in the URL project, **not proof of child ownership or owner-only permission**. See [authorization](09-authorization-and-security.md).

To keep nested paths readable, define `P = /projects/:projectId`, `T = P/tasks/:taskId`, and `C = T/comments` in the table. These are documentation abbreviations, not literal API path segments. Project routes use `:id` rather than `:projectId`.

| Method | Path                          | Input               | Service/handler                 | Access | Success |
| ------ | ----------------------------- | ------------------- | ------------------------------- | ------ | ------- |
| GET    | /health                       | none                | HealthController.check          | Public | 200     |
| POST   | /auth/register                | RegisterDto         | AuthService.register            | Public | 201     |
| POST   | /auth/login                   | LoginDto            | AuthService.login               | Public | 200     |
| GET    | /users/me                     | none                | UsersService.findById           | JWT    | 200     |
| PATCH  | /users/me                     | UpdateUserDto       | UsersService.update             | JWT    | 200     |
| POST   | /projects                     | CreateProjectDto    | ProjectsService.create          | JWT    | 201     |
| GET    | /projects                     | none                | ProjectsService.findAllForUser  | JWT    | 200     |
| GET    | /projects/:id                 | UUID id             | ProjectsService.findOne         | Member | 200     |
| PATCH  | /projects/:id                 | UpdateProjectDto    | ProjectsService.update          | Member | 200     |
| DELETE | /projects/:id                 | UUID id             | ProjectsService.remove          | Member | 200     |
| POST   | /projects/:id/members         | AddMemberDto        | ProjectsService.addMember       | Member | 201     |
| DELETE | /projects/:id/members/:userId | UUID userId         | ProjectsService.removeMember    | Member | 200     |
| POST   | P/labels                      | CreateLabelDto      | LabelsService.create            | Member | 201     |
| GET    | P/labels                      | projectId           | LabelsService.findAllForProject | Member | 200     |
| PATCH  | P/labels/:labelId             | UpdateLabelDto      | LabelsService.update            | Member | 200     |
| DELETE | P/labels/:labelId             | UUID labelId        | LabelsService.remove            | Member | 200     |
| POST   | P/tasks                       | CreateTaskDto       | TasksService.create             | Member | 201     |
| GET    | P/tasks                       | QueryTaskDto        | TasksService.findAll            | Member | 200     |
| GET    | T                             | UUID taskId         | TasksService.findOne            | Member | 200     |
| PATCH  | T                             | UpdateTaskDto       | TasksService.update             | Member | 200     |
| PATCH  | T/status                      | UpdateTaskStatusDto | TasksService.updateStatus       | Member | 200     |
| PATCH  | T/assign                      | AssignTaskDto       | TasksService.assign             | Member | 200     |
| DELETE | T                             | UUID taskId         | TasksService.remove             | Member | 200     |
| POST   | T/labels                      | AttachLabelDto      | TasksService.attachLabel        | Member | 201     |
| DELETE | T/labels/:labelId             | UUID labelId        | TasksService.detachLabel        | Member | 200     |
| POST   | C                             | CreateCommentDto    | CommentsService.create          | Member | 201     |
| GET    | C                             | QueryCommentDto     | CommentsService.findAllForTask  | Member | 200     |
| DELETE | C/:commentId                  | UUID commentId      | CommentsService.remove          | Member | 200     |

The Swagger UI and JSON live outside this controller table at `/api/docs` and `/api/docs-json`. The version prefix is configured in bootstrap, not a negotiated header/media-type version system.

## REST conventions and actual semantics

Resources are plural nouns. GET reads, POST creates or attaches, PATCH makes a partial change, and DELETE removes. Assignment/status are specialized task subpaths. There are no PUT replacements. Delete returns the deleted record in data rather than 204 No Content.

Idempotency means repeating an operation has the same state effect. Membership upsert and label-link upsert avoid duplicate rows. Repeated DELETE can return a different status once the row is gone, even though its intended state is still absence. Registration and task creation have no idempotency-key mechanism; retrying a timed-out create can create additional tasks. There are no optimistic-concurrency version fields or ETag checks.

## Example learning sequence

Use the client of your choice; angle-bracket values below must be replaced with actual returned IDs/tokens. Examples contain placeholders only.

```http
POST /api/v1/auth/register
Content-Type: application/json

{"name":"Learner","email":"learner@example.com","password":"<choose-a-new-password>"}
```

Read `data.accessToken`. Then create your project:

```http
POST /api/v1/projects
Authorization: Bearer <access-token>
Content-Type: application/json

{"name":"Learning project","description":"Explore the API"}
```

Read `data.id` as projectId, then create a task:

```http
POST /api/v1/projects/<projectId>/tasks
Authorization: Bearer <access-token>
Content-Type: application/json

{"title":"Trace a request","priority":"HIGH","dueDate":"2026-12-31T17:00:00.000Z"}
```

Use its ID in PATCH `/api/v1/projects/<projectId>/tasks/<taskId>/status` with `{ "status": "IN_PROGRESS" }`. Other body examples are `{ "userId": "<userId>", "role": "MEMBER" }` for membership, `{ "assigneeId": "<userId>" }` for assignment, `{ "name": "Study", "color": "#123456" }` for label creation, `{ "labelId": "<labelId>" }` for attachment, and `{ "body": "I traced the service call." }` for comments. IDs must be real UUIDs, not these literal placeholders.

## Filtering and pagination

Task lists accept page, limit, search, status, priority, assigneeId, labelId. Comments accept page and limit only. Unknown query properties are rejected by production validation. Projects and labels are unpaginated. No endpoint exposes caller-selected ordering.

```http
GET /api/v1/projects/<projectId>/tasks?status=TODO&priority=HIGH&search=request&page=1&limit=20
Authorization: Bearer <access-token>
```

Search matches title or description case-insensitively; other supplied filters must also match. Task/comment results use:

```json
{
  "data": {
    "items": [],
    "meta": { "page": 1, "limit": 20, "total": 0, "totalPages": 0 }
  }
}
```

Other successful endpoints wrap their own result in data. There is no universal response DTO schema describing every returned relation; runtime projections in services remain important when reviewing exports. Auth, user profile, task list, and task detail intentionally have different field selections.

## Contract tooling

[OpenAPI](openapi.json) and [HTTPie JSON](httpie-collections.json) are generated artifacts. [scripts/export-api.mjs](../scripts/export-api.mjs) derives routes/DTO metadata, fills guard-consumed parent path parameters, adds examples, and produces seven collections. Runtime Swagger generation does not perform all of those exporter enrichments. Updating controllers/DTOs requires regenerating artifacts to avoid drift; the learning chapters still need human review for business-rule changes.

## What to remember

- Prefix controller paths with /api/v1.
- All successful handler results have a data envelope.
- Public authentication routes still participate in throttling.
- Only task/comment lists are paginated.
- HTTP method semantics do not invent missing authorization or retry guarantees.

## Check your understanding

1. Why can a repeated task-create request create duplicates?
2. Why is the same DTO insufficient to describe both task list and detail responses?
3. Which exported metadata is added by the script rather than a controller parameter decorator?
