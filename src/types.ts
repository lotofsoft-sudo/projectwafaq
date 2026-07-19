/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar: string;
  status: 'active' | 'inactive';
  password?: string;
  phone?: string;
  department?: string;
  joinedDate?: string;
  employeeId?: string;
  notes?: string;
}

export interface Permission {
  viewDashboard: boolean;
  manageProjects: boolean;
  manageQuotations: boolean;
  manageBudgets: boolean;
  approveExpenses: boolean;
  manageInvoices: boolean;
  manageUsers: boolean;
  viewAuditLogs: boolean;
  viewProjectsWorkspace?: boolean;
  viewProjectDetails?: boolean;
  viewRolesAndPermissions?: boolean;
  viewAnalyticalReports?: boolean;
  viewSystemSettings?: boolean;
  viewProjectOverview?: boolean;
  viewProjectQuantities?: boolean;
  viewProjectBOQ?: boolean;
  viewProjectClients?: boolean;
  viewProjectQuotations?: boolean;
  viewProjectPO?: boolean;
  viewProjectBudgets?: boolean;
  viewProjectMilestones?: boolean;
  viewProjectTasks?: boolean;
  viewProjectIssues?: boolean;
  viewProjectVariations?: boolean;
  viewProjectExpenses?: boolean;
  viewProjectInvoices?: boolean;
  viewProjectPayments?: boolean;
  viewProjectDocuments?: boolean;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Permission;
}

export interface WorkflowStep {
  step: number;
  name: string;
  status: 'pending' | 'in_progress' | 'completed';
  completedAt?: string;
  completedBy?: string;
}

export interface Project {
  id: string;
  name: string;
  code: string;
  clientName: string;
  clientLogo?: string;
  value: number;
  budget: number;
  spent: number;
  status: 'active' | 'completed' | 'cancelled' | 'pending';
  siteLocation: string;
  siteManager: string;
  startDate: string;
  endDate: string;
  description: string;
  currentWorkflowStep: number;
  progress: number;
  workflowStepsStatuses?: Record<number, 'pending' | 'in_progress' | 'completed'>;
  workflowStepsAttachments?: Record<number, { name: string; size: string; uploadedAt: string; uploadedBy: string; url?: string }[]>;
}

export interface BOQItem {
  id: string;
  projectId: string;
  itemNo: string;
  description: string;
  unit: string;
  qty: number;
  rate: number;
  total: number;
  category: string;
}

export interface Quotation {
  id: string;
  projectId: string;
  version: string;
  date: string;
  preparedBy: string;
  totalAmount: number;
  clientComments: string;
  status: 'draft' | 'under_review' | 'approved' | 'rejected' | 'revised';
  fileName?: string;
  fileSize?: string;
  fileData?: string;
  attachments?: {
    name: string;
    size: string;
    data?: string;
  }[];
  isManual?: boolean;
  items: {
    id: string;
    description: string;
    qty: number;
    unit: string;
    rate: number;
    total: number;
  }[];
}

export interface PurchaseOrder {
  id: string;
  projectId: string;
  poNumber: string;
  date: string;
  value: number;
  scopeOfWork: string;
  paymentTerms: string;
  warranty: string;
  completionDate: string;
  fileName?: string;
  fileSize?: string;
  fileData?: string;
  withVat?: boolean;
  vatAmount?: number;
  attachments?: {
    name: string;
    size: string;
    data?: string;
  }[];
}

export interface BudgetCategory {
  id: string;
  projectId: string;
  name: string;
  allocated: number;
  spent: number;
  color: string;
  month?: string;
}

export interface Milestone {
  id: string;
  projectId: string;
  name: string;
  weight: number; // e.g. 30 meaning 30% of project
  progress: number; // e.g. 50 meaning 50% completed
  status: 'pending' | 'in_progress' | 'completed';
  dueDate: string;
  details?: string;
  attachments?: { name: string; size: string; uploadedAt?: string; url?: string }[];
}

