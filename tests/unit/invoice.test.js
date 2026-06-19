const { Store } = require('../../src/store');
const { ProjectService } = require('../../src/project');
const { InvoiceService } = require('../../src/invoice');

describe('InvoiceService', () => {
  let store, projectService, invoiceService;

  beforeEach(() => {
    store = new Store();
    projectService = new ProjectService(store);
    invoiceService = new InvoiceService(store);
  });

  describe('uploadInvoice', () => {
    test('uploads invoice and extracts OCR data', () => {
      const project = projectService.createProject({ name: 'P1', createdBy: 'user-1' });
      const invoice = invoiceService.uploadInvoice({ projectId: project.id, fileName: 'invoice_001.jpg' });
      expect(invoice.id).toMatch(/^invoice-/);
      expect(invoice.projectId).toBe(project.id);
      expect(invoice.fileName).toBe('invoice_001.jpg');
      expect(invoice.amount).toBeGreaterThan(0);
      expect(invoice.invoiceNumber).toMatch(/^INV-/);
      expect(invoice.date).toBeDefined();
      expect(invoice.ocrData).toBeDefined();
      expect(invoice.ocrData.confidence).toBe(0.92);
    });

    test('links invoice to transaction', () => {
      const project = projectService.createProject({ name: 'P1', createdBy: 'user-1' });
      const invoice = invoiceService.uploadInvoice({ projectId: project.id, fileName: 'inv.jpg', transactionId: 'tx-1' });
      expect(invoice.transactionId).toBe('tx-1');
    });

    test('defaults transactionId to null', () => {
      const project = projectService.createProject({ name: 'P1', createdBy: 'user-1' });
      const invoice = invoiceService.uploadInvoice({ projectId: project.id, fileName: 'inv.jpg' });
      expect(invoice.transactionId).toBeNull();
    });

    test('throws when projectId is missing', () => {
      expect(() => invoiceService.uploadInvoice({ fileName: 'inv.jpg' }))
        .toThrow('ProjectId and fileName are required');
    });

    test('throws when fileName is missing', () => {
      expect(() => invoiceService.uploadInvoice({ projectId: 'project-1' }))
        .toThrow('ProjectId and fileName are required');
    });

    test('throws when project not found', () => {
      expect(() => invoiceService.uploadInvoice({ projectId: 'nonexistent', fileName: 'inv.jpg' }))
        .toThrow('Project not found');
    });

    test('sets uploadedAt timestamp', () => {
      const project = projectService.createProject({ name: 'P1', createdBy: 'user-1' });
      const invoice = invoiceService.uploadInvoice({ projectId: project.id, fileName: 'inv.jpg' });
      expect(invoice.uploadedAt).toBeDefined();
      expect(new Date(invoice.uploadedAt).getTime()).not.toBeNaN();
    });
  });

  describe('listInvoices', () => {
    test('returns empty array for project with no invoices', () => {
      const project = projectService.createProject({ name: 'P1', createdBy: 'user-1' });
      expect(invoiceService.listInvoices(project.id)).toEqual([]);
    });

    test('returns all invoices for a project', () => {
      const project = projectService.createProject({ name: 'P1', createdBy: 'user-1' });
      invoiceService.uploadInvoice({ projectId: project.id, fileName: 'inv1.jpg' });
      invoiceService.uploadInvoice({ projectId: project.id, fileName: 'inv2.jpg' });
      expect(invoiceService.listInvoices(project.id)).toHaveLength(2);
    });

    test('does not return invoices from other projects', () => {
      const p1 = projectService.createProject({ name: 'P1', createdBy: 'user-1' });
      const p2 = projectService.createProject({ name: 'P2', createdBy: 'user-2' });
      invoiceService.uploadInvoice({ projectId: p1.id, fileName: 'inv1.jpg' });
      invoiceService.uploadInvoice({ projectId: p2.id, fileName: 'inv2.jpg' });
      expect(invoiceService.listInvoices(p1.id)).toHaveLength(1);
      expect(invoiceService.listInvoices(p1.id)[0].fileName).toBe('inv1.jpg');
    });
  });

  describe('_mockOCR', () => {
    test('produces deterministic output for same filename', () => {
      const project = projectService.createProject({ name: 'P1', createdBy: 'user-1' });
      const inv1 = invoiceService.uploadInvoice({ projectId: project.id, fileName: 'same_name.jpg' });
      const inv2 = invoiceService.uploadInvoice({ projectId: project.id, fileName: 'same_name.jpg' });
      expect(inv1.amount).toBe(inv2.amount);
      expect(inv1.invoiceNumber).toBe(inv2.invoiceNumber);
      expect(inv1.date).toBe(inv2.date);
    });

    test('produces different output for different filenames', () => {
      const project = projectService.createProject({ name: 'P1', createdBy: 'user-1' });
      const inv1 = invoiceService.uploadInvoice({ projectId: project.id, fileName: 'file_a.jpg' });
      const inv2 = invoiceService.uploadInvoice({ projectId: project.id, fileName: 'file_b.jpg' });
      expect(inv1.amount).not.toBe(inv2.amount);
    });
  });
});
