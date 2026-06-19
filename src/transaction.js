class TransactionService {
  constructor(store) {
    this.store = store;
  }

  recordTransaction({ projectId, type, amount, date, description, category, recordedBy }) {
    if (!projectId || !type || amount === undefined || !recordedBy) {
      throw new Error('ProjectId, type, amount, and recordedBy are required');
    }
    if (!['income', 'expense'].includes(type)) {
      throw new Error('Type must be income or expense');
    }
    if (typeof amount !== 'number' || amount < 0) {
      throw new Error('Amount must be a non-negative number');
    }
    const project = this.store.getProject(projectId);
    if (!project) throw new Error('Project not found');

    return this.store.createTransaction({
      projectId,
      type,
      amount,
      date: date || new Date().toISOString(),
      description: description || '',
      category: category || 'general',
      recordedBy
    });
  }

  listTransactions(projectId) {
    return this.store.listTransactionsByProject(projectId);
  }

  filterTransactions(projectId, filters) {
    return this.store.filterTransactions(projectId, filters);
  }

  getTotals(projectId, filters = {}) {
    const txs = this.store.filterTransactions(projectId, filters);
    const income = txs.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expense = txs.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    return { income, expense, net: income - expense, count: txs.length };
  }
}

module.exports = { TransactionService };
