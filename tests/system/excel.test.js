const request = require('supertest');
const { createApp } = require('../../src/api');

describe('System Tests - Excel Import/Export', () => {
  let app;

  beforeEach(() => {
    const created = createApp();
    app = created.app;
  });

  test('import valid transactions', async () => {
    const projectRes = await request(app)
      .post('/api/projects')
      .send({ name: 'Import Test', createdBy: 'user-1' });
    const pid = projectRes.body.id;

    const rows = [
      { type: 'income', amount: 5000, date: '2024-01-15', description: '客户A付款', category: 'service' },
      { type: 'expense', amount: 1200, date: '2024-01-20', description: '材料费', category: 'material' },
      { type: 'income', amount: 3000, date: '2024-02-01', description: '客户B付款', category: 'service' }
    ];

    const importRes = await request(app)
      .post(`/api/projects/${pid}/import`)
      .send({ rows });

    expect(importRes.status).toBe(200);
    expect(importRes.body.imported).toBe(3);
    expect(importRes.body.failed).toHaveLength(0);
    expect(importRes.body.rows).toHaveLength(3);

    // Verify totals after import
    const totalsRes = await request(app).get(`/api/projects/${pid}/totals`);
    expect(totalsRes.body.income).toBe(8000);
    expect(totalsRes.body.expense).toBe(1200);
    expect(totalsRes.body.net).toBe(6800);
  });

  test('import with invalid rows reports failures', async () => {
    const projectRes = await request(app)
      .post('/api/projects')
      .send({ name: 'Import Fail Test', createdBy: 'user-1' });
    const pid = projectRes.body.id;

    const rows = [
      { type: 'income', amount: 5000, date: '2024-01-15', description: 'Valid' },
      { type: 'invalid', amount: 1200, date: '2024-01-20', description: 'Bad type' },
      { type: 'expense', amount: -100, date: '2024-01-20', description: 'Negative amount' },
      { type: 'income', amount: 3000, description: 'Missing date' }
    ];

    const importRes = await request(app)
      .post(`/api/projects/${pid}/import`)
      .send({ rows });

    expect(importRes.status).toBe(200);
    expect(importRes.body.imported).toBe(1);
    expect(importRes.body.failed).toHaveLength(3);
    expect(importRes.body.failed[0].errors).toContain('Invalid type');
    expect(importRes.body.failed[1].errors).toContain('Invalid amount');
    expect(importRes.body.failed[2].errors).toContain('Missing date');
  });

  test('export report contains all data', async () => {
    const projectRes = await request(app)
      .post('/api/projects')
      .send({ name: 'Export Test', createdBy: 'user-1' });
    const pid = projectRes.body.id;

    // Add transactions
    await request(app).post(`/api/projects/${pid}/transactions`).send({
      type: 'income', amount: 10000, date: '2024-06-01', description: '客户全款', recordedBy: 'user-1'
    });
    await request(app).post(`/api/projects/${pid}/transactions`).send({
      type: 'expense', amount: 3000, date: '2024-06-05', description: '场地租赁', recordedBy: 'user-1'
    });

    // Add supplier
    const supplierRes = await request(app)
      .post(`/api/projects/${pid}/suppliers`)
      .send({ name: '灯光公司', contact: 'light@example.com' });
    await request(app).post(`/api/suppliers/${supplierRes.body.id}/payments`).send({
      amount: 500, status: 'paid', dueDate: '2024-06-01'
    });

    // Add invoice
    await request(app)
      .post(`/api/projects/${pid}/invoices`)
      .send({ fileName: 'invoice_export.jpg' });

    const exportRes = await request(app).get(`/api/projects/${pid}/export`);
    expect(exportRes.status).toBe(200);
    expect(exportRes.body.projectName).toBe('Export Test');
    expect(exportRes.body.summary.income).toBe(10000);
    expect(exportRes.body.summary.expense).toBe(3000);
    expect(exportRes.body.summary.net).toBe(7000);
    expect(exportRes.body.transactions).toHaveLength(2);
    expect(exportRes.body.suppliers).toHaveLength(1);
    expect(exportRes.body.invoices).toHaveLength(1);
    expect(exportRes.body.generatedAt).toBeDefined();
  });

  test('export empty project', async () => {
    const projectRes = await request(app)
      .post('/api/projects')
      .send({ name: 'Empty Export', createdBy: 'user-1' });
    const pid = projectRes.body.id;

    const exportRes = await request(app).get(`/api/projects/${pid}/export`);
    expect(exportRes.status).toBe(200);
    expect(exportRes.body.summary.income).toBe(0);
    expect(exportRes.body.summary.expense).toBe(0);
    expect(exportRes.body.summary.net).toBe(0);
    expect(exportRes.body.transactions).toHaveLength(0);
  });
});
