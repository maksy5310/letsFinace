class SupplierService {
  constructor(store) {
    this.store = store;
  }

  addSupplier({ projectId, name, contact }) {
    if (!projectId || !name) throw new Error('ProjectId and supplier name are required');
    const project = this.store.getProject(projectId);
    if (!project) throw new Error('Project not found');
    return this.store.createSupplier({ projectId, name, contact: contact || '' });
  }

  listSuppliers(projectId) {
    return this.store.listSuppliersByProject(projectId);
  }

  recordPayment(supplierId, { amount, status, dueDate, description }) {
    if (!amount || !status) throw new Error('Amount and status are required');
    if (!['pending', 'paid', 'overdue'].includes(status)) {
      throw new Error('Status must be pending, paid, or overdue');
    }
    const supplier = this.store.getSupplier(supplierId);
    if (!supplier) throw new Error('Supplier not found');
    return this.store.addPayment(supplierId, {
      amount,
      status,
      dueDate: dueDate || new Date().toISOString(),
      description: description || '',
      recordedAt: new Date().toISOString()
    });
  }

  reconcile(supplierId) {
    const supplier = this.store.getSupplier(supplierId);
    if (!supplier) throw new Error('Supplier not found');

    const totalPending = supplier.payments.filter(p => p.status === 'pending').reduce((s, p) => s + p.amount, 0);
    const totalPaid = supplier.payments.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0);
    const totalOverdue = supplier.payments.filter(p => p.status === 'overdue').reduce((s, p) => s + p.amount, 0);
    const total = totalPending + totalPaid + totalOverdue;

    const now = new Date();
    const discrepancies = supplier.payments.filter(p => {
      if (p.status === 'pending' && new Date(p.dueDate) < now) {
        return true;
      }
      return false;
    });

    return {
      supplierId,
      supplierName: supplier.name,
      paymentCount: supplier.payments.length,
      total,
      totalPending,
      totalPaid,
      totalOverdue,
      discrepancies: discrepancies.map(d => ({ ...d, issue: 'Due date passed but status is still pending' }))
    };
  }
}

module.exports = { SupplierService };
