/**
 * In-memory data store for demo purposes.
 * All data is lost on process restart.
 */
class Store {
  constructor() {
    this.projects = new Map();
    this.transactions = new Map();
    this.suppliers = new Map();
    this.invoices = new Map();
    this.users = new Map();
    this._counters = { project: 0, transaction: 0, supplier: 0, invoice: 0, user: 0 };
  }

  _nextId(entity) {
    this._counters[entity] = (this._counters[entity] || 0) + 1;
    return `${entity}-${this._counters[entity]}`;
  }

  // Projects
  createProject(data) {
    const id = this._nextId('project');
    const project = { id, ...data, members: data.members || [], createdAt: new Date().toISOString() };
    this.projects.set(id, project);
    return project;
  }

  getProject(id) {
    return this.projects.get(id) || null;
  }

  listProjects() {
    return Array.from(this.projects.values());
  }

  addMember(projectId, member) {
    const project = this.projects.get(projectId);
    if (!project) return null;
    project.members.push(member);
    return project;
  }

  // Transactions
  createTransaction(data) {
    const id = this._nextId('transaction');
    const tx = { id, ...data, date: data.date || new Date().toISOString() };
    this.transactions.set(id, tx);
    return tx;
  }

  getTransaction(id) {
    return this.transactions.get(id) || null;
  }

  listTransactionsByProject(projectId) {
    return Array.from(this.transactions.values()).filter(t => t.projectId === projectId);
  }

  filterTransactions(projectId, filters) {
    let txs = this.listTransactionsByProject(projectId);
    if (filters.from) {
      txs = txs.filter(t => new Date(t.date) >= new Date(filters.from));
    }
    if (filters.to) {
      txs = txs.filter(t => new Date(t.date) <= new Date(filters.to));
    }
    if (filters.category) {
      txs = txs.filter(t => t.category === filters.category);
    }
    if (filters.type) {
      txs = txs.filter(t => t.type === filters.type);
    }
    return txs;
  }

  // Suppliers
  createSupplier(data) {
    const id = this._nextId('supplier');
    const supplier = { id, ...data, payments: [] };
    this.suppliers.set(id, supplier);
    return supplier;
  }

  getSupplier(id) {
    return this.suppliers.get(id) || null;
  }

  listSuppliersByProject(projectId) {
    return Array.from(this.suppliers.values()).filter(s => s.projectId === projectId);
  }

  addPayment(supplierId, payment) {
    const supplier = this.suppliers.get(supplierId);
    if (!supplier) return null;
    const pid = this._nextId('payment');
    const p = { id: pid, ...payment };
    supplier.payments.push(p);
    return p;
  }

  // Invoices
  createInvoice(data) {
    const id = this._nextId('invoice');
    const invoice = { id, ...data, uploadedAt: new Date().toISOString() };
    this.invoices.set(id, invoice);
    return invoice;
  }

  listInvoicesByProject(projectId) {
    return Array.from(this.invoices.values()).filter(i => i.projectId === projectId);
  }

  // Users
  createUser(data) {
    const id = this._nextId('user');
    const user = { id, ...data };
    this.users.set(id, user);
    return user;
  }

  getUser(id) {
    return this.users.get(id) || null;
  }

  clear() {
    this.projects.clear();
    this.transactions.clear();
    this.suppliers.clear();
    this.invoices.clear();
    this.users.clear();
    this._counters = { project: 0, transaction: 0, supplier: 0, invoice: 0, user: 0 };
  }
}

module.exports = { Store };
