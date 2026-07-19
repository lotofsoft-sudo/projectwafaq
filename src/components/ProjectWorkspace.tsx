/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useRef } from 'react';
import { 
  Building2, 
  Layers, 
  FileText, 
  ClipboardList, 
  Percent, 
  Briefcase, 
  AlertTriangle, 
  DollarSign, 
  Plus, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  TrendingUp, 
  Calendar, 
  User, 
  Users,
  MessageSquare, 
  Paperclip, 
  Download,
  CheckCircle2,
  Lock,
  ArrowRight,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Scale,
  Printer,
  Eye
} from 'lucide-react';
import { 
  Project, 
  BOQItem, 
  Quotation, 
  PurchaseOrder, 
  BudgetCategory, 
  Milestone, 
  Task, 
  Issue, 
  Variation, 
  Expense, 
  Invoice, 
  Payment, 
  Document, 
  User as UserType,
  ProjectQuantity,
  Client,
  Role,
  getInvoiceDisplayValues,
  getExpenseDisplayValues
} from '../types';
import QuotationsManager from './QuotationsManager';
import PurchaseOrdersManager from './PurchaseOrdersManager';

interface ProjectWorkspaceProps {
  project: Project;
  currentUser: UserType;
  availableUsers: UserType[];
  boqList: BOQItem[];
  setBoqList: React.Dispatch<React.SetStateAction<BOQItem[]>>;
  quotations: Quotation[];
  setQuotations: React.Dispatch<React.SetStateAction<Quotation[]>>;
  purchaseOrders: PurchaseOrder[];
  setPurchaseOrders: React.Dispatch<React.SetStateAction<PurchaseOrder[]>>;
  budgets: BudgetCategory[];
  setBudgets: React.Dispatch<React.SetStateAction<BudgetCategory[]>>;
  milestones: Milestone[];
  setMilestones: React.Dispatch<React.SetStateAction<Milestone[]>>;
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  issues: Issue[];
  setIssues: React.Dispatch<React.SetStateAction<Issue[]>>;
  variations: Variation[];
  setVariations: React.Dispatch<React.SetStateAction<Variation[]>>;
  expenses: Expense[];
  setExpenses: React.Dispatch<React.SetStateAction<Expense[]>>;
  invoices: Invoice[];
  setInvoices: React.Dispatch<React.SetStateAction<Invoice[]>>;
  payments: Payment[];
  setPayments: React.Dispatch<React.SetStateAction<Payment[]>>;
  documents: Document[];
  setDocuments: React.Dispatch<React.SetStateAction<Document[]>>;
  projectQuantities?: ProjectQuantity[];
  setProjectQuantities?: React.Dispatch<React.SetStateAction<ProjectQuantity[]>>;
  clients?: Client[];
  setClients?: React.Dispatch<React.SetStateAction<Client[]>>;
  onLogAudit: (action: string, module: string, oldValue?: string, newValue?: string) => void;
  onAddNotification: (text: string, type: 'info' | 'success' | 'warning' | 'alert') => void;
  activeTab?: 'overview' | 'boq' | 'quotations' | 'po' | 'budget' | 'milestones' | 'tasks' | 'issues' | 'variations' | 'expenses' | 'invoices' | 'payments' | 'documents' | 'quantities' | 'clients';
  setActiveTab?: React.Dispatch<React.SetStateAction<'overview' | 'boq' | 'quotations' | 'po' | 'budget' | 'milestones' | 'tasks' | 'issues' | 'variations' | 'expenses' | 'invoices' | 'payments' | 'documents' | 'quantities' | 'clients'>>;
  includeVat?: boolean;
  excludeVat?: boolean;
  roles?: Role[];
}

