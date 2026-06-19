/**
 * Excel import/export using SheetJS (xlsx).
 * For demo, we implement JSON-based simulation.
 */
class ExcelService {
  constructor(store) {
    this.store = store;
  }

  importTransactions(projectId, rows) {
    if (!Array.isArray(rows)) throw new Error('Rows must be an array');
    const results = { imported: 0, failed: [], rows: [] };

    for (const [index, row] of rows.entries()) {
      const errors = [];
      if (!row.type || !['income', 'expense'].includes(row.type)) errors.push('Invalid type');
      if (typeof row.amount !== 'number' || row.amount < 0) errors.push('Invalid amount');
      if (!row.date) errors.push('Missing date');

      if (errors.length > 0) {
        results.failed.push({ row: index + 1, data: row, errors });
        continue;
      }

      const tx = this.store.createTransaction({
        projectId,
        type: row.type,
        amount: row.amount,
        date: new Date(row.date).toISOString(),
        description: row.description || '',
        category: row.category || 'general',
        recordedBy: row.recordedBy || 'import'
      });
      results.imported++;
      results.rows.push(tx);
    }

    return results;
  }

  exportReport(projectId) {
    const project = this.store.getProject(projectId);
    if (!project) throw new Error('Project not found');

    const txs = this.store.listTransactionsByProject(projectId);
    const invoices = this.store.listInvoicesByProject(projectId);
    const suppliers = this.store.listSuppliersByProject(projectId);

    const income = txs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expense = txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

    return {
      projectName: project.name,
      generatedAt: new Date().toISOString(),
      summary: { income, expense, net: income - expense, transactionCount: txs.length },
      transactions: txs,
      invoices,
      suppliers
    };
  }
}

module.exports = { ExcelService };
