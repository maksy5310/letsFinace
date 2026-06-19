const { Store } = require('../../src/store');
const { ProjectService } = require('../../src/project');
const { TransactionService } = require('../../src/transaction');

describe('TransactionService', () => {
  let store, projectService, transactionService;

  beforeEach(() => {
    store = new Store();
    projectService = new ProjectService(store);
    transactionService = new TransactionService(store);
  });

  test('record income transaction', () => {
    const project = projectService.createProject({ name: 'P1', createdBy: 'u1' });
    const tx = transactionService.recordTransaction({
      projectId: project.id, type: 'income', amount: 5000, recordedBy: 'u1'
    });
    expect(tx.type).toBe('income');
    expect(tx.amount).toBe(5000);
    expect(tx.projectId).toBe(project.id);
  });

  test('record expense transaction', () => {
    const project = projectService.createProject({ name: 'P1', createdBy: 'u1' });
    const tx = transactionService.recordTransaction({
      projectId: project.id, type: 'expense', amount: 1200, recordedBy: 'u1'
    });
    expect(tx.type).toBe('expense');
    expect(tx.amount).toBe(1200);
  });

  test('reject negative amount', () => {
    const project = projectService.createProject({ name: 'P1', createdBy: 'u1' });
    expect(() => transactionService.recordTransaction({
      projectId: project.id, type: 'income', amount: -100, recordedBy: 'u1'
    })).toThrow('Amount must be a non-negative number');
  });

  test('reject invalid type', () => {
    const project = projectService.createProject({ name: 'P1', createdBy: 'u1' });
    expect(() => transactionService.recordTransaction({
      projectId: project.id, type: 'refund', amount: 100, recordedBy: 'u1'
    })).toThrow('Type must be income or expense');
  });

  test('filter transactions by date range', () => {
    const project = projectService.createProject({ name: 'P1', createdBy: 'u1' });
    transactionService.recordTransaction({ projectId: project.id, type: 'income', amount: 1000, date: '2024-01-10', recordedBy: 'u1' });
    transactionService.recordTransaction({ projectId: project.id, type: 'income', amount: 2000, date: '2024-02-15', recordedBy: 'u1' });
    transactionService.recordTransaction({ projectId: project.id, type: 'expense', amount: 500, date: '2024-03-01', recordedBy: 'u1' });

    const filtered = transactionService.filterTransactions(project.id, { from: '2024-01-01', to: '2024-02-28' });
    expect(filtered).toHaveLength(2);
  });

  test('filter transactions by type', () => {
    const project = projectService.createProject({ name: 'P1', createdBy: 'u1' });
    transactionService.recordTransaction({ projectId: project.id, type: 'income', amount: 1000, recordedBy: 'u1' });
    transactionService.recordTransaction({ projectId: project.id, type: 'expense', amount: 500, recordedBy: 'u1' });

    const incomeOnly = transactionService.filterTransactions(project.id, { type: 'income' });
    expect(incomeOnly).toHaveLength(1);
    expect(incomeOnly[0].type).toBe('income');
  });

  test('getTotals calculates correctly', () => {
    const project = projectService.createProject({ name: 'P1', createdBy: 'u1' });
    transactionService.recordTransaction({ projectId: project.id, type: 'income', amount: 3000, recordedBy: 'u1' });
    transactionService.recordTransaction({ projectId: project.id, type: 'income', amount: 2000, recordedBy: 'u1' });
    transactionService.recordTransaction({ projectId: project.id, type: 'expense', amount: 1500, recordedBy: 'u1' });

    const totals = transactionService.getTotals(project.id);
    expect(totals.income).toBe(5000);
    expect(totals.expense).toBe(1500);
    expect(totals.net).toBe(3500);
    expect(totals.count).toBe(3);
  });

  test('getTotals with date filter', () => {
    const project = projectService.createProject({ name: 'P1', createdBy: 'u1' });
    transactionService.recordTransaction({ projectId: project.id, type: 'income', amount: 1000, date: '2024-01-10', recordedBy: 'u1' });
    transactionService.recordTransaction({ projectId: project.id, type: 'income', amount: 2000, date: '2024-03-10', recordedBy: 'u1' });

    const totals = transactionService.getTotals(project.id, { from: '2024-01-01', to: '2024-02-28' });
    expect(totals.income).toBe(1000);
    expect(totals.count).toBe(1);
  });
});
