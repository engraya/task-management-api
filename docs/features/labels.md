# Feature: labels

[Home](../README.md) · [Tasks](tasks.md) · [Database](../07-database-and-data-modeling.md)

## Purpose and files

Labels classify work inside a project, for example by category. [LabelsController](../../src/labels/labels.controller.ts), [LabelsService](../../src/labels/labels.service.ts), and [LabelsModule](../../src/labels/labels.module.ts) manage definitions. [CreateLabelDto](../../src/labels/dto/create-label.dto.ts) and its partial update type validate inputs. Label persists the definition; TaskLabel persists its application to tasks.

## API and runtime

Base path: `/api/v1/projects/:projectId/labels`. All handlers have JWT plus ProjectMemberGuard.

| Method/suffix    | Service           | Behavior                                |
| ---------------- | ----------------- | --------------------------------------- |
| POST base        | create            | Insert name/color under URL project     |
| GET base         | findAllForProject | List project's labels alphabetically    |
| PATCH /:labelId  | update            | Change definition by labelId            |
| DELETE /:labelId | remove            | Delete definition and cascade its links |

Name is a string of at least two characters. Color is an optional hexadecimal color; the database supplies #6B7280 when omitted. Update makes both optional. Label names are unique within a project, not globally, enforced by the compound unique constraint. Duplicate creation maps P2002 to 409. Lists are not paginated.

For creation: the client submits a body; guards authenticate/check project membership; pipes validate projectId/body; controller passes projectId to service; Prisma creates a Label; the success interceptor returns `{ data: label }` with 201. No task link is created until the separate task-label operation runs.

Update/delete use only labelId in the service, so membership in the URL project does not verify that the label belongs there. See [authorization](../09-authorization-and-security.md). Missing update/delete targets map to 404. No role-specific label permission exists.

## Concepts and tradeoffs

Separating Label from TaskLabel avoids duplicating name/color on every task and supports a many-to-many relation. Renaming a label changes how linked tasks are described without editing each Task. The cost is joins/relation includes and the need for a same-project business check when attaching. TasksService performs that check.

Deleting a label removes its links but leaves tasks intact. Detaching a label from a task removes only one link and leaves the label definition intact. Confusing those operations can remove classification across a whole project.

## What to remember

- Definitions and attachments are different resources.
- Names are unique per project.
- Color validation is runtime behavior; the default is in the schema.
- Definition deletion cascades links, not tasks.
- Update/delete need explicit parent scoping improvements.

## Check your understanding

1. Why can two projects each have a label named Bug?
2. Which service checks that a task and label share a project?
3. How does detach differ from delete?