export interface Comment {
  id: string;
  user: string;
  role: string;
  text: string;
  date: string;
}

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
  assigneeName?: string;
  dueDate?: string;
}

export interface Task {
  id: string;
  milestoneId: string;
  projectId: string;
  name: string;
  progress: number; // 0 to 100
  status: 'to_do' | 'in_progress' | 'review' | 'blocked' | 'on_hold' | 'completed' | 'rework';
  priority: 'low' | 'medium' | 'high';
  startDate: string;
  dueDate: string;
  assigneeId: string;
  assigneeName: string;
  comments: Comment[];
  attachments: { name: string; size: string; uploadedAt?: string }[];
  weight?: number; // percentage of milestone
  reworkInfo?: string; // rework information
  description?: string;
  statusHistory?: { user: string; role: string; previousStatus: string; newStatus: string; date: string }[];
  checklist?: ChecklistItem[];
}

export interface Issue {
  id: string;
  projectId: string;
  milestoneId?: string;
  title: string;
  description?: string;
  type: 'site' | 'technical' | 'client_request' | 'delay' | 'risk' | 'bug';
  priority: 'low' | 'medium' | 'high';
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  assigneeId: string;
  assigneeName: string;
  dateCreated: string;
  comments: Comment[];
  resolution?: string;
  attachments?: { name: string; size: string; uploadedAt?: string; url?: string }[];
  updates?: { id: string; text: string; user: string; role: string; date: string }[];
}

export interface Variation {
  id: string;
  projectId: string;
  title: string;
  costImpact: number;
  timeImpactDays: number;
  approvalStatus: 'draft' | 'pending' | 'approved' | 'rejected';
  dateCreated: string;
  description: string;
  fileName?: string;
  refNumber?: string;
  comments?: Comment[];
  attachments?: { name: string; size: string; uploadedAt?: string; url?: string }[];
  updates?: { id: string; text: string; user: string; role: string; date: string }[];
}

export interface Expense {
  id: string;
  projectId: string;
  budgetCategoryId: string;
  vendor: string;
  date: string;
  amount: number;
  vat: number;
  totalAmount: number;
  approvalStatus: 'draft' | 'pending' | 'approved' | 'rejected';
  description: string;
  fileName?: string;
  comments?: Comment[];
  attachments?: { name: string; size: string; uploadedAt?: string; url?: string }[];
  updates?: { id: string; text: string; user: string; role: string; date: string }[];
}

export interface Invoice {
  id: string;
  projectId: string;
  invoiceNumber: string;
  milestoneId: string;
  milestoneName: string;
  documentControllerId?: string;
  amount: number;
  vat: number;
  retention: number; // amount of money held back
  totalAmount: number;
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'paid' | 'partially_paid';
  dateCreated: string;
  dueDate: string;
  receivedAmount: number;
  submittedDate?: string;
  paymentDate?: string;
  paymentMethod?: 'Cash' | 'Bank Transfer';
  attachedInvoiceFile?: string;
  comments?: Comment[];
  attachments?: { name: string; size: string; uploadedAt?: string; url?: string }[];
  updates?: { id: string; text: string; user: string; role: string; date: string }[];
}

export interface Payment {
  id: string;
  projectId: string;
  invoiceId?: string;
  invoiceNumber?: string;
  documentControllerId?: string;
  amount: number;
  date: string;
  bankRef: string;
  paymentMethod: string;
  status?: 'cleared' | 'pending' | 'disputed' | 'cancelled';
  comments?: Comment[];
  attachments?: { name: string; size: string; uploadedAt?: string; url?: string }[];
  updates?: { id: string; text: string; user: string; role: string; date: string }[];
  milestoneId?: string;
  milestoneName?: string;
}

