// Never fall back to the application's development DATABASE_URL in tests.
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL =
  process.env.TEST_DATABASE_URL ??
  'postgresql://postgres:postgres@localhost:5433/task_management_test?schema=public';
process.env.JWT_SECRET = 'task-management-test-secret';
process.env.JWT_EXPIRES_IN = '15m';
