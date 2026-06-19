const { Store } = require('./store');

class ProjectService {
  constructor(store) {
    this.store = store;
  }

  createProject({ name, description, createdBy }) {
    if (!name || !createdBy) {
      throw new Error('Project name and creator are required');
    }
    const project = this.store.createProject({
      name,
      description: description || '',
      members: [{ userId: createdBy, role: 'admin', ratio: 1.0 }]
    });
    return project;
  }

  getProject(id) {
    return this.store.getProject(id);
  }

  listProjects() {
    return this.store.listProjects();
  }

  addMember(projectId, { userId, role, ratio }) {
    const project = this.store.getProject(projectId);
    if (!project) throw new Error('Project not found');
    if (!['admin', 'editor', 'viewer'].includes(role)) {
      throw new Error('Invalid role');
    }
    const existing = project.members.find(m => m.userId === userId);
    if (existing) throw new Error('User already a member');
    project.members.push({ userId, role, ratio: ratio || 0 });
    return project;
  }

  setPartnerRatios(projectId, ratios) {
    const project = this.store.getProject(projectId);
    if (!project) throw new Error('Project not found');
    const total = Object.values(ratios).reduce((a, b) => a + b, 0);
    if (Math.abs(total - 1.0) > 0.001) {
      throw new Error('Partner ratios must sum to 1.0');
    }
    for (const m of project.members) {
      if (ratios[m.userId] !== undefined) {
        m.ratio = ratios[m.userId];
      }
    }
    return project;
  }
}

module.exports = { ProjectService };
