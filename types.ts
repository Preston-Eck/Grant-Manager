export enum GrantStatus {
  Draft = 'Draft',
  Active = 'Active',
  Closed = 'Closed',
  Pending = 'Pending'
}

export interface Grant {
  id: string;
  name: string;
  funder: string;
  budget: number;
  spent: number;
  startDate: string;
  endDate: string;
  status: GrantStatus;
  description?: string;
}

export interface Transaction {
  id: string;
  grantId: string;
  date: string;
  vendor: string;
  category: string;
  amount: number;
  description?: string;
  receiptUrl?: string; // In a real app this is a path, here maybe base64 or blob url
  status: 'Pending' | 'Approved' | 'Rejected';
}

export interface EmailTemplate {
  id: string;
  title: string;
  subject: string;
  body: string;
}

export enum ReportType {
  ExecutiveSummary = 'Executive Summary',
  BudgetVsActuals = 'Budget vs. Actuals',
  AuditorExport = 'Auditor Export',
}

export interface IngestionItem {
  id: string;
  rawImage: string; // Base64
  parsedData: Partial<Transaction> | null;
  status: 'Scanning' | 'Review' | 'Approved';
}