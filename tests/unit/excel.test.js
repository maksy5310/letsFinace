const { Store } = require('../../src/store');
const { ProjectService } = require('../../src/project');
const { ExcelService } = require('../../src/excel');

describe('ExcelService', () => {
  let store, projectService, excelService;

  beforeEach(() => {
    store = new Store();
    projectService = new ProjectService(store);
    excelService = new ExcelService(store);
  });

  describe('importTransactions', () => {
    test('imports valid rows', () => {
      const project = projectService.createProject({ name: 'P1', createdBy: 'user-1' });
      const rows = [
        { type: 'income', amount: 5000, date: '2024-01-15', description: 'Payment A' },
        { type: 'expense', amount: 1200, date: '2024-01-20', description: 'Material cost' }
      ];
      const result = excelService.importTransactions(project.id, rows);
      expect(result.imported).toBe(2);
      expect(result.failed).toHaveLength(0);
    });

    test('reports invalid rows with reasons', () => {
      const project = projectService.createProject({ name: 'P1', createdBy: 'user-1' });
      const rows = [
        { type: 'income', amount: 5000, date: '2024-01-15' },
        { type: 'bad_type', amount: 100, date: '2024-01-20' },
        { type: 'expense', amount: -50, date: '2024-01-20' },
        { type: 'income', amount: 3000 }
      ];
      const result = excelService.importTransactions(project.id, rows);
      expect(result.imported).toBe(1);
      expect(result.failed).toHaveLength(3);
      expect(result.failed[0].errors).toContain('Invalid type');
      expect(result.failed[1].errors).toContain('Invalid amount');
      expect(result.failed[2].errors).toContain('Missing date');
    });

    test('handles empty rows array', () => {
      const project = projectService.createProject({ name: 'P1', createdBy: 'user-1' });
      const result = excelService.importTransactions(project.id, []);
      expect(result.imported).toBe(0);
      expect(result.failed).toHaveLength(0);
      expect(result.rows).toHaveLength(0);
    });

    test('throws when rows is not an array', () => {
      const project = projectService.createProject({ name: 'P1', createdBy: 'user-1' });
      expect(() => excelService.importTransactions(project.id, 'not an array'))
        .toThrow('Rows must be an array');
    });

    test('defaults category and recordedBy for imported rows', () => {
      const project = projectService.createProject({ name: 'P1', createdBy: 'user-1' });
      const rows = [{ type: 'income', amount: 1000, date: '2024-01-15' }];
      const result = excelService.importTransactions(project.id, rows);
      expect(result.rows[0].category).toBe('general');
      expect(result.rows[0].recordedBy).toBe('import');
    });

    test('uses provided category and recordedBy', () => {
      const project = projectService.createProject({ name: 'P1', createdBy: 'user-1' });
      const rows = [{ type: 'income', amount: 1000, date: '2024-01-15', category: 'service', recordedBy: 'user-1' }];
      const result = excelService.importTransactions(project.id, rows);
      expect(result.rows[0].category).toBe('service');
      expect(result.rows[0].recordedBy).toBe('user-1');
    });
  });

  describe('exportReport', () => {
    test('exports complete report', () => {
      const project = projectService.createProject({ name: 'Export Test', createdBy: 'user-1' });
      store.createTransaction({ projectId: project.id, type: 'income', amount: 10000, date: '2024-06-01' });
      store.createTransaction({ projectId: project.id, type: 'expense', amount: 3000, date: '2024-06-05' });
      store.createInvoice({ projectId: project.id, fileName: 'inv.jpg', amount: 500 });

      const report = excelService.exportReport(project.id);
      expect(report.projectName).toBe('Export Test');
      expect(report.generatedAt).toBeDefined();
      expect(report.summary.income).toBe(10000);
      expect(report.summary.expense).toBe(3000);
      expect(report.summary.net).toBe(7000);
      expect(report.summary.transactionCount).toBe(2);
      expect(report.transactions).toHaveLength(2);
      expect(report.invoices).toHaveLength(1);
    });

    test('exports empty project', () => {
      const project = projectService.createProject({ name: 'Empty', createdBy: 'user-1' });
      const report = excelService.exportReport(project.id);
      expect(report.summary.income).toBe(0);
      expect(report.summary.expense).toBe(0);
      expect(report.summary.net).toBe(0);
      expect(report.summary.transactionCount).toBe(0);
      expect(report.transactions).toHaveLength(0);
      expect(report.invoices).toHaveLength(0);
      expect(report.suppliers).toHaveLength(0);
    });

    test('throws when project not found', () => {
      expect(() => excelService.exportReport('nonexistent'))
        .toThrow('Project not found');
    });
  });
});
