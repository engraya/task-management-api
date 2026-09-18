# Glossary

[Home](README.md) · [Architecture](04-architecture-and-concepts.md) · [Database](07-database-and-data-modeling.md)

| Term                      | Meaning in this project                                                                                   |
| ------------------------- | --------------------------------------------------------------------------------------------------------- |
| API                       | Contract through which clients request application operations                                             |
| REST                      | Resource-oriented HTTP style used by the plural routes and methods                                        |
| CRUD                      | Create, read, update, delete operations on persisted resources                                            |
| Endpoint                  | A method/path pair, such as GET /api/v1/users/me                                                          |
| Bootstrap                 | Build/configure/initialize the application before it serves requests                                      |
| Monolith                  | One deployed application containing all feature modules                                                   |
| Nest module               | Metadata grouping controllers/providers/imports/exports                                                   |
| ESM module                | JavaScript import/export unit; different from a Nest module                                               |
| Controller                | Maps HTTP arguments to service operations                                                                 |
| Service                   | Injectable class implementing operations/business checks                                                  |
| Provider                  | An object/class registered in Nest's dependency container                                                 |
| Dependency injection (DI) | Supplying collaborators rather than constructing them inside consumers                                    |
| IoC container             | Framework machinery that resolves and constructs registered dependencies                                  |
| DTO                       | Data transfer object class describing/validating request values here                                      |
| Decorator                 | Syntax/function attaching metadata or defining parameter extraction                                       |
| Guard                     | Framework gate that allows or rejects route execution                                                     |
| Strategy                  | Passport authentication implementation, here JWT verification                                             |
| Middleware                | Request processing that precedes route handler execution                                                  |
| Pipe                      | Transformation/validation of controller arguments                                                         |
| Interceptor               | Wrapper around handler execution/result processing                                                        |
| Exception filter          | Handler translating selected exceptions into HTTP responses                                               |
| Promise                   | JavaScript object representing eventual completion/failure                                                |
| async/await               | Language syntax for Promise-based operations, not a durable job system                                    |
| Observable                | RxJS stream used by Nest interceptors for result/error processing                                         |
| Interface                 | Compile-time TypeScript shape, erased at runtime                                                          |
| Generic                   | Type parameter, such as T in the response interceptor; no runtime validation                              |
| Enum                      | Named allowed values; Prisma also defines corresponding database enums                                    |
| ORM                       | Object-relational mapper; Prisma maps code query objects to database work                                 |
| Model                     | Prisma description of stored fields and relationships                                                     |
| Migration                 | Versioned SQL schema change applied to a database                                                         |
| Seed                      | Optional sample-data creation script                                                                      |
| Primary key               | Unique identity of a row; TaskLabel uses a two-column key                                                 |
| Foreign key               | Constraint requiring a referenced row to exist                                                            |
| Composite key             | Key formed from multiple fields, such as projectId and userId                                             |
| Join table                | Table connecting entities in a many-to-many relationship                                                  |
| Index                     | Database structure improving some lookups at storage/write cost                                           |
| Transaction               | Group of database operations with transactional guarantees                                                |
| Atomicity                 | All parts of a write succeed together or none do                                                          |
| Isolation                 | Rules for how concurrent database operations observe each other                                           |
| Cascade                   | Database automatically deleting related rows when the parent is deleted                                   |
| Upsert                    | Update an existing unique target or create it if absent                                                   |
| Projection                | Select only desired fields, such as safe User fields                                                      |
| UUID                      | Widely used identifier format; here persisted as TEXT, not an authorization mechanism                     |
| Offset pagination         | Skip earlier rows and take a bounded number based on page/limit                                           |
| Authentication            | Establish who the caller is                                                                               |
| Authorization             | Decide whether that caller may perform this operation on this resource                                    |
| RBAC                      | Role-based access control; roles are stored here but owner policy is not enforced                         |
| JWT                       | Signed token containing claims; its payload is not encrypted                                              |
| Bearer token              | Credential usable by whoever possesses it                                                                 |
| Claim                     | Token field such as sub identifying a user                                                                |
| Hash                      | One-way verifier; bcrypt hashes passwords                                                                 |
| Salt                      | Per-hash variation preventing identical passwords from trivially sharing hashes                           |
| CORS                      | Browser cross-origin request policy, not an authentication system                                         |
| CSRF                      | Unwanted authenticated browser request induced by another site; relevant when designing cookie-based auth |
| XSS                       | Script injection into a client page; future clients must safely render stored text                        |
| Rate limiting             | Reject requests beyond a configured allowance                                                             |
| Idempotency               | Repetition has the same intended state effect                                                             |
| Mock/spy                  | Test substitute / recorder of calls used to isolate behavior                                              |
| Fixture                   | Helper-created test data                                                                                  |
| Liveness                  | Whether the application responds                                                                          |
| Readiness                 | Whether it can perform required work; database readiness is not implemented here                          |
| Docker image              | Packaged filesystem and execution configuration                                                           |
| Container                 | Running instance of an image                                                                              |
| Layer                     | Cacheable filesystem/build step contribution to an image                                                  |
| Volume                    | Persistent storage separate from a container's replaceable filesystem                                     |
| CI                        | Automated validation of changes                                                                           |
| CD                        | Delivery/deployment automation; this repository's CD publishes images only                                |
| Runner                    | Machine executing a GitHub Actions job                                                                    |
| Service container         | Dependency started alongside a CI job, such as PostgreSQL                                                 |
| Registry                  | Store for images; CD publishes to GHCR                                                                    |
| Reverse proxy             | Front-facing server that forwards traffic; none configured here                                           |
| TTL                       | Time-to-live; no application cache TTL is configured here                                                 |
| Outbox                    | Proposed table of reliably deliverable events; not currently implemented                                  |

For concepts with security consequences, consult the [security chapter](09-authorization-and-security.md) rather than treating a definition as an implementation guarantee.
