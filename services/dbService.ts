import { Grant, Expenditure, EmailTemplate, GrantStatus } from '../types';

const INITIAL_GRANTS: Grant[] = [
  {
    id: 'g-1',
    name: 'Community Health Initiative',
    funder: 'Global Wellness Foundation',
    purpose: 'To improve access to clean water in rural districts.',
    totalAward: 50000,
    startDate: '2023-01-01',
    endDate: '2023-12-31',
    status: 'Active',
    reports: [],
    attachments: [],
    indirectCostRate: 10.0,
    requiredMatchAmount: 5000,
    auditLog: [],
    subRecipients: [], 
    deliverables: [
      {
        id: 'd-1',
        sectionReference: 'Obj 1.1',
        description: 'Install 5 Water Filtration Systems',
        allocatedValue: 30000,
        dueDate: '2023-06-30',
        status: 'In Progress',
        budgetCategories: [
           { id: 'c-1', name: 'Equipment', allocation: 20000, purpose: 'Filters and pumps' },
           { id: 'c-2', name: 'Labor', allocation: 10000, purpose: 'Installation team' }
        ]
      }
    ]
  }
];

const INITIAL_TEMPLATES: EmailTemplate[] = [
  { id: 't-1', title: 'Grant Kickoff', subject: 'Grant Kickoff: {{GrantName}}', body: 'Dear Team,\n\nWe are pleased to announce the start of {{GrantName}}. Please review the attached compliance documents.\n\nBest,\nGrant Admin' },
  { id: 't-2', title: 'Receipt Correction Needed', subject: 'Action Required: Invalid Receipt for {{Vendor}}', body: 'Hello,\n\nThe receipt submitted for {{Vendor}} on {{Date}} is missing tax details. Please provide a valid tax invoice.\n\nThank you.' }
];

class DBService {
  private grantsKey = 'eckerdt_grants';
  private expendituresKey = 'eckerdt_expenditures';
  private templatesKey = 'eckerdt_templates';

  constructor() {
    this.init();
  }

  private init() {
    if (!localStorage.getItem(this.grantsKey)) {
      localStorage.setItem(this.grantsKey, JSON.stringify(INITIAL_GRANTS));
    }
    if (!localStorage.getItem(this.expendituresKey)) {
      localStorage.setItem(this.expendituresKey, JSON.stringify([]));
    }
    if (!localStorage.getItem(this.templatesKey)) {
      localStorage.setItem(this.templatesKey, JSON.stringify(INITIAL_TEMPLATES));
    }
    this.migrate();
  }

  private migrate() {
    try {
      const rawGrants = JSON.parse(localStorage.getItem(this.grantsKey) || '[]');
      const updatedGrants = rawGrants.map((g: any) => {
        if (g.indirectCostRate === undefined) g.indirectCostRate = 0;
        if (g.requiredMatchAmount === undefined) g.requiredMatchAmount = 0;
        if (!g.auditLog) g.auditLog = [];
        if (!g.attachments) g.attachments = [];
        if (!g.subRecipients) g.subRecipients = [];
        if (g.totalAward === undefined && g.budget !== undefined) {
          g.totalAward = g.budget;
        }
        return g;
      });
      localStorage.setItem(this.grantsKey, JSON.stringify(updatedGrants));
      
      const rawExp = JSON.parse(localStorage.getItem(this.expendituresKey) || '[]');
      const updatedExp = rawExp.map((e: any) => {
          if(!e.fundingSource) e.fundingSource = 'Grant';
          return e;
      });
      localStorage.setItem(this.expendituresKey, JSON.stringify(updatedExp));

    } catch (e) {
      console.error("Migration failed", e);
    }
  }

  getGrants(): Grant[] {
    return JSON.parse(localStorage.getItem(this.grantsKey) || '[]');
  }

  saveGrant(grant: Grant) {
    const grants = this.getGrants();
    const existingIndex = grants.findIndex(g => g.id === grant.id);
    if (existingIndex >= 0) {
      grants[existingIndex] = grant;
    } else {
      grants.push(grant);
    }
    localStorage.setItem(this.grantsKey, JSON.stringify(grants));
  }

  deleteGrant(id: string) {
    const grants = this.getGrants().filter(g => g.id !== id);
    localStorage.setItem(this.grantsKey, JSON.stringify(grants));
  }

  getExpenditures(grantId?: string): Expenditure[] {
    const all = JSON.parse(localStorage.getItem(this.expendituresKey) || '[]');
    if (grantId) return all.filter((t: Expenditure) => t.grantId === grantId);
    return all;
  }

  addExpenditure(tx: Expenditure) {
    const all = this.getExpenditures();
    all.push(tx);
    localStorage.setItem(this.expendituresKey, JSON.stringify(all));
  }

  saveExpenditure(updated: Expenditure) {
    const all = this.getExpenditures();
    const index = all.findIndex(e => e.id === updated.id);
    if (index !== -1) {
      all[index] = updated;
      localStorage.setItem(this.expendituresKey, JSON.stringify(all));
    }
  }

  deleteExpenditure(id: string) {
    const all = this.getExpenditures().filter(e => e.id !== id);
    localStorage.setItem(this.expendituresKey, JSON.stringify(all));
  }

  getTemplates(): EmailTemplate[] {
    return JSON.parse(localStorage.getItem(this.templatesKey) || '[]');
  }

  saveTemplate(template: EmailTemplate) {
    const templates = this.getTemplates();
    const existingIndex = templates.findIndex(t => t.id === template.id);
    if (existingIndex >= 0) {
      templates[existingIndex] = template;
    } else {
      templates.push(template);
    }
    localStorage.setItem(this.templatesKey, JSON.stringify(templates));
  }

  deleteTemplate(id: string) {
    const templates = this.getTemplates().filter(t => t.id !== id);
    localStorage.setItem(this.templatesKey, JSON.stringify(templates));
  }

  getFullState() {
    return {
      grants: this.getGrants(),
      expenditures: this.getExpenditures(),
      templates: this.getTemplates(),
      timestamp: new Date().toISOString()
    };
  }

  importState(data: any): boolean {
    try {
      if (!data.grants || !data.expenditures) {
        throw new Error("Invalid backup file format.");
      }
      localStorage.setItem(this.grantsKey, JSON.stringify(data.grants));
      localStorage.setItem(this.expendituresKey, JSON.stringify(data.expenditures));
      if (data.templates) localStorage.setItem(this.templatesKey, JSON.stringify(data.templates));
      return true;
    } catch (e) {
      console.error("Import failed:", e);
      return false;
    }
  }
}

export const db = new DBService();