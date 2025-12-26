import { Grant, Transaction, EmailTemplate, GrantStatus } from '../types';

// Initial Data Seeding
const INITIAL_GRANTS: Grant[] = [
  {
    id: 'g-1',
    name: 'Community Health Initiative',
    funder: 'Global Wellness Foundation',
    budget: 50000,
    spent: 12450.50,
    startDate: '2023-01-01',
    endDate: '2023-12-31',
    status: GrantStatus.Active
  },
  {
    id: 'g-2',
    name: 'STEM Education Outreach',
    funder: 'TechForFuture',
    budget: 25000,
    spent: 24000.00,
    startDate: '2023-03-15',
    endDate: '2023-09-15',
    status: GrantStatus.Active
  }
];

const INITIAL_TEMPLATES: EmailTemplate[] = [
  { id: 't-1', title: 'Grant Kickoff', subject: 'Grant Kickoff: {{GrantName}}', body: 'Dear Team,\n\nWe are pleased to announce the start of {{GrantName}}. Please review the attached compliance documents.\n\nBest,\nGrant Admin' },
  { id: 't-2', title: 'Receipt Correction Needed', subject: 'Action Required: Invalid Receipt for {{Vendor}}', body: 'Hello,\n\nThe receipt submitted for {{Vendor}} on {{Date}} is missing tax details. Please provide a valid tax invoice.\n\nThank you.' },
  { id: 't-3', title: '90-Day Closeout', subject: 'Urgent: 90-Day Closeout for {{GrantName}}', body: 'Team,\n\nWe are approaching the 90-day closeout window. Please ensure all expenses are logged.' },
];

class DBService {
  private grantsKey = 'eckerdt_grants';
  private transactionsKey = 'eckerdt_transactions';
  private templatesKey = 'eckerdt_templates';

  constructor() {
    this.init();
  }

  private init() {
    if (!localStorage.getItem(this.grantsKey)) {
      localStorage.setItem(this.grantsKey, JSON.stringify(INITIAL_GRANTS));
    }
    if (!localStorage.getItem(this.transactionsKey)) {
      localStorage.setItem(this.transactionsKey, JSON.stringify([]));
    }
    if (!localStorage.getItem(this.templatesKey)) {
      localStorage.setItem(this.templatesKey, JSON.stringify(INITIAL_TEMPLATES));
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

  getTransactions(grantId?: string): Transaction[] {
    const all = JSON.parse(localStorage.getItem(this.transactionsKey) || '[]');
    if (grantId) return all.filter((t: Transaction) => t.grantId === grantId);
    return all;
  }

  addTransaction(tx: Transaction) {
    const all = this.getTransactions();
    all.push(tx);
    localStorage.setItem(this.transactionsKey, JSON.stringify(all));

    // Update grant spent amount
    const grants = this.getGrants();
    const grant = grants.find(g => g.id === tx.grantId);
    if (grant) {
      grant.spent += tx.amount;
      this.saveGrant(grant);
    }
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

  /**
   * Returns the complete state of the local database for diagnostic reporting.
   */
  getFullState() {
    return {
      grants: this.getGrants(),
      transactions: this.getTransactions(),
      templates: this.getTemplates(),
      storageKeys: {
        grants: this.grantsKey,
        transactions: this.transactionsKey,
        templates: this.templatesKey
      },
      timestamp: new Date().toISOString()
    };
  }
}

export const db = new DBService();