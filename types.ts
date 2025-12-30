export type GrantStatus = 'Draft' | 'Pending' | 'Active' | 'Closed' | 'Archived';

export interface Note {
  id: string;
  date: string;
  text: string;
  author: string;
}

export interface BudgetCategory {
  id: string;
  name: string;
  allocation: number;
  purpose: string;
}

export interface Deliverable {
  id: string;
  type: 'Standard' | 'SubAward'; 
  sectionReference: string;
  description: string;
  allocatedValue: number;
  dueDate: string;
  startDate?: string;
  endDate?: string;
  completionDate?: string;
  status: 'Pending' | 'In Progress' | 'Completed' | 'Deferred';
  budgetCategories: BudgetCategory[];
  notes?: Note[]; // NEW
}

export interface SubRecipient {
  id: string;
  name: string;
  allocatedAmount: number;
  deliverables: Deliverable[];
  notes?: Note[]; // NEW
}

export interface ComplianceReport {
  id: string;
  title: string;
  dueDate: string;
  type: 'Financial' | 'Programmatic' | 'Audit';
  status: 'Pending' | 'Submitted' | 'Overdue';
  attachments?: string[]; // NEW
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
  
  deliverables: Deliverable[]; 
  subRecipients: SubRecipient[]; 
  
  reports: ComplianceReport[];
  attachments: string[];
  auditLog: AuditEvent[];
  notes?: Note[]; // NEW
}

export interface Expenditure {
  id: string;
  grantId: string;
  subRecipientId?: string;
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

export interface AppSettings {
  dbPath: string;
  apiKey?: string;
}