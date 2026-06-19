class ProfitService {
  constructor(store) {
    this.store = store;
  }

  calculateProfit(projectId) {
    const project = this.store.getProject(projectId);
    if (!project) throw new Error('Project not found');

    const txs = this.store.listTransactionsByProject(projectId);
    const totalIncome = txs.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = txs.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const netProfit = totalIncome - totalExpense;

    const partners = project.members.filter(m => m.ratio > 0);
    const distribution = partners.map(p => ({
      userId: p.userId,
      role: p.role,
      ratio: p.ratio,
      share: netProfit * p.ratio
    }));

    return {
      projectId,
      totalIncome,
      totalExpense,
      netProfit,
      isProfit: netProfit >= 0,
      partnerCount: partners.length,
      distribution
    };
  }

  simulateScenario(projectId, { additionalIncome = 0, additionalExpense = 0 }) {
    const base = this.calculateProfit(projectId);
    const simulatedNet = base.netProfit + additionalIncome - additionalExpense;
    return {
      ...base,
      simulatedNet,
      additionalIncome,
      additionalExpense,
      simulatedDistribution: base.distribution.map(d => ({
        ...d,
        share: simulatedNet * d.ratio
      }))
    };
  }
}

module.exports = { ProfitService };
