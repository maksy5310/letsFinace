const { UserService, ROLE_DEFINITIONS } = require('../../src/user');
const { Store } = require('../../src/store');

describe('UserService', () => {
  let store, service;

  beforeEach(() => {
    store = new Store();
    service = new UserService(store);
  });

  describe('createUser', () => {
    test('should create a user with valid data', () => {
      const user = service.createUser({ name: '张三', email: 'z@test.com', phone: '13800000000', role: 'admin' });
      expect(user.id).toBe('user-1');
      expect(user.name).toBe('张三');
      expect(user.email).toBe('z@test.com');
      expect(user.phone).toBe('13800000000');
      expect(user.role).toBe('admin');
      expect(user.status).toBe('active');
      expect(user.createdAt).toBeDefined();
    });

    test('should throw if name is missing', () => {
      expect(() => service.createUser({ role: 'admin' })).toThrow('User name is required');
    });

    test('should throw if role is missing', () => {
      expect(() => service.createUser({ name: '张三' })).toThrow('User role is required');
    });

    test('should throw for invalid role', () => {
      expect(() => service.createUser({ name: '张三', role: 'superadmin' })).toThrow('Invalid role: superadmin');
    });

    test('should create users with all valid roles', () => {
      const roles = ['admin', 'partner', 'accountant', 'cashier', 'developer', 'supplier', 'auditor', 'friend'];
      roles.forEach(role => {
        const user = service.createUser({ name: `User ${role}`, role });
        expect(user.role).toBe(role);
      });
    });

    test('should create user without optional fields', () => {
      const user = service.createUser({ name: 'Minimal', role: 'friend' });
      expect(user.email).toBe('');
      expect(user.phone).toBe('');
    });
  });

  describe('getUser', () => {
    test('should get user by id', () => {
      const created = service.createUser({ name: '张三', role: 'admin' });
      const user = service.getUser(created.id);
      expect(user.name).toBe('张三');
    });

    test('should throw if user not found', () => {
      expect(() => service.getUser('nonexistent')).toThrow('User not found');
    });
  });

  describe('listUsers', () => {
    test('should list all users', () => {
      service.createUser({ name: 'A', role: 'admin' });
      service.createUser({ name: 'B', role: 'friend' });
      const users = service.listUsers();
      expect(users).toHaveLength(2);
    });

    test('should filter by role', () => {
      service.createUser({ name: 'A', role: 'admin' });
      service.createUser({ name: 'B', role: 'friend' });
      service.createUser({ name: 'C', role: 'admin' });
      const admins = service.listUsers('admin');
      expect(admins).toHaveLength(2);
      admins.forEach(u => expect(u.role).toBe('admin'));
    });

    test('should throw for invalid role filter', () => {
      expect(() => service.listUsers('invalid')).toThrow('Invalid role: invalid');
    });

    test('should return empty array when no users', () => {
      expect(service.listUsers()).toHaveLength(0);
    });
  });

  describe('updateUser', () => {
    test('should update user fields', () => {
      const user = service.createUser({ name: 'Old', role: 'friend' });
      const updated = service.updateUser(user.id, { name: 'New', email: 'new@test.com' });
      expect(updated.name).toBe('New');
      expect(updated.email).toBe('new@test.com');
    });

    test('should throw if user not found', () => {
      expect(() => service.updateUser('nonexistent', { name: 'X' })).toThrow('User not found');
    });

    test('should update status to valid values', () => {
      const user = service.createUser({ name: 'Test', role: 'admin' });
      const deactivated = service.updateUser(user.id, { status: 'inactive' });
      expect(deactivated.status).toBe('inactive');
    });

    test('should throw for invalid status', () => {
      const user = service.createUser({ name: 'Test', role: 'admin' });
      expect(() => service.updateUser(user.id, { status: 'banned' })).toThrow('Invalid status');
    });
  });

  describe('changeRole', () => {
    test('should change user role', () => {
      const user = service.createUser({ name: 'Test', role: 'friend' });
      const updated = service.changeRole(user.id, 'admin');
      expect(updated.role).toBe('admin');
    });

    test('should throw for invalid role', () => {
      const user = service.createUser({ name: 'Test', role: 'friend' });
      expect(() => service.changeRole(user.id, 'superadmin')).toThrow('Invalid role: superadmin');
    });

    test('should throw if user not found', () => {
      expect(() => service.changeRole('nonexistent', 'admin')).toThrow('User not found');
    });
  });

  describe('deactivateUser / activateUser', () => {
    test('should deactivate user', () => {
      const user = service.createUser({ name: 'Test', role: 'admin' });
      const deactivated = service.deactivateUser(user.id);
      expect(deactivated.status).toBe('inactive');
    });

    test('should activate user', () => {
      const user = service.createUser({ name: 'Test', role: 'admin' });
      service.deactivateUser(user.id);
      const activated = service.activateUser(user.id);
      expect(activated.status).toBe('active');
    });

    test('should throw if user not found', () => {
      expect(() => service.deactivateUser('nonexistent')).toThrow('User not found');
      expect(() => service.activateUser('nonexistent')).toThrow('User not found');
    });
  });

  describe('hasPermission', () => {
    test('admin should have all permissions', () => {
      const user = service.createUser({ name: 'Admin', role: 'admin' });
      expect(service.hasPermission(user.id, 'project.create')).toBe(true);
      expect(service.hasPermission(user.id, 'user.manage')).toBe(true);
      expect(service.hasPermission(user.id, 'export')).toBe(true);
    });

    test('friend should only have read permissions', () => {
      const user = service.createUser({ name: 'Friend', role: 'friend' });
      expect(service.hasPermission(user.id, 'project.read')).toBe(true);
      expect(service.hasPermission(user.id, 'profit.read')).toBe(true);
      expect(service.hasPermission(user.id, 'report.read')).toBe(true);
      expect(service.hasPermission(user.id, 'project.create')).toBe(false);
      expect(service.hasPermission(user.id, 'transaction.create')).toBe(false);
    });

    test('supplier should only have supplier and invoice read', () => {
      const user = service.createUser({ name: 'Supplier', role: 'supplier' });
      expect(service.hasPermission(user.id, 'supplier.read')).toBe(true);
      expect(service.hasPermission(user.id, 'invoice.read')).toBe(true);
      expect(service.hasPermission(user.id, 'transaction.create')).toBe(false);
      expect(service.hasPermission(user.id, 'profit.read')).toBe(false);
    });

    test('cashier should have transaction and supplier pay', () => {
      const user = service.createUser({ name: 'Cashier', role: 'cashier' });
      expect(service.hasPermission(user.id, 'transaction.create')).toBe(true);
      expect(service.hasPermission(user.id, 'supplier.pay')).toBe(true);
      expect(service.hasPermission(user.id, 'supplier.reconcile')).toBe(false);
      expect(service.hasPermission(user.id, 'profit.read')).toBe(false);
    });

    test('accountant should have transaction, profit, invoice, import/export', () => {
      const user = service.createUser({ name: 'Accountant', role: 'accountant' });
      expect(service.hasPermission(user.id, 'transaction.create')).toBe(true);
      expect(service.hasPermission(user.id, 'profit.read')).toBe(true);
      expect(service.hasPermission(user.id, 'invoice.create')).toBe(true);
      expect(service.hasPermission(user.id, 'import')).toBe(true);
      expect(service.hasPermission(user.id, 'export')).toBe(true);
      expect(service.hasPermission(user.id, 'user.manage')).toBe(false);
    });

    test('developer should have project and transaction', () => {
      const user = service.createUser({ name: 'Developer', role: 'developer' });
      expect(service.hasPermission(user.id, 'project.create')).toBe(true);
      expect(service.hasPermission(user.id, 'transaction.create')).toBe(true);
      expect(service.hasPermission(user.id, 'profit.read')).toBe(true);
      expect(service.hasPermission(user.id, 'supplier.pay')).toBe(false);
    });

    test('partner should have project, member, transaction, profit and report', () => {
      const user = service.createUser({ name: 'Partner', role: 'partner' });
      expect(service.hasPermission(user.id, 'project.create')).toBe(true);
      expect(service.hasPermission(user.id, 'member.manage')).toBe(true);
      expect(service.hasPermission(user.id, 'transaction.create')).toBe(true);
      expect(service.hasPermission(user.id, 'profit.read')).toBe(true);
      expect(service.hasPermission(user.id, 'report.read')).toBe(true);
      expect(service.hasPermission(user.id, 'supplier.create')).toBe(false);
      expect(service.hasPermission(user.id, 'user.manage')).toBe(false);
    });

    test('auditor should have read-only access to all financial data', () => {
      const user = service.createUser({ name: 'Auditor', role: 'auditor' });
      expect(service.hasPermission(user.id, 'project.read')).toBe(true);
      expect(service.hasPermission(user.id, 'transaction.read')).toBe(true);
      expect(service.hasPermission(user.id, 'profit.read')).toBe(true);
      expect(service.hasPermission(user.id, 'supplier.read')).toBe(true);
      expect(service.hasPermission(user.id, 'invoice.read')).toBe(true);
      expect(service.hasPermission(user.id, 'report.read')).toBe(true);
      expect(service.hasPermission(user.id, 'project.create')).toBe(false);
      expect(service.hasPermission(user.id, 'transaction.create')).toBe(false);
    });

    test('inactive user should have no permissions', () => {
      const user = service.createUser({ name: 'Inactive', role: 'admin' });
      service.deactivateUser(user.id);
      expect(service.hasPermission(user.id, 'project.create')).toBe(false);
    });

    test('nonexistent user should return false', () => {
      expect(service.hasPermission('nonexistent', 'project.read')).toBe(false);
    });
  });

  describe('getRoleDefinitions', () => {
    test('should return all role definitions', () => {
      const defs = service.getRoleDefinitions();
      expect(defs).toHaveLength(8);
      const roleNames = defs.map(d => d.role);
      expect(roleNames).toEqual(['admin', 'partner', 'accountant', 'cashier', 'developer', 'supplier', 'auditor', 'friend']);
    });

    test('each role should have permissions array', () => {
      const defs = service.getRoleDefinitions();
      defs.forEach(d => {
        expect(d.permissions).toBeDefined();
        expect(d.permissions.length).toBeGreaterThan(0);
        expect(d.label).toBeDefined();
      });
    });
  });

  describe('getUserRoleInfo', () => {
    test('should return full role info', () => {
      const user = service.createUser({ name: 'Test', role: 'accountant' });
      const info = service.getUserRoleInfo(user.id);
      expect(info.userId).toBe(user.id);
      expect(info.name).toBe('Test');
      expect(info.role).toBe('accountant');
      expect(info.label).toBe('会计');
      expect(info.permissions).toBeDefined();
      expect(info.status).toBe('active');
    });

    test('should throw if user not found', () => {
      expect(() => service.getUserRoleInfo('nonexistent')).toThrow('User not found');
    });
  });

  describe('getUserStats', () => {
    test('should return stats for all roles', () => {
      service.createUser({ name: 'A', role: 'admin' });
      service.createUser({ name: 'B', role: 'admin' });
      service.createUser({ name: 'C', role: 'friend' });
      service.deactivateUser('user-2');

      const stats = service.getUserStats();
      expect(stats.admin.count).toBe(2);
      expect(stats.admin.active).toBe(1);
      expect(stats.friend.count).toBe(1);
      expect(stats.friend.active).toBe(1);
    });

    test('should return zero counts when no users', () => {
      const stats = service.getUserStats();
      Object.values(stats).forEach(s => {
        expect(s.count).toBe(0);
        expect(s.active).toBe(0);
      });
    });
  });
});
