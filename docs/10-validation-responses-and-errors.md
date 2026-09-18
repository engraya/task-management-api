# 10. Validation, responses, and errors

[Home](README.md) · [API](11-api-design.md) · [Request lifecycle](12-request-lifecycle-and-data-flows.md)

## Four different forms of correctness

A TypeScript type checks developer code before execution. A DTO validator checks runtime input. A service checks a business relationship. A database constraint checks persisted integrity. A task assignee can pass UUID validation but fail membership validation; a project member can still submit a missing label ID. Each layer addresses a different failure.

## Global request pipeline

[main.ts](../src/main.ts) registers ValidationPipe with `whitelist: true`, `forbidNonWhitelisted: true`, `transform: true`, and `enableImplicitConversion: true`. The pipe turns plain values into DTO instances and applies class-validator metadata. Unknown decorated-body/query properties are rejected rather than silently accepted. Do not assume this is an exact raw-JSON type check: conversion runs before validation and can coerce primitives.

`@Type(() => Number)` on pagination fields explicitly converts query strings such as `page=2` into numbers. `IsInt`, `Min(1)`, and `Max(100)` then enforce numeric bounds. Instantiating the DTO also supplies defaults and the skip getter.

TypeScript DTO property declarations alone cannot do this: they disappear after compilation. Swagger decorators describe the contract for tools; they are not validation rules. Fields need class-validator metadata to participate in whitelist validation.

## DTO reference

| DTO                 | Fields/rules                                                                                            |
| ------------------- | ------------------------------------------------------------------------------------------------------- |
| RegisterDto         | email valid email; password string min 8; name string min 2                                             |
| LoginDto            | email valid email; password string                                                                      |
| UpdateUserDto       | optional name string min 2                                                                              |
| CreateProjectDto    | name string min 3; optional string description                                                          |
| UpdateProjectDto    | partial CreateProjectDto                                                                                |
| AddMemberDto        | UUID userId; required ProjectRole role                                                                  |
| CreateTaskDto       | title string min 3; optional string description, TaskPriority, ISO date string dueDate, UUID assigneeId |
| UpdateTaskDto       | partial CreateTaskDto with assigneeId omitted                                                           |
| UpdateTaskStatusDto | required TaskStatus                                                                                     |
| AssignTaskDto       | required UUID assigneeId                                                                                |
| AttachLabelDto      | required UUID labelId                                                                                   |
| CreateLabelDto      | name string min 2; optional hexadecimal color                                                           |
| UpdateLabelDto      | partial CreateLabelDto                                                                                  |
| CreateCommentDto    | body string min 1                                                                                       |
| PaginationQueryDto  | page default 1/min 1; limit default 20/min 1/max 100; both integers                                     |
| QueryTaskDto        | pagination plus optional search string, status, priority, UUID assigneeId/labelId                       |
| QueryCommentDto     | inherits pagination unchanged                                                                           |

See feature DTO directories under [src](../src). `PartialType` preserves relevant class metadata while making fields optional; `OmitType` excludes assignment from generic task update. Status and assignment have dedicated endpoints so those behaviors can have separate rules.

`IsOptional` generally skips other validators for undefined/null. Therefore “optional” does not always mean “null is forbidden.” For example dueDate update converts only truthy values and otherwise passes undefined, so null does not clear the date. Null on a required database field may reach Prisma and fail there. Whitespace-only strings are not trimmed by this application and can satisfy some minimum-length rules. Maximum text lengths and nested DTO validation are not currently implemented.

## URL parameters and guard ordering

Controllers explicitly apply ParseUUIDPipe to selected parameters. Parameters consumed only by ProjectMemberGuard are not automatically parsed just because they appear in the URL. Guards run before handler argument pipes; consequently a malformed project path may fail membership lookup with 403 before reaching UUID validation. Do not promise a universal 400 for every malformed path segment.

## Response transformation

[TransformInterceptor](../src/common/interceptors/transform.interceptor.ts) maps every successful handler result to `{ data: result }`. This is a response envelope, not a serializer that hides private fields. Services must still use safe selections. Dates are serialized into JSON date strings through normal serialization.

Paginated services return `{ items, meta }`, so HTTP returns `{ data: { items, meta } }`. Default successful status is 201 for POST and 200 for GET/PATCH/DELETE; login explicitly overrides POST to 200. Delete handlers return deleted records rather than empty 204 responses.

## Error paths

[PrismaExceptionFilter](../src/common/filters/prisma-exception.filter.ts) catches PrismaClientKnownRequestError only:

| Error/source                                                  | HTTP | Response behavior                                 |
| ------------------------------------------------------------- | ---- | ------------------------------------------------- |
| P2002 unique violation                                        | 409  | statusCode and generated duplicate-target message |
| P2025 missing update/delete target                            | 404  | statusCode and Record not found                   |
| Other known Prisma error, including foreign-key failures      | 500  | statusCode and Something went wrong               |
| DTO or ParseUUIDPipe rejection                                | 400  | Nest validation/HTTP exception response           |
| Missing/invalid/expired token, incorrect credentials          | 401  | Authentication failure                            |
| Missing membership / invalid assignment / wrong-project label | 403  | Explicit ForbiddenException                       |
| Explicit service missing task/project/user                    | 404  | Service NotFoundException                         |
| Throttling                                                    | 429  | Throttler exception response                      |
| Other unhandled error                                         | 500  | Framework default handling                        |

The filter's JSON errors have no `data` wrapper. Ordinary Nest HTTP exception bodies may include an `error` field and validation message arrays, so all error bodies are not identical. Prisma validation/initialization errors are not covered by this filter merely because their name contains Prisma.

For example, adding a nonexistent member can pass UUID/role validation, then fail a foreign key. There is no pre-check in ProjectsService.addMember and no dedicated P2003 mapping, so the known error takes the generic 500 path. That is an improvement opportunity, not evidence the request was semantically valid.

## Common mistakes

- Expecting Swagger examples to validate requests.
- Expecting optional update fields to support explicit clearing uniformly.
- Assuming `{ data }` strips password hashes.
- Catching every error locally and hiding useful framework status codes.

## What to remember

- Validation runs at runtime after guards and before handlers.
- Conversion can affect what validators see.
- Partial DTOs preserve metadata but do not invent business rules.
- Successful responses are wrapped; errors are not.
- Database errors have limited explicit mappings today.

## Check your understanding

1. Why does `limit=101` fail but `limit=20` become a number?
2. Why can a missing user ID lead to 500 rather than 400?
3. Why is password-hash safety a service concern despite the response interceptor?
