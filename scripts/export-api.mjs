import 'reflect-metadata';
import { mkdir, writeFile } from 'node:fs/promises';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule } from '@nestjs/swagger';
import { swaggerConfig } from '../dist/config/swagger.config.js';

// Documentation generation never starts the server or connects to a database.
// Fixed placeholders keep local credentials out of generated artifacts.
Object.assign(process.env, {
  NODE_ENV: 'test',
  PORT: '3000',
  DATABASE_URL: 'postgresql://docs:docs@localhost:5432/docs',
  JWT_SECRET: 'documentation-only-placeholder',
  JWT_EXPIRES_IN: '15m',
  CORS_ORIGIN: 'http://localhost:3000',
});
const { AppModule } = await import('../dist/app.module.js');
const app = await NestFactory.create(AppModule, { logger: false });

try {
  app.setGlobalPrefix('api/v1');
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  document.servers = [{ url: 'http://localhost:3000', description: 'Local API' }];
  const resources = ['health', 'auth', 'users', 'projects', 'labels', 'tasks', 'comments'];
  document.tags = resources.map((name) => ({ name }));
  const ids = {
    userId: '11111111-1111-4111-8111-111111111111',
    projectId: '22222222-2222-4222-8222-222222222222',
    taskId: '33333333-3333-4333-8333-333333333333',
    labelId: '44444444-4444-4444-8444-444444444444',
    commentId: '55555555-5555-4555-8555-555555555555',
  };
  const variable = (name) => `{{${name}}}`;
  const idVariable = (name) => name === 'id' ? 'projectId' : name === 'assigneeId' ? 'userId' : name;
  const resolve = (schema) => schema?.$ref
    ? document.components.schemas[schema.$ref.split('/').at(-1)]
    : schema;
  function exampleFor(input) {
    const schema = resolve(input);
    if (!schema) throw new Error('Missing request schema');
    if (schema.example !== undefined) return schema.example;
    if (schema.allOf) return Object.assign({}, ...schema.allOf.map(exampleFor));
    if (schema.properties) {
      return Object.fromEntries(Object.entries(schema.properties).map(([key, value]) => [key, exampleFor(value)]));
    }
    if (schema.default !== undefined) return schema.default;
    if (schema.enum) return schema.enum[0];
    throw new Error(`Add an example to the DTO property: ${JSON.stringify(schema)}`);
  }
  const collections = new Map(resources.map((name) => [name, {
    name: name[0].toUpperCase() + name.slice(1), auth: { type: 'none' }, requests: [],
  }]));
  const methods = new Set(['get', 'post', 'put', 'patch', 'delete', 'options', 'head']);
  for (const [path, item] of Object.entries(document.paths)) {
    for (const [method, operation] of Object.entries(item)) {
      if (!methods.has(method)) continue;
      const resource = operation.tags?.[0];
      if (!collections.has(resource)) throw new Error(`Missing resource tag: ${method} ${path}`);
      const parameters = operation.parameters ??= [];
      // Some parent route parameters are consumed by guards rather than @Param.
      for (const [, name] of path.matchAll(/\{([^}]+)\}/g)) {
        let parameter = parameters.find((entry) => entry.in === 'path' && entry.name === name);
        if (!parameter) {
          parameter = { name, in: 'path', required: true, schema: { type: 'string' } };
          parameters.push(parameter);
        }
        parameter.schema = { type: 'string', format: 'uuid' };
        parameter.example = ids[idVariable(name)];
      }
      const media = operation.requestBody?.content?.['application/json'];
      if (media) {
        media.example = exampleFor(media.schema);
        if (!Object.keys(media.example).length) throw new Error(`Empty body: ${method} ${path}`);
      }
      const headers = [{ name: 'Accept', value: 'application/json', enabled: true }];
      if (operation.security?.length) {
        headers.push({ name: 'Authorization', value: `Bearer ${variable('accessToken')}`, enabled: true });
      }
      if (media) headers.push({ name: 'Content-Type', value: 'application/json', enabled: true });
      const body = media ? Object.fromEntries(Object.entries(media.example).map(([key, value]) => [
        key, ids[idVariable(key)] ? variable(idVariable(key)) : value,
      ])) : undefined;
      collections.get(resource).requests.push({
        name: `${method.toUpperCase()} ${path}`,
        method: method.toUpperCase(),
        url: variable('baseUrl') + path.replace(/\{([^}]+)\}/g, (_, name) => `:${name}`),
        auth: { type: 'none' },
        headers,
        pathParams: parameters.filter((p) => p.in === 'path').map((p) => ({
          name: p.name, value: variable(idVariable(p.name)), enabled: true,
        })),
        queryParams: parameters.filter((p) => p.in === 'query').map((p) => ({
          name: p.name,
          value: ids[idVariable(p.name)] ? variable(idVariable(p.name)) : String(p.example ?? exampleFor(p.schema)),
          // Optional filters are ready to enable without restricting the first list request.
          enabled: p.required === true || ['page', 'limit'].includes(p.name),
        })),
        body: body ? { type: 'text', text: { format: 'application/json', value: JSON.stringify(body, null, 2) } } : { type: 'none' },
      });
    }
  }
  const httpie = {
    meta: {
      format: 'httpie', version: '1.0.0', contentType: 'workspace',
      schema: 'https://raw.githubusercontent.com/httpie/schema/main/versions/1.0.0/schema.json',
    },
    entry: {
      name: 'Task & Project Management API',
      collections: [...collections.values()],
      environments: [{
        name: 'Local', isDefault: true, isLocalOnly: true,
        variables: Object.entries({ baseUrl: 'http://localhost:3000', accessToken: '', ...ids }).map(([name, value]) => ({
          name, value, isSecret: name === 'accessToken',
        })),
      }],
      drafts: [],
    },
  };
  const directory = new URL('../docs/', import.meta.url);
  await mkdir(directory, { recursive: true });
  for (const [name, data] of [['openapi.json', document], ['httpie-collections.json', httpie]]) {
    await writeFile(new URL(name, directory), JSON.stringify(data, null, 2) + '\n');
  }
  const count = httpie.entry.collections.reduce((total, collection) => total + collection.requests.length, 0);
  console.log(`Exported ${count} endpoints in ${collections.size} collections to docs/.`);
} finally {
  await app.close();
}
