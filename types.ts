export type GrantStatus = 'Draft' | 'Pending' | 'Active' | 'Closed' | 'Archived';

export interface BudgetCategory {
  id: string;
  name: string;
  allocation: number;
  purpose: string;
}

export interface Deliverable {
  id: string;
  sectionReference: string;
  description: string;
  allocatedValue: number;
  dueDate: string;
  status: 'Pending' | 'In Progress' | 'Completed' | 'Deferred';
  budgetCategories: BudgetCategory[];
}

// NEW: Sub-Recipient Structure
export interface SubRecipient {
  id: string;
  name: string; // e.g. "Fruitvale Community Center"
  allocatedAmount: number; // Funds passed through to them
  deliverables: Deliverable[]; // Their specific goals
}

export interface ComplianceReport {
  id: string;
  title: string;
  dueDate: string;
  type: 'Financial' | 'Programmatic' | 'Audit';
  status: 'Pending' | 'Submitted' | 'Overdue';
}

export interface Grant {
  id: string;
  name: string;
  funder: string;
  purpose: string;
  totalAward: number;
  startDate: string;
  endDate: string;
  status: GrantStatus;
  indirectCostRate: number;
  requiredMatchAmount: number;
  
  deliverables: Deliverable[]; // Primary Grant Deliverables
  subRecipients: SubRecipient[]; // NEW: List of Communities
  
  reports: ComplianceReport[];
  attachments: string[];
  auditLog: AuditEvent[];
}

export interface Expenditure {
  id: string;
  grantId: string;
  subRecipientId?: string; // NEW: If present, expense belongs to community
  deliverableId: string;
  categoryId: string;
  date: string;
  vendor: string;
  amount: number;
  purchaser: string;
  justification: string;
  notes: string;
  receiptUrl?: string;
  status: 'Pending' | 'Approved' | 'Flagged';
  fundingSource: 'Grant' | 'Match' | 'Third-Party';
}

export interface AuditEvent {
  date: string;
  user: string;
  action: string;
  details: string;
}

export interface IngestionItem {
  id: string;
  rawImage: string;
  parsedData: any;
  status: 'Scanning' | 'Review' | 'Done';
}

export interface EmailTemplate {
  id: string;
  title: string;
  subject: string;
  body: string;
}