export interface Document {
  id: string;
  projectId: string;
  name: string;
  category: string; // Drawing, BOQ, Contract, Invoice, Photo, Report, Quotation, PO, Subcontractor PO, Payment Documents, Other
  version: string;
  uploadedBy: string;
  uploadedAt: string;
  size: string;
  tags: string[];
  referenceNumber?: string;
  expiryDate?: string;
  description?: string;
  url?: string;
}

export interface AuditLog {
  id: string;
  user: string;
  role: string;
  action: string;
  module: string;
  oldValue?: string;
  newValue?: string;
  ip: string;
  device: string;
  date: string;
}

export interface Notification {
  id: string;
  text: string;
  type: 'info' | 'success' | 'warning' | 'alert';
  read: boolean;
  timestamp: string;
}

export interface ProjectQuantity {
  id: string;
  projectId: string;
  name: string;
  value: number;
  unit: string;
  lastUpdated: string;
  updatedBy: string;
}

export interface Client {
  id: string;
  projectId: string;
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  vatNumber?: string;
  commercialReg?: string;
  contractValue?: number;
  notes?: string;
  lastUpdated: string;
  updatedBy: string;
}

export interface DocumentController {
  id: string;
  projectId: string;
  milestoneId: string;
  milestoneName: string;
  documentTitle: string;
  documentNumber: string;
  revision: string;
  category: 'Shop Drawing' | 'Material Submittal' | 'Method Statement' | 'Inspection Request' | 'As-Built Drawing' | 'Calculation Sheet' | 'Certificate' | 'Other';
  status: 'pending_review' | 'under_review' | 'approved' | 'approved_with_comments' | 'rejected' | 'revised_required';
  assignedControllerId?: string;
  assignedControllerName?: string;
  receivedDate: string;
  actionDate?: string;
  description?: string;
  comments?: Comment[];
  attachments?: { name: string; size: string; uploadedAt?: string; url?: string }[];
  updates?: { id: string; text: string; user: string; role: string; date: string }[];
}

export interface Tax {
  id: string;
  name: string;
  rate: number;
}

export function getVatAppliedAmount(amount: number, isExpense: boolean = false): number {
  if (typeof amount !== 'number' || isNaN(amount)) return 0;
  try {
    const includeVat = localStorage.getItem('wafaq_include_vat') === 'true';
    const excludeVat = localStorage.getItem('wafaq_exclude_vat') === 'true';

    const activeTaxId = localStorage.getItem('wafaq_selected_tax_id') || 't1';
    const taxesStr = localStorage.getItem('wafaq_taxes');
    let rate = 15; // default is 15%
    if (taxesStr) {
      const taxes = JSON.parse(taxesStr);
      const activeTax = taxes.find((t: any) => t.id === activeTaxId);
      if (activeTax) rate = activeTax.rate;
    }

    if (excludeVat) {
      // Amount will show without VAT by removing 15% (or active tax rate)
      return amount / (1 + rate / 100);
    }

    if (!includeVat) return amount;

    return amount * (1 + rate / 100);
  } catch (e) {
    return amount;
  }
}

export function getExpenseDisplayValues(expense: Expense): { amount: number; vat: number; totalAmount: number } {
  if (!expense) return { amount: 0, vat: 0, totalAmount: 0 };
  const hasVat = (expense.vat || 0) > 0;
  const includeVat = localStorage.getItem('wafaq_include_vat') === 'true';
  const excludeVat = localStorage.getItem('wafaq_exclude_vat') === 'true';
  
  const activeTaxId = localStorage.getItem('wafaq_selected_tax_id') || 't1';
  const taxesStr = localStorage.getItem('wafaq_taxes');
  let rate = 15;
  if (taxesStr) {
    try {
      const taxes = JSON.parse(taxesStr);
      const activeTax = taxes.find((t: any) => t.id === activeTaxId);
      if (activeTax) rate = activeTax.rate;
    } catch (e) {}
  }

  if (excludeVat) {
    if (hasVat) {
      return {
        amount: expense.amount,
        vat: 0,
        totalAmount: expense.amount
      };
    } else {
      const withoutVatAmount = expense.amount / (1 + rate / 100);
      return {
        amount: withoutVatAmount,
        vat: 0,
        totalAmount: withoutVatAmount
      };
    }
  }

  if (hasVat) {
    return {
      amount: expense.amount,
      vat: expense.vat,
      totalAmount: expense.totalAmount
    };
  } else {
    if (includeVat) {
      const calculatedVat = expense.amount * (rate / 100);
      return {
        amount: expense.amount,
        vat: calculatedVat,
        totalAmount: expense.amount + calculatedVat
      };
    } else {
      return {
        amount: expense.amount,
        vat: 0,
        totalAmount: expense.amount
      };
    }
  }
}

