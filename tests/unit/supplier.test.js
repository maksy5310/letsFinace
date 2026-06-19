const { Store } = require('../../src/store');
const { ProjectService } = require('../../src/project');
const { SupplierService } = require('../../src/supplier');

describe('SupplierService', () => {
  let store, projectService, supplierService;

  beforeEach(() => {
    store = new Store();
    projectService = new ProjectService(store);
    supplierService = new SupplierService(store);
  });

  test('add supplier to project', () => {
    const project = projectService.createProject({ name: 'P1', createdBy: 'u1' });
    const supplier = supplierService.addSupplier({ projectId: project.id, name: '印刷厂', contact: '123456789' });
    expect(supplier.name).toBe('印刷厂');
    expect(supplier.projectId).toBe(project.id);
    expect(supplier.payments).toEqual([]);
  });

  test('list suppliers by project', () => {
    const project = projectService.createProject({ name: 'P1', createdBy: 'u1' });
    supplierService.addSupplier({ projectId: project.id, name: 'S1' });
    supplierService.addSupplier({ projectId: project.id, name: 'S2' });
    const list = supplierService.listSuppliers(project.id);
    expect(list).toHaveLength(2);
  });

  test('record payment', () => {
    const project = projectService.createProject({ name: 'P1', createdBy: 'u1' });
    const supplier = supplierService.addSupplier({ projectId: project.id, name: 'S1' });
    const payment = supplierService.recordPayment(supplier.id, { amount: 500, status: 'pending', dueDate: '2024-12-31' });
    expect(payment.amount).toBe(500);
    expect(payment.status).toBe('pending');
  });

  test('reject invalid payment status', () => {
    const project = projectService.createProject({ name: 'P1', createdBy: 'u1' });
    const supplier = supplierService.addSupplier({ projectId: project.id, name: 'S1' });
    expect(() => supplierService.recordPayment(supplier.id, { amount: 100, status: 'unknown' }))
      .toThrow('Status must be pending, paid, or overdue');
  });

  test('reconcile with no discrepancies', () => {
    const project = projectService.createProject({ name: 'P1', createdBy: 'u1' });
    const supplier = supplierService.addSupplier({ projectId: project.id, name: 'S1' });
    supplierService.recordPayment(supplier.id, { amount: 500, status: 'paid', dueDate: '2024-12-31' });
    supplierService.recordPayment(supplier.id, { amount: 300, status: 'pending', dueDate: '2099-12-31' });

    const result = supplierService.reconcile(supplier.id);
    expect(result.totalPaid).toBe(500);
    expect(result.totalPending).toBe(300);
    expect(result.discrepancies).toHaveLength(0);
  });

  test('reconcile detects overdue pending payments', () => {
    const project = projectService.createProject({ name: 'P1', createdBy: 'u1' });
    const supplier = supplierService.addSupplier({ projectId: project.id, name: 'S1' });
    supplierService.recordPayment(supplier.id, { amount: 500, status: 'pending', dueDate: '2020-01-01' });

    const result = supplierService.reconcile(supplier.id);
    expect(result.discrepancies).toHaveLength(1);
    expect(result.discrepancies[0].issue).toContain('Due date passed');
  });

  test('reconcile totals are correct', () => {
    const project = projectService.createProject({ name: 'P1', createdBy: 'u1' });
    const supplier = supplierService.addSupplier({ projectId: project.id, name: 'S1' });
    supplierService.recordPayment(supplier.id, { amount: 100, status: 'paid' });
    supplierService.recordPayment(supplier.id, { amount: 200, status: 'pending' });
    supplierService.recordPayment(supplier.id, { amount: 300, status: 'overdue' });

    const result = supplierService.reconcile(supplier.id);
    expect(result.total).toBe(600);
    expect(result.totalPaid).toBe(100);
    expect(result.totalPending).toBe(200);
    expect(result.totalOverdue).toBe(300);
    expect(result.paymentCount).toBe(3);
  });
});
