/**
 * User Management Service
 * Roles: admin(管理员), partner(合伙人), accountant(会计), cashier(出纳),
 *        developer(开发商), supplier(供应商), auditor(审计), friend(朋友)
 *
 * Permission Matrix:
 * - admin:     全部权限
 * - partner:   项目管理、成员管理、交易记录、利润查看、报表、供应商查看
 * - accountant: 交易记录、利润查看、发票管理、导入导出、报表
 * - cashier:   交易记录(支出)、供应商付款、发票查看
 * - developer: 项目管理、交易记录、利润查看、报表
 * - supplier:  查看供应商信息、查看相关付款记录
 * - auditor:   只读查看全部财务数据（项目、交易、利润、供应商、发票、报表）
 * - friend:    只读查看项目概况和利润分配
 */
const ROLE_DEFINITIONS = {
  admin: {
    label: '管理员',
    permissions: [
      'project.create', 'project.read', 'project.update', 'project.delete',
      'member.manage', 'transaction.create', 'transaction.read',
      'profit.read', 'profit.simulate',
      'supplier.create', 'supplier.read', 'supplier.pay', 'supplier.reconcile',
      'invoice.create', 'invoice.read',
      'user.manage',
      'import', 'export', 'report.read'
    ]
  },
  partner: {
    label: '合伙人',
    permissions: [
      'project.create', 'project.read', 'project.update',
      'member.manage', 'transaction.create', 'transaction.read',
      'profit.read', 'profit.simulate',
      'supplier.read', 'supplier.reconcile',
      'invoice.read',
      'report.read'
    ]
  },
  accountant: {
    label: '会计',
    permissions: [
      'transaction.create', 'transaction.read',
      'profit.read', 'profit.simulate',
      'invoice.create', 'invoice.read',
      'import', 'export', 'report.read'
    ]
  },
  cashier: {
    label: '出纳',
    permissions: [
      'transaction.create', 'transaction.read',
      'supplier.read', 'supplier.pay',
      'invoice.read'
    ]
  },
  developer: {
    label: '开发商',
    permissions: [
      'project.create', 'project.read', 'project.update',
      'transaction.create', 'transaction.read',
      'profit.read',
      'report.read'
    ]
  },
  supplier: {
    label: '供应商',
    permissions: [
      'supplier.read',
      'invoice.read'
    ]
  },
  auditor: {
    label: '审计',
    permissions: [
      'project.read',
      'transaction.read',
      'profit.read',
      'supplier.read',
      'invoice.read',
      'report.read'
    ]
  },
  friend: {
    label: '朋友',
    permissions: [
      'project.read',
      'profit.read',
      'report.read'
    ]
  }
};

class UserService {
  constructor(store) {
    this.store = store;
  }

  createUser({ name, email, phone, role }) {
    if (!name) throw new Error('User name is required');
    if (!role) throw new Error('User role is required');
    if (!ROLE_DEFINITIONS[role]) {
      throw new Error(`Invalid role: ${role}. Valid roles: ${Object.keys(ROLE_DEFINITIONS).join(', ')}`);
    }
    const user = this.store.createUser({
      name, email: email || '', phone: phone || '', role,
      status: 'active', createdAt: new Date().toISOString()
    });
    return user;
  }

  getUser(id) {
    const user = this.store.getUser(id);
    if (!user) throw new Error('User not found');
    return user;
  }

  listUsers(role) {
    const users = Array.from(this.store.users.values());
    if (role) {
      if (!ROLE_DEFINITIONS[role]) throw new Error(`Invalid role: ${role}`);
      return users.filter(u => u.role === role);
    }
    return users;
  }

  updateUser(id, updates) {
    const user = this.store.getUser(id);
    if (!user) throw new Error('User not found');
    if (updates.name !== undefined) user.name = updates.name;
    if (updates.email !== undefined) user.email = updates.email;
    if (updates.phone !== undefined) user.phone = updates.phone;
    if (updates.status !== undefined) {
      if (!['active', 'inactive', 'suspended'].includes(updates.status)) {
        throw new Error('Invalid status. Must be: active, inactive, suspended');
      }
      user.status = updates.status;
    }
    return user;
  }

  changeRole(id, newRole) {
    const user = this.store.getUser(id);
    if (!user) throw new Error('User not found');
    if (!ROLE_DEFINITIONS[newRole]) throw new Error(`Invalid role: ${newRole}`);
    user.role = newRole;
    return user;
  }

  deactivateUser(id) {
    const user = this.store.getUser(id);
    if (!user) throw new Error('User not found');
    user.status = 'inactive';
    return user;
  }

  activateUser(id) {
    const user = this.store.getUser(id);
    if (!user) throw new Error('User not found');
    user.status = 'active';
    return user;
  }

  hasPermission(userId, permission) {
    const user = this.store.getUser(userId);
    if (!user) return false;
    if (user.status !== 'active') return false;
    const roleDef = ROLE_DEFINITIONS[user.role];
    return roleDef ? roleDef.permissions.includes(permission) : false;
  }

  getRoleDefinitions() {
    return Object.entries(ROLE_DEFINITIONS).map(([key, def]) => ({
      role: key, label: def.label, permissions: def.permissions
    }));
  }

  getUserRoleInfo(userId) {
    const user = this.store.getUser(userId);
    if (!user) throw new Error('User not found');
    const roleDef = ROLE_DEFINITIONS[user.role];
    return {
      userId: user.id, name: user.name, role: user.role,
      label: roleDef.label, permissions: roleDef.permissions, status: user.status
    };
  }

  getUserStats() {
    const users = Array.from(this.store.users.values());
    const stats = {};
    for (const [key, def] of Object.entries(ROLE_DEFINITIONS)) {
      stats[key] = { label: def.label, count: 0, active: 0 };
    }
    users.forEach(u => {
      if (stats[u.role]) { stats[u.role].count++; if (u.status === 'active') stats[u.role].active++; }
    });
    return stats;
  }
}

module.exports = { UserService, ROLE_DEFINITIONS };
