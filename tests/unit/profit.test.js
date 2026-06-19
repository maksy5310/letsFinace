const { Store } = require('../../src/store');
const { ProjectService } = require('../../src/project');
const { TransactionService } = require('../../src/transaction');
const { ProfitService } = require('../../src/profit');

describe('ProfitService', () => {
  let store, projectService, transactionService, profitService;

  beforeEach(() => {
    store = new Store();
    projectService = new ProjectService(store);
    transactionService = new TransactionService(store);
    profitService = new ProfitService(store);
  });

  test('calculateProfit with positive net profit', () => {
    const project = projectService.createProject({ name: 'Test', createdBy: 'user-a' });
    projectService.addMember(project.id, { userId: 'user-b', role: 'editor', ratio: 0.4 });
    projectService.setPartnerRatios(project.id, { 'user-a': 0.6, 'user-b': 0.4 });

    transactionService.recordTransaction({ projectId: project.id, type: 'income', amount: 10000, recordedBy: 'user-a' });
    transactionService.recordTransaction({ projectId: project.id, type: 'expense', amount: 3000, recordedBy: 'user-a' });

    const result = profitService.calculateProfit(project.id);

    expect(result.totalIncome).toBe(10000);
    expect(result.totalExpense).toBe(3000);
    expect(result.netProfit).toBe(7000);
    expect(result.isProfit).toBe(true);
    expect(result.distribution).toHaveLength(2);
    expect(result.distribution.find(d => d.userId === 'user-a').share).toBe(4200);
    expect(result.distribution.find(d => d.userId === 'user-b').share).toBe(2800);
  });

  test('calculateProfit with loss', () => {
    const project = projectService.createProject({ name: 'Loss Project', createdBy: 'user-a' });
    projectService.addMember(project.id, { userId: 'user-b', role: 'editor', ratio: 0.5 });
    projectService.setPartnerRatios(project.id, { 'user-a': 0.5, 'user-b': 0.5 });

    transactionService.recordTransaction({ projectId: project.id, type: 'income', amount: 2000, recordedBy: 'user-a' });
    transactionService.recordTransaction({ projectId: project.id, type: 'expense', amount: 5000, recordedBy: 'user-a' });

    const result = profitService.calculateProfit(project.id);

    expect(result.netProfit).toBe(-3000);
    expect(result.isProfit).toBe(false);
    expect(result.distribution.find(d => d.userId === 'user-a').share).toBe(-1500);
    expect(result.distribution.find(d => d.userId === 'user-b').share).toBe(-1500);
  });

  test('calculateProfit with no transactions returns zero', () => {
    const project = projectService.createProject({ name: 'Empty', createdBy: 'user-a' });
    const result = profitService.calculateProfit(project.id);

    expect(result.totalIncome).toBe(0);
    expect(result.totalExpense).toBe(0);
    expect(result.netProfit).toBe(0);
    expect(result.distribution).toHaveLength(1);
  });

  test('simulateScenario adds hypothetical amounts', () => {
    const project = projectService.createProject({ name: 'Sim', createdBy: 'user-a' });
    projectService.addMember(project.id, { userId: 'user-b', role: 'editor', ratio: 0.5 });
    projectService.setPartnerRatios(project.id, { 'user-a': 0.5, 'user-b': 0.5 });

    transactionService.recordTransaction({ projectId: project.id, type: 'income', amount: 5000, recordedBy: 'user-a' });
    transactionService.recordTransaction({ projectId: project.id, type: 'expense', amount: 2000, recordedBy: 'user-a' });

    const result = profitService.simulateScenario(project.id, { additionalIncome: 1000, additionalExpense: 500 });

    expect(result.simulatedNet).toBe(3500);
    expect(result.additionalIncome).toBe(1000);
    expect(result.additionalExpense).toBe(500);
    expect(result.simulatedDistribution.find(d => d.userId === 'user-a').share).toBe(1750);
  });

  test('throws when project not found', () => {
    expect(() => profitService.calculateProfit('nonexistent')).toThrow('Project not found');
  });
});
