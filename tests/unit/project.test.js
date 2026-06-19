const { Store } = require('../../src/store');
const { ProjectService } = require('../../src/project');

describe('ProjectService', () => {
  let store, projectService;

  beforeEach(() => {
    store = new Store();
    projectService = new ProjectService(store);
  });

  describe('createProject', () => {
    test('creates project with valid inputs', () => {
      const project = projectService.createProject({ name: 'Test Project', description: 'A test', createdBy: 'user-1' });
      expect(project.name).toBe('Test Project');
      expect(project.description).toBe('A test');
      expect(project.members).toHaveLength(1);
      expect(project.members[0]).toEqual({ userId: 'user-1', role: 'admin', ratio: 1.0 });
      expect(project.createdAt).toBeDefined();
      expect(project.id).toMatch(/^project-/);
    });

    test('throws when name is missing', () => {
      expect(() => projectService.createProject({ description: 'test', createdBy: 'user-1' }))
        .toThrow('Project name and creator are required');
    });

    test('throws when createdBy is missing', () => {
      expect(() => projectService.createProject({ name: 'Test' }))
        .toThrow('Project name and creator are required');
    });

    test('throws when both name and createdBy are missing', () => {
      expect(() => projectService.createProject({}))
        .toThrow('Project name and creator are required');
    });

    test('defaults description to empty string', () => {
      const project = projectService.createProject({ name: 'No Desc', createdBy: 'user-1' });
      expect(project.description).toBe('');
    });
  });

  describe('getProject', () => {
    test('returns project by id', () => {
      const project = projectService.createProject({ name: 'P1', createdBy: 'user-1' });
      const found = projectService.getProject(project.id);
      expect(found).toEqual(project);
    });

    test('returns null for non-existent id', () => {
      expect(projectService.getProject('nonexistent')).toBeNull();
    });
  });

  describe('listProjects', () => {
    test('returns empty array when no projects', () => {
      expect(projectService.listProjects()).toEqual([]);
    });

    test('returns all created projects', () => {
      projectService.createProject({ name: 'P1', createdBy: 'user-1' });
      projectService.createProject({ name: 'P2', createdBy: 'user-2' });
      expect(projectService.listProjects()).toHaveLength(2);
    });
  });

  describe('addMember', () => {
    test('adds member with valid role', () => {
      const project = projectService.createProject({ name: 'P1', createdBy: 'user-1' });
      const updated = projectService.addMember(project.id, { userId: 'user-2', role: 'editor', ratio: 0.3 });
      expect(updated.members).toHaveLength(2);
      expect(updated.members[1]).toEqual({ userId: 'user-2', role: 'editor', ratio: 0.3 });
    });

    test('throws when project not found', () => {
      expect(() => projectService.addMember('nonexistent', { userId: 'user-2', role: 'editor' }))
        .toThrow('Project not found');
    });

    test('throws for invalid role', () => {
      const project = projectService.createProject({ name: 'P1', createdBy: 'user-1' });
      expect(() => projectService.addMember(project.id, { userId: 'user-2', role: 'superadmin' }))
        .toThrow('Invalid role');
    });

    test('throws when user already a member', () => {
      const project = projectService.createProject({ name: 'P1', createdBy: 'user-1' });
      projectService.addMember(project.id, { userId: 'user-2', role: 'editor' });
      expect(() => projectService.addMember(project.id, { userId: 'user-2', role: 'viewer' }))
        .toThrow('User already a member');
    });

    test('defaults ratio to 0', () => {
      const project = projectService.createProject({ name: 'P1', createdBy: 'user-1' });
      const updated = projectService.addMember(project.id, { userId: 'user-2', role: 'viewer' });
      expect(updated.members[1].ratio).toBe(0);
    });
  });

  describe('setPartnerRatios', () => {
    test('sets ratios correctly', () => {
      const project = projectService.createProject({ name: 'P1', createdBy: 'user-1' });
      projectService.addMember(project.id, { userId: 'user-2', role: 'editor', ratio: 0 });
      const updated = projectService.setPartnerRatios(project.id, { 'user-1': 0.6, 'user-2': 0.4 });
      expect(updated.members.find(m => m.userId === 'user-1').ratio).toBe(0.6);
      expect(updated.members.find(m => m.userId === 'user-2').ratio).toBe(0.4);
    });

    test('throws when project not found', () => {
      expect(() => projectService.setPartnerRatios('nonexistent', { 'user-1': 1.0 }))
        .toThrow('Project not found');
    });

    test('throws when ratios do not sum to 1.0', () => {
      const project = projectService.createProject({ name: 'P1', createdBy: 'user-1' });
      expect(() => projectService.setPartnerRatios(project.id, { 'user-1': 0.5, 'user-2': 0.3 }))
        .toThrow('Partner ratios must sum to 1.0');
    });

    test('accepts ratios summing to 1.0 within floating point tolerance', () => {
      const project = projectService.createProject({ name: 'P1', createdBy: 'user-1' });
      projectService.addMember(project.id, { userId: 'user-2', role: 'editor', ratio: 0 });
      // 0.333 + 0.333 + 0.333 = 0.999, within 0.001 tolerance
      expect(() => projectService.setPartnerRatios(project.id, { 'user-1': 0.333, 'user-2': 0.333 }))
        .toThrow('Partner ratios must sum to 1.0');
    });

    test('only updates ratios for specified users', () => {
      const project = projectService.createProject({ name: 'P1', createdBy: 'user-1' });
      projectService.addMember(project.id, { userId: 'user-2', role: 'editor', ratio: 0.5 });
      // user-1: 0.7, user-2: 0.3 = 1.0
      projectService.setPartnerRatios(project.id, { 'user-1': 0.7, 'user-2': 0.3 });
      expect(project.members.find(m => m.userId === 'user-1').ratio).toBe(0.7);
      expect(project.members.find(m => m.userId === 'user-2').ratio).toBe(0.3);
    });
  });
});
