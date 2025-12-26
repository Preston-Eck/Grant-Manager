export enum GrantStatus {
  Draft = 'Draft',
  Active = 'Active',
  Closed = 'Closed',
  Pending = 'Pending'
}

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
  status: 'Pending' | 'In Progress' | 'Completed' | 'Delayed'; // Status column
  budgetCategories: BudgetCategory[];
}

export interface ComplianceReport {
  id: string;
  title: string;
  dueDate: string;
  submittedDate?: string;
  type: 'Financial' | 'Programmatic' | 'Audit' | 'Other';
  status: 'Pending' | 'Submitted' | 'Overdue' | 'Accepted';
  comments?: string;
  attachmentPath?: string;
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
  deliverables: Deliverable[];
  reports: ComplianceReport[];
  attachments: string[]; // NEW: Grant-level attachments
}

export interface Expenditure {
  id: string;
  grantId: string;
  deliverableId: string;
  categoryId: string;
  date: string;
  vendor: string;
  amount: number;
  justification: string;
  receiptUrl?: string; 
  status: 'Pending' | 'Approved' | 'Rejected';
  purchaser?: string;
  notes?: string;
}

export interface EmailTemplate {
  id: string;
  title: string;
  subject: string;
  body: string;
}

export interface IngestionItem {
  id: string;
  rawImage: string; 
  parsedData: Partial<Expenditure> | null;
  status: 'Scanning' | 'Review' | 'Approved';
}