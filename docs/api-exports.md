# API JSON exports

[Documentation home](README.md) · [API behavior and endpoint reference](11-api-design.md)

- [httpie-collections.json](httpie-collections.json): import this file into HTTPie Web/Desktop. It contains 28 requests in seven resource collections: Health, Auth, Users, Projects, Labels, Tasks, and Comments.
- [openapi.json](openapi.json): Swagger/OpenAPI 3.0 JSON, grouped by resource tags, with request schemas and example bodies.

## Import into HTTPie

1. Open the space library's **+** menu, choose **Import**, and select `httpie-collections.json`. Import into a new space to keep the collections together.
2. In the imported space's variables, set `baseUrl` to your API origin, such as `http://localhost:3000`, without a trailing slash or `/api/v1`.
3. Send **Auth → POST /api/v1/auth/register**, or use the login request for an existing account. The example credentials are `jane@example.com` / `a-strong-password`.
4. Copy `data.accessToken` from the response into the `accessToken` variable. Protected requests already include the corresponding Bearer authorization header. Refresh this variable by logging in again when the token expires.
5. Replace the example UUID variables with actual IDs returned by your API: `userId`, `projectId`, `taskId`, `labelId`, and `commentId`. They are placeholders, not seeded records. Use a registered user's ID when adding a member; an assignee must belong to the project.

Every endpoint that accepts a body includes an editable JSON example. Pagination is enabled for list requests; optional task filters are populated but disabled until you enable them. Remove optional fields such as `assigneeId` if you do not need them. Update requests include all editable fields as examples, but you can send only the fields you want to change.

Suggested order: register/login, create a project, set `projectId`, add a member if needed, create labels/tasks, set their IDs, then try assignments, comments, and label attachments.

## Regenerate

```sh
npm run docs:export
```

This builds the app and regenerates both files from the controllers and Swagger DTO metadata. Install dependencies and generate the Prisma client first if setting up a fresh checkout. Exporting does not start a server or connect to PostgreSQL. The exporter uses fixed documentation placeholders and does not write local credentials into the files.

The running API also serves Swagger JSON at `/api/docs-json`.

HTTPie format references: [import documentation](https://httpie.io/docs/desktop/import), [official JSON schema](https://github.com/httpie/schema), and [variables](https://httpie.io/docs/desktop/variables).
