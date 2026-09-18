# Feature: comments

[Home](../README.md) · [Tasks](tasks.md) · [Validation](../10-validation-responses-and-errors.md)

## Purpose and files

Comments record discussion on tasks. [CommentsController](../../src/comments/comments.controller.ts), [CommentsService](../../src/comments/comments.service.ts), and [CommentsModule](../../src/comments/comments.module.ts) implement it; [CreateCommentDto](../../src/comments/dto/create-comment.dto.ts) validates text and QueryCommentDto inherits pagination. The Comment model references a task and author with timestamps.

## API and behavior

Base: `/api/v1/projects/:projectId/tasks/:taskId/comments`.

| Method/suffix      | Service        | Result                                               |
| ------------------ | -------------- | ---------------------------------------------------- |
| POST base          | create         | Comment plus author id/name                          |
| GET base           | findAllForTask | Paginated comments plus author id/name, newest first |
| DELETE /:commentId | remove         | Deleted comment record                               |

There is no edit endpoint. Body must be a string of at least one character; trimming, rich-text sanitization, and maximum-length rules are not implemented. An eventual frontend must safely render untrusted comment content rather than inserting it as raw HTML.

Creation extracts taskId and authenticated userId, then inserts body/taskId/authorId. Listing queries only by taskId and combines findMany/count in a transaction; defaults are page 1, limit 20, maximum 100. Deletion queries only commentId.

## Security and flow

Global JWT and the controller's ProjectMemberGuard protect all routes. However, neither controller nor service verifies taskId belongs to the URL project; deletion also does not verify commentId belongs to taskId or that the caller authored it. These are [authorization gaps](../09-authorization-and-security.md).

A valid create request flows through authentication → URL project membership → taskId/body validation → CommentsController.create → CommentsService.create → Comment insert with selected author → wrapped 201 response. There are no notifications, events, or background side effects. A missing task can produce a foreign-key failure currently mapped to 500. Listing a nonexistent task can return an empty page because it does not first check task existence.

The author selection illustrates data minimization: the response includes a useful display name without returning the user's password hash. Task detail separately includes only the latest five comments, without the same author include; the dedicated list is the complete paginated discussion interface.

## Common mistakes

- Assuming nested URLs enforce relationships.
- Assuming every member is allowed to delete any comment by intended product policy; that policy is not defined/enforced.
- Treating minimum length as safe HTML rendering.
- Expecting edits or notification delivery that do not exist.

## What to remember

- Comments attach to tasks and authenticated authors.
- Lists use shared pagination and newest-first ordering.
- There is no update endpoint.
- Parent-child and author authorization need explicit checks.
- A stored discussion record is not a sent notification.

## Check your understanding

1. Why can a comment list return empty for a missing task?
2. Which relationship must be checked before deleting a nested comment?
3. Why is HTML escaping still needed in a future client?