export default function ProjectWorkspace({
  project,
  currentUser,
  availableUsers,
  boqList,
  setBoqList,
  quotations,
  setQuotations,
  purchaseOrders,
  setPurchaseOrders,
  budgets,
  setBudgets,
  milestones,
  setMilestones,
  tasks,
  setTasks,
  issues,
  setIssues,
  variations,
  setVariations,
  expenses,
  setExpenses,
  invoices,
  setInvoices,
  payments,
  setPayments,
  documents,
  setDocuments,
  projectQuantities = [],
  setProjectQuantities = () => {},
  clients = [],
  setClients = () => {},
  onLogAudit,
  onAddNotification,
  activeTab: propActiveTab,
  setActiveTab: propSetActiveTab,
  includeVat,
  excludeVat,
  roles = [],
}: ProjectWorkspaceProps) {
  
  const [localActiveTab, setLocalActiveTab] = useState<'overview' | 'boq' | 'quotations' | 'po' | 'budget' | 'milestones' | 'tasks' | 'issues' | 'variations' | 'expenses' | 'invoices' | 'payments' | 'documents' | 'quantities' | 'clients'>('overview');
  const activeTab = propActiveTab !== undefined ? propActiveTab : localActiveTab;
  const setActiveTab = propSetActiveTab !== undefined ? propSetActiveTab : setLocalActiveTab;

  const tabsRef = useRef<HTMLDivElement>(null);

  const scrollTabs = (direction: 'left' | 'right') => {
    if (tabsRef.current) {
      const scrollAmount = direction === 'left' ? -250 : 250;
      tabsRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Filter lists for current project
  const projBOQs = useMemo(() => boqList.filter(b => b.projectId === project.id), [boqList, project.id]);
  const projQuotations = useMemo(() => quotations.filter(q => q.projectId === project.id), [quotations, project.id]);
  const projPO = useMemo(() => purchaseOrders.find(po => po.projectId === project.id), [purchaseOrders, project.id]);
  const projBudgets = useMemo(() => budgets.filter(b => b.projectId === project.id), [budgets, project.id]);
  const projMilestones = useMemo(() => milestones.filter(m => m.projectId === project.id), [milestones, project.id]);
  const projTasks = useMemo(() => tasks.filter(t => t.projectId === project.id), [tasks, project.id]);
  const projIssues = useMemo(() => issues.filter(i => i.projectId === project.id), [issues, project.id]);
  const projVariations = useMemo(() => variations.filter(v => v.projectId === project.id), [variations, project.id]);
  const projExpenses = useMemo(() => expenses.filter(e => e.projectId === project.id), [expenses, project.id]);
  const projInvoices = useMemo(() => invoices.filter(i => i.projectId === project.id), [invoices, project.id]);
  const projPayments = useMemo(() => payments.filter(p => p.projectId === project.id), [payments, project.id]);
  const projDocs = useMemo(() => documents.filter(d => d.projectId === project.id), [documents, project.id]);

  // Authorization helper
  const canWrite = currentUser.role === 'General Manager' || currentUser.role === 'Project Manager' || currentUser.role === 'Admin' || currentUser.role === 'Super Admin';
  const canAccount = currentUser.role === 'General Manager' || currentUser.role === 'Accountant' || currentUser.role === 'Admin' || currentUser.role === 'Super Admin';
  const canSite = currentUser.role === 'General Manager' || currentUser.role === 'Site Engineer' || currentUser.role === 'Project Manager' || currentUser.role === 'Admin' || currentUser.role === 'Super Admin';

  // State for forms
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [taskName, setTaskName] = useState('');
  const [taskMilestone, setTaskMilestone] = useState('');
  const [taskAssignee, setTaskAssignee] = useState('');
  const [taskPriority, setTaskPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [taskDueDate, setTaskDueDate] = useState('2026-08-30');

  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [expVendor, setExpVendor] = useState('');
  const [expCategory, setExpCategory] = useState('');
  const [expAmount, setExpAmount] = useState(0);
  const [expDesc, setExpDesc] = useState('');

  const [showIssueForm, setShowIssueForm] = useState(false);
  const [issueTitle, setIssueTitle] = useState('');
  const [issueType, setIssueType] = useState<'site' | 'technical' | 'client_request' | 'delay' | 'risk' | 'bug'>('site');
  const [issuePriority, setIssuePriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [issueSeverity, setIssueSeverity] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');

  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [invMilestone, setInvMilestone] = useState('');
  const [invAmount, setInvAmount] = useState(0);

  const [showVariationForm, setShowVariationForm] = useState(false);
  const [varTitle, setVarTitle] = useState('');
  const [varCost, setVarCost] = useState(0);
  const [varTime, setVarTime] = useState(0);
  const [varDesc, setVarDesc] = useState('');

  const [showBOQForm, setShowBOQForm] = useState(false);
  const [boqNo, setBOQNo] = useState('');
  const [boqDesc, setBOQDesc] = useState('');
  const [boqUnit, setBOQUnit] = useState('m3');
  const [boqQty, setBOQQty] = useState(0);
  const [boqRate, setBOQRate] = useState(0);
  const [boqCategory, setBOQCategory] = useState('Civil');

  // Milestone workflow states
  const [showMilestoneForm, setShowMilestoneForm] = useState(false);
  const [milestoneName, setMilestoneName] = useState('');
  const [milestoneDueDate, setMilestoneDueDate] = useState('');
  const [milestoneWeight, setMilestoneWeight] = useState(10);
  const [milestoneDetails, setMilestoneDetails] = useState('');
  const [milestoneAttachmentName, setMilestoneAttachmentName] = useState('');

  // Task extension states
  const [taskWeight, setTaskWeight] = useState(10);
  const [completingTaskId, setCompletingTaskId] = useState<string | null>(null);
  const [taskAttachmentName, setTaskAttachmentName] = useState('');
  const [reworkingTaskId, setReworkingTaskId] = useState<string | null>(null);
  const [taskReworkReason, setTaskReworkReason] = useState('');

  // Project Quantities Local States
  const [showQtyForm, setShowQtyForm] = useState(false);
  const [newQtyName, setNewQtyName] = useState('');
  const [newQtyValue, setNewQtyValue] = useState<number | ''>('');
  const [newQtyUnit, setNewQtyUnit] = useState('m3');
  const [editingQtyId, setEditingQtyId] = useState<string | null>(null);
  const [editQtyName, setEditQtyName] = useState('');
  const [editQtyValue, setEditQtyValue] = useState<number | ''>('');
  const [editQtyUnit, setEditQtyUnit] = useState('m3');

  // Client Data Local States
  const [showClientForm, setShowClientForm] = useState(false);
  const [editingClientId, setEditingClientId] = useState<string | null>(null);
  const [clientCompanyName, setClientCompanyName] = useState('');
  const [clientContactPerson, setClientContactPerson] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [clientVatNumber, setClientVatNumber] = useState('');
  const [clientCommercialReg, setClientCommercialReg] = useState('');
  const [clientContractValue, setClientContractValue] = useState<number | ''>('');
  const [clientNotes, setClientNotes] = useState('');

  // Task detail modal state
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const selectedTaskForDetails = useMemo(() => {
    return tasks.find(t => t.id === selectedTaskId) || null;
  }, [tasks, selectedTaskId]);
  const [taskDetailDescription, setTaskDetailDescription] = useState('');
  const [taskDetailAssignee, setTaskDetailAssignee] = useState('');
  const [taskNewUpdateText, setTaskNewUpdateText] = useState('');
  const [taskNewAttachmentName, setTaskNewAttachmentName] = useState('');
  const [activeTaskTab, setActiveTaskTab] = useState<'details' | 'comments' | 'checklist' | 'attachments'>('details');
  const [newChecklistItemText, setNewChecklistItemText] = useState('');

  // TASK STATUS HANDLER (logs history & updates state)
  const handleUpdateTaskStatus = (taskId: string, newStatus: Task['status'], extraData?: { reason?: string; fileName?: string }) => {
    const targetTask = tasks.find(t => t.id === taskId);
    if (!targetTask) return;

    const oldStatus = targetTask.status;

    // Create status change history entry
    const historyEntry = {
      user: currentUser.name,
      role: currentUser.role,
      previousStatus: oldStatus,
      newStatus: newStatus,
      date: new Date().toLocaleString()
    };

    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        const updatedHistory = [...(t.statusHistory || []), historyEntry];

        let updatedProgress = t.progress;
        let reworkInfo = t.reworkInfo;
        let attachments = t.attachments || [];

        if (newStatus === 'completed') {
          updatedProgress = 100;
          if (extraData?.fileName) {
            attachments = [...attachments, { name: extraData.fileName, size: '2.4 MB', uploadedAt: new Date().toISOString().slice(0, 10) }];
          } else {
            attachments = [...attachments, { name: 'Work_Completion_Receipt.pdf', size: '1.5 MB', uploadedAt: new Date().toISOString().slice(0, 10) }];
          }
        } else if (newStatus === 'rework') {
          updatedProgress = 20; // reset progress
          reworkInfo = extraData?.reason || 'QA audit returned for corrections.';
        } else if (newStatus === 'blocked') {
          // Keep current progress
        } else if (newStatus === 'on_hold') {
          // Keep current progress
        } else if (newStatus === 'in_progress') {
          updatedProgress = Math.max(10, t.progress);
        } else if (newStatus === 'to_do') {
          updatedProgress = 0;
        }

        const updatedTask: Task = {
          ...t,
          status: newStatus,
          progress: updatedProgress,
          reworkInfo,
          attachments,
          statusHistory: updatedHistory
        };

        return updatedTask;
      }
      return t;
    }));

    onLogAudit(`Changed Task Status: ${targetTask.name}`, 'Task Management', oldStatus, newStatus);
    onAddNotification(`Task "${targetTask.name}" status changed to ${newStatus.replace('_', ' ')} by ${currentUser.name}`, 'info');

    // Trigger state recalculation cascade
    setTimeout(() => {
      recalculateMilestoneProgress(targetTask.milestoneId);
    }, 50);
  };

  const handleToggleChecklistItem = (taskId: string, itemId: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        const updatedChecklist = (t.checklist || []).map(item => {
          if (item.id === itemId) {
            return { ...item, completed: !item.completed };
          }
          return item;
        });
        const completedCount = updatedChecklist.filter(i => i.completed).length;
        const totalCount = updatedChecklist.length;
        const newProgress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : t.progress;

        const updatedTask = {
          ...t,
          checklist: updatedChecklist,
          progress: newProgress,
          status: newProgress === 100 ? 'completed' as const : t.status === 'completed' ? 'in_progress' as const : t.status
        };

        return updatedTask;
      }
      return t;
    }));
  };

  const handleAddChecklistItem = (taskId: string, text: string) => {
    if (!text.trim()) return;
    const newItem = {
      id: `c_${Date.now()}`,
      text: text.trim(),
      completed: false,
      assigneeName: currentUser.name,
      dueDate: new Date().toISOString().slice(0, 10)
    };

    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        const updatedChecklist = [...(t.checklist || []), newItem];
        const completedCount = updatedChecklist.filter(i => i.completed).length;
        const totalCount = updatedChecklist.length;
        const newProgress = Math.round((completedCount / totalCount) * 100);

        const updatedTask = {
          ...t,
          checklist: updatedChecklist,
          progress: newProgress,
          status: newProgress === 100 ? 'completed' as const : t.status === 'completed' ? 'in_progress' as const : t.status
        };

        return updatedTask;
      }
      return t;
    }));

    setNewChecklistItemText('');
  };

  const getInitials = (name: string) => {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  // Budget & Expense states
  const [selectedExpenseCategoryFilter, setSelectedExpenseCategoryFilter] = useState('');

  // Invoice custom fields & payment recording states
  const [invNumInput, setInvNumInput] = useState('');
  const [invVatAmount, setInvVatAmount] = useState(0);
  const [invRetentionAmount, setInvRetentionAmount] = useState(0);
  const [invAttachmentInput, setInvAttachmentInput] = useState('');
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState<any | null>(null);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Bank Transfer'>('Bank Transfer');
  const [paymentDate, setPaymentDate] = useState('');
  const [paymentBankRef, setPaymentBankRef] = useState('');

  // Document Controller custom fields
  const [showDocUploadForm, setShowDocUploadForm] = useState(false);
  const [docName, setDocName] = useState('');
  const [docFileUrl, setDocFileUrl] = useState('');
  const [docFileSize, setDocFileSize] = useState('3.4 MB');
  const [docCategory, setDocCategory] = useState('Drawing');
  const [docRefNumber, setDocRefNumber] = useState('');
  const [docExpiryDate, setDocExpiryDate] = useState('');
  const [docVersion, setDocVersion] = useState('v1.0');
  const [docDescription, setDocDescription] = useState('');
  const [docTags, setDocTags] = useState('');

  // Currency format helper
  const formatSAR = (val: number) => {
    return `${val.toLocaleString()} SAR`;
  };

  // State Management Actions

  // Budget Category addition state
  const [showBudgetForm, setShowBudgetForm] = useState(false);
  const [newBudgetCategoryName, setNewBudgetCategoryName] = useState('Subcontractor Payments');
  const [newBudgetAllocated, setNewBudgetAllocated] = useState(0);

  // 00. ADD BUDGET CATEGORY
  const handleCreateBudget = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canWrite) {
      alert("Unauthorized: Only General Manager or Project Manager can configure budget allocations.");
      return;
    }
    if (!newBudgetCategoryName || newBudgetAllocated <= 0) {
      alert("Please provide category and valid allocation amount.");
      return;
    }

    const newBC: BudgetCategory = {
      id: `bc_${Date.now()}`,
      projectId: project.id,
      name: newBudgetCategoryName,
      allocated: newBudgetAllocated,
      spent: 0,
      color: 'indigo'
    };

    setBudgets(prev => [...prev, newBC]);
    onLogAudit(`Allocated budget category "${newBudgetCategoryName}" with ${formatSAR(newBudgetAllocated)}`, 'Budgets', undefined, newBudgetCategoryName);
    onAddNotification(`Budget category "${newBudgetCategoryName}" (${formatSAR(newBudgetAllocated)}) added.`, 'success');

    setNewBudgetAllocated(0);
    setShowBudgetForm(false);
  };

  // 0. ADD MILESTONE (Set by managers, with weight contributions, details, and files)
  const handleCreateMilestone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canWrite) {
      alert("Unauthorized: Only General Manager or Project Manager can create milestones.");
      return;
    }
    if (!milestoneName || !milestoneDueDate || milestoneWeight <= 0) {
      alert("Please fill in Milestone Name, Due Date, and Contribution Weight.");
      return;
    }

    const newMilestone: Milestone = {
      id: `m_${Date.now()}`,
      projectId: project.id,
      name: milestoneName,
      weight: milestoneWeight,
      progress: 0,
      status: 'pending',
      dueDate: milestoneDueDate,
      details: milestoneDetails || 'Engineering or physical site delivery milestone.',
      attachments: milestoneAttachmentName 
        ? [{ name: milestoneAttachmentName, size: '2.5 MB', uploadedAt: new Date().toISOString().slice(0, 10) }]
        : []
    };

    setMilestones(prev => [...prev, newMilestone]);
    onLogAudit(`Created milestone: "${milestoneName}" with weight ${milestoneWeight}%`, 'Milestone Management', undefined, milestoneName);
    onAddNotification(`New milestone "${milestoneName}" (${milestoneWeight}%) added to contract baseline.`, 'success');

    // Reset Form
    setMilestoneName('');
    setMilestoneDueDate('');
    setMilestoneWeight(10);
    setMilestoneDetails('');
    setMilestoneAttachmentName('');
    setShowMilestoneForm(false);
  };

  // 1. ADD TASK (With optional milestone-specific weight percentage)
  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canWrite) {
      alert("Unauthorized: Only General Manager or Project Manager can create tasks.");
      return;
    }
    if (!taskName || !taskMilestone || !taskAssignee) {
      alert("Please populate all fields");
      return;
    }

    const assignedUser = availableUsers.find(u => u.id === taskAssignee);

    const newTask: Task = {
      id: `t_${Date.now()}`,
      milestoneId: taskMilestone,
      projectId: project.id,
      name: taskName,
      progress: 0,
      status: 'to_do',
      priority: taskPriority,
      startDate: new Date().toISOString().slice(0, 10),
      dueDate: taskDueDate,
      assigneeId: taskAssignee,
      assigneeName: assignedUser ? assignedUser.name : 'Unassigned',
      comments: [],
      attachments: [],
      weight: taskWeight
    };

    setTasks(prev => [...prev, newTask]);
    onLogAudit(`Added task: "${taskName}" (Weight: ${taskWeight}%)`, 'Task Management', undefined, newTask.name);
    onAddNotification(`New task assigned to ${newTask.assigneeName}: ${newTask.name} (${taskWeight}%)`, 'info');

    // Reset Form
    setTaskName('');
    setTaskMilestone('');
    setTaskAssignee('');
    setTaskWeight(10);
    setShowTaskForm(false);
  };

  // COMPLETE TASK WITH ATTACHMENTS
  const handleCompleteTaskDetailed = (taskId: string, fileName: string) => {
    if (!canSite) {
      alert("Unauthorized: Site Engineers or Managers must sign off task completions.");
      return;
    }
    const finalFile = fileName.trim() || 'Work_Completion_Receipt.pdf';
    handleUpdateTaskStatus(taskId, 'completed', { fileName: finalFile });
    setCompletingTaskId(null);
    setTaskAttachmentName('');
  };

  // REWORK TASK WITH REASON
  const handleReworkTaskDetailed = (taskId: string, reason: string) => {
    if (!canSite) {
      alert("Unauthorized: Only site engineers or project managers can flag rework.");
      return;
    }
    if (!reason.trim()) {
      alert("Rework information is required.");
      return;
    }

    handleUpdateTaskStatus(taskId, 'rework', { reason });
    setReworkingTaskId(null);
    setTaskReworkReason('');
  };

  // UPLOAD DOCUMENT CONTROLLER METADATA
  const handleUploadDocumentController = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docName || !docCategory) {
      alert("Please fill in Document Name and Category.");
      return;
    }

    const newDoc: Document = {
      id: `doc_${Date.now()}`,
      projectId: project.id,
      name: docName,
      category: docCategory,
      version: docVersion || 'v1.0',
      uploadedBy: currentUser.name,
      uploadedAt: new Date().toISOString().slice(0, 10),
      size: docFileSize,
      tags: docTags ? docTags.split(',').map(t => t.trim()) : [],
      referenceNumber: docRefNumber || undefined,
      expiryDate: docExpiryDate || undefined,
      description: docDescription || undefined,
      url: docFileUrl || undefined
    };

    setDocuments(prev => [...prev, newDoc]);
    onLogAudit(`Uploaded Document Controller file: "${docName}" [${docCategory}]`, 'Document Controller', undefined, docName);
    onAddNotification(`Document "${docName}" successfully filed under category ${docCategory}`, 'success');

    // Reset Form
    setDocName('');
    setDocFileUrl('');
    setDocFileSize('3.4 MB');
    setDocCategory('Drawing');
    setDocRefNumber('');
    setDocExpiryDate('');
    setDocVersion('v1.0');
    setDocDescription('');
    setDocTags('');
    setShowDocUploadForm(false);
  };

  // RECORD CLIENT DETAILED PAYMENT
  const handleRecordInvoicePaymentDetailed = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoiceForPayment) return;
    if (paymentAmount <= 0) {
      alert("Please enter a valid received amount.");
      return;
    }

    const invoice = selectedInvoiceForPayment;
    const previousReceived = invoice.receivedAmount || 0;
    const nextReceived = previousReceived + paymentAmount;
    const isFullyPaid = nextReceived >= invoice.totalAmount;

    setInvoices(prev => prev.map(inv => {
      if (inv.id === invoice.id) {
        return {
          ...inv,
          receivedAmount: nextReceived,
          status: isFullyPaid ? 'paid' : 'partially_paid',
          paymentDate: paymentDate || new Date().toISOString().slice(0, 10),
          paymentMethod: paymentMethod
        };
      }
      return inv;
    }));

    const newPayment: Payment = {
      id: `pay_${Date.now()}`,
      projectId: project.id,
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      amount: paymentAmount,
      date: paymentDate || new Date().toISOString().slice(0, 10),
      bankRef: paymentMethod === 'Bank Transfer' ? (paymentBankRef || `BANK-TX-${Date.now().toString().slice(-8)}`) : 'Cash Receipt',
      paymentMethod: paymentMethod === 'Bank Transfer' ? 'SADAD Bank Transfer' : 'Cash Counter Payment'
    };

    setPayments(prev => [...prev, newPayment]);
    onLogAudit(`Recorded Payment of ${formatSAR(paymentAmount)} on Invoice ${invoice.invoiceNumber}`, 'Payment Module', undefined, `${formatSAR(paymentAmount)}`);
    onAddNotification(`Collected ${formatSAR(paymentAmount)} against Invoice ${invoice.invoiceNumber}. Method: ${paymentMethod}`, 'success');

    // Reset payment dialog states
    setSelectedInvoiceForPayment(null);
    setPaymentAmount(0);
    setPaymentMethod('Bank Transfer');
    setPaymentDate('');
    setPaymentBankRef('');
  };

  // UPDATE TASK PROGRESS (Updates milestone & project progress automatically)
  const handleUpdateTaskProgress = (taskId: string, newProgress: number) => {
    if (!canSite) {
      alert("Unauthorized: Site Engineers or Managers must sign off progress updates.");
      return;
    }

    const progressVal = Math.min(Math.max(newProgress, 0), 100);
    const targetTask = tasks.find(t => t.id === taskId);
    if (!targetTask) return;

    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        return {
          ...t,
          progress: progressVal,
          status: progressVal === 100 ? 'completed' : progressVal > 0 ? 'in_progress' : 'to_do'
        };
      }
      return t;
    }));

    onLogAudit(`Updated task progress: ${targetTask.name}`, 'Task Management', `${targetTask.progress}%`, `${progressVal}%`);

    // Trigger state recalculation cascade
    setTimeout(() => {
      recalculateMilestoneProgress(targetTask.milestoneId);
    }, 50);
  };

  const recalculateMilestoneProgress = (milestoneId: string) => {
    const milestoneTasks = tasks.filter(t => t.milestoneId === milestoneId);
    if (milestoneTasks.length === 0) return;

    const totalProgress = milestoneTasks.reduce((acc, t) => acc + t.progress, 0);
    const avgProgress = Math.round(totalProgress / milestoneTasks.length);

    setMilestones(prevMilestones => {
      return prevMilestones.map(m => {
        if (m.id === milestoneId) {
          const isDone = avgProgress === 100;
          return {
            ...m,
            progress: avgProgress,
            status: isDone ? 'completed' : avgProgress > 0 ? 'in_progress' : 'pending'
          };
        }
        return m;
      });
    });
  };

  // 2. ADD EXPENSE
  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSite) {
      alert("Unauthorized: Only site personnel or accountants can file expense receipts.");
      return;
    }
    if (!expVendor || !expCategory || expAmount <= 0) {
      alert("Please populate all fields correctly.");
      return;
    }

    const vatVal = expAmount * 0.15; // KSA 15% VAT
    const totalAmount = expAmount + vatVal;

    const newExpense: Expense = {
      id: `e_${Date.now()}`,
      projectId: project.id,
      budgetCategoryId: expCategory,
      vendor: expVendor,
      date: new Date().toISOString().slice(0, 10),
      amount: expAmount,
      vat: vatVal,
      totalAmount: totalAmount,
      approvalStatus: 'pending',
      description: expDesc || 'Material or subcontractor supply payment request.',
      fileName: 'Receipt_Attached.pdf'
    };

    setExpenses(prev => [...prev, newExpense]);
    onLogAudit(`Filed expense: ${formatSAR(totalAmount)} to ${expVendor}`, 'Expense Module', undefined, `Vendor: ${expVendor}`);
    onAddNotification(`New pending expense submitted: ${formatSAR(totalAmount)}`, 'warning');

    // Reset Form
    setExpVendor('');
    setExpCategory('');
    setExpAmount(0);
    setExpDesc('');
    setShowExpenseForm(false);
  };

  // APPROVE EXPENSE (Deducts from budget automatically)
  const handleApproveExpense = (expenseId: string) => {
    if (!canAccount) {
      alert("Unauthorized: Only Accountants can authorize financial expenditures.");
      return;
    }

    const expToApprove = expenses.find(e => e.id === expenseId);
    if (!expToApprove) return;

    setExpenses(prev => prev.map(e => {
      if (e.id === expenseId) {
        return { ...e, approvalStatus: 'approved' };
      }
      return e;
    }));

    // Deduct from budget
    setBudgets(prev => prev.map(b => {
      if (b.id === expToApprove.budgetCategoryId) {
        return {
          ...b,
          spent: b.spent + expToApprove.totalAmount
        };
      }
      return b;
    }));

    onLogAudit(`Approved Expense #${expenseId}`, 'Expense Module', 'pending', 'approved');
    onAddNotification(`Expense of ${formatSAR(expToApprove.totalAmount)} approved and charged to project budget.`, 'success');
  };

  // REJECT EXPENSE
  const handleRejectExpense = (expenseId: string) => {
    if (!canAccount) {
      alert("Unauthorized: Only Accountants can reject financial expenditures.");
      return;
    }

    setExpenses(prev => prev.map(e => {
      if (e.id === expenseId) {
        return { ...e, approvalStatus: 'rejected' };
      }
      return e;
    }));

    onLogAudit(`Rejected Expense #${expenseId}`, 'Expense Module', 'pending', 'rejected');
  };

  // 3. ADD SITE ISSUE
  const handleAddIssue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSite) {
      alert("Unauthorized: Only site engineers can record issues.");
      return;
    }
    if (!issueTitle) return;

    const newIssue: Issue = {
      id: `i_${Date.now()}`,
      projectId: project.id,
      title: issueTitle,
      type: issueType,
      priority: issuePriority,
      severity: issueSeverity,
      status: 'open',
      assigneeId: currentUser.id,
      assigneeName: currentUser.name,
      dateCreated: new Date().toISOString().slice(0, 10),
      comments: []
    };

    setIssues(prev => [...prev, newIssue]);
    onLogAudit(`Logged Site Issue: "${issueTitle}"`, 'Issue Tracking', undefined, `Severity: ${issueSeverity}`);
    onAddNotification(`New critical site issue logged: ${issueTitle}`, 'alert');

    setIssueTitle('');
    setShowIssueForm(false);
  };

  // RESOLVE ISSUE
  const handleResolveIssue = (issueId: string) => {
    if (!canSite) return;
    const resolution = prompt("Please record the resolution action details:");
    if (!resolution) return;

    setIssues(prev => prev.map(i => {
      if (i.id === issueId) {
        return {
          ...i,
          status: 'resolved',
          resolution: resolution
        };
      }
      return i;
    }));

    onLogAudit(`Resolved Issue #${issueId}`, 'Issue Tracking', 'open', 'resolved');
  };

  // 4. ADD VARIATION ORDER
  const handleAddVariation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canWrite) {
      alert("Unauthorized: Only Project Directors can register variations.");
      return;
    }
    if (!varTitle || varCost <= 0) return;

    const newVar: Variation = {
      id: `v_${Date.now()}`,
      projectId: project.id,
      title: varTitle,
      costImpact: varCost,
      timeImpactDays: varTime,
      approvalStatus: 'pending',
      dateCreated: new Date().toISOString().slice(0, 10),
      description: varDesc || 'Requested structural layout alteration.',
      fileName: 'VO_Form_Drafted.pdf'
    };

    setVariations(prev => [...prev, newVar]);
    onLogAudit(`Registered Variation Order: "${varTitle}"`, 'Variation Module', undefined, `${formatSAR(varCost)} impact`);
    onAddNotification(`New Variation Order submitted: ${varTitle} (+${formatSAR(varCost)})`, 'warning');

    setVarTitle('');
    setVarCost(0);
    setVarTime(0);
    setVarDesc('');
    setShowVariationForm(false);
  };

  // APPROVE VARIATION ORDER (Adds to project value dynamically!)
  const handleApproveVariation = (varId: string) => {
    if (currentUser.role !== 'General Manager' && currentUser.role !== 'Client') {
      alert("Unauthorized: Only General Manager or the Client representative can authorize Variation Orders.");
      return;
    }

    const targetVar = variations.find(v => v.id === varId);
    if (!targetVar) return;

    setVariations(prev => prev.map(v => {
      if (v.id === varId) {
        return { ...v, approvalStatus: 'approved' };
      }
      return v;
    }));

    onLogAudit(`Approved Variation Order #${varId}`, 'Variation Module', 'pending', 'approved');
    onAddNotification(`Variation approved! Project portfolio value increased by +${formatSAR(targetVar.costImpact)}`, 'success');
  };

  // 5. ADD BOQ ITEM
  const handleAddBOQ = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canWrite) return;
    if (!boqNo || !boqDesc || boqQty <= 0 || boqRate <= 0) return;

    const total = boqQty * boqRate;

    const newItem: BOQItem = {
      id: `boq_${Date.now()}`,
      projectId: project.id,
      itemNo: boqNo,
      description: boqDesc,
      unit: boqUnit,
      qty: boqQty,
      rate: boqRate,
      total: total,
      category: boqCategory
    };

    setBoqList(prev => [...prev, newItem]);
    onLogAudit(`Added BOQ item ${boqNo}`, 'BOQ Module', undefined, boqDesc);

    setBOQNo('');
    setBOQDesc('');
    setBOQQty(0);
    setBOQRate(0);
    setShowBOQForm(false);
  };

  // CLIENTS HANDLERS
  const handleAddClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canWrite) return;
    if (!clientCompanyName || !clientContactPerson || !clientEmail || !clientPhone) {
      onAddNotification('Please fill in all required fields (Company, Contact Person, Email, and Phone).', 'warning');
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];

    if (editingClientId) {
      // Edit mode
      setClients(prev => prev.map(c => {
        if (c.id === editingClientId) {
          const updated = {
            ...c,
            companyName: clientCompanyName,
            contactPerson: clientContactPerson,
            email: clientEmail,
            phone: clientPhone,
            address: clientAddress,
            vatNumber: clientVatNumber || undefined,
            commercialReg: clientCommercialReg || undefined,
            contractValue: clientContractValue !== '' ? Number(clientContractValue) : undefined,
            notes: clientNotes || undefined,
            lastUpdated: todayStr,
            updatedBy: currentUser.name
          };
          onLogAudit(`Updated client record ${clientCompanyName}`, 'Client Data', c.companyName, clientCompanyName);
          return updated;
        }
        return c;
      }));
      onAddNotification(`Client ${clientCompanyName} successfully updated.`, 'success');
    } else {
      // Create mode
      const newClient: Client = {
        id: `cl_${Date.now()}`,
        projectId: project.id,
        companyName: clientCompanyName,
        contactPerson: clientContactPerson,
        email: clientEmail,
        phone: clientPhone,
        address: clientAddress,
        vatNumber: clientVatNumber || undefined,
        commercialReg: clientCommercialReg || undefined,
        contractValue: clientContractValue !== '' ? Number(clientContractValue) : undefined,
        notes: clientNotes || undefined,
        lastUpdated: todayStr,
        updatedBy: currentUser.name
      };
      setClients(prev => [...prev, newClient]);
      onLogAudit(`Added new client ${clientCompanyName}`, 'Client Data', undefined, clientCompanyName);
      onAddNotification(`New client ${clientCompanyName} successfully registered.`, 'success');
    }

    handleClearClientForm();
  };

  const handleEditClientClick = (c: Client) => {
    setEditingClientId(c.id);
    setClientCompanyName(c.companyName);
    setClientContactPerson(c.contactPerson);
    setClientEmail(c.email);
    setClientPhone(c.phone);
    setClientAddress(c.address);
    setClientVatNumber(c.vatNumber || '');
    setClientCommercialReg(c.commercialReg || '');
    setClientContractValue(c.contractValue !== undefined ? c.contractValue : '');
    setClientNotes(c.notes || '');
    setShowClientForm(true);
  };

  const handleDeleteClient = (id: string, name: string) => {
    const userRoleStr = currentUser?.role?.toLowerCase() || '';
    if (userRoleStr !== 'admin' && userRoleStr !== 'super admin' && userRoleStr !== 'superadmin') {
      alert("Unauthorized: Only Admin or Super Admin can delete records.");
      return;
    }

    if (window.confirm(`Are you sure you want to delete the client record for "${name}"?`)) {
      setClients(prev => prev.filter(c => c.id !== id));
      onLogAudit(`Deleted client record ${name}`, 'Client Data', name, undefined);
      onAddNotification(`Client "${name}" has been deleted.`, 'info');
      if (editingClientId === id) {
        handleClearClientForm();
      }
    }
  };

  const handleClearClientForm = () => {
    setEditingClientId(null);
    setClientCompanyName('');
    setClientContactPerson('');
    setClientEmail('');
    setClientPhone('');
    setClientAddress('');
    setClientVatNumber('');
    setClientCommercialReg('');
    setClientContractValue('');
    setClientNotes('');
    setShowClientForm(false);
  };

  // 6. SUBMIT PROGRESS INVOICE FOR MILESTONE
  const handleAddInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canAccount) {
      alert("Unauthorized: Only Accountants can issue progress bills.");
      return;
    }
    if (!invMilestone || invAmount <= 0) {
      alert("Please choose milestone and fill amount.");
      return;
    }

    const milestoneSelected = milestones.find(m => m.id === invMilestone);
    const vatVal = invAmount * 0.15; // KSA VAT
    const retentionVal = invAmount * 0.05; // 5% typical client retention
    const totalAmount = invAmount + vatVal - retentionVal;

    const newInvoice: Invoice = {
      id: `inv_${Date.now()}`,
      projectId: project.id,
      invoiceNumber: `WF-INV-${project.code.split('-')[2]}-${projInvoices.length + 101}`,
      milestoneId: invMilestone,
      milestoneName: milestoneSelected ? milestoneSelected.name : 'Physical Valuation',
      amount: invAmount,
      vat: vatVal,
      retention: retentionVal,
      totalAmount: totalAmount,
      status: 'submitted',
      dateCreated: new Date().toISOString().slice(0, 10),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      receivedAmount: 0
    };

    setInvoices(prev => [...prev, newInvoice]);
    onLogAudit(`Issued Valuation Progress Invoice: ${newInvoice.invoiceNumber}`, 'Invoice Module', undefined, `${formatSAR(totalAmount)} total`);
    onAddNotification(`Invoice ${newInvoice.invoiceNumber} submitted to client: ${formatSAR(totalAmount)}`, 'info');

    setInvMilestone('');
    setInvAmount(0);
    setShowInvoiceForm(false);
  };

  // Global Quantities Handlers
  const handleAddQuantity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQtyName.trim() || newQtyValue === '') return;
    const newQty: ProjectQuantity = {
      id: `qty_${Date.now()}`,
      projectId: project.id,
      name: newQtyName.trim(),
      value: Number(newQtyValue),
      unit: newQtyUnit,
      lastUpdated: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      updatedBy: currentUser.name
    };
    setProjectQuantities(prev => [...prev, newQty]);
    onLogAudit(`Added Project Quantity: ${newQty.name}`, 'Quantity Surveyor', undefined, `${newQty.value} ${newQty.unit}`);
    onAddNotification(`New global quantity added: ${newQty.name} (${newQty.value} ${newQty.unit})`, 'success');
    
    setNewQtyName('');
    setNewQtyValue('');
    setNewQtyUnit('m3');
    setShowQtyForm(false);
  };

  const handleStartEditQty = (qty: ProjectQuantity) => {
    setEditingQtyId(qty.id);
    setEditQtyName(qty.name);
    setEditQtyValue(qty.value);
    setEditQtyUnit(qty.unit);
  };

  const handleSaveEditQty = (id: string) => {
    if (!editQtyName.trim() || editQtyValue === '') return;
    setProjectQuantities(prev => prev.map(q => q.id === id ? {
      ...q,
      name: editQtyName.trim(),
      value: Number(editQtyValue),
      unit: editQtyUnit,
      lastUpdated: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      updatedBy: currentUser.name
    } : q));
    onLogAudit(`Edited Project Quantity`, 'Quantity Surveyor', undefined, `${editQtyName}: ${editQtyValue} ${editQtyUnit}`);
    onAddNotification(`Quantity ${editQtyName} successfully updated.`, 'info');
    setEditingQtyId(null);
  };

  const handleDeleteQty = (id: string, name: string) => {
    const userRoleStr = currentUser?.role?.toLowerCase() || '';
    if (userRoleStr !== 'admin' && userRoleStr !== 'super admin' && userRoleStr !== 'superadmin') {
      alert("Unauthorized: Only Admin or Super Admin can delete records.");
      return;
    }

    if (!confirm(`Are you sure you want to delete quantity "${name}"?`)) return;
    setProjectQuantities(prev => prev.filter(q => q.id !== id));
    onLogAudit(`Deleted Project Quantity: ${name}`, 'Quantity Surveyor', `${name}`, undefined);
    onAddNotification(`Quantity ${name} removed from contract.`, 'warning');
  };

  const handleExportBOQPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Could not open print window. Please allow popups.');
      return;
    }
    const todayStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const grandTotal = projBOQs.reduce((sum, item) => sum + item.total, 0);
    const rowsHTML = projBOQs.map((item, idx) => `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 10px 8px; font-weight: bold; text-align: center; color: #475569; font-family: monospace;">${item.itemNo}</td>
        <td style="padding: 10px 8px; font-weight: 600; color: #1e293b; text-align: left;">${item.description}</td>
        <td style="padding: 10px 8px; text-align: center; color: #64748b; font-family: monospace; font-size: 11px;">${item.category}</td>
        <td style="padding: 10px 8px; text-align: center; color: #475569; font-family: monospace;">${item.unit}</td>
        <td style="padding: 10px 8px; font-family: monospace; text-align: right; color: #334155;">${item.qty.toLocaleString()}</td>
        <td style="padding: 10px 8px; font-family: monospace; text-align: right; color: #334155;">${item.rate.toLocaleString()}</td>
        <td style="padding: 10px 8px; font-family: monospace; font-weight: bold; text-align: right; color: #4f46e5;">${item.total.toLocaleString()} SAR</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Bill of Quantities - ${project.code}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
          body { font-family: 'Inter', sans-serif; margin: 0; padding: 40px; color: #1e293b; background-color: #ffffff; }
          .header-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          .logo-cell { font-size: 24px; font-weight: 800; color: #4f46e5; letter-spacing: -0.05em; }
          .gov-cell { text-align: right; font-size: 11px; font-family: monospace; color: #64748b; line-height: 1.5; }
          .title-section { border-top: 3px solid #4f46e5; padding-top: 20px; margin-bottom: 25px; }
          .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 30px; font-size: 13px; }
          .meta-item strong { color: #475569; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; display: block; margin-bottom: 4px; }
          .meta-item span { font-weight: 700; color: #0f172a; font-size: 14px; }
          .ledger-table { width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 40px; }
          .ledger-table th { background-color: #f1f5f9; color: #475569; padding: 12px 8px; border-bottom: 2px solid #cbd5e1; font-weight: 700; text-transform: uppercase; font-size: 10px; letter-spacing: 0.05em; }
          .total-row { background-color: #f8fafc; font-weight: 800; border-top: 2px solid #cbd5e1; border-bottom: 2px solid #cbd5e1; }
          .total-row td { padding: 15px 8px; font-size: 13px; color: #0f172a; }
          .signature-box { display: flex; justify-content: space-between; margin-top: 60px; page-break-inside: avoid; }
          .sig-line { width: 220px; border-top: 1px solid #94a3b8; text-align: center; padding-top: 10px; font-size: 11px; color: #475569; font-weight: 500; }
          @media print {
            body { padding: 20px; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <table class="header-table">
          <tr>
            <td class="logo-cell">WAFAQ CONTRACTING</td>
            <td class="gov-cell">BILL OF QUANTITIES (BOQ)<br>Document Date: ${todayStr}</td>
          </tr>
        </table>
        <div class="title-section">
          <h1 style="font-size: 22px; font-weight: 800; margin: 0; color: #0f172a; tracking: -0.02em;">Priced Contract Bill of Quantities</h1>
        </div>
        <div class="meta-grid">
          <div class="meta-item">
            <strong>Project Reference</strong>
            <span>${project.code} - ${project.name}</span>
          </div>
          <div class="meta-item">
            <strong>Contracting Client</strong>
            <span>${project.clientName}</span>
          </div>
        </div>
        <table class="ledger-table">
          <thead>
            <tr>
              <th style="width: 80px; text-align: center;">Item #</th>
              <th style="text-align: left;">Scope Element Description</th>
              <th style="width: 100px; text-align: center;">Division</th>
              <th style="width: 60px; text-align: center;">Unit</th>
              <th style="width: 100px; text-align: right;">Tender Qty</th>
              <th style="width: 120px; text-align: right;">Rate (SAR)</th>
              <th style="width: 140px; text-align: right;">Total Amount</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHTML.length > 0 ? rowsHTML : '<tr><td colspan="7" style="padding: 30px; text-align: center; color: #64748b; font-style: italic;">No priced elements found for this project.</td></tr>'}
            ${rowsHTML.length > 0 ? `
            <tr class="total-row">
              <td colspan="4" style="text-transform: uppercase; font-weight: 800; letter-spacing: 0.05em; color: #475569;">Grand Contract Valuation</td>
              <td style="text-align: right; font-family: monospace;">${projBOQs.reduce((sum, item) => sum + item.qty, 0).toLocaleString()}</td>
              <td style="text-align: right; color: #64748b;">-</td>
              <td style="text-align: right; font-family: monospace; color: #4f46e5; font-size: 14px;">${grandTotal.toLocaleString()} SAR</td>
            </tr>
            ` : ''}
          </tbody>
        </table>
        <div class="signature-box">
          <div class="sig-line">Prepared By (Surveying & Cost Dept)</div>
          <div class="sig-line">Approved & Certified By (Client Representative)</div>
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 300);

    onLogAudit(`Exported BOQ PDF for Project ${project.code}`, 'BOQ Central Module', undefined, `${grandTotal.toLocaleString()} SAR`);
    onAddNotification(`BOQ exported as PDF for ${project.code}`, 'success');
  };

  const currentPermissions = useMemo(() => {
    return roles.find(r => r.name === currentUser.role)?.permissions;
  }, [roles, currentUser]);

  // tab items list
  const tabItems = [
    ...(currentPermissions?.viewProjectOverview !== false ? [{ id: 'overview', label: 'Overview', icon: Building2 }] : []),
    ...(currentPermissions?.viewProjectQuantities !== false ? [{ id: 'quantities', label: 'Contract Quantities', icon: Scale }] : []),
    ...(currentPermissions?.viewProjectBOQ !== false ? [{ id: 'boq', label: 'Bill of Quantities (BOQ)', icon: ClipboardList }] : []),
    ...(currentPermissions?.viewProjectClients !== false ? [{ id: 'clients', label: 'Client Data', icon: Users }] : []),
    ...(currentPermissions?.viewProjectQuotations !== false ? [{ id: 'quotations', label: 'Quotations', icon: FileText }] : []),
    ...(currentPermissions?.viewProjectPO !== false ? [{ id: 'po', label: 'Purchase Order', icon: Lock }] : []),
    ...(currentPermissions?.viewProjectBudgets !== false ? [{ id: 'budget', label: 'Budgets', icon: DollarSign }] : []),
    ...(currentPermissions?.viewProjectMilestones !== false ? [{ id: 'milestones', label: 'Milestones', icon: Layers }] : []),
    ...(currentPermissions?.viewProjectTasks !== false ? [{ id: 'tasks', label: 'Tasks', icon: Percent }] : []),
    ...(currentPermissions?.viewProjectIssues !== false ? [{ id: 'issues', label: 'Site Issues', icon: AlertTriangle }] : []),
    ...(currentPermissions?.viewProjectVariations !== false ? [{ id: 'variations', label: 'Variations', icon: TrendingUp }] : []),
    ...(currentPermissions?.viewProjectExpenses !== false ? [{ id: 'expenses', label: 'Expenses', icon: Briefcase }] : []),
    ...(currentPermissions?.viewProjectInvoices !== false ? [{ id: 'invoices', label: 'Invoices', icon: CheckCircle }] : []),
    ...(currentPermissions?.viewProjectPayments !== false ? [{ id: 'payments', label: 'Payments Received', icon: DollarSign }] : []),
    ...(currentPermissions?.viewProjectDocuments !== false ? [{ id: 'documents', label: 'Document Controller', icon: Paperclip }] : []),
  ];

  return (
    <div id="project-workspace-container" className="flex-1 overflow-visible p-4 md:p-6 space-y-6 pb-24 md:pb-6">
      
      {/* Project Meta Banner */}
      <div id="project-meta-banner" className="bg-white p-5 rounded-xl border border-gray-200/80 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0 select-none">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono bg-indigo-50 text-indigo-700 border border-indigo-200/50 font-bold px-2.5 py-0.5 rounded-full uppercase">
              {project.code}
            </span>
            <span className={`text-xs font-mono px-2 py-0.5 rounded-full font-bold ${
              project.status === 'active' 
                ? 'bg-emerald-100 text-emerald-800' 
                : project.status === 'completed' 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'bg-indigo-100 text-indigo-800'
            }`}>
              {project.status.toUpperCase()}
            </span>
          </div>
          <h2 className="text-lg font-bold text-gray-900 mt-2">{project.name}</h2>
          <p className="text-xs text-gray-400 mt-0.5">Location: <span className="text-gray-700 font-medium">{project.siteLocation}</span> | PM: <span className="text-gray-700 font-medium">{project.siteManager}</span></p>
        </div>

        {/* Project progress bars */}
        <div className="flex items-center space-x-4 shrink-0 bg-gray-50 p-3 rounded-lg border border-gray-150">
          <div className="text-right">
            <span className="text-xs font-mono text-gray-400 uppercase tracking-widest font-semibold block">Overall Project Progress</span>
            <p className="text-sm font-extrabold text-gray-800">{project.progress}% Complete</p>
          </div>
          <div className="relative w-12 h-12 flex items-center justify-center">
            <svg className="w-12 h-12 transform -rotate-90">
              <circle cx="24" cy="24" r="20" stroke="#e2e8f0" strokeWidth="4" fill="none" />
              <circle cx="24" cy="24" r="20" stroke="#4f46e5" strokeWidth="4" fill="none" strokeDasharray={`${2 * Math.PI * 20}`} strokeDashoffset={`${2 * Math.PI * 20 * (1 - project.progress / 100)}`} strokeLinecap="round" />
            </svg>
            <span className="absolute text-xs font-mono font-bold text-gray-800">{project.progress}%</span>
          </div>
        </div>
      </div>

      {/* Tabs list bar - Responsive (Dropdown on Mobile, Row on Desktop) */}
      <div className="md:hidden w-full select-none relative active-scale">
        <div className="bg-slate-900 text-white rounded-xl p-3.5 shadow-md flex items-center justify-between border border-slate-800">
          <div className="flex items-center space-x-2.5">
            {React.createElement(tabItems.find(t => t.id === activeTab)?.icon || Building2, { className: "w-5 h-5 text-indigo-400 shrink-0" })}
            <div className="text-left">
              <span className="block text-[9px] font-mono uppercase text-slate-400 tracking-wider font-semibold leading-none mb-1">Active Section</span>
              <span className="text-xs font-bold leading-none">{tabItems.find(t => t.id === activeTab)?.label}</span>
            </div>
          </div>
          
          <select
            value={activeTab}
            onChange={(e) => setActiveTab(e.target.value as any)}
            className="opacity-0 absolute inset-0 w-full h-full cursor-pointer z-10"
          >
            {tabItems.map((tab) => (
              <option key={tab.id} value={tab.id} className="text-slate-950 text-xs">
                {tab.label}
              </option>
            ))}
          </select>
          
          <div className="flex items-center space-x-1 text-xs text-indigo-300 font-semibold font-mono pointer-events-none">
            <span>Switch</span>
            <ChevronDown className="w-4 h-4 text-indigo-300 shrink-0" />
          </div>
        </div>
      </div>

      <div className="hidden md:flex items-center space-x-2 border-b border-gray-200">
        <button
          type="button"
          onClick={() => scrollTabs('left')}
          className="p-1.5 rounded-lg border border-gray-200 hover:border-indigo-400 text-gray-500 hover:text-indigo-600 bg-white hover:bg-indigo-50/20 shadow-sm transition shrink-0 cursor-pointer"
          title="Scroll Left"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div 
          ref={tabsRef}
          id="project-workspace-tabs" 
          className="flex-1 flex overflow-x-auto whitespace-nowrap scrollbar-none select-none"
        >
          {tabItems.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-3 border-b-2 font-medium text-xs flex items-center space-x-1.5 transition cursor-pointer ${
                  isActive 
                    ? 'border-indigo-600 text-indigo-600 font-bold' 
                    : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => scrollTabs('right')}
          className="p-1.5 rounded-lg border border-gray-200 hover:border-indigo-400 text-gray-500 hover:text-indigo-600 bg-white hover:bg-indigo-50/20 shadow-sm transition shrink-0 cursor-pointer"
          title="Scroll Right"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Render Active Tab Panel Content */}
      <div id="tab-panel-content" className="min-h-96">
        
        {/* T1. OVERVIEW */}
        {activeTab === 'overview' && currentPermissions?.viewProjectOverview !== false && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Left Card: Core Info */}
            <div className="md:col-span-2 space-y-6">
              <div className="bg-white p-5 rounded-xl border border-gray-200/80 shadow-sm space-y-4">
                <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider font-mono">Contract Scope Overview</h3>
                <p className="text-xs text-gray-600 leading-relaxed">{project.description}</p>
                
                <div className="grid grid-cols-2 gap-4 border-t border-gray-100 pt-4 text-xs font-mono">
                  <div>
                    <span className="block text-gray-400">Award Value</span>
                    <span className="font-bold text-gray-800">{formatSAR(project.value)}</span>
                  </div>
                  <div>
                    <span className="block text-gray-400">Approved Budget (Incl. VAT)</span>
                    <span className="font-bold text-gray-800">{formatSAR(project.budget)}</span>
                  </div>
                  <div>
                    <span className="block text-gray-400">Start Date</span>
                    <span className="text-gray-600">{project.startDate}</span>
                  </div>
                  <div>
                    <span className="block text-gray-400">Planned Completion</span>
                    <span className="text-gray-600">{project.endDate}</span>
                  </div>
                </div>
              </div>

              {/* Workflow Stepper integration inside overview for easy tracking */}
              <div className="bg-white p-5 rounded-xl border border-gray-200/80 shadow-sm">
                <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider font-mono mb-3">Project Workflow Progress</h3>
                <div className="flex items-center justify-between p-3 bg-slate-900 rounded-lg text-white">
                  <div>
                    <span className="text-[9px] font-mono text-indigo-400 block">ACTIVE STAGE</span>
                    <h4 className="text-xs font-bold">Step {project.currentWorkflowStep}: {project.name.includes('Fit-out') ? 'Closing Finished' : 'Execution Phase Active'}</h4>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">Step {project.currentWorkflowStep}/28</span>
                </div>
              </div>
            </div>

            {/* Right Card: Client & Contact Info */}
            <div className="space-y-6">
              <div className="bg-white p-5 rounded-xl border border-gray-200/80 shadow-sm space-y-4">
                <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider font-mono">Client Details</h3>
                <div className="flex items-center space-x-3 bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <div className="w-10 h-10 bg-indigo-600 text-white font-bold rounded-lg flex items-center justify-center text-lg">C</div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-800">{project.clientName}</h4>
                    <span className="text-[10px] text-gray-400">KSA Institutional Developer</span>
                  </div>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div>
                    <span className="block text-gray-400 font-mono text-[9px] uppercase">Corporate Contact</span>
                    <span className="font-medium text-gray-700">Youssef Al-Waleed (Procurement Dir)</span>
                  </div>
                  <div>
                    <span className="block text-gray-400 font-mono text-[9px] uppercase">Supervising Consultant</span>
                    <span className="font-medium text-gray-700">Dr. Nabil Ghamdi (Ghamdi Engineering Co.)</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* T2. BOQ */}
        {activeTab === 'boq' && currentPermissions?.viewProjectBOQ !== false && (
          <div className="space-y-4">
            
            {/* BOQ Header with adding form */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider font-mono">Contract Priced Bill of Quantities</h3>
                <p className="text-[10px] text-gray-400">Standard priced elements based on certified tender specifications</p>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleExportBOQPDF}
                  className="bg-slate-900 hover:bg-slate-800 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Export PDF</span>
                </button>
                
                {canWrite && !showBOQForm && (
                  <button
                    onClick={() => setShowBOQForm(true)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Element</span>
                  </button>
                )}
              </div>
            </div>

            {/* Project Quantities Ledger Summary */}
            <div className="flex flex-wrap gap-2.5 items-center p-3 bg-slate-50 border border-gray-200/60 rounded-xl select-none">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest mr-1.5 flex items-center shrink-0">
                <Scale className="w-3.5 h-3.5 text-indigo-600 mr-1.5 shrink-0" />
                Quantities Ledger:
              </span>
              {projectQuantities.filter(q => q.projectId === project.id).length === 0 ? (
                <span className="text-xs text-gray-400 italic">No global quantities logged for this contract project.</span>
              ) : (
                projectQuantities.filter(q => q.projectId === project.id).map(q => (
                  <div key={q.id} className="inline-flex items-center bg-white border border-gray-150 rounded-full px-3 py-1 text-xs shadow-sm hover:border-gray-300 transition">
                    <span className="font-semibold text-gray-600 mr-1.5">{q.name}:</span>
                    <span className="font-mono font-bold text-indigo-600">{q.value.toLocaleString()}</span>
                    <span className="text-[10px] text-gray-400 font-mono ml-1 uppercase">{q.unit}</span>
                  </div>
                ))
              )}
            </div>

            {showBOQForm && (
              <form onSubmit={handleAddBOQ} className="bg-white p-4 rounded-xl border border-gray-200 shadow-md grid grid-cols-1 md:grid-cols-5 gap-3">
                <div className="md:col-span-1">
                  <label className="block text-[10px] font-mono text-gray-400 uppercase">Item #</label>
                  <input type="text" required value={boqNo} onChange={e => setBOQNo(e.target.value)} placeholder="e.g. 1.04" className="w-full border border-gray-200 rounded p-1 text-xs mt-1" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-mono text-gray-400 uppercase">Description</label>
                  <input type="text" required value={boqDesc} onChange={e => setBOQDesc(e.target.value)} placeholder="Reinforcement steel casting" className="w-full border border-gray-200 rounded p-1 text-xs mt-1" />
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-gray-400 uppercase">Qty</label>
                  <input type="number" required value={boqQty || ''} onChange={e => setBOQQty(Number(e.target.value))} className="w-full border border-gray-200 rounded p-1 text-xs mt-1" />
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-gray-400 uppercase">Rate (SAR)</label>
                  <input type="number" required value={boqRate || ''} onChange={e => setBOQRate(Number(e.target.value))} className="w-full border border-gray-200 rounded p-1 text-xs mt-1" />
                </div>
                <div className="md:col-span-5 flex justify-end space-x-2">
                  <button type="button" onClick={() => setShowBOQForm(false)} className="text-xs text-gray-500 font-bold px-3">Cancel</button>
                  <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded text-xs font-bold cursor-pointer">Save Item</button>
                </div>
              </form>
            )}

            {/* BOQ Table */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-[10px] font-mono text-gray-400 uppercase">
                  <tr>
                    <th className="p-3">Item No</th>
                    <th className="p-3">Element Description</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Unit</th>
                    <th className="p-3 text-right">Qty</th>
                    <th className="p-3 text-right">Rate (SAR)</th>
                    <th className="p-3 text-right">Total (SAR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {projBOQs.map(item => (
                    <tr key={item.id} className="hover:bg-gray-50/20">
                      <td className="p-3 font-mono font-bold text-gray-600">{item.itemNo}</td>
                      <td className="p-3 font-medium text-gray-800">{item.description}</td>
                      <td className="p-3"><span className="bg-slate-100 text-gray-600 text-[10px] px-1.5 py-0.5 rounded font-mono">{item.category}</span></td>
                      <td className="p-3 font-mono text-gray-500">{item.unit}</td>
                      <td className="p-3 text-right font-mono text-gray-600">{item.qty.toLocaleString()}</td>
                      <td className="p-3 text-right font-mono text-gray-600">{item.rate.toLocaleString()}</td>
                      <td className="p-3 text-right font-mono font-bold text-gray-800">{item.total.toLocaleString()}</td>
                    </tr>
                  ))}
                  
                  {projBOQs.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-12 text-center text-gray-400 italic">No BOQ items uploaded. Use the element drafting form.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

          </div>
        )}

        {/* T2.5. CLIENT DATA */}
        {activeTab === 'clients' && currentPermissions?.viewProjectClients !== false && (
          <div className="space-y-4">
            
            {/* Header with actions */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider font-mono">Project Clients Directory</h3>
                <p className="text-[10px] text-gray-400">Manage client contacts, billing particulars, tax credentials, and contracting agreements</p>
              </div>
              
              <div className="flex items-center space-x-2">
                {canWrite && !showClientForm && (
                  <button
                    onClick={() => {
                      handleClearClientForm();
                      setShowClientForm(true);
                    }}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Register Client</span>
                  </button>
                )}
              </div>
            </div>

            {/* Client Registration & Edit Form */}
            {showClientForm && (
              <form onSubmit={handleAddClient} className="bg-white p-5 rounded-xl border border-gray-200 shadow-md space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                  <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider font-mono">
                    {editingClientId ? 'Edit Client Record' : 'Register New Client'}
                  </h4>
                  <button 
                    type="button" 
                    onClick={handleClearClientForm}
                    className="text-gray-400 hover:text-gray-600 text-xs font-semibold"
                  >
                    Clear & Close
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-mono text-gray-400 uppercase">Company / Client Name *</label>
                    <input 
                      type="text" 
                      required 
                      value={clientCompanyName} 
                      onChange={e => setClientCompanyName(e.target.value)} 
                      placeholder="e.g. Al-Ajlan Real Estate" 
                      className="w-full border border-gray-200 rounded p-1.5 text-xs mt-1 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500" 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-gray-400 uppercase">Contact Person / Rep *</label>
                    <input 
                      type="text" 
                      required 
                      value={clientContactPerson} 
                      onChange={e => setClientContactPerson(e.target.value)} 
                      placeholder="e.g. Eng. Abdulrahman Al-Ajlan" 
                      className="w-full border border-gray-200 rounded p-1.5 text-xs mt-1 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500" 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-gray-400 uppercase">Contract Value Contribution (SAR)</label>
                    <input 
                      type="number" 
                      value={clientContractValue} 
                      onChange={e => setClientContractValue(e.target.value !== '' ? Number(e.target.value) : '')} 
                      placeholder="e.g. 12500000" 
                      className="w-full border border-gray-200 rounded p-1.5 text-xs mt-1 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500" 
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-gray-400 uppercase">Email Address *</label>
                    <input 
                      type="email" 
                      required 
                      value={clientEmail} 
                      onChange={e => setClientEmail(e.target.value)} 
                      placeholder="a.ajlan@domain.com" 
                      className="w-full border border-gray-200 rounded p-1.5 text-xs mt-1 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500" 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-gray-400 uppercase">Phone Number *</label>
                    <input 
                      type="text" 
                      required 
                      value={clientPhone} 
                      onChange={e => setClientPhone(e.target.value)} 
                      placeholder="+966 50 000 0000" 
                      className="w-full border border-gray-200 rounded p-1.5 text-xs mt-1 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500" 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-gray-400 uppercase">Commercial Reg. (CR) #</label>
                    <input 
                      type="text" 
                      value={clientCommercialReg} 
                      onChange={e => setClientCommercialReg(e.target.value)} 
                      placeholder="1010XXXXXX" 
                      className="w-full border border-gray-200 rounded p-1.5 text-xs mt-1 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500" 
                    />
                  </div>

                  <div className="md:col-span-1">
                    <label className="block text-[10px] font-mono text-gray-400 uppercase">VAT/Tax ID</label>
                    <input 
                      type="text" 
                      value={clientVatNumber} 
                      onChange={e => setClientVatNumber(e.target.value)} 
                      placeholder="3102XXXXXXXXXX" 
                      className="w-full border border-gray-200 rounded p-1.5 text-xs mt-1 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500" 
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-mono text-gray-400 uppercase">Office Address</label>
                    <input 
                      type="text" 
                      value={clientAddress} 
                      onChange={e => setClientAddress(e.target.value)} 
                      placeholder="King Fahd Rd, Riyadh, KSA" 
                      className="w-full border border-gray-200 rounded p-1.5 text-xs mt-1 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500" 
                    />
                  </div>

                  <div className="md:col-span-3">
                    <label className="block text-[10px] font-mono text-gray-400 uppercase">Notes & Special Directives</label>
                    <textarea 
                      value={clientNotes} 
                      onChange={e => setClientNotes(e.target.value)} 
                      rows={2}
                      placeholder="Add key billing conditions, contract milestones, or notes regarding communication channels..." 
                      className="w-full border border-gray-200 rounded p-1.5 text-xs mt-1 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500" 
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-2 border-t border-gray-100">
                  <button 
                    type="button" 
                    onClick={handleClearClientForm} 
                    className="text-xs text-gray-500 hover:text-gray-700 font-bold px-3 py-1.5"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition shadow-sm"
                  >
                    {editingClientId ? 'Update Client' : 'Register Client'}
                  </button>
                </div>
              </form>
            )}

            {/* Clients Grid & Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {clients.filter(c => c.projectId === project.id).length === 0 ? (
                <div className="lg:col-span-2 bg-white p-12 text-center rounded-xl border border-gray-200 shadow-sm">
                  <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-xs text-gray-400 italic">No client records registered for this project yet.</p>
                  {canWrite && (
                    <button 
                      onClick={() => setShowClientForm(true)} 
                      className="mt-3 text-xs font-bold text-indigo-600 hover:text-indigo-800"
                    >
                      + Register first client
                    </button>
                  )}
                </div>
              ) : (
                clients.filter(c => c.projectId === project.id).map(c => (
                  <div key={c.id} className="bg-white border border-gray-200/80 rounded-xl p-5 shadow-sm hover:shadow-md transition relative flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[9px] font-mono bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-0.5 rounded font-bold uppercase">
                            CLIENT ID: {c.id.toUpperCase()}
                          </span>
                          <h4 className="text-sm font-bold text-gray-900 mt-1.5">{c.companyName}</h4>
                          <p className="text-xs text-gray-500 font-medium flex items-center mt-1">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-1.5"></span>
                            Primary Representative: <strong className="text-gray-800 ml-1">{c.contactPerson}</strong>
                          </p>
                        </div>
                        
                        {canWrite && (
                          <div className="flex items-center space-x-1.5">
                            <button
                              onClick={() => handleEditClientClick(c)}
                              className="text-xs text-indigo-600 hover:bg-indigo-50 p-1.5 rounded-lg transition"
                              title="Edit Client Information"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteClient(c.id, c.companyName)}
                              className="text-xs text-rose-600 hover:bg-rose-50 p-1.5 rounded-lg transition"
                              title="Delete Client Record"
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-x-4 gap-y-2 pt-2 border-t border-gray-100 text-xs">
                        <div>
                          <span className="text-[10px] font-mono text-gray-400 uppercase block">Email</span>
                          <a href={`mailto:${c.email}`} className="text-indigo-600 hover:underline font-medium break-all">{c.email}</a>
                        </div>
                        <div>
                          <span className="text-[10px] font-mono text-gray-400 uppercase block">Phone</span>
                          <span className="text-gray-700 font-medium">{c.phone}</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-mono text-gray-400 uppercase block">CR / Commercial Register</span>
                          <span className="text-gray-700 font-mono font-bold">{c.commercialReg || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-mono text-gray-400 uppercase block">VAT Number</span>
                          <span className="text-gray-700 font-mono font-bold">{c.vatNumber || 'N/A'}</span>
                        </div>
                        {c.contractValue !== undefined && (
                          <div className="col-span-2">
                            <span className="text-[10px] font-mono text-gray-400 uppercase block">Contract Allocation</span>
                            <span className="text-indigo-600 font-mono font-black text-sm">{c.contractValue.toLocaleString()} SAR</span>
                          </div>
                        )}
                        {c.address && (
                          <div className="col-span-2">
                            <span className="text-[10px] font-mono text-gray-400 uppercase block">Office Address</span>
                            <span className="text-gray-600 font-medium">{c.address}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {c.notes && (
                      <div className="mt-3 p-2.5 bg-slate-50 border border-gray-100 rounded-lg text-xs text-gray-500 italic">
                        {c.notes}
                      </div>
                    )}

                    <div className="mt-3 pt-2 border-t border-gray-100 flex justify-between items-center text-[10px] text-gray-400 font-mono">
                      <span>Updated: {c.lastUpdated}</span>
                      <span>By: {c.updatedBy}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

          </div>
        )}

        {/* T3. QUOTATIONS */}
        {activeTab === 'quotations' && currentPermissions?.viewProjectQuotations !== false && (
          <div className="bg-white p-5 rounded-xl border border-gray-200/80 shadow-sm">
            <QuotationsManager
              projectId={project.id}
              projects={[project]} // pass the current project context as the selectable projects array
              quotations={quotations}
              setQuotations={setQuotations}
              currentUser={currentUser}
              onLogAudit={onLogAudit}
              onAddNotification={onAddNotification}
              documents={documents}
              setDocuments={setDocuments}
            />
          </div>
        )}

        {/* T4. PURCHASE ORDER */}
        {activeTab === 'po' && currentPermissions?.viewProjectPO !== false && (
          <div className="bg-white p-5 rounded-xl border border-gray-200/80 shadow-sm">
            <PurchaseOrdersManager
              projectId={project.id}
              projects={[project]}
              purchaseOrders={purchaseOrders}
              setPurchaseOrders={setPurchaseOrders}
              currentUser={currentUser}
              onLogAudit={onLogAudit}
              onAddNotification={onAddNotification}
              documents={documents}
              setDocuments={setDocuments}
            />
          </div>
        )}

        {/* T5. BUDGETS */}
        {activeTab === 'budget' && currentPermissions?.viewProjectBudgets !== false && (
          <div className="space-y-6">
            
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div>
                <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider font-mono font-semibold">Internal Budget Categories</h3>
                <p className="text-[10px] text-gray-400">Priced expense allocations. Approved expenses are automatically deducted from the remaining balance.</p>
              </div>

              <div className="flex items-center space-x-3 self-start sm:self-auto">
                <div className="text-xs font-mono font-bold bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded border border-indigo-150">
                  Total Allocated (Incl. VAT): {formatSAR(projBudgets.reduce((acc, b) => acc + b.allocated, 0))}
                </div>
                {canWrite && !showBudgetForm && (
                  <button
                    onClick={() => setShowBudgetForm(true)}
                    className="bg-slate-900 hover:bg-slate-800 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Budget</span>
                  </button>
                )}
              </div>
            </div>

            {/* Create Budget Form */}
            {showBudgetForm && (
              <form onSubmit={handleCreateBudget} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4 select-none">
                <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                  <h4 className="text-xs font-bold text-gray-800 uppercase font-mono">Create Budget Category</h4>
                  <button type="button" onClick={() => setShowBudgetForm(false)} className="text-xs text-gray-400 hover:text-gray-600 font-bold">Cancel</button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-mono text-gray-400 uppercase">Category Name</label>
                    <select
                      value={newBudgetCategoryName}
                      onChange={e => setNewBudgetCategoryName(e.target.value)}
                      className="w-full border border-gray-200 rounded p-1.5 text-xs mt-1 focus:outline-none focus:border-indigo-600 bg-white"
                    >
                      {['Subcontractor Payments', 'Procurement', 'Salary / Site Office', 'Fuel Cost', 'Taxi Rent', 'Accommodation Rent', 'Water', 'Civil & Structural', 'Electrical & Cabling', 'HVAC & Plumbing', 'Facade & Masonry', 'Others'].map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-gray-400 uppercase">Allocated Amount (SAR)</label>
                    <input
                      type="number"
                      required
                      min={100}
                      value={newBudgetAllocated}
                      onChange={e => setNewBudgetAllocated(Number(e.target.value))}
                      placeholder="e.g. 150000"
                      className="w-full border border-gray-200 rounded p-1.5 text-xs mt-1 focus:outline-none focus:border-indigo-600"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-2 border-t border-gray-100">
                  <button type="button" onClick={() => setShowBudgetForm(false)} className="text-xs text-gray-500 font-semibold px-3 py-1.5">
                    Cancel
                  </button>
                  <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1.5 rounded-lg text-xs font-bold">
                    Save Allocation
                  </button>
                </div>
              </form>
            )}

            {/* Budgets Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projBudgets.map((b) => {
                const remaining = b.allocated - b.spent;
                const utilizationPct = b.allocated > 0 ? Math.round((b.spent / b.allocated) * 100) : 0;
                
                return (
                  <div key={b.id} className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-sm space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-xs text-gray-800">{b.name}</span>
                      <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-mono font-semibold uppercase ${
                        utilizationPct > 90 ? 'bg-rose-100 text-rose-800' : utilizationPct > 70 ? 'bg-indigo-100 text-indigo-800' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {utilizationPct}% Used
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                      <div>
                        <span className="block text-gray-400">Baseline Budget</span>
                        <span className="font-bold text-gray-700">{formatSAR(b.allocated)}</span>
                      </div>
                      <div className="text-right">
                        <span className="block text-gray-400">Actual Spent</span>
                        <span className="font-bold text-rose-600">{formatSAR(b.spent)}</span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1">
                      <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-300 ${
                            utilizationPct > 90 ? 'bg-rose-500' : utilizationPct > 70 ? 'bg-indigo-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(utilizationPct, 100)}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-[9px] font-mono text-gray-500">
                        <span>Remaining Balance:</span>
                        <span className="font-bold text-gray-700">{formatSAR(remaining)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
              {projBudgets.length === 0 && (
                <div className="bg-white p-8 border border-dashed border-gray-200 text-center text-gray-400 italic text-xs col-span-full rounded-xl">
                  No internal budget allocations declared. Click "Add Budget" to initialize categories.
                </div>
              )}
            </div>

          </div>
        )}

        {/* T6. MILESTONES */}
        {activeTab === 'milestones' && currentPermissions?.viewProjectMilestones !== false && (
          <div className="space-y-6">
            
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div>
                <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider font-mono font-semibold">Milestone Master Plan</h3>
                <p className="text-[10px] text-gray-400">Contractual billing milestones contributed to the overall contract. Milestone progress rolls up to overall project progress.</p>
              </div>

              {canWrite && !showMilestoneForm && (
                <button
                  onClick={() => setShowMilestoneForm(true)}
                  className="bg-slate-900 hover:bg-slate-800 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer self-start sm:self-auto"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Configure Milestone</span>
                </button>
              )}
            </div>

            {/* Total Milestone Weight Monitor */}
            {(() => {
              const totalWeightSum = projMilestones.reduce((acc, m) => acc + m.weight, 0);
              const isOverBudget = totalWeightSum > 100;
              const isUnderBudget = totalWeightSum < 100;

              return (
                <div className={`p-4 rounded-xl border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 ${
                  isOverBudget 
                    ? 'bg-rose-50 border-rose-200 text-rose-800' 
                    : isUnderBudget 
                      ? 'bg-amber-50/50 border-amber-200/60 text-amber-800' 
                      : 'bg-emerald-50/30 border-emerald-100 text-emerald-800'
                }`}>
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold font-mono uppercase">Contract Baseline Allocation</h4>
                    <p className="text-[10px] opacity-90">
                      {isOverBudget 
                        ? 'Total allocated milestone weights exceed 100%. Please modify weight percentages.' 
                        : isUnderBudget 
                          ? `Active milestones contribute ${totalWeightSum}% of the total project. Add milestones to represent the remaining ${100 - totalWeightSum}%.` 
                          : 'Milestone baseline contributions successfully sum to exactly 100%.'}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-lg font-mono font-bold">{totalWeightSum}%</span>
                    <span className="text-[10px] block opacity-80">/ 100% Contract Weight</span>
                  </div>
                </div>
              );
            })()}

            {/* Create Milestone Form */}
            {showMilestoneForm && (
              <form onSubmit={handleCreateMilestone} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4 select-none">
                <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                  <h4 className="text-xs font-bold text-gray-800 uppercase font-mono">Create Contractual Milestone</h4>
                  <button type="button" onClick={() => setShowMilestoneForm(false)} className="text-xs text-gray-400 hover:text-gray-600 font-bold">Cancel</button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-mono text-gray-400 uppercase">Milestone Title</label>
                    <input
                      type="text"
                      required
                      value={milestoneName}
                      onChange={e => setMilestoneName(e.target.value)}
                      placeholder="e.g. Rough-ins & MEP First Fix"
                      className="w-full border border-gray-200 rounded p-1.5 text-xs mt-1 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-gray-400 uppercase">Planned Due Date</label>
                    <input
                      type="date"
                      required
                      value={milestoneDueDate}
                      onChange={e => setMilestoneDueDate(e.target.value)}
                      className="w-full border border-gray-200 rounded p-1.5 text-xs mt-1 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-gray-400 uppercase">Contract Contribution Weight (%)</label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={100}
                      value={milestoneWeight}
                      onChange={e => setMilestoneWeight(Number(e.target.value))}
                      className="w-full border border-gray-200 rounded p-1.5 text-xs mt-1 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-gray-400 uppercase">Detailed Specifications & Deliverables</label>
                  <textarea
                    value={milestoneDetails}
                    onChange={e => setMilestoneDetails(e.target.value)}
                    placeholder="Enter detailed description, compliance criteria, or physical deliverables of this milestone..."
                    className="w-full border border-gray-200 rounded p-2 text-xs mt-1 focus:outline-none focus:border-amber-500 h-20 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-gray-400 uppercase">Attach Reference Documents (e.g., Drawings, Specs)</label>
                  <input
                    type="text"
                    value={milestoneAttachmentName}
                    onChange={e => setMilestoneAttachmentName(e.target.value)}
                    placeholder="e.g. Specification_Sheet_RevB.pdf"
                    className="w-full border border-gray-200 rounded p-1.5 text-xs mt-1 focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-2 border-t border-gray-100">
                  <button type="button" onClick={() => setShowMilestoneForm(false)} className="text-xs text-gray-500 font-semibold px-3 py-1.5">
                    Cancel
                  </button>
                  <button type="submit" className="bg-amber-500 hover:bg-amber-600 text-slate-950 px-4 py-1.5 rounded-lg text-xs font-bold transition">
                    Save Milestone
                  </button>
                </div>
              </form>
            )}

            {/* Milestones Card / Table List */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
              <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                <span className="text-xs font-bold uppercase font-mono text-gray-500">Contract Milestones Baseline</span>
                <span className="text-[10px] text-gray-400">{projMilestones.length} Milestone(s) Found</span>
              </div>
              <div className="divide-y divide-gray-100">
                {projMilestones.map((m) => {
                  const hasAttachments = m.attachments && m.attachments.length > 0;
                  return (
                    <div key={m.id} className="p-4 hover:bg-gray-50/30 transition space-y-3">
                      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-xs text-gray-800">{m.name}</span>
                            <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase ${
                              m.status === 'completed' 
                                ? 'bg-emerald-100 text-emerald-800' 
                                : m.status === 'in_progress' 
                                  ? 'bg-indigo-100 text-indigo-800' 
                                  : 'bg-gray-100 text-gray-500'
                            }`}>
                              {m.status.replace('_', ' ')}
                            </span>
                          </div>
                          {m.details && (
                            <p className="text-[11px] text-gray-500 mt-1 max-w-2xl">{m.details}</p>
                          )}
                        </div>

                        <div className="text-left sm:text-right font-mono text-[10px] text-gray-500 space-y-0.5 shrink-0">
                          <div>Planned Due: <span className="font-bold text-gray-700">{m.dueDate}</span></div>
                          <div>Contract Weight: <span className="font-bold text-indigo-700">{m.weight}%</span></div>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="flex items-center space-x-3">
                        <span className="text-[10px] font-bold font-mono text-gray-700 w-8 shrink-0">{m.progress}%</span>
                        <div className="flex-1 bg-gray-100 h-2 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-300 ${
                              m.progress === 100 ? 'bg-emerald-500' : 'bg-indigo-600'
                            }`} 
                            style={{ width: `${m.progress}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Attachments */}
                      {hasAttachments && (
                        <div className="flex items-center space-x-2 text-[10px] font-mono text-gray-400 bg-gray-50 rounded px-2.5 py-1 w-fit border border-gray-150">
                          <Paperclip className="w-3 h-3 text-gray-400 shrink-0" />
                          <span className="text-gray-600 font-medium">{m.attachments![0].name}</span>
                          <span className="text-gray-400">({m.attachments![0].size})</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        )}

        {/* T7. TASKS */}
        {activeTab === 'tasks' && currentPermissions?.viewProjectTasks !== false && (
          <div className="space-y-6">
            
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div>
                <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider font-mono font-semibold">Project Operational Tasks</h3>
                <p className="text-[10px] text-gray-400">On-site checklist assigned to engineers. Task progress rolls up to milestone progress according to their task weights.</p>
              </div>
              
              {canWrite && !showTaskForm && (
                <button
                  onClick={() => setShowTaskForm(true)}
                  className="bg-slate-900 hover:bg-slate-800 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer self-start sm:self-auto"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Task</span>
                </button>
              )}
            </div>

            {/* Task creation form */}
            {showTaskForm && (
              <form onSubmit={handleAddTask} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4 select-none">
                <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                  <h4 className="text-xs font-bold text-gray-800 uppercase font-mono">Draft New Task Details</h4>
                  <button type="button" onClick={() => setShowTaskForm(false)} className="text-xs text-gray-400 hover:text-gray-600 font-bold">Cancel</button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-mono text-gray-400 uppercase">Task Name</label>
                    <input
                      type="text"
                      required
                      value={taskName}
                      onChange={e => setTaskName(e.target.value)}
                      placeholder="e.g. Concrete framing columns for block 2"
                      className="w-full border border-gray-200 rounded p-1.5 text-xs mt-1 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-gray-400 uppercase">Parent Milestone</label>
                    <select
                      required
                      value={taskMilestone}
                      onChange={e => setTaskMilestone(e.target.value)}
                      className="w-full border border-gray-200 rounded p-1.5 text-xs mt-1 focus:outline-none focus:border-amber-500 bg-white"
                    >
                      <option value="">Choose Milestone</option>
                      {projMilestones.map(m => (
                        <option key={m.id} value={m.id}>{m.name} ({m.weight}%)</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-gray-400 uppercase">Assignee Engineer</label>
                    <select
                      required
                      value={taskAssignee}
                      onChange={e => setTaskAssignee(e.target.value)}
                      className="w-full border border-gray-200 rounded p-1.5 text-xs mt-1 focus:outline-none focus:border-amber-500 bg-white"
                    >
                      <option value="">Choose Engineer</option>
                      {availableUsers.map(u => (
                        <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-gray-400 uppercase">Task Contribution Weight in Milestone (%)</label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={100}
                      value={taskWeight}
                      onChange={e => setTaskWeight(Number(e.target.value))}
                      className="w-full border border-gray-200 rounded p-1.5 text-xs mt-1 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-gray-400 uppercase">Target Due Date</label>
                    <input
                      type="date"
                      required
                      value={taskDueDate}
                      onChange={e => setTaskDueDate(e.target.value)}
                      className="w-full border border-gray-200 rounded p-1.5 text-xs mt-1 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-2 border-t border-gray-100 pt-3">
                  <button type="button" onClick={() => setShowTaskForm(false)} className="text-xs text-gray-500 px-3 py-1.5 font-semibold">Cancel</button>
                  <button type="submit" className="bg-amber-500 hover:bg-amber-600 text-slate-950 px-4 py-1.5 rounded-lg text-xs font-bold">Save Task</button>
                </div>
              </form>
            )}


            {/* Kanban columns */}
            <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-6 gap-4 items-start select-none">
              
              {([
                { id: 'to_do', title: 'To-Do', color: 'bg-slate-100 border-slate-200 text-slate-700' },
                { id: 'in_progress', title: 'In Progress', color: 'bg-indigo-50/50 border-indigo-100 text-indigo-700' },
                { id: 'blocked', title: 'Blocked', color: 'bg-rose-50/30 border-rose-100/50 text-rose-700' },
                { id: 'on_hold', title: 'On Hold', color: 'bg-amber-50/30 border-amber-100/40 text-amber-700' },
                { id: 'rework', title: 'Rework', color: 'bg-red-50/40 border-red-100/60 text-red-800' },
                { id: 'completed', title: 'Completed', color: 'bg-emerald-50/30 border-emerald-100/60 text-emerald-800' }
              ] as const).map((col) => {
                const colTasks = projTasks.filter(t => t.status === col.id || (col.id === 'to_do' && t.status === 'review'));

                return (
                  <div key={col.id} className="bg-gray-50/60 border border-gray-200 rounded-xl p-3 space-y-3 min-h-[350px] flex flex-col">
                    <div className="flex justify-between items-center pb-2 border-b border-gray-200/60">
                      <div className="flex items-center space-x-1.5">
                        <span className={`inline-block w-2 h-2 rounded-full ${
                          col.id === 'completed' ? 'bg-emerald-500' : col.id === 'rework' ? 'bg-red-500' : col.id === 'blocked' ? 'bg-rose-500' : col.id === 'in_progress' ? 'bg-indigo-500' : col.id === 'on_hold' ? 'bg-amber-500' : 'bg-slate-400'
                        }`} />
                        <span className="text-[11px] font-bold uppercase font-mono text-gray-700">{col.title}</span>
                      </div>
                      <span className="text-[10px] font-mono font-bold bg-white px-1.5 py-0.5 rounded-full border border-gray-200 text-gray-500">
                        {colTasks.length}
                      </span>
                    </div>

                    <div className="space-y-2 flex-1 overflow-y-auto max-h-[450px] pr-1 scrollbar-thin">
                      {colTasks.map((t) => {
                        const mParent = projMilestones.find(m => m.id === t.milestoneId);
                        return (
                          <div 
                            key={t.id} 
                            onClick={() => {
                              setSelectedTaskId(t.id);
                              setTaskDetailDescription(t.description || '');
                              setTaskDetailAssignee(t.assigneeId || '');
                              setActiveTaskTab('details');
                            }}
                            className="bg-white border border-gray-200/80 rounded-lg p-3 shadow-xs space-y-3 hover:border-indigo-300 hover:shadow-md transition text-[11px] cursor-pointer"
                          >
                            
                            <div className="space-y-1">
                              <span className="text-[9px] font-mono text-indigo-600 block truncate font-medium">
                                ↳ {mParent ? mParent.name : 'Unknown Milestone'}
                              </span>
                              <h5 className="font-bold text-gray-800 leading-tight">{t.name}</h5>
                            </div>

                            <div className="grid grid-cols-2 gap-1.5 font-mono text-[9px] text-gray-500 border-t border-gray-50 pt-1.5">
                              <div>
                                <span className="block opacity-75">Assignee</span>
                                <span className="font-semibold text-gray-700 block truncate">{t.assigneeName}</span>
                              </div>
                              <div className="text-right">
                                <span className="block opacity-75">Weight in MS</span>
                                <span className="font-bold text-slate-800 block">{t.weight ?? 10}%</span>
                              </div>
                            </div>

                            {/* Rework Info Warning Box */}
                            {t.status === 'rework' && t.reworkInfo && (
                              <div className="bg-red-50 border border-red-100 rounded p-2 text-[9px] text-red-900 space-y-1 font-mono">
                                <span className="font-bold uppercase block text-[8px] tracking-wider font-semibold">🛠️ Rework Instructions</span>
                                <p className="leading-tight">{t.reworkInfo}</p>
                              </div>
                            )}

                            {/* Task progress input */}
                            <div className="space-y-1" onClick={e => e.stopPropagation()}>
                              <div className="flex justify-between items-center text-[9px] font-mono">
                                <span className="text-gray-400">Progress:</span>
                                <span className="font-bold text-gray-700">{t.progress}%</span>
                              </div>
                              {canSite && t.status !== 'completed' ? (
                                <input 
                                  type="range" 
                                  min="0" 
                                  max="100" 
                                  step="10"
                                  value={t.progress}
                                  onClick={e => e.stopPropagation()}
                                  onChange={(e) => handleUpdateTaskProgress(t.id, Number(e.target.value))}
                                  className="w-full accent-indigo-600 h-1 bg-gray-100 rounded-lg appearance-none cursor-pointer"
                                />
                              ) : (
                                <div className="w-full bg-gray-100 h-1 rounded-full overflow-hidden">
                                  <div className={`h-full ${t.status === 'completed' ? 'bg-emerald-500' : 'bg-indigo-600'}`} style={{ width: `${t.progress}%` }}></div>
                                </div>
                              )}
                            </div>

                            {/* Attachments list */}
                            {t.attachments && t.attachments.length > 0 && (
                              <div className="bg-gray-50 border border-gray-100 rounded px-1.5 py-1 flex items-center space-x-1 text-[8px] font-mono text-gray-600">
                                <Paperclip className="w-2.5 h-2.5 shrink-0 text-gray-400" />
                                <span className="truncate flex-1">{t.attachments[0].name}</span>
                              </div>
                            )}

                            {/* Status transitions - Always active Block, Hold, Rework, Complete */}
                            <div className="flex flex-wrap gap-1.5 pt-2 border-t border-gray-100" onClick={e => e.stopPropagation()}>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleUpdateTaskStatus(t.id, 'blocked');
                                }}
                                className={`text-[10px] font-semibold px-2 py-1 rounded transition cursor-pointer border ${
                                  t.status === 'blocked'
                                    ? 'bg-rose-600 border-rose-600 text-white shadow-xs font-bold'
                                    : 'bg-rose-50/50 border-rose-100 text-rose-700 hover:bg-rose-100/80'
                                }`}
                              >
                                Block
                              </button>
                              
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleUpdateTaskStatus(t.id, 'on_hold');
                                }}
                                className={`text-[10px] font-semibold px-2 py-1 rounded transition cursor-pointer border ${
                                  t.status === 'on_hold'
                                    ? 'bg-amber-500 border-amber-500 text-white shadow-xs font-bold'
                                    : 'bg-amber-50/50 border-amber-100 text-amber-700 hover:bg-amber-100/80'
                                }`}
                              >
                                Hold
                              </button>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setReworkingTaskId(t.id);
                                }}
                                className={`text-[10px] font-semibold px-2 py-1 rounded transition cursor-pointer border ${
                                  t.status === 'rework'
                                    ? 'bg-red-600 border-red-600 text-white shadow-xs font-bold'
                                    : 'bg-red-50/50 border-red-100 text-red-700 hover:bg-red-100/80'
                                }`}
                              >
                                Rework
                              </button>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setCompletingTaskId(t.id);
                                }}
                                className={`text-[10px] font-semibold px-2 py-1 rounded transition cursor-pointer border flex items-center space-x-1 ${
                                  t.status === 'completed'
                                    ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs font-bold'
                                    : 'bg-emerald-50/50 border-emerald-100 text-emerald-800 hover:bg-emerald-100/80'
                                }`}
                              >
                                <span>Complete</span>
                                <span>✓</span>
                              </button>
                            </div>

                          </div>
                        );
                      })}
                      {colTasks.length === 0 && (
                        <div className="p-4 border border-dashed border-gray-200 text-center text-gray-400 italic text-[9px] rounded-lg">
                          No Tasks
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

            </div>

          </div>
        )}

        {/* T8. ISSUES */}
        {activeTab === 'issues' && currentPermissions?.viewProjectIssues !== false && (
          <div className="space-y-4">
            
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider font-mono">Site Issues & Technical Risks</h3>
                <p className="text-[10px] text-gray-400">Discrepancy logs, delay factors, and material delays logged directly by Site Engineers.</p>
              </div>
              
              {canSite && !showIssueForm && (
                <button
                  onClick={() => setShowIssueForm(true)}
                  className="bg-rose-500 hover:bg-rose-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Log Issue</span>
                </button>
              )}
            </div>

            {showIssueForm && (
              <form onSubmit={handleAddIssue} className="bg-white p-5 rounded-xl border border-gray-200 shadow-md space-y-4">
                <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                  <h4 className="text-xs font-bold text-red-600 uppercase font-mono">Log Site Issue</h4>
                  <button type="button" onClick={() => setShowIssueForm(false)} className="text-xs text-gray-400 hover:text-gray-600 font-bold">Cancel</button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-mono text-gray-400 uppercase">Issue Title / Description</label>
                    <input
                      type="text"
                      required
                      value={issueTitle}
                      onChange={e => setIssueTitle(e.target.value)}
                      placeholder="e.g. Ground water seepages during foundation excavation"
                      className="w-full border border-gray-200 rounded p-1.5 text-xs mt-1"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-gray-400 uppercase">Issue Type</label>
                    <select
                      value={issueType}
                      onChange={e => setIssueType(e.target.value as any)}
                      className="w-full border border-gray-200 rounded p-1.5 text-xs mt-1"
                    >
                      <option value="site">Site Physical Issue</option>
                      <option value="technical">Technical Engineering Discrepancy</option>
                      <option value="client_request">Client Change Request</option>
                      <option value="delay">Supply chain / Resource delay</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-gray-400 uppercase">Severity Level</label>
                    <select
                      value={issueSeverity}
                      onChange={e => setIssueSeverity(e.target.value as any)}
                      className="w-full border border-gray-200 rounded p-1.5 text-xs mt-1"
                    >
                      <option value="low">Low Impact</option>
                      <option value="medium">Medium Impact</option>
                      <option value="high">High Severity</option>
                      <option value="critical">Critical Path Risk</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <button type="button" onClick={() => setShowIssueForm(false)} className="text-xs text-gray-500 px-3">Cancel</button>
                  <button type="submit" className="bg-rose-500 hover:bg-rose-600 text-white px-4 py-2 rounded-xl text-xs font-bold cursor-pointer">Log Issue</button>
                </div>
              </form>
            )}

            {/* Issues List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {projIssues.map((issue) => (
                <div key={issue.id} className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-sm space-y-4 hover:border-red-200 transition">
                  <div className="flex justify-between items-start border-b border-gray-50 pb-2">
                    <div>
                      <span className={`inline-block text-[9px] font-mono px-1.5 py-0.5 rounded uppercase font-bold mr-1.5 ${
                        issue.severity === 'critical' ? 'bg-rose-100 text-rose-800' : 'bg-indigo-100 text-indigo-800'
                      }`}>
                        {issue.severity} severity
                      </span>
                      <span className="text-[10px] font-mono text-gray-400">{issue.dateCreated}</span>
                    </div>
                    
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                      issue.status === 'resolved' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {issue.status}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-gray-800">{issue.title}</h4>
                    <span className="text-[10px] text-gray-400 mt-1 block">Logged By: <span className="font-semibold text-gray-700">{issue.assigneeName}</span></span>
                  </div>

                  {issue.status === 'open' && canSite && (
                    <button
                      onClick={() => handleResolveIssue(issue.id)}
                      className="w-full bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center space-x-1 cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Resolve Issue</span>
                    </button>
                  )}

                  {issue.status === 'resolved' && (
                    <div className="bg-emerald-50/50 p-2.5 rounded border border-emerald-500/10 text-[10px] text-emerald-800 leading-relaxed font-mono">
                      <strong>Resolution: </strong> {issue.resolution || 'Resolved by site engineer team.'}
                    </div>
                  )}
                </div>
              ))}
            </div>

          </div>
        )}

        {/* T9. VARIATIONS */}
        {activeTab === 'variations' && currentPermissions?.viewProjectVariations !== false && (
          <div className="space-y-4">
            
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider font-mono">Variation Orders (VO) & Extra Works</h3>
                <p className="text-[10px] text-gray-400">Layout changes requested on site. Approving a variation increases total contract values.</p>
              </div>
              
              {canWrite && !showVariationForm && (
                <button
                  onClick={() => setShowVariationForm(true)}
                  className="bg-slate-900 hover:bg-slate-800 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Draft VO</span>
                </button>
              )}
            </div>

            {showVariationForm && (
              <form onSubmit={handleAddVariation} className="bg-white p-5 rounded-xl border border-gray-200 shadow-md space-y-4">
                <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                  <h4 className="text-xs font-bold text-gray-800 uppercase font-mono">Draft Variation Order</h4>
                  <button type="button" onClick={() => setShowVariationForm(false)} className="text-xs text-gray-400 hover:text-gray-600 font-bold">Cancel</button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-3">
                    <label className="block text-[10px] font-mono text-gray-400 uppercase">Variation Title</label>
                    <input type="text" required value={varTitle} onChange={e => setVarTitle(e.target.value)} placeholder="e.g. Upgrade swimming pool to Olympic specification" className="w-full border border-gray-200 rounded p-1.5 text-xs mt-1" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-gray-400 uppercase">Cost Impact (SAR)</label>
                    <input type="number" required value={varCost || ''} onChange={e => setVarCost(Number(e.target.value))} className="w-full border border-gray-200 rounded p-1.5 text-xs mt-1" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-gray-400 uppercase">Time Extension Impact (Days)</label>
                    <input type="number" value={varTime || ''} onChange={e => setVarTime(Number(e.target.value))} className="w-full border border-gray-200 rounded p-1.5 text-xs mt-1" />
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <button type="button" onClick={() => setShowVariationForm(false)} className="text-xs text-gray-500 px-3">Cancel</button>
                  <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold cursor-pointer">Register VO</button>
                </div>
              </form>
            )}

            {/* Variations list */}
            <div className="space-y-4">
              {projVariations.map((v) => (
                <div key={v.id} className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center space-y-3 md:space-y-0">
                  <div className="space-y-1.5 max-w-[60%]">
                    <div className="flex items-center space-x-2">
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                        v.approvalStatus === 'approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-indigo-100 text-indigo-800'
                      }`}>
                        {v.approvalStatus}
                      </span>
                      <span className="text-[10px] font-mono text-gray-400">{v.dateCreated}</span>
                    </div>
                    <h4 className="text-xs font-bold text-gray-800">{v.title}</h4>
                    <p className="text-[11px] text-gray-500 leading-snug">{v.description || 'No detailed layout description registered.'}</p>
                  </div>

                  <div className="flex items-center space-x-6 shrink-0">
                    <div className="text-right font-mono">
                      <span className="block text-[9px] text-gray-400 uppercase">Financial Impact</span>
                      <span className="font-extrabold text-indigo-600 text-xs">{formatSAR(v.costImpact)}</span>
                    </div>
                    <div className="text-right font-mono">
                      <span className="block text-[9px] text-gray-400 uppercase">Time Impact</span>
                      <span className="font-bold text-gray-700 text-xs">+{v.timeImpactDays} Days</span>
                    </div>
                    
                    {v.approvalStatus === 'pending' && (currentUser.role === 'General Manager' || currentUser.role === 'Client') && (
                      <button
                        onClick={() => handleApproveVariation(v.id)}
                        className="bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer shadow"
                      >
                        Approve VO
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

          </div>
        )}

        {/* T10. EXPENSES */}
        {activeTab === 'expenses' && currentPermissions?.viewProjectExpenses !== false && (
          <div className="space-y-4">
            
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider font-mono">Subcontractor & Supplier Receipts</h3>
                <p className="text-[10px] text-gray-400">Direct material expenditures. Approved costs reduce remaining category budget allocations.</p>
              </div>
              
              {canSite && !showExpenseForm && (
                <button
                  onClick={() => setShowExpenseForm(true)}
                  className="bg-slate-900 hover:bg-slate-800 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>File Receipt</span>
                </button>
              )}
            </div>

            {showExpenseForm && (
              <form onSubmit={handleAddExpense} className="bg-white p-5 rounded-xl border border-gray-200 shadow-md space-y-4">
                <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                  <h4 className="text-xs font-bold text-gray-800 uppercase font-mono">Submit Material Receipt</h4>
                  <button type="button" onClick={() => setShowExpenseForm(false)} className="text-xs text-gray-400 hover:text-gray-600 font-bold">Cancel</button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-mono text-gray-400 uppercase">Subcontractor / Vendor</label>
                    <input type="text" required value={expVendor} onChange={e => setExpVendor(e.target.value)} placeholder="e.g. Saudi Ready-Mix Concrete Co." className="w-full border border-gray-200 rounded p-1.5 text-xs mt-1" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-gray-400 uppercase">Budget Category</label>
                    <select required value={expCategory} onChange={e => setExpCategory(e.target.value)} className="w-full border border-gray-200 rounded p-1.5 text-xs mt-1">
                      <option value="">Select Category</option>
                      {projBudgets.map(b => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-gray-400 uppercase">Amount (SAR, Excl VAT)</label>
                    <input type="number" required value={expAmount || ''} onChange={e => setExpAmount(Number(e.target.value))} className="w-full border border-gray-200 rounded p-1.5 text-xs mt-1" />
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <button type="button" onClick={() => setShowExpenseForm(false)} className="text-xs text-gray-500 px-3">Cancel</button>
                  <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold cursor-pointer font-sans">Submit Invoice</button>
                </div>
              </form>
            )}

            {/* Expenses table */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-[10px] font-mono text-gray-400 uppercase">
                  <tr>
                    <th className="p-3">Vendor / Supplier</th>
                    <th className="p-3">Budget Account</th>
                    <th className="p-3 text-right">Base Amount</th>
                    <th className="p-3 text-right">VAT (15%)</th>
                    <th className="p-3 text-right">Total (SAR)</th>
                    <th className="p-3 text-right">Receipt Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {projExpenses.map((exp) => {
                    const matchedCategory = projBudgets.find(b => b.id === exp.budgetCategoryId);
                    const displayVals = getExpenseDisplayValues(exp);
                    return (
                      <tr key={exp.id} className="hover:bg-gray-50/20">
                        <td className="p-3 font-medium text-gray-900">{exp.vendor}</td>
                        <td className="p-3 font-mono text-gray-500">{matchedCategory ? matchedCategory.name : 'Unassigned'}</td>
                        <td className="p-3 text-right font-mono text-gray-600">{formatSAR(displayVals.amount)}</td>
                        <td className="p-3 text-right font-mono text-gray-600">{formatSAR(displayVals.vat)}</td>
                        <td className="p-3 text-right font-mono font-bold text-gray-800">{formatSAR(displayVals.totalAmount)}</td>
                        <td className="p-3 text-right">
                          {exp.approvalStatus === 'pending' && canAccount ? (
                            <div className="flex justify-end space-x-1">
                              <button onClick={() => handleApproveExpense(exp.id)} className="bg-emerald-500 hover:bg-emerald-600 text-white p-1 px-2 rounded text-[10px] font-bold cursor-pointer">Approve</button>
                              <button onClick={() => handleRejectExpense(exp.id)} className="bg-rose-500 hover:bg-rose-600 text-white p-1 px-2 rounded text-[10px] font-bold cursor-pointer">Reject</button>
                            </div>
                          ) : (
                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                              exp.approvalStatus === 'approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-indigo-100 text-indigo-800'
                            }`}>
                              {exp.approvalStatus}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  
                  {projExpenses.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-12 text-center text-gray-400 italic">No receipts filed yet for this contract.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

          </div>
        )}

        {/* T11. INVOICES */}
        {activeTab === 'invoices' && currentPermissions?.viewProjectInvoices !== false && (
          <div className="space-y-4">
            
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider font-mono font-semibold">Issued Client Progress Invoices</h3>
                <p className="text-[10px] text-gray-400 font-sans">Valuations issued to Client developer for completed milestone works.</p>
              </div>
              
              {canAccount && !showInvoiceForm && (
                <button
                  onClick={() => setShowInvoiceForm(true)}
                  className="bg-slate-900 hover:bg-slate-800 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Draft Invoice</span>
                </button>
              )}
            </div>

            {showInvoiceForm && (
              <form onSubmit={handleAddInvoice} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4 select-none">
                <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                  <h4 className="text-xs font-bold text-gray-800 uppercase font-mono">Draft Progress Invoice</h4>
                  <button type="button" onClick={() => setShowInvoiceForm(false)} className="text-xs text-gray-400 hover:text-gray-600 font-bold">Cancel</button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-mono text-gray-400 uppercase">Target Completion Milestone</label>
                    <select required value={invMilestone} onChange={e => setInvMilestone(e.target.value)} className="w-full border border-gray-200 rounded p-1.5 text-xs mt-1 bg-white">
                      <option value="">Select Milestone</option>
                      {projMilestones.map(m => (
                        <option key={m.id} value={m.id}>{m.name} ({m.progress}% done)</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-gray-400 uppercase">Invoice Value (Base SAR, Excl VAT)</label>
                    <input type="number" required value={invAmount || ''} onChange={e => setInvAmount(Number(e.target.value))} className="w-full border border-gray-200 rounded p-1.5 text-xs mt-1" />
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <button type="button" onClick={() => setShowInvoiceForm(false)} className="text-xs text-gray-500 px-3">Cancel</button>
                  <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold cursor-pointer font-sans">Submit Invoice</button>
                </div>
              </form>
            )}

            {/* Payment Recording Modal Dialog */}
            {selectedInvoiceForPayment && (
              <div className="fixed inset-0 bg-slate-950/60 z-50 flex items-center justify-center p-4 select-none animate-fade-in">
                <form onSubmit={handleRecordInvoicePaymentDetailed} className="bg-white rounded-xl border border-gray-150 shadow-2xl p-6 max-w-md w-full space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider font-mono text-emerald-700">Record Client Payment Received</h4>
                  <p className="text-[11px] text-gray-500">Record direct cash collections or bank wire transfers received against the selected progress valuation invoice.</p>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-mono text-gray-400 uppercase">Amount Received (SAR)</label>
                      <input
                        type="number"
                        required
                        value={paymentAmount}
                        onChange={e => setPaymentAmount(Number(e.target.value))}
                        className="w-full border border-gray-200 rounded p-1.5 text-xs mt-1 font-mono focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-gray-400 uppercase">Date of Collection</label>
                      <input
                        type="date"
                        required
                        value={paymentDate}
                        onChange={e => setPaymentDate(e.target.value)}
                        className="w-full border border-gray-200 rounded p-1.5 text-xs mt-1 font-mono focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-mono text-gray-400 uppercase">Payment Method</label>
                      <select
                        value={paymentMethod}
                        onChange={e => setPaymentMethod(e.target.value as any)}
                        className="w-full border border-gray-200 rounded p-1.5 text-xs mt-1 bg-white focus:outline-none focus:border-amber-500"
                      >
                        <option value="Bank Transfer">Bank Transfer (SADAD / Wire)</option>
                        <option value="Cash">Direct Cash Deposit / Counter</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-gray-400 uppercase">Bank Transaction / Cash Ref</label>
                      <input
                        type="text"
                        required
                        value={paymentBankRef}
                        onChange={e => setPaymentBankRef(e.target.value)}
                        placeholder="e.g. SAB-TX-9821038"
                        className="w-full border border-gray-200 rounded p-1.5 text-xs mt-1 font-mono focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-gray-400 uppercase">Signed Payment Reference Document</label>
                    <input
                      type="text"
                      value={invAttachmentInput}
                      onChange={e => setInvAttachmentInput(e.target.value)}
                      placeholder="e.g. Signed_Payment_Receipt_992.pdf"
                      className="w-full border border-gray-200 rounded p-1.5 text-xs mt-1 font-mono focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="flex justify-end space-x-2 pt-2 border-t border-gray-100">
                    <button type="button" onClick={() => setSelectedInvoiceForPayment(null)} className="text-xs text-gray-500 font-semibold px-3 py-1.5">Cancel</button>
                    <button 
                      type="submit" 
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-1.5 rounded-lg text-xs font-bold"
                    >
                      Record Payment
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Invoices list */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-x-auto text-xs">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-[10px] font-mono text-gray-400 uppercase">
                  <tr>
                    <th className="p-3">Invoice Number</th>
                    <th className="p-3">Target Milestone</th>
                    <th className="p-3 text-right">Base Amount</th>
                    <th className="p-3 text-right">VAT (15%)</th>
                    <th className="p-3 text-right">Retention (5%)</th>
                    <th className="p-3 text-right">Total Net Bill</th>
                    <th className="p-3 text-right">Valuation Status / Received</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {projInvoices.map((inv) => {
                    const displayVals = getInvoiceDisplayValues(inv);
                    return (
                      <tr key={inv.id} className="hover:bg-gray-50/20 font-medium">
                        <td className="p-3 font-mono font-bold text-slate-900">
                          <div>{inv.invoiceNumber}</div>
                          {inv.attachedInvoiceFile && (
                            <div className="text-[9px] text-gray-400 font-normal flex items-center space-x-1 mt-0.5">
                              <Paperclip className="w-2.5 h-2.5 shrink-0" />
                              <span>{inv.attachedInvoiceFile}</span>
                            </div>
                          )}
                        </td>
                        <td className="p-3 text-gray-600">{inv.milestoneName}</td>
                        <td className="p-3 text-right font-mono text-gray-600">{formatSAR(displayVals.amount)}</td>
                        <td className="p-3 text-right font-mono text-gray-600">+{formatSAR(displayVals.vat)}</td>
                        <td className="p-3 text-right font-mono text-rose-600">-{formatSAR(inv.retention)}</td>
                        <td className="p-3 text-right font-mono font-bold text-gray-900">{formatSAR(displayVals.totalAmount)}</td>
                        <td className="p-3 text-right">
                          {inv.status === 'submitted' && canAccount ? (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedInvoiceForPayment(inv);
                                setPaymentAmount(displayVals.totalAmount);
                                setPaymentDate(new Date().toISOString().slice(0, 10));
                              }}
                              className="bg-indigo-600 hover:bg-indigo-700 text-white p-1 px-2.5 rounded text-[10px] font-bold cursor-pointer"
                            >
                              Collect Payment
                            </button>
                          ) : (
                          <div className="space-y-0.5">
                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                              inv.status === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-indigo-100 text-indigo-800'
                            }`}>
                              {inv.status}
                            </span>
                            {inv.status === 'paid' && inv.receivedAmount && (
                              <div className="text-[9px] text-gray-500 font-mono">
                                Rec: {formatSAR(inv.receivedAmount)} ({inv.paymentDate})
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                    );
                  })}
                  
                  {projInvoices.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-12 text-center text-gray-400 italic">No progress invoices drafted yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

          </div>
        )}

        {/* T12. PAYMENTS */}
        {activeTab === 'payments' && currentPermissions?.viewProjectPayments !== false && (
          <div className="space-y-4">
            
            <div>
              <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider font-mono">Payment Collection History</h3>
              <p className="text-[10px] text-gray-400 font-normal">Formal SAB/SADAD receipts of funds transferred directly into bank accounts.</p>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-x-auto text-xs">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-[10px] font-mono text-gray-400 uppercase">
                  <tr>
                    <th className="p-3">Payment Receipt #</th>
                    <th className="p-3">Reference Invoice</th>
                    <th className="p-3">Collection Date</th>
                    <th className="p-3">Method</th>
                    <th className="p-3 text-right">Bank Wire Ref</th>
                    <th className="p-3 text-right">Collected Amount (SAR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 font-medium">
                  {projPayments.map((pay) => (
                    <tr key={pay.id} className="hover:bg-gray-50/20">
                      <td className="p-3 font-mono text-gray-500">#{pay.id.split('_')[1] || pay.id}</td>
                      <td className="p-3 font-mono font-bold text-slate-900">{pay.invoiceNumber}</td>
                      <td className="p-3 text-gray-600 font-normal">{pay.date}</td>
                      <td className="p-3 text-gray-600 font-normal">{pay.paymentMethod}</td>
                      <td className="p-3 text-right font-mono font-bold text-emerald-700">{pay.bankRef}</td>
                      <td className="p-3 text-right font-mono font-bold text-emerald-600">{formatSAR(pay.amount)}</td>
                    </tr>
                  ))}
                  
                  {projPayments.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-12 text-center text-gray-400 italic font-normal">No payments received yet. Process uncollected progress invoices above.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

          </div>
        )}

        {/* T13. DOCUMENTS */}
        {activeTab === 'documents' && currentPermissions?.viewProjectDocuments !== false && (
          <div className="space-y-6">
            
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div>
                <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider font-mono font-semibold">Drawing & Document Management</h3>
                <p className="text-[10px] text-gray-400">Approved master blueprints, priced BOQs, and executed contracts with strict version history.</p>
              </div>
              
              {!showDocUploadForm && (
                <button
                  onClick={() => setShowDocUploadForm(true)}
                  className="bg-slate-900 hover:bg-slate-800 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer self-start sm:self-auto"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Register Document</span>
                </button>
              )}
            </div>

            {/* Document Register Form */}
            {showDocUploadForm && (
              <form onSubmit={handleUploadDocumentController} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4 select-none">
                <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                  <h4 className="text-xs font-bold text-gray-800 uppercase font-mono">Register Reference Document</h4>
                  <button type="button" onClick={() => setShowDocUploadForm(false)} className="text-xs text-gray-400 hover:text-gray-600 font-bold">Cancel</button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-3">
                    <label className="block text-[10px] font-mono text-gray-400 uppercase mb-1">Upload File</label>
                    <input
                      type="file"
                      onChange={e => {
                        if (e.target.files && e.target.files.length > 0) {
                          const file = e.target.files[0];
                          if (!docName) {
                            setDocName(file.name);
                          }
                          setDocFileUrl(URL.createObjectURL(file));
                          setDocFileSize(
                            file.size > 1024 * 1024
                              ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
                              : `${Math.round(file.size / 1024)} KB`
                          );
                        }
                      }}
                      className="w-full border border-gray-200 rounded p-1.5 text-xs bg-slate-50 focus:outline-none focus:border-indigo-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-gray-400 uppercase">Document Name (Incl. Ext)</label>
                    <input
                      type="text"
                      required
                      value={docName}
                      onChange={e => setDocName(e.target.value)}
                      placeholder="e.g. Architectural_Section_Layout.pdf"
                      className="w-full border border-gray-200 rounded p-1.5 text-xs mt-1 focus:outline-none focus:border-indigo-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-gray-400 uppercase">Document Category</label>
                    <select
                      value={docCategory}
                      onChange={e => setDocCategory(e.target.value)}
                      className="w-full border border-gray-200 rounded p-1.5 text-xs mt-1 bg-white focus:outline-none focus:border-indigo-600"
                    >
                      {['Quotation', 'PO', 'Subcontractor PO', 'Payment Document', 'Drawing', 'Specification', 'Inspection Log', 'Invoice File'].map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-gray-400 uppercase">Reference / PO Number (Optional)</label>
                    <input
                      type="text"
                      value={docRefNumber}
                      onChange={e => setDocRefNumber(e.target.value)}
                      placeholder="e.g. REF-2026-902A"
                      className="w-full border border-gray-200 rounded p-1.5 text-xs mt-1 focus:outline-none focus:border-indigo-600 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-gray-400 uppercase">Expiry Date (Optional)</label>
                    <input
                      type="date"
                      value={docExpiryDate}
                      onChange={e => setDocExpiryDate(e.target.value)}
                      className="w-full border border-gray-200 rounded p-1.5 text-xs mt-1 focus:outline-none focus:border-indigo-600 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-gray-400 uppercase">Version Tag</label>
                    <input
                      type="text"
                      value={docVersion}
                      onChange={e => setDocVersion(e.target.value)}
                      placeholder="e.g. v1.0"
                      className="w-full border border-gray-200 rounded p-1.5 text-xs mt-1 focus:outline-none focus:border-indigo-600 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-gray-400 uppercase">Comma Separated Tags (Optional)</label>
                    <input
                      type="text"
                      value={docTags}
                      onChange={e => setDocTags(e.target.value)}
                      placeholder="e.g. structural, approved, main-office"
                      className="w-full border border-gray-200 rounded p-1.5 text-xs mt-1 focus:outline-none focus:border-indigo-600 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-gray-400 uppercase">Description / Scope of Application</label>
                  <textarea
                    value={docDescription}
                    onChange={e => setDocDescription(e.target.value)}
                    placeholder="Provide short memo, scope of application, or engineering authorization notes of this file..."
                    className="w-full border border-gray-200 rounded p-2 text-xs mt-1 focus:outline-none focus:border-indigo-600 h-16 resize-none"
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-2 border-t border-gray-100">
                  <button type="button" onClick={() => setShowDocUploadForm(false)} className="text-xs text-gray-500 font-semibold px-3 py-1.5">Cancel</button>
                  <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1.5 rounded-lg text-xs font-bold">Register Document</button>
                </div>
              </form>
            )}

            {/* Documents List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 select-none">
              {projDocs.map((doc) => {
                const isExpired = doc.expiryDate && new Date(doc.expiryDate) < new Date();
                return (
                  <div key={doc.id} className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-sm flex flex-col justify-between hover:border-indigo-200/60 hover:shadow-xs transition space-y-3">
                    <div className="flex items-start space-x-3">
                      <div className="p-2.5 bg-indigo-50/50 rounded-lg text-indigo-600 border border-indigo-100 shrink-0">
                        <FileText className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div className="truncate flex-1 min-w-0">
                        <h4 className="text-xs font-bold text-gray-800 truncate" title={doc.name}>{doc.name}</h4>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                          <span className="text-[9px] font-semibold bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded font-mono">
                            {doc.category}
                          </span>
                          <span className="text-[9px] font-semibold bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded font-mono">
                            Version {doc.version}
                          </span>
                          {doc.referenceNumber && (
                            <span className="text-[9px] font-semibold bg-amber-50 text-amber-800 px-1.5 py-0.5 rounded font-mono">
                              Ref: {doc.referenceNumber}
                            </span>
                          )}
                        </div>
                        {doc.description && (
                          <p className="text-[10px] text-gray-500 mt-1.5 line-clamp-2 leading-tight">{doc.description}</p>
                        )}
                        
                        {doc.expiryDate && (
                          <div className={`text-[9px] font-mono mt-2 flex items-center space-x-1 ${isExpired ? 'text-rose-600 font-bold' : 'text-gray-400'}`}>
                            <AlertTriangle className="w-3 h-3 text-rose-500 shrink-0" />
                            <span>Expiry: {doc.expiryDate} {isExpired ? '(EXPIRED)' : ''}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-gray-50 pt-2.5">
                      <span className="text-[9px] text-gray-400 block font-mono">
                        By {doc.uploadedBy} on {doc.uploadedAt} ({doc.size})
                      </span>

                      <div className="flex items-center space-x-2">
                        {doc.url && (
                          <a
                            href={doc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 px-2.5 text-xs text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded font-semibold transition cursor-pointer flex items-center space-x-1"
                            title="Preview File"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Preview</span>
                          </a>
                        )}
                        <a
                          href={doc.url || '#'}
                          download={doc.name}
                          onClick={(e) => {
                            if (!doc.url) {
                              e.preventDefault();
                              alert(`File not found on server: ${doc.name}`);
                            }
                          }}
                          className="p-1 px-2.5 text-xs text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded font-semibold transition cursor-pointer flex items-center space-x-1"
                          title="Download File"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download</span>
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
              {projDocs.length === 0 && (
                <div className="bg-white p-12 text-center text-gray-400 italic text-xs border border-gray-200 rounded-xl col-span-full">
                  No registered drawings, specifications, or PO documents linked to this contract yet.
                </div>
              )}
            </div>

          </div>
        )}

        {/* T14. CONTRACT QUANTITIES */}
        {activeTab === 'quantities' && currentPermissions?.viewProjectQuantities !== false && (
          <div className="space-y-6">
            
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div>
                <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider font-mono font-semibold">Contract Project Quantities Ledger</h3>
                <p className="text-[10px] text-gray-400">Add, edit, manage and export global project quantities for {project.code} - {project.name}. This ledger is synchronized globally across the platform.</p>
              </div>
              
              <div className="flex items-center space-x-2 self-start sm:self-auto">
                {canWrite && !showQtyForm && (
                  <button
                    onClick={() => setShowQtyForm(true)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Log New Quantity</span>
                  </button>
                )}
                
                <button
                  onClick={() => {
                    const printWindow = window.open('', '_blank');
                    if (!printWindow) {
                      alert('Could not open print window. Please allow popups.');
                      return;
                    }
                    const activeQs = projectQuantities.filter(q => q.projectId === project.id);
                    const todayStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
                    const rowsHTML = activeQs.map((q, idx) => `
                      <tr style="border-bottom: 1px solid #e2e8f0;">
                        <td style="padding: 12px 8px; font-weight: bold; text-align: center; color: #4a5568;">${idx + 1}</td>
                        <td style="padding: 12px 8px; font-weight: 600; color: #1a202c;">${q.name}</td>
                        <td style="padding: 12px 8px; font-family: monospace; font-weight: bold; text-align: right; color: #2b6cb0;">${q.value.toLocaleString()}</td>
                        <td style="padding: 12px 8px; font-family: monospace; text-align: left; color: #4a5568;">${q.unit}</td>
                        <td style="padding: 12px 8px; text-align: center; color: #718096; font-size: 11px;">${q.lastUpdated}</td>
                        <td style="padding: 12px 8px; color: #4a5568; font-size: 11px;">${q.updatedBy}</td>
                      </tr>
                    `).join('');
                    printWindow.document.write(`
                      <!DOCTYPE html>
                      <html>
                      <head>
                        <title>Project Quantities Ledger - ${project.code}</title>
                        <style>
                          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
                          body { font-family: 'Inter', sans-serif; margin: 0; padding: 40px; color: #2d3748; }
                          .header-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
                          .logo-cell { font-size: 24px; font-weight: 800; color: #4f46e5; }
                          .gov-cell { text-align: right; font-size: 11px; font-family: monospace; color: #718096; }
                          .title-section { border-top: 3px solid #4f46e5; padding-top: 15px; margin-bottom: 25px; }
                          .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 30px; font-size: 12px; }
                          .ledger-table { width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 40px; }
                          .ledger-table th { background-color: #f1f5f9; color: #475569; padding: 10px 8px; border-bottom: 2px solid #cbd5e1; font-weight: 700; text-transform: uppercase; font-size: 10px; }
                          .signature-box { display: flex; justify-content: space-between; margin-top: 50px; }
                          .sig-line { width: 200px; border-top: 1px solid #a0aec0; text-align: center; padding-top: 8px; font-size: 11px; }
                        </style>
                      </head>
                      <body>
                        <table class="header-table">
                          <tr>
                            <td class="logo-cell">WAFAQ CONTRACTING</td>
                            <td class="gov-cell">QUANTITY SURVEY LOG<br>Date: ${todayStr}</td>
                          </tr>
                        </table>
                        <div class="title-section"><h1 style="font-size: 20px; font-weight: 800; margin: 0;">Project Quantities Certificate</h1></div>
                        <div class="meta-grid">
                          <div><strong>Project:</strong> ${project.code} - ${project.name}</div>
                          <div><strong>Client:</strong> ${project.clientName}</div>
                        </div>
                        <table class="ledger-table">
                          <thead>
                            <tr>
                              <th>#</th>
                              <th style="text-align:left;">Item Description</th>
                              <th style="text-align:right;">Certified Value</th>
                              <th style="text-align:left;">Unit</th>
                              <th>Last Update</th>
                              <th>Verified By</th>
                            </tr>
                          </thead>
                          <tbody>${rowsHTML.length > 0 ? rowsHTML : `<tr><td colspan="6" style="padding: 20px; text-align:center;">No quantities found</td></tr>`}</tbody>
                        </table>
                        <div class="signature-box">
                          <div class="sig-line">Prepared By (PM / Surveyor)</div>
                          <div class="sig-line">Approved By (General Manager)</div>
                        </div>
                      </body>
                      </html>
                    `);
                    printWindow.document.close();
                    setTimeout(() => printWindow.print(), 300);
                  }}
                  className="bg-slate-900 hover:bg-slate-800 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Export to PDF</span>
                </button>
              </div>
            </div>

            {/* Add Quantity Form */}
            {showQtyForm && (
              <form onSubmit={handleAddQuantity} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4 select-none">
                <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                  <h4 className="text-xs font-bold text-gray-800 uppercase font-mono">Log New Contract Quantity</h4>
                  <button type="button" onClick={() => setShowQtyForm(false)} className="text-xs text-gray-400 hover:text-gray-600 font-bold">Cancel</button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-mono text-gray-400 uppercase">Quantity Item Name</label>
                    <input
                      type="text"
                      required
                      value={newQtyName}
                      onChange={e => setNewQtyName(e.target.value)}
                      placeholder="e.g. Excavation Volume"
                      className="w-full border border-gray-200 rounded p-1.5 text-xs mt-1 focus:outline-none focus:border-indigo-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-gray-400 uppercase">Measured Value</label>
                    <input
                      type="number"
                      required
                      value={newQtyValue}
                      onChange={e => setNewQtyValue(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="e.g. 15000"
                      className="w-full border border-gray-200 rounded p-1.5 text-xs mt-1 focus:outline-none focus:border-indigo-600 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-gray-400 uppercase">Measurement Unit</label>
                    <select
                      value={newQtyUnit}
                      onChange={e => setNewQtyUnit(e.target.value)}
                      className="w-full border border-gray-200 rounded p-1.5 text-xs mt-1 bg-white focus:outline-none focus:border-indigo-600"
                    >
                      {['m3', 'm2', 'm', 'kg', 'ton', 'Pcs', 'Lot'].map(unit => (
                        <option key={unit} value={unit}>{unit}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-2 border-t border-gray-100">
                  <button type="button" onClick={() => setShowQtyForm(false)} className="text-xs text-gray-500 px-3 py-1.5 font-semibold">Cancel</button>
                  <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1.5 rounded-lg text-xs font-bold cursor-pointer">
                    Save Quantity
                  </button>
                </div>
              </form>
            )}

            {/* Quantities Table */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden text-xs">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50 text-[10px] font-mono text-gray-400 uppercase border-b border-gray-200">
                  <tr>
                    <th className="p-3 pl-4">#</th>
                    <th className="p-3">Quantity Item</th>
                    <th className="p-3 text-right">Value</th>
                    <th className="p-3">Unit</th>
                    <th className="p-3 text-center">Last Updated</th>
                    <th className="p-3">Verified By</th>
                    <th className="p-3 text-right pr-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {projectQuantities.filter(q => q.projectId === project.id).map((qty, idx) => {
                    const isEditing = editingQtyId === qty.id;
                    return (
                      <tr key={qty.id} className="hover:bg-gray-50/40">
                        <td className="p-3 pl-4 font-mono text-gray-400 text-[10px]">{idx + 1}</td>
                        <td className="p-3">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editQtyName}
                              onChange={e => setEditQtyName(e.target.value)}
                              className="border border-gray-300 rounded p-1 text-xs w-full max-w-[200px]"
                            />
                          ) : (
                            <span className="font-bold text-gray-900">{qty.name}</span>
                          )}
                        </td>
                        <td className="p-3 text-right font-mono font-black text-indigo-600">
                          {isEditing ? (
                            <input
                              type="number"
                              value={editQtyValue}
                              onChange={e => setEditQtyValue(e.target.value === '' ? '' : Number(e.target.value))}
                              className="border border-gray-300 rounded p-1 text-xs text-right w-24 font-mono"
                            />
                          ) : (
                            qty.value.toLocaleString()
                          )}
                        </td>
                        <td className="p-3 font-mono text-gray-500 text-[11px] uppercase">
                          {isEditing ? (
                            <select
                              value={editQtyUnit}
                              onChange={e => setEditQtyUnit(e.target.value)}
                              className="border border-gray-300 rounded p-1 text-xs bg-white"
                            >
                              {['m3', 'm2', 'm', 'kg', 'ton', 'Pcs', 'Lot'].map(unit => (
                                <option key={unit} value={unit}>{unit}</option>
                              ))}
                            </select>
                          ) : (
                            qty.unit
                          )}
                        </td>
                        <td className="p-3 text-center text-gray-400 font-mono text-[10px]">{qty.lastUpdated}</td>
                        <td className="p-3 text-gray-600 font-normal">{qty.updatedBy}</td>
                        <td className="p-3 text-right pr-4">
                          {isEditing ? (
                            <div className="inline-flex space-x-1.5">
                              <button
                                onClick={() => handleSaveEditQty(qty.id)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold px-2.5 py-1 rounded cursor-pointer"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingQtyId(null)}
                                className="bg-gray-100 hover:bg-gray-200 text-gray-600 text-[10px] font-bold px-2.5 py-1 rounded cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <div className="inline-flex space-x-1.5">
                              {canWrite && (
                                <>
                                  <button
                                    onClick={() => handleStartEditQty(qty)}
                                    className="text-indigo-600 hover:text-indigo-800 text-[10px] font-extrabold cursor-pointer hover:underline"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleDeleteQty(qty.id, qty.name)}
                                    className="text-rose-600 hover:text-rose-800 text-[10px] font-extrabold cursor-pointer hover:underline"
                                  >
                                    Delete
                                  </button>
                                </>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  
                  {projectQuantities.filter(q => q.projectId === project.id).length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-12 text-center text-gray-400 italic font-normal">
                        No global quantities logged for this contract project yet. Click Log New Quantity above to begin tracking.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

          </div>
        )}

      </div>

      {/* Task Detail Modal */}
      {selectedTaskForDetails && (
        <div className="fixed inset-0 bg-slate-950/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs overflow-y-auto select-none">
          <div className="bg-white rounded-2xl border border-gray-150 shadow-2xl max-w-2xl w-full flex flex-col max-h-[92vh] overflow-hidden">
            
            {/* Modal Header */}
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-white">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5.5 h-5.5 text-emerald-500" />
                </div>
                <div>
                  <span className="text-[10px] font-mono font-bold text-gray-400 block uppercase tracking-wider">
                    {projMilestones.find(m => m.id === selectedTaskForDetails.milestoneId)?.name || 'Milestone'}
                  </span>
                  <h4 className="text-base font-bold text-gray-900 leading-snug">
                    {selectedTaskForDetails.name}
                  </h4>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setSelectedTaskId(null)} 
                className="text-gray-400 hover:text-gray-600 font-semibold p-1.5 hover:bg-gray-100 rounded-xl transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Navigation Tabs (Details, Comments, Checklist, Attachments) */}
            <div className="px-6 py-2 bg-white border-b border-gray-100">
              <div className="bg-gray-100/80 p-1 rounded-xl flex space-x-1">
                <button
                  type="button"
                  onClick={() => setActiveTaskTab('details')}
                  className={`flex-1 text-center py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    activeTaskTab === 'details'
                      ? 'bg-white text-gray-900 shadow-xs'
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  Details
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTaskTab('comments')}
                  className={`flex-1 text-center py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    activeTaskTab === 'comments'
                      ? 'bg-white text-gray-900 shadow-xs'
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  Comments ({selectedTaskForDetails.comments?.length || 0})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTaskTab('checklist')}
                  className={`flex-1 text-center py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    activeTaskTab === 'checklist'
                      ? 'bg-white text-gray-900 shadow-xs'
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  Checklist ({selectedTaskForDetails.checklist?.length || 0})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTaskTab('attachments')}
                  className={`flex-1 text-center py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    activeTaskTab === 'attachments'
                      ? 'bg-white text-gray-900 shadow-xs'
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  Attachments
                </button>
              </div>
            </div>

            {/* Modal Body (Scrollable Panel) */}
            <div className="p-6 overflow-y-auto flex-1 text-xs space-y-6">
              
              {activeTaskTab === 'details' && (
                <div className="space-y-6">
                  {/* Grid Metadata */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                    {/* Stage */}
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0 text-gray-500">
                        <Layers className="w-4 h-4" />
                      </div>
                      <div className="space-y-0.5">
                        <span className="block text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Stage</span>
                        <div className="flex items-center space-x-1.5">
                          <span className={`w-2 h-2 rounded-full ${
                            selectedTaskForDetails.status === 'completed' ? 'bg-emerald-500' :
                            selectedTaskForDetails.status === 'blocked' ? 'bg-red-500' :
                            selectedTaskForDetails.status === 'rework' ? 'bg-rose-500' :
                            selectedTaskForDetails.status === 'on_hold' ? 'bg-amber-500' :
                            'bg-sky-500'
                          }`} />
                          <span className="font-semibold text-gray-800 capitalize">{selectedTaskForDetails.status.replace('_', ' ')}</span>
                        </div>
                      </div>
                    </div>

                    {/* Priority */}
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0 text-gray-500">
                        <TrendingUp className="w-4 h-4" />
                      </div>
                      <div className="space-y-0.5">
                        <span className="block text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Priority</span>
                        <span className={`inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-full capitalize ${
                          selectedTaskForDetails.priority === 'high' ? 'bg-red-50 text-red-700 border border-red-100' :
                          selectedTaskForDetails.priority === 'medium' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                          'bg-slate-50 text-slate-700 border border-slate-100'
                        }`}>
                          {selectedTaskForDetails.priority}
                        </span>
                      </div>
                    </div>

                    {/* Assignee Selection & Notification */}
                    <div className="flex items-start space-x-3 sm:col-span-2 bg-slate-50 border border-slate-100 rounded-xl p-3">
                      <div className="w-8 h-8 rounded-lg bg-white border border-slate-200/80 flex items-center justify-center shrink-0 text-gray-500 mt-1">
                        <User className="w-4 h-4" />
                      </div>
                      <div className="flex-1 space-y-1.5">
                        <span className="block text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Assignee</span>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <select
                            value={taskDetailAssignee}
                            onChange={e => setTaskDetailAssignee(e.target.value)}
                            className="flex-1 border border-gray-200 rounded-lg p-2 text-xs bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                          >
                            <option value="">Select Assignee</option>
                            {availableUsers.map(u => (
                              <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={() => {
                              if (!taskDetailAssignee) {
                                alert("Please choose an assignee first.");
                                return;
                              }
                              const userObj = availableUsers.find(u => u.id === taskDetailAssignee);
                              if (userObj) {
                                setTasks(prev => prev.map(t => {
                                  if (t.id === selectedTaskForDetails.id) {
                                    return { ...t, assigneeId: userObj.id, assigneeName: userObj.name };
                                  }
                                  return t;
                                }));
                                
                                onLogAudit(`Assigned task "${selectedTaskForDetails.name}" to ${userObj.name}`, 'Task Management');
                                onAddNotification(`📧 Email containing task details successfully sent to ${userObj.name} (${userObj.email})`, 'success');
                                alert(`📧 Real-time Email Notification Sent!\n\nTo: ${userObj.name} (${userObj.email})\nSubject: [Wafaq Project Tasks] New Task Assigned: ${selectedTaskForDetails.name}\n\nAll details, files, and deadlines have been delivered to their inbox!`);
                              }
                            }}
                            className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2 rounded-lg text-xs transition shrink-0 cursor-pointer"
                          >
                            Save & Send Mail
                          </button>
                        </div>
                        {selectedTaskForDetails.assigneeName && (
                          <div className="text-[10px] text-gray-500 flex items-center space-x-1.5 mt-1">
                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span>Currently assigned to <strong className="text-gray-700">{selectedTaskForDetails.assigneeName}</strong>. Changing assignment will notify them instantly.</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Start Date */}
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0 text-gray-500">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <div className="space-y-0.5">
                        <span className="block text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Start Date</span>
                        <span className="font-semibold text-gray-800 font-mono text-[11px]">{selectedTaskForDetails.startDate}</span>
                      </div>
                    </div>

                    {/* Due Date */}
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0 text-gray-500">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <div className="space-y-0.5">
                        <span className="block text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Due Date</span>
                        <span className="font-semibold text-red-600 font-mono text-[11px]">{selectedTaskForDetails.dueDate}</span>
                      </div>
                    </div>

                    {/* Progress slider */}
                    <div className="flex items-start space-x-3 sm:col-span-2 bg-gray-50 p-4 rounded-xl border border-gray-100">
                      <div className="w-8 h-8 rounded-lg bg-white border border-gray-200/80 flex items-center justify-center shrink-0 text-gray-500 mt-1">
                        <Percent className="w-4 h-4" />
                      </div>
                      <div className="flex-1 space-y-1.5">
                        <div className="flex justify-between items-center">
                          <span className="block text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Adjust Progress</span>
                          <span className="font-bold text-gray-800 font-mono text-[11px] bg-white border px-2 py-0.5 rounded shadow-sm">{selectedTaskForDetails.progress}%</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <input 
                            type="range" 
                            min="0" 
                            max="100" 
                            step="10"
                            value={selectedTaskForDetails.progress}
                            onChange={(e) => {
                              const progressVal = Number(e.target.value);
                              setTasks(prev => prev.map(t => {
                                if (t.id === selectedTaskForDetails.id) {
                                  return {
                                    ...t,
                                    progress: progressVal,
                                    status: progressVal === 100 ? 'completed' : progressVal > 0 ? 'in_progress' : 'to_do'
                                  };
                                }
                                return t;
                              }));
                              setTimeout(() => {
                                recalculateMilestoneProgress(selectedTaskForDetails.milestoneId);
                              }, 50);
                            }}
                            className="flex-1 accent-indigo-600 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Project */}
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0 text-gray-500">
                        <Briefcase className="w-4 h-4" />
                      </div>
                      <div className="space-y-0.5">
                        <span className="block text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Project</span>
                        <span className="font-semibold text-gray-800">{project.name}</span>
                      </div>
                    </div>

                    {/* Milestone */}
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0 text-gray-500">
                        <Layers className="w-4 h-4" />
                      </div>
                      <div className="space-y-0.5">
                        <span className="block text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Milestone</span>
                        <span className="font-semibold text-gray-800">{projMilestones.find(m => m.id === selectedTaskForDetails.milestoneId)?.name || 'Superstructure Concrete Frame'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Task Description Block */}
                  <div className="space-y-2 pt-2 border-t border-gray-100">
                    <label className="block text-[10px] font-mono text-gray-400 uppercase font-bold flex items-center space-x-1">
                      <FileText className="w-3.5 h-3.5" />
                      <span>Description</span>
                    </label>
                    <textarea
                      value={taskDetailDescription}
                      onChange={e => setTaskDetailDescription(e.target.value)}
                      placeholder="Describe the workspace details, requirements, safety plans, or QA checklists for this task..."
                      className="w-full border border-gray-200 rounded-lg p-3 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 h-24 resize-none text-[11px] leading-relaxed bg-white shadow-inner"
                    />
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] text-gray-400 italic">Saved automatically to workspace profile</span>
                      <button
                        type="button"
                        onClick={() => {
                          setTasks(prev => prev.map(t => t.id === selectedTaskForDetails.id ? { ...t, description: taskDetailDescription } : t));
                          onAddNotification("Task description updated successfully", "success");
                        }}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-3.5 py-1.5 rounded-lg text-xs transition cursor-pointer shadow-sm"
                      >
                        Save Description
                      </button>
                    </div>
                  </div>

                  {/* Status History (Audit Trail) */}
                  <div className="space-y-2 border-t border-gray-100 pt-4 bg-amber-50/15 p-4 rounded-xl border border-amber-100/30">
                    <label className="block text-[10px] font-mono text-amber-800 uppercase font-bold flex items-center space-x-1.5">
                      <span>📜 Status Change History</span>
                      <span className="text-[8px] bg-amber-100/80 text-amber-800 px-1.5 py-0.5 rounded font-mono font-bold">Audit Logs</span>
                    </label>
                    
                    <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
                      {selectedTaskForDetails.statusHistory && selectedTaskForDetails.statusHistory.length > 0 ? (
                        selectedTaskForDetails.statusHistory.map((hist, idx) => (
                          <div key={idx} className="flex justify-between items-start text-[10px] border-b border-gray-100/60 pb-1.5 font-mono last:border-0 last:pb-0">
                            <div className="space-y-0.5">
                              <div className="flex items-center space-x-1.5">
                                <span className="font-bold text-gray-700">{hist.user}</span>
                                <span className="text-[8px] bg-gray-100 text-gray-500 px-1 py-0.2 rounded">{hist.role}</span>
                              </div>
                              <div className="text-gray-500 text-[9px]">
                                Changed status: <span className="text-red-500 line-through">{hist.previousStatus.replace('_', ' ')}</span> → <span className="text-emerald-700 font-bold bg-emerald-50 px-1 rounded">{hist.newStatus.replace('_', ' ')}</span>
                              </div>
                            </div>
                            <span className="text-[9px] text-gray-400 shrink-0 text-right">{hist.date}</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-[10px] text-gray-400 italic font-mono">No prior status updates recorded. All status changes are logged automatically here.</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeTaskTab === 'comments' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                    <h5 className="font-bold text-gray-800 text-sm">Comments & Logs</h5>
                    <span className="text-[10px] text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full font-mono font-bold">
                      {selectedTaskForDetails.comments?.length || 0} updates
                    </span>
                  </div>

                  {/* Comment List */}
                  <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-1">
                    {selectedTaskForDetails.comments && selectedTaskForDetails.comments.length > 0 ? (
                      selectedTaskForDetails.comments.map((comment) => (
                        <div key={comment.id} className="flex items-start space-x-3 bg-white p-3.5 rounded-xl border border-gray-150 shadow-xs hover:border-gray-200 transition">
                          <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center shrink-0 uppercase text-xs border border-slate-200">
                            {getInitials(comment.user)}
                          </div>
                          <div className="flex-1 space-y-1">
                            <div className="flex justify-between items-center">
                              <span className="font-bold text-gray-800 text-xs">{comment.user}</span>
                              <span className="text-[10px] text-gray-400 font-mono">{comment.date}</span>
                            </div>
                            <span className="text-[8px] bg-slate-50 text-gray-500 px-1.5 py-0.2 rounded font-mono border border-slate-100">{comment.role}</span>
                            <p className="text-gray-600 text-[11px] mt-1.5 leading-relaxed whitespace-pre-wrap">{comment.text}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-400 italic">No comments or updates yet. Post the first one below!</div>
                    )}
                  </div>

                  {/* Add comment form */}
                  <div className="space-y-2 pt-3 border-t border-gray-100">
                    <label className="block text-[10px] font-mono text-gray-400 uppercase font-bold">Post comment</label>
                    <div className="flex space-x-2">
                      <textarea
                        value={taskNewUpdateText}
                        onChange={e => setTaskNewUpdateText(e.target.value)}
                        placeholder="Write your message here..."
                        className="flex-1 border border-gray-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 h-16 resize-none bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (!taskNewUpdateText.trim()) return;
                          const newComment = {
                            id: `com_${Date.now()}`,
                            user: currentUser.name,
                            role: currentUser.role,
                            text: taskNewUpdateText.trim(),
                            date: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          };
                          const updatedComments = [...(selectedTaskForDetails.comments || []), newComment];
                          setTasks(prev => prev.map(t => t.id === selectedTaskForDetails.id ? { ...t, comments: updatedComments } : t));
                          
                          onLogAudit(`Logged update for task "${selectedTaskForDetails.name}": ${newComment.text}`, 'Task Management');
                          onAddNotification("Progress update log successfully added", "success");
                          setTaskNewUpdateText('');
                        }}
                        className="w-10 h-10 rounded-full bg-[#5cd4b4] hover:bg-[#4bc3a3] text-white flex items-center justify-center transition shrink-0 self-end shadow-xs cursor-pointer"
                        title="Send Comment"
                      >
                        <ArrowRight className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTaskTab === 'checklist' && (
                <div className="space-y-4">
                  {/* Checklist Summary */}
                  {(() => {
                    const checklistItems = selectedTaskForDetails.checklist || [];
                    const completedChecklistCount = checklistItems.filter(item => item.completed).length;
                    const totalChecklistCount = checklistItems.length;
                    const checklistPercent = totalChecklistCount > 0 ? Math.round((completedChecklistCount / totalChecklistCount) * 100) : 0;
                    
                    return (
                      <div className="space-y-3">
                        <div className="flex justify-between items-center text-xs font-semibold">
                          <span className="text-gray-800 font-bold">Progress</span>
                          <span className="text-gray-500 bg-gray-50 px-2 py-0.5 rounded-full font-mono text-[10px]">
                            {completedChecklistCount}/{totalChecklistCount} completed
                          </span>
                        </div>
                        <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                          <div className="bg-emerald-500 h-full transition-all duration-300" style={{ width: `${checklistPercent}%` }} />
                        </div>

                        {/* Checklist items list */}
                        <div className="space-y-2.5 max-h-[35vh] overflow-y-auto pr-1 pt-2">
                          {checklistItems.length > 0 ? (
                            checklistItems.map(item => (
                              <div key={item.id} className="flex items-start space-x-3 bg-white border border-gray-100 p-3.5 rounded-xl hover:shadow-xs transition">
                                <input 
                                  type="checkbox" 
                                  checked={item.completed} 
                                  onChange={() => handleToggleChecklistItem(selectedTaskForDetails.id, item.id)}
                                  className="w-4.5 h-4.5 text-emerald-500 border-gray-300 rounded focus:ring-emerald-500 accent-emerald-500 shrink-0 mt-0.5 cursor-pointer"
                                />
                                <div className="flex-1 min-w-0">
                                  <p className={`text-xs font-semibold text-gray-800 leading-tight ${item.completed ? 'line-through text-gray-400 font-normal' : ''}`}>
                                    {item.text}
                                  </p>
                                  <div className="flex flex-wrap gap-2 mt-1.5 text-[9px] text-gray-400 font-mono">
                                    {item.assigneeName && (
                                      <span className="flex items-center space-x-1 bg-gray-50 px-1.5 py-0.5 rounded">
                                        <User className="w-3 h-3 text-gray-400" />
                                        <span>{item.assigneeName}</span>
                                      </span>
                                    )}
                                    {item.dueDate && (
                                      <span className="flex items-center space-x-1 bg-gray-50 px-1.5 py-0.5 rounded">
                                        <Calendar className="w-3 h-3 text-gray-400" />
                                        <span>{item.dueDate}</span>
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="text-center py-10 text-gray-400 italic">No checklist items defined yet. Add some items below to detail your pipeline!</div>
                          )}
                        </div>

                        {/* Add checklist item */}
                        <div className="space-y-2 pt-3 border-t border-gray-100">
                          <label className="block text-[10px] font-mono text-gray-400 uppercase font-bold">Add checklist item</label>
                          <div className="flex space-x-2">
                            <input
                              type="text"
                              value={newChecklistItemText}
                              onChange={e => setNewChecklistItemText(e.target.value)}
                              placeholder="Add checklist item..."
                              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white"
                            />
                            <button
                              type="button"
                              onClick={() => handleAddChecklistItem(selectedTaskForDetails.id, newChecklistItemText)}
                              className="bg-[#5cd4b4] hover:bg-[#4bc3a3] text-white font-bold px-4 py-2 rounded-lg text-xs transition cursor-pointer shrink-0"
                            >
                              + Add
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {activeTaskTab === 'attachments' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                    <h5 className="font-bold text-gray-800 text-sm">Task Attachments</h5>
                    <span className="text-[10px] text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full font-mono font-bold">
                      {selectedTaskForDetails.attachments?.length || 0} files
                    </span>
                  </div>

                  {/* List attachments */}
                  <div className="space-y-2 max-h-[35vh] overflow-y-auto pr-1">
                    {selectedTaskForDetails.attachments && selectedTaskForDetails.attachments.length > 0 ? (
                      selectedTaskForDetails.attachments.map((file, idx) => (
                        <div key={idx} className="flex justify-between items-center bg-white border border-gray-100 p-3 rounded-xl hover:shadow-xs transition">
                          <div className="flex items-center space-x-3 text-gray-700 truncate">
                            <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                              <Paperclip className="w-4 h-4 text-slate-400" />
                            </div>
                            <div className="truncate">
                              <span className="font-semibold text-xs text-gray-800 block truncate">{file.name}</span>
                              <span className="text-[9px] text-gray-400 font-mono block">{file.size || '1.5 MB'} • {file.uploadedAt || 'Just now'}</span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-1.5 shrink-0">
                            {file.url && (
                              <a
                                href={file.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-indigo-600 bg-indigo-50 hover:bg-indigo-100 font-bold px-2.5 py-1 rounded-lg transition"
                                title="Preview File"
                              >
                                Preview
                              </a>
                            )}
                            <a
                              href={file.url || '#'}
                              download={file.name}
                              onClick={(e) => {
                                if (!file.url) {
                                  e.preventDefault();
                                  alert(`File not found on server: ${file.name}`);
                                }
                              }}
                              className="text-xs text-indigo-600 bg-indigo-50 hover:bg-indigo-100 font-bold px-2.5 py-1 rounded-lg transition"
                            >
                              Download
                            </a>
                            <button
                              type="button"
                              onClick={() => {
                                const updatedFiles = selectedTaskForDetails.attachments.filter((_, fidx) => fidx !== idx);
                                setTasks(prev => prev.map(t => t.id === selectedTaskForDetails.id ? { ...t, attachments: updatedFiles } : t));
                                onAddNotification("Attached document removed", "info");
                              }}
                              className="text-xs text-red-500 hover:text-red-700 font-bold px-2.5 py-1 rounded-lg hover:bg-red-50 transition"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 space-y-3 border-2 border-dashed border-gray-100 rounded-2xl bg-slate-50/50">
                        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-200">
                          <Paperclip className="w-5.5 h-5.5" />
                        </div>
                        <div className="text-center">
                          <p className="font-semibold text-gray-700 text-xs">No attachments yet</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">Upload files to share with your team!</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Add attachment */}
                  <div className="space-y-2 pt-3 border-t border-gray-100">
                    <label className="block text-[10px] font-mono text-gray-400 uppercase font-bold">Add Media</label>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={taskNewAttachmentName}
                        onChange={e => setTaskNewAttachmentName(e.target.value)}
                        placeholder="Select media..."
                        className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (!taskNewAttachmentName.trim()) {
                            alert("Please specify a document name.");
                            return;
                          }
                          const newFile = {
                            name: taskNewAttachmentName.trim(),
                            size: '1.2 MB',
                            uploadedAt: new Date().toISOString().slice(0, 10)
                          };
                          const updatedFiles = [...(selectedTaskForDetails.attachments || []), newFile];
                          setTasks(prev => prev.map(t => t.id === selectedTaskForDetails.id ? { ...t, attachments: updatedFiles } : t));
                          
                          onLogAudit(`Attached file "${newFile.name}" to task "${selectedTaskForDetails.name}"`, 'Task Management');
                          onAddNotification(`Document attached to task: ${newFile.name}`, 'success');
                          setTaskNewAttachmentName('');
                        }}
                        className="bg-white border hover:bg-gray-50 border-gray-200 text-gray-700 font-bold px-4 py-2 rounded-lg text-xs transition cursor-pointer flex items-center space-x-1.5 shrink-0 shadow-xs"
                      >
                        <Paperclip className="w-3.5 h-3.5 text-gray-400" />
                        <span>Browse</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Quick Status Bar (Always Active as requested) */}
            <div className="px-6 py-3.5 border-t border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-mono">
                Task Action
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleUpdateTaskStatus(selectedTaskForDetails.id, 'blocked')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-200 cursor-pointer flex items-center space-x-1 ${
                    selectedTaskForDetails.status === 'blocked'
                      ? 'bg-red-600 border-red-600 text-white shadow-xs'
                      : 'bg-white border-gray-200 text-red-600 hover:bg-red-50'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-current" />
                  <span>Block</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateTaskStatus(selectedTaskForDetails.id, 'on_hold')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-200 cursor-pointer flex items-center space-x-1 ${
                    selectedTaskForDetails.status === 'on_hold'
                      ? 'bg-amber-500 border-amber-500 text-white shadow-xs'
                      : 'bg-white border-gray-200 text-amber-600 hover:bg-amber-50'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-current" />
                  <span>Hold</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setReworkingTaskId(selectedTaskForDetails.id);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-200 cursor-pointer flex items-center space-x-1 ${
                    selectedTaskForDetails.status === 'rework'
                      ? 'bg-rose-600 border-rose-600 text-white shadow-xs'
                      : 'bg-white border-gray-200 text-rose-600 hover:bg-rose-50'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-current" />
                  <span>Rework</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCompletingTaskId(selectedTaskForDetails.id);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-200 cursor-pointer flex items-center space-x-1 ${
                    selectedTaskForDetails.status === 'completed'
                      ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                      : 'bg-white border-gray-200 text-emerald-600 hover:bg-emerald-50'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-current" />
                  <span>Complete ✔</span>
                </button>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedTaskId(null)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-2 rounded-xl text-xs transition cursor-pointer shadow-sm"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Task Completion Dialog Overlay */}
      {completingTaskId && (
        <div className="fixed inset-0 bg-slate-950/60 z-50 flex items-center justify-center p-4 select-none">
          <div className="bg-white rounded-xl border border-gray-150 shadow-2xl p-6 max-w-md w-full space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider font-mono text-emerald-700">Attach Document & Complete Task</h4>
            <p className="text-[11px] text-gray-500">To finalize this work package and claim 100% progress, you can optionally attach delivery receipts, inspect logs, or signoffs.</p>
            <div>
              <label className="block text-[10px] font-mono text-gray-400 uppercase">Document Name</label>
              <input
                type="text"
                value={taskAttachmentName}
                onChange={e => setTaskAttachmentName(e.target.value)}
                placeholder="e.g. Concrete_Compressive_Receipt.pdf"
                className="w-full border border-gray-200 rounded p-2 text-xs mt-1 focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>
            <div className="flex justify-end space-x-2 pt-2 border-t border-gray-100">
              <button type="button" onClick={() => setCompletingTaskId(null)} className="text-xs text-gray-500 font-semibold px-3 py-1.5">Cancel</button>
              <button 
                type="button" 
                onClick={() => handleCompleteTaskDetailed(completingTaskId, taskAttachmentName)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-1.5 rounded-lg text-xs font-bold"
              >
                Finalize Task
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Task Rework Dialog Overlay */}
      {reworkingTaskId && (
        <div className="fixed inset-0 bg-slate-950/60 z-50 flex items-center justify-center p-4 select-none">
          <div className="bg-white rounded-xl border border-gray-150 shadow-2xl p-6 max-w-md w-full space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider font-mono text-rose-700">Flag Task for Rework</h4>
            <p className="text-[11px] text-gray-500">Provide the specific rework instructions or QA defects. The progress will be set to 20% to allow correction updates.</p>
            <div>
              <label className="block text-[10px] font-mono text-gray-400 uppercase">Rework Information / Defects Description</label>
              <textarea
                required
                value={taskReworkReason}
                onChange={e => setTaskReworkReason(e.target.value)}
                placeholder="e.g. Concrete curing pressure did not meet baseline requirements. Re-test or block replacement required..."
                className="w-full border border-gray-200 rounded p-2 text-xs mt-1 focus:outline-none focus:border-amber-500 h-24 resize-none"
              />
            </div>
            <div className="flex justify-end space-x-2 pt-2 border-t border-gray-100">
              <button type="button" onClick={() => setReworkingTaskId(null)} className="text-xs text-gray-500 font-semibold px-3 py-1.5">Cancel</button>
              <button 
                type="button" 
                onClick={() => handleReworkTaskDetailed(reworkingTaskId, taskReworkReason)}
                className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-1.5 rounded-lg text-xs font-bold"
              >
                Issue Rework Order
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
