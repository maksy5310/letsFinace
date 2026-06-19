const express = require('express');
const { Store } = require('./store');
const { ProjectService } = require('./project');
const { TransactionService } = require('./transaction');
const { ProfitService } = require('./profit');
const { SupplierService } = require('./supplier');
const { InvoiceService } = require('./invoice');
const { ExcelService } = require('./excel');
const { UserService, ROLE_DEFINITIONS } = require('./user');

function createApp() {
  const app = express();
  app.use(express.json());

  const store = new Store();
  const projectService = new ProjectService(store);
  const transactionService = new TransactionService(store);
  const profitService = new ProfitService(store);
  const supplierService = new SupplierService(store);
  const invoiceService = new InvoiceService(store);
  const excelService = new ExcelService(store);
  const userService = new UserService(store);

  // Projects
  app.post('/api/projects', (req, res) => {
    try {
      const project = projectService.createProject(req.body);
      res.status(201).json(project);
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  });

  app.get('/api/projects', (req, res) => {
    res.json(projectService.listProjects());
  });

  app.get('/api/projects/:id', (req, res) => {
    const project = projectService.getProject(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json(project);
  });

  app.post('/api/projects/:id/members', (req, res) => {
    try {
      const project = projectService.addMember(req.params.id, req.body);
      res.json(project);
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  });

  app.post('/api/projects/:id/ratios', (req, res) => {
    try {
      const project = projectService.setPartnerRatios(req.params.id, req.body);
      res.json(project);
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  });

  // Transactions
  app.post('/api/projects/:id/transactions', (req, res) => {
    try {
      const tx = transactionService.recordTransaction({ projectId: req.params.id, ...req.body });
      res.status(201).json(tx);
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  });

  app.get('/api/projects/:id/transactions', (req, res) => {
    const filters = {
      from: req.query.from,
      to: req.query.to,
      category: req.query.category,
      type: req.query.type
    };
    const txs = transactionService.filterTransactions(req.params.id, filters);
    res.json(txs);
  });

  app.get('/api/projects/:id/totals', (req, res) => {
    const filters = { from: req.query.from, to: req.query.to };
    res.json(transactionService.getTotals(req.params.id, filters));
  });

  // Profit
  app.get('/api/projects/:id/profit', (req, res) => {
    try {
      const result = profitService.calculateProfit(req.params.id);
      res.json(result);
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  });

  app.post('/api/projects/:id/profit/simulate', (req, res) => {
    try {
      const result = profitService.simulateScenario(req.params.id, req.body);
      res.json(result);
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  });

  // Suppliers
  app.post('/api/projects/:id/suppliers', (req, res) => {
    try {
      const supplier = supplierService.addSupplier({ projectId: req.params.id, ...req.body });
      res.status(201).json(supplier);
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  });

  app.get('/api/projects/:id/suppliers', (req, res) => {
    res.json(supplierService.listSuppliers(req.params.id));
  });

  app.post('/api/suppliers/:sid/payments', (req, res) => {
    try {
      const payment = supplierService.recordPayment(req.params.sid, req.body);
      res.status(201).json(payment);
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  });

  app.get('/api/suppliers/:sid/reconcile', (req, res) => {
    try {
      const result = supplierService.reconcile(req.params.sid);
      res.json(result);
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  });

  // Invoices
  app.post('/api/projects/:id/invoices', (req, res) => {
    try {
      const invoice = invoiceService.uploadInvoice({ projectId: req.params.id, ...req.body });
      res.status(201).json(invoice);
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  });

  app.get('/api/projects/:id/invoices', (req, res) => {
    res.json(invoiceService.listInvoices(req.params.id));
  });

  // Excel
  app.post('/api/projects/:id/import', (req, res) => {
    try {
      const result = excelService.importTransactions(req.params.id, req.body.rows);
      res.json(result);
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  });

  app.get('/api/projects/:id/export', (req, res) => {
    try {
      const result = excelService.exportReport(req.params.id);
      res.json(result);
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  });

  // Health
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // ===== User Management =====

  // Create user
  app.post('/api/users', (req, res) => {
    try {
      const user = userService.createUser(req.body);
      res.status(201).json(user);
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  });

  // List users (optional filter by role)
  app.get('/api/users', (req, res) => {
    try {
      const users = userService.listUsers(req.query.role);
      res.json(users);
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  });

  // Get user
  app.get('/api/users/:id', (req, res) => {
    try {
      const user = userService.getUser(req.params.id);
      res.json(user);
    } catch (e) {
      res.status(404).json({ error: e.message });
    }
  });

  // Update user
  app.put('/api/users/:id', (req, res) => {
    try {
      const user = userService.updateUser(req.params.id, req.body);
      res.json(user);
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  });

  // Change user role
  app.put('/api/users/:id/role', (req, res) => {
    try {
      const user = userService.changeRole(req.params.id, req.body.role);
      res.json(user);
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  });

  // Deactivate user
  app.put('/api/users/:id/deactivate', (req, res) => {
    try {
      const user = userService.deactivateUser(req.params.id);
      res.json(user);
    } catch (e) {
      res.status(404).json({ error: e.message });
    }
  });

  // Activate user
  app.put('/api/users/:id/activate', (req, res) => {
    try {
      const user = userService.activateUser(req.params.id);
      res.json(user);
    } catch (e) {
      res.status(404).json({ error: e.message });
    }
  });

  // Check permission
  app.get('/api/users/:id/permissions', (req, res) => {
    try {
      const info = userService.getUserRoleInfo(req.params.id);
      res.json(info);
    } catch (e) {
      res.status(404).json({ error: e.message });
    }
  });

  // Get role definitions
  app.get('/api/roles', (req, res) => {
    res.json(userService.getRoleDefinitions());
  });

  // Get user stats
  app.get('/api/users/stats/summary', (req, res) => {
    res.json(userService.getUserStats());
  });

  return { app, store };
}

module.exports = { createApp };
