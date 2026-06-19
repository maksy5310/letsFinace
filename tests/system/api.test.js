const request = require('supertest');
const { createApp } = require('../../src/api');

describe('System Tests - Full API Workflow', () => {
  let app;

  beforeEach(() => {
    const created = createApp();
    app = created.app;
  });

  test('complete project lifecycle', async () => {
    // 1. Create project
    const projectRes = await request(app)
      .post('/api/projects')
      .send({ name: '摄影联名项目', description: '一次合作拍摄', createdBy: 'user-1' });
    expect(projectRes.status).toBe(201);
    const projectId = projectRes.body.id;

    // 2. Add member
    const memberRes = await request(app)
      .post(`/api/projects/${projectId}/members`)
      .send({ userId: 'user-2', role: 'editor', ratio: 0.4 });
    expect(memberRes.status).toBe(200);

    // 3. Set ratios
    const ratioRes = await request(app)
      .post(`/api/projects/${projectId}/ratios`)
      .send({ 'user-1': 0.6, 'user-2': 0.4 });
    expect(ratioRes.status).toBe(200);

    // 4. Record transactions
    await request(app).post(`/api/projects/${projectId}/transactions`).send({
      type: 'income', amount: 10000, date: '2024-06-01', description: '客户全款', recordedBy: 'user-1'
    });
    await request(app).post(`/api/projects/${projectId}/transactions`).send({
      type: 'expense', amount: 2000, date: '2024-06-05', description: '场地租赁', recordedBy: 'user-1'
    });
    await request(app).post(`/api/projects/${projectId}/transactions`).send({
      type: 'expense', amount: 1500, date: '2024-06-10', description: '模特费用', recordedBy: 'user-2'
    });

    // 5. Query totals
    const totalsRes = await request(app).get(`/api/projects/${projectId}/totals`);
    expect(totalsRes.body.income).toBe(10000);
    expect(totalsRes.body.expense).toBe(3500);
    expect(totalsRes.body.net).toBe(6500);

    // 6. Calculate profit
    const profitRes = await request(app).get(`/api/projects/${projectId}/profit`);
    expect(profitRes.body.netProfit).toBe(6500);
    expect(profitRes.body.distribution).toHaveLength(2);
    expect(profitRes.body.distribution.find(d => d.userId === 'user-1').share).toBe(3900);
    expect(profitRes.body.distribution.find(d => d.userId === 'user-2').share).toBe(2600);

    // 7. Add supplier and payments
    const supplierRes = await request(app)
      .post(`/api/projects/${projectId}/suppliers`)
      .send({ name: '灯光租赁公司', contact: 'light@example.com' });
    expect(supplierRes.status).toBe(201);
    const supplierId = supplierRes.body.id;

    await request(app).post(`/api/suppliers/${supplierId}/payments`).send({
      amount: 800, status: 'paid', dueDate: '2024-06-01'
    });
    await request(app).post(`/api/suppliers/${supplierId}/payments`).send({
      amount: 500, status: 'pending', dueDate: '2099-12-31'
    });

    // 8. Reconcile
    const reconcileRes = await request(app).get(`/api/suppliers/${supplierId}/reconcile`);
    expect(reconcileRes.body.totalPaid).toBe(800);
    expect(reconcileRes.body.totalPending).toBe(500);
    expect(reconcileRes.body.discrepancies).toHaveLength(0);

    // 9. Upload invoice
    const invoiceRes = await request(app)
      .post(`/api/projects/${projectId}/invoices`)
      .send({ fileName: 'invoice_001.jpg' });
    expect(invoiceRes.status).toBe(201);
    expect(invoiceRes.body.amount).toBeGreaterThan(0);

    // 10. List invoices
    const invoicesListRes = await request(app).get(`/api/projects/${projectId}/invoices`);
    expect(invoicesListRes.body).toHaveLength(1);

    // 11. Export
    const exportRes = await request(app).get(`/api/projects/${projectId}/export`);
    expect(exportRes.body.projectName).toBe('摄影联名项目');
    expect(exportRes.body.summary.transactionCount).toBe(3);
  });

  test('filter transactions by date range', async () => {
    const projectRes = await request(app)
      .post('/api/projects')
      .send({ name: 'Filter Test', createdBy: 'user-1' });
    const pid = projectRes.body.id;

    await request(app).post(`/api/projects/${pid}/transactions`).send({
      type: 'income', amount: 1000, date: '2024-01-15', recordedBy: 'user-1'
    });
    await request(app).post(`/api/projects/${pid}/transactions`).send({
      type: 'income', amount: 2000, date: '2024-03-15', recordedBy: 'user-1'
    });

    const filtered = await request(app).get(`/api/projects/${pid}/transactions?from=2024-01-01&to=2024-02-28`);
    expect(filtered.body).toHaveLength(1);
    expect(filtered.body[0].amount).toBe(1000);
  });

  test('profit simulation endpoint', async () => {
    const projectRes = await request(app)
      .post('/api/projects')
      .send({ name: 'Sim Test', createdBy: 'user-1' });
    const pid = projectRes.body.id;

    await request(app).post(`/api/projects/${pid}/transactions`).send({
      type: 'income', amount: 5000, recordedBy: 'user-1'
    });

    const simRes = await request(app)
      .post(`/api/projects/${pid}/profit/simulate`)
      .send({ additionalIncome: 2000, additionalExpense: 1000 });
    expect(simRes.body.simulatedNet).toBe(6000);
  });

  test('health check', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});
