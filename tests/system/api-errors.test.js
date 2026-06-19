const request = require('supertest');
const { createApp } = require('../../src/api');

describe('System Tests - API Error Scenarios', () => {
  let app;

  beforeEach(() => {
    const created = createApp();
    app = created.app;
  });

  // --- Projects ---
  describe('Projects error handling', () => {
    test('GET /api/projects/:id returns 404 for non-existent project', async () => {
      const res = await request(app).get('/api/projects/nonexistent');
      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Project not found');
    });

    test('POST /api/projects returns 400 when name is missing', async () => {
      const res = await request(app)
        .post('/api/projects')
        .send({ createdBy: 'user-1' });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/required/i);
    });

    test('POST /api/projects/:id/members returns 400 for invalid role', async () => {
      const projectRes = await request(app)
        .post('/api/projects')
        .send({ name: 'P1', createdBy: 'user-1' });
      const res = await request(app)
        .post(`/api/projects/${projectRes.body.id}/members`)
        .send({ userId: 'user-2', role: 'superadmin' });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/invalid role/i);
    });

    test('POST /api/projects/:id/members returns 400 for duplicate member', async () => {
      const projectRes = await request(app)
        .post('/api/projects')
        .send({ name: 'P1', createdBy: 'user-1' });
      await request(app)
        .post(`/api/projects/${projectRes.body.id}/members`)
        .send({ userId: 'user-2', role: 'editor' });
      const res = await request(app)
        .post(`/api/projects/${projectRes.body.id}/members`)
        .send({ userId: 'user-2', role: 'viewer' });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/already a member/i);
    });

    test('POST /api/projects/:id/ratios returns 400 when ratios do not sum to 1.0', async () => {
      const projectRes = await request(app)
        .post('/api/projects')
        .send({ name: 'P1', createdBy: 'user-1' });
      const res = await request(app)
        .post(`/api/projects/${projectRes.body.id}/ratios`)
        .send({ 'user-1': 0.5 });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/sum to 1.0/i);
    });

    test('GET /api/projects lists all projects', async () => {
      await request(app).post('/api/projects').send({ name: 'P1', createdBy: 'user-1' });
      await request(app).post('/api/projects').send({ name: 'P2', createdBy: 'user-2' });
      const res = await request(app).get('/api/projects');
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
    });
  });

  // --- Transactions ---
  describe('Transactions error handling', () => {
    test('POST /api/projects/:id/transactions returns 400 for invalid type', async () => {
      const projectRes = await request(app)
        .post('/api/projects')
        .send({ name: 'P1', createdBy: 'user-1' });
      const res = await request(app)
        .post(`/api/projects/${projectRes.body.id}/transactions`)
        .send({ type: 'refund', amount: 100, recordedBy: 'user-1' });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/income or expense/i);
    });

    test('POST /api/projects/:id/transactions returns 400 for negative amount', async () => {
      const projectRes = await request(app)
        .post('/api/projects')
        .send({ name: 'P1', createdBy: 'user-1' });
      const res = await request(app)
        .post(`/api/projects/${projectRes.body.id}/transactions`)
        .send({ type: 'income', amount: -100, recordedBy: 'user-1' });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/non-negative/i);
    });

    test('POST /api/projects/:id/transactions returns 400 for non-existent project', async () => {
      const res = await request(app)
        .post('/api/projects/nonexistent/transactions')
        .send({ type: 'income', amount: 100, recordedBy: 'user-1' });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Project not found');
    });
  });

  // --- Profit ---
  describe('Profit error handling', () => {
    test('GET /api/projects/:id/profit returns 400 for non-existent project', async () => {
      const res = await request(app).get('/api/projects/nonexistent/profit');
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Project not found');
    });
  });

  // --- Suppliers ---
  describe('Suppliers error handling', () => {
    test('POST /api/projects/:id/suppliers returns 400 when name is missing', async () => {
      const projectRes = await request(app)
        .post('/api/projects')
        .send({ name: 'P1', createdBy: 'user-1' });
      const res = await request(app)
        .post(`/api/projects/${projectRes.body.id}/suppliers`)
        .send({ contact: 'test@test.com' });
      expect(res.status).toBe(400);
    });

    test('POST /api/suppliers/:sid/payments returns 400 for invalid status', async () => {
      const projectRes = await request(app)
        .post('/api/projects')
        .send({ name: 'P1', createdBy: 'user-1' });
      const supplierRes = await request(app)
        .post(`/api/projects/${projectRes.body.id}/suppliers`)
        .send({ name: 'Supplier A' });
      const res = await request(app)
        .post(`/api/suppliers/${supplierRes.body.id}/payments`)
        .send({ amount: 100, status: 'unknown' });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/pending, paid, or overdue/i);
    });

    test('GET /api/suppliers/:sid/reconcile returns 400 for non-existent supplier', async () => {
      const res = await request(app).get('/api/suppliers/nonexistent/reconcile');
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Supplier not found');
    });

    test('GET /api/projects/:id/suppliers lists all suppliers', async () => {
      const projectRes = await request(app)
        .post('/api/projects')
        .send({ name: 'P1', createdBy: 'user-1' });
      await request(app)
        .post(`/api/projects/${projectRes.body.id}/suppliers`)
        .send({ name: 'S1' });
      await request(app)
        .post(`/api/projects/${projectRes.body.id}/suppliers`)
        .send({ name: 'S2' });
      const res = await request(app).get(`/api/projects/${projectRes.body.id}/suppliers`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
    });
  });

  // --- Invoices ---
  describe('Invoices error handling', () => {
    test('POST /api/projects/:id/invoices returns 400 when fileName is missing', async () => {
      const projectRes = await request(app)
        .post('/api/projects')
        .send({ name: 'P1', createdBy: 'user-1' });
      const res = await request(app)
        .post(`/api/projects/${projectRes.body.id}/invoices`)
        .send({});
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/required/i);
    });
  });

  // --- Import/Export ---
  describe('Import/Export error handling', () => {
    test('POST /api/projects/:id/import returns 400 when rows is not an array', async () => {
      const projectRes = await request(app)
        .post('/api/projects')
        .send({ name: 'P1', createdBy: 'user-1' });
      const res = await request(app)
        .post(`/api/projects/${projectRes.body.id}/import`)
        .send({ rows: 'not an array' });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Rows must be an array');
    });

    test('GET /api/projects/:id/export returns 400 for non-existent project', async () => {
      const res = await request(app).get('/api/projects/nonexistent/export');
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Project not found');
    });
  });
});
