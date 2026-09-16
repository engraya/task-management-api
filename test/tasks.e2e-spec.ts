import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module.js';

describe('Tasks flow (e2e)', () => {
  let app: INestApplication;
  let token: string;
  let projectId: string;
  let taskId: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.setGlobalPrefix('api/v1');
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('registers and logs in', async () => {
    const email = `e2e-${Date.now()}@example.com`;
    await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email, password: 'password123', name: 'E2E User' })
      .expect(201);

    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email, password: 'password123' })
      .expect(200);

    token = res.body.data.accessToken;
    expect(token).toBeDefined();
  });

  it('creates a project', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'E2E Project' })
      .expect(201);
    projectId = res.body.data.id;
  });

  it('creates a task in the project', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/v1/projects/${projectId}/tasks`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'E2E Task', priority: 'HIGH' })
      .expect(201);
    taskId = res.body.data.id;
  });

  it('updates the task status', () => {
    return request(app.getHttpServer())
      .patch(`/api/v1/projects/${projectId}/tasks/${taskId}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'IN_PROGRESS' })
      .expect(200)
      .expect((res) => expect(res.body.data.status).toBe('IN_PROGRESS'));
  });

  it('rejects an invalid status value', () => {
    return request(app.getHttpServer())
      .patch(`/api/v1/projects/${projectId}/tasks/${taskId}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'NOT_REAL' })
      .expect(400);
  });

  it('adds a comment to the task', () => {
    return request(app.getHttpServer())
      .post(`/api/v1/projects/${projectId}/tasks/${taskId}/comments`)
      .set('Authorization', `Bearer ${token}`)
      .send({ body: 'Looks good' })
      .expect(201);
  });
});
