import { Grant, Expenditure, EmailTemplate, AuditEvent } from '../types';

const EMPTY_STATE = {
  grants: [],
  expenditures: [],
  templates: [
    { id: 't-1', title: 'Grant Kickoff', subject: 'Kickoff: {{GrantName}}', body: '...' },
    { id: 't-2', title: 'Receipt Issue', subject: 'Receipt Issue: {{Vendor}}', body: '...' }
  ]
};

class DBService {
  private cache: any = null;
  private dbPath: string = '';

  async init(): Promise<boolean> {
    if (!window.electronAPI) return false;
    const settings = await window.electronAPI.getSettings();
    if (settings && settings.dbPath) {
      this.dbPath = settings.dbPath;
      await this.load();
      return true;
    }
    return false;
  }

  async load() {
    if (!this.dbPath) return;
    const data = await window.electronAPI.readDb(this.dbPath);
    this.cache = data || JSON.parse(JSON.stringify(EMPTY_STATE));
  }

  async save() {
    if (!this.dbPath || !this.cache) return;
    await window.electronAPI.writeDb(this.dbPath, this.cache);
  }

  async createNewDb(path: string) {
    this.dbPath = path;
    this.cache = JSON.parse(JSON.stringify(EMPTY_STATE));
    await this.save();
    const settings = await window.electronAPI.getSettings();
    await window.electronAPI.saveSettings({ ...settings, dbPath: path });
  }

  // --- Helpers ---
  private logAudit(grantId: string, action: string, details: string) {
      if (!this.cache) return;
      const grant = this.cache.grants.find((g: Grant) => g.id === grantId);
      if (grant) {
          if (!grant.auditLog) grant.auditLog = [];
          const event: AuditEvent = {
              date: new Date().toISOString(),
              user: 'System User', // In a real app, this would be the logged-in user
              action,
              details
          };
          grant.auditLog.unshift(event);
      }
  }

  // --- Methods ---

  getGrants(): Grant[] { return this.cache?.grants || []; }
  getExpenditures(grantId?: string): Expenditure[] {
    const all = this.cache?.expenditures || [];
    if (grantId) return all.filter((e: Expenditure) => e.grantId === grantId);
    return all;
  }
  getTemplates(): EmailTemplate[] { return this.cache?.templates || []; }
  getFullState() { return this.cache; }

  async saveGrant(grant: Grant) {
    if (!this.cache) await this.load();
    const idx = this.cache.grants.findIndex((g: Grant) => g.id === grant.id);
    if (idx >= 0) {
        this.cache.grants[idx] = grant;
        this.logAudit(grant.id, 'UPDATE_GRANT', 'Updated grant details/budget');
    } else {
        grant.auditLog = []; // Init log
        this.cache.grants.push(grant);
    }
    await this.save();
  }

  async deleteGrant(id: string) {
    if (!this.cache) return;
    this.cache.grants = this.cache.grants.filter((g: Grant) => g.id !== id);
    await this.save();
  }

  async addExpenditure(tx: Expenditure) {
    if (!this.cache) await this.load();
    this.cache.expenditures.push(tx);
    this.logAudit(tx.grantId, 'ADD_EXPENDITURE', `Added tx for $${tx.amount} to ${tx.vendor}`);
    await this.save();
  }

  async saveExpenditure(updated: Expenditure) {
    if (!this.cache) await this.load();
    const index = this.cache.expenditures.findIndex((e: Expenditure) => e.id === updated.id);
    if (index !== -1) {
      this.cache.expenditures[index] = updated;
      this.logAudit(updated.grantId, 'UPDATE_EXPENDITURE', `Updated tx ${updated.id}`);
      await this.save();
    }
  }

  async deleteExpenditure(id: string) {
    if (!this.cache) return;
    const tx = this.cache.expenditures.find((e:Expenditure) => e.id === id);
    if(tx) {
        this.logAudit(tx.grantId, 'DELETE_EXPENDITURE', `Deleted tx ${id} ($${tx.amount})`);
    }
    this.cache.expenditures = this.cache.expenditures.filter((e: Expenditure) => e.id !== id);
    await this.save();
  }

  async saveTemplate(template: EmailTemplate) {
    if(!this.cache) await this.load();
    const idx = this.cache.templates.findIndex((t: EmailTemplate) => t.id === template.id);
    if (idx >= 0) this.cache.templates[idx] = template;
    else this.cache.templates.push(template);
    await this.save();
  }

  async deleteTemplate(id: string) {
    if (!this.cache) return;
    this.cache.templates = this.cache.templates.filter((t: EmailTemplate) => t.id !== id);
    await this.save();
  }

  importState(data: any) {
    this.cache = data;
    this.save();
  }
}

export const db = new DBService();