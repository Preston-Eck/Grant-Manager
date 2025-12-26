export enum GrantStatus {
  Draft = 'Draft',
  Active = 'Active',
  Closed = 'Closed',
  Pending = 'Pending'
}

export interface BudgetCategory {
  id: string;
  name: string; // e.g., "Personnel", "Travel"
  allocation: number;
  purpose: string;
}

export interface Deliverable {
  id: string;
  sectionReference: string; // e.g., "Section 4.1.a"
  description: string;
  allocatedValue: number;
  dueDate: string;
  status: 'Pending' | 'In Progress' | 'Completed' | 'Delayed';
  budgetCategories: BudgetCategory[];
}

export interface ComplianceReport {
  id: string;
  title: string; // e.g., "Q1 Performance Report"
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
  purpose: string; // NEW
  totalAward: number; // Renamed from budget for clarity
  startDate: string;
  endDate: string;
  status: GrantStatus;
  deliverables: Deliverable[]; // NEW
  reports: ComplianceReport[]; // NEW
}

export interface Expenditure { // Renamed from Transaction
  id: string;
  grantId: string;
  deliverableId: string; // NEW
  categoryId: string; // NEW
  date: string;
  vendor: string;
  amount: number;
  justification: string; // NEW (Long text)
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