export function getInvoiceDisplayValues(invoice: Invoice): { amount: number; vat: number; totalAmount: number } {
  if (!invoice) return { amount: 0, vat: 0, totalAmount: 0 };
  const hasVat = (invoice.vat || 0) > 0;
  const includeVat = localStorage.getItem('wafaq_include_vat') === 'true';
  const excludeVat = localStorage.getItem('wafaq_exclude_vat') === 'true';
  
  const activeTaxId = localStorage.getItem('wafaq_selected_tax_id') || 't1';
  const taxesStr = localStorage.getItem('wafaq_taxes');
  let rate = 15;
  if (taxesStr) {
    try {
      const taxes = JSON.parse(taxesStr);
      const activeTax = taxes.find((t: any) => t.id === activeTaxId);
      if (activeTax) rate = activeTax.rate;
    } catch (e) {}
  }

  if (excludeVat) {
    if (hasVat) {
      return {
        amount: invoice.amount,
        vat: 0,
        totalAmount: invoice.amount
      };
    } else {
      const withoutVatAmount = invoice.amount / (1 + rate / 100);
      return {
        amount: withoutVatAmount,
        vat: 0,
        totalAmount: withoutVatAmount
      };
    }
  }

  if (hasVat) {
    return {
      amount: invoice.amount,
      vat: invoice.vat,
      totalAmount: invoice.totalAmount
    };
  } else {
    if (includeVat) {
      const calculatedVat = invoice.amount * (rate / 100);
      return {
        amount: invoice.amount,
        vat: calculatedVat,
        totalAmount: invoice.amount + calculatedVat
      };
    } else {
      return {
        amount: invoice.amount,
        vat: 0,
        totalAmount: invoice.amount
      };
    }
  }
}

export function getPurchaseOrderDisplayValues(po: PurchaseOrder): { value: number; vatAmount: number; total: number } {
  if (!po) return { value: 0, vatAmount: 0, total: 0 };
  const hasVat = po.withVat !== false || (po.vatAmount || 0) > 0;
  const includeVat = localStorage.getItem('wafaq_include_vat') === 'true';
  const excludeVat = localStorage.getItem('wafaq_exclude_vat') === 'true';
  
  const activeTaxId = localStorage.getItem('wafaq_selected_tax_id') || 't1';
  const taxesStr = localStorage.getItem('wafaq_taxes');
  let rate = 15;
  if (taxesStr) {
    try {
      const taxes = JSON.parse(taxesStr);
      const activeTax = taxes.find((t: any) => t.id === activeTaxId);
      if (activeTax) rate = activeTax.rate;
    } catch (e) {}
  }

  if (excludeVat) {
    return {
      value: po.value,
      vatAmount: 0,
      total: po.value
    };
  }

  const vatVal = po.vatAmount || (po.value * (rate / 100));

  if (hasVat) {
    return {
      value: po.value,
      vatAmount: vatVal,
      total: po.value + vatVal
    };
  } else {
    if (includeVat) {
      const calculatedVat = po.value * (rate / 100);
      return {
        value: po.value,
        vatAmount: calculatedVat,
        total: po.value + calculatedVat
      };
    } else {
      return {
        value: po.value,
        vatAmount: 0,
        total: po.value
      };
    }
  }
}


