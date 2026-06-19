const request = require('supertest');
const { createApp } = require('../../src/api');

describe('User Management API', () => {
  let app;

  beforeEach(() => {
    const result = createApp();
    app = result.app;
  });

  describe('POST /api/users', () => {
    test('should create a user', async () => {
      const res = await request(app)
        .post('/api/users')
        .send({ name: '张三', email: 'z@test.com', role: 'admin' });
      expect(res.status).toBe(201);
      expect(res.body.name).toBe('张三');
      expect(res.body.role).toBe('admin');
      expect(res.body.status).toBe('active');
    });

    test('should return 400 for missing name', async () => {
      const res = await request(app)
        .post('/api/users')
        .send({ role: 'admin' });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/name/i);
    });

    test('should return 400 for invalid role', async () => {
      const res = await request(app)
        .post('/api/users')
        .send({ name: 'Test', role: 'superadmin' });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/Invalid role/i);
    });
  });

  describe('GET /api/users', () => {
    test('should list all users', async () => {
      await request(app).post('/api/users').send({ name: 'A', role: 'admin' });
      await request(app).post('/api/users').send({ name: 'B', role: 'friend' });
      const res = await request(app).get('/api/users');
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
    });

    test('should filter by role', async () => {
      await request(app).post('/api/users').send({ name: 'A', role: 'admin' });
      await request(app).post('/api/users').send({ name: 'B', role: 'friend' });
      const res = await request(app).get('/api/users?role=admin');
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].role).toBe('admin');
    });

    test('should return 400 for invalid role filter', async () => {
      const res = await request(app).get('/api/users?role=invalid');
      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/users/:id', () => {
    test('should get user by id', async () => {
      const created = await request(app).post('/api/users').send({ name: 'Test', role: 'admin' });
      const res = await request(app).get(`/api/users/${created.body.id}`);
      expect(res.status).toBe(200);
      expect(res.body.name).toBe('Test');
    });

    test('should return 404 for nonexistent user', async () => {
      const res = await request(app).get('/api/users/nonexistent');
      expect(res.status).toBe(404);
    });
  });

  describe('PUT /api/users/:id', () => {
    test('should update user', async () => {
      const created = await request(app).post('/api/users').send({ name: 'Old', role: 'friend' });
      const res = await request(app)
        .put(`/api/users/${created.body.id}`)
        .send({ name: 'New', email: 'new@test.com' });
      expect(res.status).toBe(200);
      expect(res.body.name).toBe('New');
      expect(res.body.email).toBe('new@test.com');
    });

    test('should return 400 for nonexistent user', async () => {
      const res = await request(app)
        .put('/api/users/nonexistent')
        .send({ name: 'X' });
      expect(res.status).toBe(400);
    });
  });

  describe('PUT /api/users/:id/role', () => {
    test('should change user role', async () => {
      const created = await request(app).post('/api/users').send({ name: 'Test', role: 'friend' });
      const res = await request(app)
        .put(`/api/users/${created.body.id}/role`)
        .send({ role: 'admin' });
      expect(res.status).toBe(200);
      expect(res.body.role).toBe('admin');
    });

    test('should return 400 for invalid role', async () => {
      const created = await request(app).post('/api/users').send({ name: 'Test', role: 'friend' });
      const res = await request(app)
        .put(`/api/users/${created.body.id}/role`)
        .send({ role: 'superadmin' });
      expect(res.status).toBe(400);
    });
  });

  describe('PUT /api/users/:id/deactivate', () => {
    test('should deactivate user', async () => {
      const created = await request(app).post('/api/users').send({ name: 'Test', role: 'admin' });
      const res = await request(app).put(`/api/users/${created.body.id}/deactivate`);
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('inactive');
    });

    test('should return 404 for nonexistent user', async () => {
      const res = await request(app).put('/api/users/nonexistent/deactivate');
      expect(res.status).toBe(404);
    });
  });

  describe('PUT /api/users/:id/activate', () => {
    test('should activate user', async () => {
      const created = await request(app).post('/api/users').send({ name: 'Test', role: 'admin' });
      await request(app).put(`/api/users/${created.body.id}/deactivate`);
      const res = await request(app).put(`/api/users/${created.body.id}/activate`);
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('active');
    });
  });

  describe('GET /api/users/:id/permissions', () => {
    test('should return user permissions', async () => {
      const created = await request(app).post('/api/users').send({ name: 'Test', role: 'accountant' });
      const res = await request(app).get(`/api/users/${created.body.id}/permissions`);
      expect(res.status).toBe(200);
      expect(res.body.role).toBe('accountant');
      expect(res.body.label).toBe('会计');
      expect(res.body.permissions).toContain('transaction.create');
      expect(res.body.permissions).toContain('profit.read');
      expect(res.body.permissions).not.toContain('user.manage');
    });

    test('should return 404 for nonexistent user', async () => {
      const res = await request(app).get('/api/users/nonexistent/permissions');
      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/roles', () => {
    test('should return all role definitions', async () => {
      const res = await request(app).get('/api/roles');
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(8);
      const roleNames = res.body.map(r => r.role);
      expect(roleNames).toContain('admin');
      expect(roleNames).toContain('partner');
      expect(roleNames).toContain('accountant');
      expect(roleNames).toContain('cashier');
      expect(roleNames).toContain('developer');
      expect(roleNames).toContain('supplier');
      expect(roleNames).toContain('auditor');
      expect(roleNames).toContain('friend');
    });
  });

  describe('GET /api/users/stats/summary', () => {
    test('should return user stats', async () => {
      await request(app).post('/api/users').send({ name: 'A', role: 'admin' });
      await request(app).post('/api/users').send({ name: 'B', role: 'admin' });
      await request(app).post('/api/users').send({ name: 'C', role: 'friend' });
      const res = await request(app).get('/api/users/stats/summary');
      expect(res.status).toBe(200);
      expect(res.body.admin.count).toBe(2);
      expect(res.body.friend.count).toBe(1);
    });
  });

  describe('Full workflow', () => {
    test('complete user lifecycle', async () => {
      // Create users with different roles
      const admin = await request(app).post('/api/users').send({ name: '管理员张', role: 'admin' });
      const partner = await request(app).post('/api/users').send({ name: '合伙人钱', role: 'partner' });
      const accountant = await request(app).post('/api/users').send({ name: '会计李', role: 'accountant' });
      const cashier = await request(app).post('/api/users').send({ name: '出纳王', role: 'cashier' });
      const developer = await request(app).post('/api/users').send({ name: '开发商赵', role: 'developer' });
      const supplier = await request(app).post('/api/users').send({ name: '供应商陈', role: 'supplier' });
      const auditor = await request(app).post('/api/users').send({ name: '审计孙', role: 'auditor' });
      const friend = await request(app).post('/api/users').send({ name: '朋友刘', role: 'friend' });

      // List all users
      const list = await request(app).get('/api/users');
      expect(list.body).toHaveLength(8);

      // Filter by role
      const admins = await request(app).get('/api/users?role=admin');
      expect(admins.body).toHaveLength(1);

      // Change role
      const changed = await request(app)
        .put(`/api/users/${friend.body.id}/role`)
        .send({ role: 'developer' });
      expect(changed.body.role).toBe('developer');

      // Deactivate and activate
      await request(app).put(`/api/users/${cashier.body.id}/deactivate`);
      const cashierCheck = await request(app).get(`/api/users/${cashier.body.id}`);
      expect(cashierCheck.body.status).toBe('inactive');

      await request(app).put(`/api/users/${cashier.body.id}/activate`);
      const cashierActive = await request(app).get(`/api/users/${cashier.body.id}`);
      expect(cashierActive.body.status).toBe('active');

      // Check permissions
      const permRes = await request(app).get(`/api/users/${accountant.body.id}/permissions`);
      expect(permRes.body.permissions).toContain('import');
      expect(permRes.body.permissions).not.toContain('user.manage');

      // Get stats
      const stats = await request(app).get('/api/users/stats/summary');
      expect(stats.body.admin.count).toBe(1);
      expect(stats.body.partner.count).toBe(1);
      expect(stats.body.developer.count).toBe(2); // friend changed to developer
      expect(stats.body.auditor.count).toBe(1);
    });
  });
});
