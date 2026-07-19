/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  FileText, 
  Search, 
  ChevronLeft,
  Briefcase,
  Plus,
  Edit2,
  Trash2,
  X,
  CheckCircle2,
  Calendar,
  MessageSquare,
  Paperclip,
  TrendingUp,
  DollarSign,
  Clock,
  Shield,
  Printer,
  Download,
  AlertCircle,
  PlusCircle,
  FileDown,
  Upload,
  Layers,
  History,
  Tag
} from 'lucide-react';
import { Project, Expense, BudgetCategory, User, Comment, getVatAppliedAmount, getExpenseDisplayValues } from '../types';
import { jsPDF } from 'jspdf';

interface ProjectExpensesViewProps {
  projects: Project[];
  budgets: BudgetCategory[];
  expenses: Expense[];
  setExpenses: React.Dispatch<React.SetStateAction<Expense[]>>;
  currentUser: User;
  availableUsers: User[];
  onLogAudit: (action: string, module: string, oldValue?: string, newValue?: string) => void;
  onAddNotification: (text: string, type: 'info' | 'success' | 'warning' | 'alert') => void;
  includeVat?: boolean;
  excludeVat?: boolean;
}

export default function ProjectExpensesView({
  projects,
  budgets,
  expenses,
  setExpenses,
  currentUser,
  availableUsers,
  onLogAudit,
  onAddNotification,
  includeVat,
  excludeVat,
}: ProjectExpensesViewProps) {
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [projectSearchQuery, setProjectSearchQuery] = useState('');
  const [expenseSearchQuery, setExpenseSearchQuery] = useState('');
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);

  // Filters state
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterMonth, setFilterMonth] = useState<string>('');

  // Detail Modal & Action Form States
  const [selectedExpenseId, setSelectedExpenseId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  // Form Fields
  const [expVendor, setExpVendor] = useState('');
  const [expDescription, setExpDescription] = useState('');
  const [expProjectId, setExpProjectId] = useState('');
  const [expCategoryId, setExpCategoryId] = useState('');
  const [expDate, setExpDate] = useState('');
  const [expAmount, setExpAmount] = useState<number>(0);
  const [expVat, setExpVat] = useState<number>(0);
  const [expApprovalStatus, setExpApprovalStatus] = useState<'draft' | 'pending' | 'approved' | 'rejected'>('draft');

  // Comments & Attachments additions in details panel / form
  const [newCommentText, setNewCommentText] = useState('');
  const [newFileName, setNewFileName] = useState('');
  const [newFileSize, setNewFileSize] = useState('');

  // Draft file attachments for creation/editing form
  const [draftAttachments, setDraftAttachments] = useState<{ name: string; size: string; uploadedAt?: string }[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  // Authorization checks
  const canManageExpenses = useMemo(() => {
    return currentUser.role === 'General Manager' || 
           currentUser.role === 'Project Manager' || 
           currentUser.role === 'Admin' || 
           currentUser.role === 'Super Admin' ||
           currentUser.role === 'Finance Manager';
  }, [currentUser]);

  // Selected expense memoized
  const selectedExpense = useMemo(() => {
    return expenses.find(e => e.id === selectedExpenseId) || null;
  }, [expenses, selectedExpenseId]);

  // Project filtering
  const filteredProjects = useMemo(() => {
    return projects.filter(p => 
      p.name.toLowerCase().includes(projectSearchQuery.toLowerCase()) || 
      p.code.toLowerCase().includes(projectSearchQuery.toLowerCase()) ||
      (p.clientName && p.clientName.toLowerCase().includes(projectSearchQuery.toLowerCase()))
    );
  }, [projects, projectSearchQuery]);

  // Active project helper
  const activeProject = useMemo(() => {
    if (selectedProjectId === 'all') return null;
    return projects.find(p => p.id === selectedProjectId) || null;
  }, [projects, selectedProjectId]);

  // Filter categories helper based on project
  const activeProjectBudgets = useMemo(() => {
    if (selectedProjectId === 'all') return budgets;
    return budgets.filter(b => b.projectId === selectedProjectId);
  }, [budgets, selectedProjectId]);

  // Get active budget categories for any specific project (for the form)
  const getBudgetsForProject = (pId: string) => {
    return budgets.filter(b => b.projectId === pId);
  };

  // Filtered Expenses List
  const selectedExpensesList = useMemo(() => {
    let list = expenses;
    if (selectedProjectId !== 'all') {
      list = list.filter(e => e.projectId === selectedProjectId);
    }
    if (filterStatus !== 'all') {
      list = list.filter(e => e.approvalStatus === filterStatus);
    }
    if (filterCategory !== 'all') {
      list = list.filter(e => e.budgetCategoryId === filterCategory);
    }
    if (filterMonth) {
      list = list.filter(e => e.date.startsWith(filterMonth));
    }
    if (expenseSearchQuery.trim()) {
      const q = expenseSearchQuery.toLowerCase();
      list = list.filter(e => 
        e.vendor.toLowerCase().includes(q) || 
        e.description.toLowerCase().includes(q) ||
        (e.id && e.id.toLowerCase().includes(q))
      );
    }
    return list;
  }, [expenses, selectedProjectId, filterStatus, filterCategory, filterMonth, expenseSearchQuery]);

  // Metrics Calculations
  const metrics = useMemo(() => {
    const list = selectedExpensesList;
    const totalCount = list.length;
    const approvedCount = list.filter(e => e.approvalStatus === 'approved').length;
    const pendingCount = list.filter(e => e.approvalStatus === 'pending').length;
    const draftCount = list.filter(e => e.approvalStatus === 'draft').length;

    const includeVat = localStorage.getItem('wafaq_include_vat') === 'true';
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

    const totalApprovedAmount = list
      .filter(e => e.approvalStatus === 'approved')
      .reduce((sum, e) => sum + getExpenseDisplayValues(e).totalAmount, 0);

    const totalPendingAmount = list
      .filter(e => e.approvalStatus === 'pending')
      .reduce((sum, e) => sum + getExpenseDisplayValues(e).totalAmount, 0);

    const totalApprovedVat = list
      .filter(e => e.approvalStatus === 'approved')
      .reduce((sum, e) => sum + getExpenseDisplayValues(e).vat, 0);

    return {
      totalCount,
      approvedCount,
      pendingCount,
      draftCount,
      totalApprovedAmount,
      totalPendingAmount,
      totalApprovedVat
    };
  }, [selectedExpensesList, includeVat, excludeVat]);

  // Project metadata helper
  const getProjectInfo = (pId: string) => {
    return projects.find(p => p.id === pId) || { name: 'Unknown Project', code: 'PROJ-XXX', budget: 0, clientName: 'N/A' };
  };

  // Budget category helper
  const getCategoryName = (cId: string) => {
    return budgets.find(b => b.id === cId)?.name || 'General Expense';
  };

  // Form Initializers
  const handleOpenAdd = () => {
    if (!canManageExpenses) {
      onAddNotification('Unauthorized: Your role does not allow recording expenses.', 'alert');
      return;
    }
    setEditingExpense(null);
    setExpVendor('');
    setExpDescription('');
    const targetProjId = selectedProjectId === 'all' ? (projects[0]?.id || '') : selectedProjectId;
    setExpProjectId(targetProjId);
    
    const projBudgets = getBudgetsForProject(targetProjId);
    setExpCategoryId(projBudgets[0]?.id || '');
    
    setExpDate(new Date().toISOString().slice(0, 10));
    setExpAmount(0);
    setExpVat(0);
    setExpApprovalStatus('draft');
    setDraftAttachments([]);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (exp: Expense, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!canManageExpenses) {
      onAddNotification('Unauthorized: Your role does not allow editing expenses.', 'alert');
      return;
    }
    setEditingExpense(exp);
    setExpVendor(exp.vendor);
    setExpDescription(exp.description);
    setExpProjectId(exp.projectId);
    setExpCategoryId(exp.budgetCategoryId);
    setExpDate(exp.date);
    setExpAmount(exp.amount);
    setExpVat(exp.vat);
    setExpApprovalStatus(exp.approvalStatus);
    setDraftAttachments(exp.attachments || []);
    setIsFormOpen(true);
  };

  // Automatic 15% VAT calculator helper
  const handleCalculateVat = () => {
    const calculatedVat = Math.round(expAmount * 0.15);
    setExpVat(calculatedVat);
    onAddNotification('Calculated 15% Standard KSA VAT.', 'info');
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = (fileList: FileList) => {
    const newAttachments: { name: string; size: string; uploadedAt?: string }[] = [];
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const sizeInMB = file.size / (1024 * 1024);
      const sizeStr = sizeInMB < 0.1 
        ? `${(file.size / 1024).toFixed(1)} KB` 
        : `${sizeInMB.toFixed(2)} MB`;
      
      newAttachments.push({
        name: file.name,
        size: sizeStr,
        uploadedAt: new Date().toISOString().slice(0, 10)
      });
    }
    setDraftAttachments(prev => [...prev, ...newAttachments]);
    onAddNotification(`Prepared ${newAttachments.length} file(s) for attachment.`, 'info');
  };

  const handleRemoveDraftAttachment = (idx: number) => {
    setDraftAttachments(prev => prev.filter((_, i) => i !== idx));
    onAddNotification('Attachment removed from draft.', 'info');
  };

  const handleSaveExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageExpenses) {
      onAddNotification('Unauthorized: Your role does not allow saving expense changes.', 'alert');
      return;
    }

    if (!expVendor.trim()) {
      onAddNotification('Please specify a valid vendor or supplier.', 'warning');
      return;
    }

    if (expAmount <= 0) {
      onAddNotification('Amount must be greater than zero.', 'warning');
      return;
    }

    const totalCalculated = Number(expAmount) + Number(expVat);

    if (editingExpense) {
      setExpenses(prev => prev.map(item => {
        if (item.id === editingExpense.id) {
          const statusChanged = item.approvalStatus !== expApprovalStatus;
          const nextUpdates = [...(item.updates || [])];

          if (statusChanged) {
            nextUpdates.push({
              id: `exp_up_${Date.now()}`,
              user: currentUser.name,
              role: currentUser.role,
              text: `Status updated from "${item.approvalStatus}" to "${expApprovalStatus}".`,
              date: new Date().toISOString().replace('T', ' ').substring(0, 16)
            });
          }

          return {
            ...item,
            vendor: expVendor.trim(),
            description: expDescription.trim(),
            projectId: expProjectId,
            budgetCategoryId: expCategoryId,
            date: expDate,
            amount: Number(expAmount),
            vat: Number(expVat),
            totalAmount: totalCalculated,
            approvalStatus: expApprovalStatus,
            attachments: draftAttachments,
            updates: nextUpdates
          };
        }
        return item;
      }));

      onLogAudit(`Updated Expense to "${expVendor}"`, 'Expenses', `${editingExpense.totalAmount} SAR`, `${totalCalculated} SAR`);
      onAddNotification(`Expense of ${totalCalculated} SAR for ${expVendor} updated successfully.`, 'success');
    } else {
      const newExp: Expense = {
        id: `exp_${Date.now()}`,
        projectId: expProjectId,
        budgetCategoryId: expCategoryId,
        vendor: expVendor.trim(),
        date: expDate,
        amount: Number(expAmount),
        vat: Number(expVat),
        totalAmount: totalCalculated,
        approvalStatus: expApprovalStatus,
        description: expDescription.trim(),
        comments: [],
        attachments: draftAttachments,
        updates: [
          {
            id: `exp_up_${Date.now()}`,
            user: currentUser.name,
            role: currentUser.role,
            text: `Expense claim submitted under "${expApprovalStatus}".`,
            date: new Date().toISOString().replace('T', ' ').substring(0, 16)
          }
        ]
      };

      setExpenses(prev => [...prev, newExp]);
      onLogAudit(`Created Expense claim for "${newExp.vendor}"`, 'Expenses', undefined, `${newExp.totalAmount} SAR`);
      onAddNotification(`Expense logged under Reference ${newExp.id}.`, 'success');
    }

    setIsFormOpen(false);
    setEditingExpense(null);
  };

  const handleDeleteExpense = (exp: Expense, e: React.MouseEvent) => {
    const userRoleStr = currentUser?.role?.toLowerCase() || '';
    if (userRoleStr !== 'admin' && userRoleStr !== 'super admin' && userRoleStr !== 'superadmin') {
      alert("Unauthorized: Only Admin or Super Admin can delete records.");
      return;
    }

    e.stopPropagation();
    if (!canManageExpenses) {
      onAddNotification('Unauthorized: Your role does not allow deleting expenses.', 'alert');
      return;
    }

    if (window.confirm(`Are you sure you want to permanently delete Expense voucher of ${formatExpenseValue(exp, 'totalAmount')} from ${exp.vendor}?`)) {
      setExpenses(prev => prev.filter(item => item.id !== exp.id));
      if (selectedExpenseId === exp.id) {
        setSelectedExpenseId(null);
      }
      onLogAudit(`Deleted expense claim "${exp.vendor}"`, 'Expenses', `${exp.totalAmount} SAR`, undefined);
      onAddNotification(`Expense claim voucher deleted successfully.`, 'success');
    }
  };

  // Add Comment inside Detail panel
  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExpenseId || !newCommentText.trim()) return;

    const nextComment: Comment = {
      id: `exp_comm_${Date.now()}`,
      user: currentUser.name,
      role: currentUser.role,
      text: newCommentText.trim(),
      date: new Date().toISOString().replace('T', ' ').substring(0, 16)
    };

    setExpenses(prev => prev.map(e => {
      if (e.id === selectedExpenseId) {
        const nextComments = [...(e.comments || []), nextComment];
        return { ...e, comments: nextComments };
      }
      return e;
    }));

    setNewCommentText('');
    onAddNotification('Comment logged successfully.', 'success');
  };

  // Add Attachment inside Detail panel
  const handleAddAttachment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExpenseId || !newFileName.trim()) return;

    const nextAttachment = {
      name: newFileName.trim(),
      size: newFileSize.trim() || '1.5 MB',
      uploadedAt: new Date().toISOString().slice(0, 10)
    };

    setExpenses(prev => prev.map(e => {
      if (e.id === selectedExpenseId) {
        const nextAttachments = [...(e.attachments || []), nextAttachment];
        return { ...e, attachments: nextAttachments };
      }
      return e;
    }));

    setNewFileName('');
    setNewFileSize('');
    onAddNotification(`Uploaded file "${nextAttachment.name}" successfully.`, 'success');
  };

  const formatRawCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'SAR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatExpenseValue = (expense: Expense, type: 'amount' | 'vat' | 'totalAmount') => {
    const displayVals = getExpenseDisplayValues(expense);
    return formatRawCurrency(displayVals[type]);
  };

  // Format currencies beautifully
  const formatCurrency = (amount: number) => {
    const applied = getVatAppliedAmount(amount);
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'SAR',
      maximumFractionDigits: 0
    }).format(applied);
  };

  // Status visual label helper
  const getStatusLabel = (status: Expense['approvalStatus']) => {
    switch (status) {
      case 'draft': return { label: 'Draft Voucher', style: 'bg-slate-100 text-slate-700 border-slate-200' };
      case 'pending': return { label: 'Review Pending', style: 'bg-amber-50 text-amber-700 border-amber-200' };
      case 'approved': return { label: 'Approved', style: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'rejected': return { label: 'Rejected', style: 'bg-rose-50 text-rose-700 border-rose-200' };
    }
  };

  // Formal Export as simulated Expense voucher download
  const handleExportVoucher = (exp: Expense) => {
    const proj = getProjectInfo(exp.projectId);
    const catName = getCategoryName(exp.budgetCategoryId);
    const content = `
=========================================
          OFFICIAL EXPENSE VOUCHER       
=========================================
Voucher ID:    ${exp.id}
Date Incurred: ${exp.date}
Project Code:  ${proj.code}
Project Name:  ${proj.name}
Budget Category: ${catName}
Supplier/Vendor: ${exp.vendor}
Status:        ${exp.approvalStatus.toUpperCase()}

-----------------------------------------
1. DETAILED REASON / WORK DESCRIPTION:
-----------------------------------------
${exp.description || 'No description recorded.'}

-----------------------------------------
2. FINANCIAL & VAT RECAP:
-----------------------------------------
Subtotal Amount:       ${formatExpenseValue(exp, 'amount')}
VAT (Value Added Tax): ${formatExpenseValue(exp, 'vat')}
Total Outlay:          ${formatExpenseValue(exp, 'totalAmount')}

-----------------------------------------
3. SIGN-OFF & AUTHORIZATION:
-----------------------------------------
Voucher Prepared By:
Name: ${currentUser.name} (${currentUser.role})
Signature: Verified Electronic Sign-Off
Date: ${new Date().toISOString().slice(0, 10)}

Financial Authority Approval:
Status: [ ${exp.approvalStatus.toUpperCase()} ]
Signed-Off By Finance Supervisor
Date: ${exp.approvalStatus === 'approved' ? exp.date : 'Pending Formal Release'}

=========================================
Generated via Wafaq Smart PM Core Software
=========================================
`;

    // Trigger download
    const pdfDoc = new jsPDF();
    pdfDoc.setFont("courier", "normal");
    pdfDoc.setFontSize(10);
    const lines = pdfDoc.splitTextToSize(content, 180);
    let y = 20;
    lines.forEach(line => {
      if (y > 280) {
        pdfDoc.addPage();
        y = 20;
      }
      pdfDoc.text(line, 15, y);
      y += 5;
    });
    pdfDoc.save(`Voucher_${exp.id}_formal_release.pdf`);

    onLogAudit(`Exported financial voucher for Expense Voucher "${exp.id}"`, 'Expenses', undefined, exp.id);
    onAddNotification(`Formal Expense voucher saved as TXT/PDF.`, 'success');
  };

  return (
    <div id="expenses-view-root" className="flex-1 flex flex-col h-full bg-slate-50 overflow-hidden">
      
      {/* Top Banner Context Section */}
      <div className="bg-white border-b border-slate-200 p-5 md:px-8 flex flex-col md:flex-row md:items-center md:justify-between shrink-0 gap-4">
        <div>
          <span className="text-xs font-mono font-bold text-indigo-600 uppercase tracking-widest block mb-1">Financial Expenditure</span>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Project Expenses & Outlays</h2>
          <p className="text-xs text-slate-500 mt-1">Track capital expenditures, material receipts, equipment rentals, sub-contractor bills, and VAT reporting across your budgets.</p>
        </div>
      </div>

      {/* Split Pane View */}
      <div className="flex-1 flex overflow-hidden min-h-0 w-full">
      
        {/* 1. LEFT SIDEBAR: Project Selector */}
        <div 
          id="expenses-project-sidebar" 
          className={`w-72 border-r border-slate-200 bg-white flex flex-col h-full shrink-0 transition-transform lg:translate-x-0 lg:relative lg:pointer-events-auto lg:z-10 ${
            mobileDetailOpen ? '-translate-x-full absolute pointer-events-none' : 'relative z-10'
          }`}
        >
          <div className="p-4 border-b border-slate-100 bg-slate-50/60">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-widest font-mono">Projects Directory</h2>
            <p className="text-[10px] text-slate-400 mt-1">Select a project to filter expenses</p>
            <div className="relative mt-3">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                placeholder="Search code, client, name..."
                value={projectSearchQuery}
                onChange={e => setProjectSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2.5 space-y-1 bg-slate-50/30">
            <button
              onClick={() => {
                setSelectedProjectId('all');
                setFilterCategory('all');
                setMobileDetailOpen(true);
              }}
              className={`w-full text-left p-3 rounded-xl transition-all cursor-pointer border flex items-center space-x-2.5 ${
                selectedProjectId === 'all'
                  ? 'bg-white border-indigo-200 shadow-md ring-1 ring-indigo-500/5 font-bold'
                  : 'bg-transparent border-transparent hover:bg-slate-100 hover:border-slate-200'
              }`}
            >
              <Briefcase className={`w-4 h-4 ${selectedProjectId === 'all' ? 'text-indigo-600' : 'text-slate-400'}`} />
              <div>
                <h4 className="text-xs font-bold text-slate-800">All Project Expenditures</h4>
                <p className="text-[10px] text-slate-400 mt-0.5">Corporate balance timeline</p>
              </div>
            </button>

            {filteredProjects.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs italic">No projects found.</div>
            ) : (
              filteredProjects.map(p => {
                const isActive = selectedProjectId === p.id;
                const pExpensesCount = expenses.filter(e => e.projectId === p.id).length;
                return (
                  <button
                    key={p.id}
                    onClick={() => {
                      setSelectedProjectId(p.id);
                      setFilterCategory('all');
                      setMobileDetailOpen(true);
                    }}
                    className={`w-full text-left p-3 rounded-xl transition-all cursor-pointer border ${
                      isActive 
                        ? 'bg-white border-indigo-200 shadow-md ring-1 ring-indigo-500/5' 
                        : 'bg-transparent border-transparent hover:bg-slate-100 hover:border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-extrabold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded uppercase border border-indigo-100/50">
                        {p.code}
                      </span>
                      <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                        {pExpensesCount} Outlays
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-800 mt-2 truncate">{p.name}</h4>
                    <p className="text-[10px] text-slate-400 mt-1 truncate">Client: <span className="font-semibold text-slate-600">{p.clientName}</span></p>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* 2. RIGHT WORKSPACE AREA */}
        <div 
          id="expenses-data-viewport" 
          className={`flex-1 flex flex-col h-full overflow-hidden transition-transform lg:translate-x-0 lg:relative lg:pointer-events-auto lg:z-10 ${
            mobileDetailOpen ? 'translate-x-0 relative z-20 bg-white' : 'translate-x-full absolute pointer-events-none'
          }`}
        >
          {/* Header section */}
          <div className="p-4 bg-white border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shrink-0">
            <div className="flex items-center space-x-3 overflow-hidden">
              <button 
                onClick={() => setMobileDetailOpen(false)}
                className="lg:hidden p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 shrink-0"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="bg-indigo-50 p-2 rounded-xl text-indigo-600 border border-indigo-100 shrink-0">
                <DollarSign className="w-5 h-5" />
              </div>
              <div className="overflow-hidden">
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-mono font-extrabold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded uppercase">
                    {activeProject ? activeProject.code : 'GLOBAL'}
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 truncate">
                    {activeProject ? `${activeProject.name} - Expenditures` : 'Wafaq Corporate Expenditure Control'}
                  </h3>
                </div>
                <p className="text-[10px] text-slate-400 truncate mt-0.5">
                  {activeProject 
                    ? `Record and audit direct project costs, supplies receipts, and machinery rental bills for ${activeProject.name}.`
                    : 'Consolidated summary of all logged, audited, and processed expenditures across active projects.'
                  }
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              {canManageExpenses && (
                <button
                  onClick={handleOpenAdd}
                  className="inline-flex items-center justify-center space-x-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Log Expense Voucher</span>
                </button>
              )}
            </div>
          </div>

          {/* Search bar & Filters row */}
          <div className="p-4 bg-white border-b border-slate-200 shrink-0 space-y-3">
            <div className="flex flex-wrap items-center gap-3 justify-between">
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="text" 
                  placeholder="Search by vendor, details..."
                  value={expenseSearchQuery}
                  onChange={e => setExpenseSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                />
              </div>

              {/* Filtering Controls */}
              <div className="flex flex-wrap gap-2 items-center text-xs">
                {/* Status Filter */}
                <div className="flex items-center space-x-1">
                  <span className="text-slate-400 font-mono text-[10px]">Status:</span>
                  <select
                    value={filterStatus}
                    onChange={e => setFilterStatus(e.target.value)}
                    className="border border-slate-200 rounded-lg bg-white p-1 text-[11px] focus:ring-1 focus:ring-indigo-500 outline-none"
                  >
                    <option value="all">All statuses</option>
                    <option value="draft">Draft Voucher</option>
                    <option value="pending">Review Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>

                {/* Category Filter */}
                <div className="flex items-center space-x-1">
                  <span className="text-slate-400 font-mono text-[10px]">Category:</span>
                  <select
                    value={filterCategory}
                    onChange={e => setFilterCategory(e.target.value)}
                    className="border border-slate-200 rounded-lg bg-white p-1 text-[11px] focus:ring-1 focus:ring-indigo-500 outline-none max-w-[180px] truncate"
                  >
                    <option value="all">All Budgets</option>
                    {activeProjectBudgets.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>

                {/* Month Filter */}
                <div className="flex items-center space-x-1">
                  <span className="text-slate-400 font-mono text-[10px]">Month:</span>
                  <div className="relative">
                    <input
                      type="month"
                      value={filterMonth}
                      onChange={(e) => setFilterMonth(e.target.value)}
                      className="border border-slate-200 rounded-lg bg-white p-1 text-[11px] focus:ring-1 focus:ring-indigo-500 outline-none pr-6"
                    />
                    {filterMonth && (
                      <button
                        onClick={() => setFilterMonth('')}
                        className="absolute right-1 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 bg-white"
                        title="Clear month filter"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Container Workspace */}
          <div className="p-6 bg-slate-50 flex-1 overflow-y-auto space-y-6">

            {/* KPI metrics row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase font-bold tracking-wider">Total Capital Outlay</span>
                  <h4 className="text-lg font-extrabold text-slate-900 mt-1">{formatRawCurrency(metrics.totalApprovedAmount)}</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">{metrics.approvedCount} approved claims</p>
                </div>
                <div className="bg-emerald-50 p-2.5 rounded-xl text-emerald-600">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase font-bold tracking-wider">Unprocessed Receipts</span>
                  <h4 className="text-lg font-extrabold text-amber-600 mt-1">{formatRawCurrency(metrics.totalPendingAmount)}</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">{metrics.pendingCount} pending audit</p>
                </div>
                <div className="bg-amber-50 p-2.5 rounded-xl text-amber-600">
                  <Clock className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase font-bold tracking-wider">Accumulated VAT Paid</span>
                  <h4 className="text-lg font-extrabold text-indigo-600 mt-1">{formatRawCurrency(metrics.totalApprovedVat)}</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">15% VAT component</p>
                </div>
                <div className="bg-indigo-50 p-2.5 rounded-xl text-indigo-600">
                  <Tag className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase font-bold tracking-wider">Draft Outlays</span>
                  <h4 className="text-lg font-extrabold text-slate-600 mt-1">{metrics.draftCount} Drafts</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Internal log proposed</p>
                </div>
                <div className="bg-slate-100 p-2.5 rounded-xl text-slate-600">
                  <FileText className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Creation / Editing Form Modal (In-page block) */}
            {isFormOpen && (
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
                  <h4 className="text-xs font-extrabold text-slate-800 uppercase font-mono tracking-wider flex items-center space-x-1.5">
                    <DollarSign className="w-4 h-4 text-indigo-600" />
                    <span>{editingExpense ? 'Modify Expense Voucher' : 'Log New Project Expense Voucher'}</span>
                  </h4>
                  <button 
                    type="button" 
                    onClick={() => {
                      setIsFormOpen(false);
                      setEditingExpense(null);
                    }} 
                    className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-50 transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleSaveExpense} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Project Selector */}
                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 uppercase font-bold">Target Project</label>
                      <select
                        required
                        disabled={!!editingExpense}
                        value={expProjectId}
                        onChange={e => {
                          const pId = e.target.value;
                          setExpProjectId(pId);
                          const projBudgets = getBudgetsForProject(pId);
                          setExpCategoryId(projBudgets[0]?.id || '');
                        }}
                        className="w-full border border-slate-200 rounded-lg p-2 text-xs mt-1 bg-white focus:ring-1 focus:ring-indigo-500 outline-none font-medium text-slate-700"
                      >
                        {projects.map(p => (
                          <option key={p.id} value={p.id}>[{p.code}] {p.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Category Selector */}
                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 uppercase font-bold">Budget Allocation Code</label>
                      <select
                        required
                        value={expCategoryId}
                        onChange={e => setExpCategoryId(e.target.value)}
                        className="w-full border border-slate-200 rounded-lg p-2 text-xs mt-1 bg-white focus:ring-1 focus:ring-indigo-500 outline-none font-medium text-slate-700"
                      >
                        {getBudgetsForProject(expProjectId).map(b => (
                          <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                        {getBudgetsForProject(expProjectId).length === 0 && (
                          <option value="">General Project Allocation</option>
                        )}
                      </select>
                    </div>

                    {/* Date Selector */}
                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 uppercase font-bold">Transaction Date</label>
                      <input
                        type="date"
                        required
                        value={expDate}
                        onChange={e => setExpDate(e.target.value)}
                        className="w-full border border-slate-200 rounded-lg p-2 text-xs mt-1 focus:ring-1 focus:ring-indigo-500 outline-none font-medium text-slate-700"
                      />
                    </div>

                    {/* Vendor / Supplier */}
                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-mono text-slate-400 uppercase font-bold">Vendor / Payee Name</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Riyadh Concrete Co., Zahid Tractor Rentals..."
                        value={expVendor}
                        onChange={e => setExpVendor(e.target.value)}
                        className="w-full border border-slate-200 rounded-lg p-2 text-xs mt-1 focus:ring-1 focus:ring-indigo-500 outline-none font-medium text-slate-700"
                      />
                    </div>

                    {/* Status */}
                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 uppercase font-bold">Expense Status</label>
                      <select
                        value={expApprovalStatus}
                        onChange={e => setExpApprovalStatus(e.target.value as any)}
                        className="w-full border border-slate-200 rounded-lg p-2 text-xs mt-1 bg-white focus:ring-1 focus:ring-indigo-500 outline-none font-medium text-slate-700"
                      >
                        <option value="draft">Draft Voucher (Proposed)</option>
                        <option value="pending">Pending Approval Review</option>
                        <option value="approved">Approved / Disbursed</option>
                        <option value="rejected">Rejected / Void</option>
                      </select>
                    </div>

                    {/* Net Amount */}
                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 uppercase font-bold">Net Amount (SAR - Excl. VAT)</label>
                      <input
                        type="number"
                        required
                        min="0"
                        placeholder="e.g. 10000"
                        value={expAmount}
                        onChange={e => setExpAmount(Number(e.target.value))}
                        className="w-full border border-slate-200 rounded-lg p-2 text-xs mt-1 focus:ring-1 focus:ring-indigo-500 outline-none font-medium text-slate-700"
                      />
                    </div>

                    {/* VAT Amount */}
                    <div>
                      <div className="flex justify-between items-center">
                        <label className="block text-[10px] font-mono text-slate-400 uppercase font-bold">VAT Amount (SAR)</label>
                        <button
                          type="button"
                          onClick={handleCalculateVat}
                          className="text-[9px] font-bold text-indigo-600 hover:text-indigo-800 hover:underline"
                        >
                          Auto 15% VAT
                        </button>
                      </div>
                      <input
                        type="number"
                        required
                        min="0"
                        placeholder="e.g. 1500"
                        value={expVat}
                        onChange={e => setExpVat(Number(e.target.value))}
                        className="w-full border border-slate-200 rounded-lg p-2 text-xs mt-1 focus:ring-1 focus:ring-indigo-500 outline-none font-medium text-slate-700"
                      />
                    </div>

                    {/* Calculated Total (Read only) */}
                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 uppercase font-bold">Calculated Gross Total (SAR)</label>
                      <input
                        type="text"
                        disabled
                        value={formatRawCurrency(Number(expAmount) + Number(expVat))}
                        className="w-full border border-slate-200 rounded-lg p-2 text-xs mt-1 bg-slate-50 font-bold text-slate-800"
                      />
                    </div>

                    {/* Description */}
                    <div className="md:col-span-3">
                      <label className="block text-[10px] font-mono text-slate-400 uppercase font-bold">Purpose / Transaction Justification</label>
                      <textarea
                        required
                        placeholder="Log detailed description of materials, site logs, purchase invoice matching, or team expenses details..."
                        value={expDescription}
                        onChange={e => setExpDescription(e.target.value)}
                        rows={3}
                        className="w-full border border-slate-200 rounded-lg p-2 text-xs mt-1 focus:ring-1 focus:ring-indigo-500 outline-none font-medium text-slate-700 bg-white"
                      />
                    </div>

                    {/* File Attachment Drag and Drop */}
                    <div className="md:col-span-3">
                      <label className="block text-[10px] font-mono text-slate-400 uppercase font-bold mb-1">Upload Receipt / Supporting Invoice PDF</label>
                      
                      <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => document.getElementById('expense-form-file-input')?.click()}
                        className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center ${
                          isDragging 
                            ? 'border-indigo-500 bg-indigo-50/50 scale-[1.01]' 
                            : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300'
                        }`}
                      >
                        <input
                          id="expense-form-file-input"
                          type="file"
                          multiple
                          onChange={handleFileChange}
                          className="hidden"
                        />
                        <Upload className={`w-8 h-8 mb-2 transition-transform duration-200 ${isDragging ? 'text-indigo-600 scale-110' : 'text-slate-400'}`} />
                        <span className="text-xs font-semibold text-slate-700">
                          {isDragging ? 'Drop your files here!' : 'Drag & drop bills / invoices here, or click to browse'}
                        </span>
                        <span className="text-[10px] text-slate-400 mt-1">
                          Supports PDF, JPG, PNG, Excel files (Max 15MB)
                        </span>
                      </div>

                      {/* Display Selected Files list */}
                      {draftAttachments.length > 0 && (
                        <div className="mt-3 space-y-2">
                          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                            Prepared Invoice Attachments ({draftAttachments.length})
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto p-1 bg-slate-100/50 rounded-lg">
                            {draftAttachments.map((file, idx) => (
                              <div
                                key={idx}
                                className="flex items-center justify-between p-2 bg-white border border-slate-200 rounded-lg text-xs"
                              >
                                <div className="flex items-center space-x-2 truncate pr-2">
                                  <Paperclip className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                  <div className="truncate">
                                    <p className="font-bold text-slate-700 truncate text-[11px]">{file.name}</p>
                                    <p className="text-[9px] text-slate-400 font-mono">{file.size}</p>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemoveDraftAttachment(idx);
                                  }}
                                  className="p-1 text-slate-400 hover:text-rose-600 hover:bg-slate-50 rounded transition"
                                  title="Remove attachment"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                    <button 
                      type="button" 
                      onClick={() => {
                        setIsFormOpen(false);
                        setEditingExpense(null);
                      }} 
                      className="text-xs text-slate-500 font-bold px-3.5 py-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1.5 rounded-lg text-xs font-bold transition shadow-xs cursor-pointer"
                    >
                      {editingExpense ? 'Apply Changes' : 'Record Expense'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Expenses Card Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {selectedExpensesList.map((exp) => {
                const proj = getProjectInfo(exp.projectId);
                const statusInfo = getStatusLabel(exp.approvalStatus);
                const catName = getCategoryName(exp.budgetCategoryId);
                
                return (
                  <div 
                    key={exp.id} 
                    onClick={() => setSelectedExpenseId(exp.id)}
                    className="bg-white p-5 rounded-2xl border border-slate-200/85 shadow-xs hover:shadow-md hover:border-indigo-200 transition-all duration-200 flex flex-col justify-between group relative cursor-pointer"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1 max-w-[65%]">
                          <span className="inline-block text-[8px] font-mono font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded uppercase">
                            {proj.code}
                          </span>
                          <span className="ml-1 inline-block text-[9px] font-mono text-slate-400 font-semibold truncate max-w-[80px]">
                            {exp.id}
                          </span>
                          <h4 className="font-extrabold text-xs text-slate-800 line-clamp-1 group-hover:text-indigo-600 transition-colors">
                            {exp.vendor}
                          </h4>
                          <span className="inline-flex items-center space-x-1 text-[9px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded font-mono font-medium mt-1">
                            <Layers className="w-2.5 h-2.5" />
                            <span>{catName}</span>
                          </span>
                        </div>

                        <div className="flex flex-col items-end space-y-1 shrink-0">
                          <span className={`px-2 py-0.5 rounded text-[8px] font-mono font-extrabold uppercase border ${statusInfo.style}`}>
                            {statusInfo.label}
                          </span>
                        </div>
                      </div>

                      <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed">
                        {exp.description || 'No description logged.'}
                      </p>
                    </div>

                    {/* Financial details inside card */}
                    <div className="grid grid-cols-2 gap-2 my-3 p-2 bg-slate-50 rounded-xl border border-slate-100">
                      <div>
                        <span className="text-[9px] font-mono text-slate-400 block">TOTAL VALUE</span>
                        <span className="text-xs font-extrabold text-slate-800">{formatExpenseValue(exp, 'totalAmount')}</span>
                      </div>
                      <div>
                        <span className="text-[9px] font-mono text-slate-400 block">VAT AMOUNT</span>
                        <span className="text-xs font-semibold text-slate-600">{formatExpenseValue(exp, 'vat')}</span>
                      </div>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-slate-50 mt-2">
                      <div className="flex justify-between items-center text-[9px] font-mono text-slate-400">
                        <span>Date: {exp.date}</span>
                        <div className="flex items-center space-x-2">
                          {(exp.comments || []).length > 0 && (
                            <span className="flex items-center space-x-0.5">
                              <MessageSquare className="w-3 h-3" />
                              <span>{(exp.comments || []).length}</span>
                            </span>
                          )}
                          {(exp.attachments || []).length > 0 && (
                            <span className="flex items-center space-x-0.5">
                              <Paperclip className="w-3 h-3" />
                              <span>{(exp.attachments || []).length}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action buttons shown on hover */}
                    {canManageExpenses && (
                      <div className="flex items-center justify-end space-x-1.5 pt-2 border-t border-slate-50 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => handleOpenEdit(exp, e)}
                          className="p-1 text-slate-400 hover:text-indigo-600 rounded hover:bg-slate-50 transition"
                          title="Edit Expense Voucher"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => handleDeleteExpense(exp, e)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-slate-50 transition"
                          title="Delete Expense"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleExportVoucher(exp);
                          }}
                          className="p-1 text-indigo-500 hover:text-indigo-700 rounded hover:bg-slate-50 transition"
                          title="Export Voucher Receipt"
                        >
                          <FileDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}

              {selectedExpensesList.length === 0 && (
                <div className="col-span-full text-center py-12 bg-white rounded-2xl border border-dashed border-slate-200">
                  <DollarSign className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-slate-400 text-xs font-medium">No expenses match your filters.</p>
                  <p className="text-slate-300 text-[10px] mt-1">Select all projects or log a new material bill.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 3. SLIDE OVER: DETAIL WORKSPACE PANEL FOR SELECTED EXPENSE */}
        {selectedExpense && (
          <div className="w-96 border-l border-slate-200 bg-white flex flex-col h-full shrink-0 overflow-y-auto">
            {/* Slide Header */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="overflow-hidden">
                <span className="text-[10px] font-mono text-slate-400 font-bold uppercase block">
                  Expense ID: {selectedExpense.id}
                </span>
                <h4 className="text-xs font-extrabold text-slate-800 truncate uppercase tracking-tight mt-0.5">
                  {selectedExpense.vendor}
                </h4>
              </div>
              <button 
                onClick={() => setSelectedExpenseId(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-6">
              
              {/* Financial Status Summary card */}
              <div className="bg-slate-900 text-white p-4 rounded-xl space-y-3 shadow-xs font-sans">
                <div className="flex justify-between items-center border-b border-white/10 pb-2">
                  <span className="text-[10px] font-mono text-slate-300 font-bold">DISBURSEMENT STATUS</span>
                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded border ${
                    selectedExpense.approvalStatus === 'approved' 
                      ? 'bg-emerald-500 text-white border-transparent'
                      : selectedExpense.approvalStatus === 'pending'
                        ? 'bg-amber-500 text-white border-transparent'
                        : selectedExpense.approvalStatus === 'rejected'
                          ? 'bg-rose-500 text-white border-transparent'
                          : 'bg-slate-600 text-slate-200 border-transparent'
                  }`}>
                    {selectedExpense.approvalStatus.toUpperCase()}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[9px] text-slate-400 font-mono block uppercase">Net Amount</span>
                    <span className="text-sm font-extrabold tracking-tight text-white">
                      {formatExpenseValue(selectedExpense, 'amount')}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 font-mono block uppercase">VAT Paid (KSA 15%)</span>
                    <span className="text-sm font-extrabold tracking-tight text-indigo-300">
                      {formatExpenseValue(selectedExpense, 'vat')}
                    </span>
                  </div>
                </div>

                <div className="pt-2.5 border-t border-white/10 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 uppercase font-mono">Gross Cash Outlay:</span>
                  <span className="text-sm font-extrabold tracking-tight text-amber-400 font-mono">
                    {formatExpenseValue(selectedExpense, 'totalAmount')}
                  </span>
                </div>
              </div>

              {/* Expense Purpose */}
              <div>
                <h5 className="text-[10px] font-bold text-slate-400 uppercase font-mono tracking-wider">Expense Purpose & Justification</h5>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                  {selectedExpense.description || 'No detailed description provided.'}
                </p>
              </div>

              {/* Budget Category Category block */}
              <div className="flex items-center justify-between p-3 bg-slate-100/60 rounded-xl border border-slate-200 text-xs text-slate-700">
                <span className="font-semibold text-slate-500">Allocation:</span>
                <span className="font-bold text-indigo-700 font-mono">{getCategoryName(selectedExpense.budgetCategoryId)}</span>
              </div>

              {/* Attachments Section */}
              <div className="space-y-3">
                <h5 className="text-[10px] font-bold text-slate-400 uppercase font-mono tracking-wider flex items-center justify-between">
                  <span>Attached Invoices / Receipts</span>
                  <span className="text-[9px] font-mono text-indigo-600">{(selectedExpense.attachments || []).length} items</span>
                </h5>

                {/* Upload Form */}
                <form onSubmit={handleAddAttachment} className="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Invoice_Receipt.pdf"
                    value={newFileName}
                    onChange={e => setNewFileName(e.target.value)}
                    className="flex-1 border border-slate-200 rounded-lg px-2.5 py-1 text-xs outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <input
                    type="text"
                    placeholder="1.2 MB"
                    value={newFileSize}
                    onChange={e => setNewFileSize(e.target.value)}
                    className="w-16 border border-slate-200 rounded-lg px-1.5 py-1 text-xs text-center outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <button
                    type="submit"
                    className="p-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg text-slate-600 transition"
                  >
                    <PlusCircle className="w-4 h-4" />
                  </button>
                </form>

                <div className="space-y-1.5">
                  {(selectedExpense.attachments || []).length === 0 ? (
                    <div className="text-center py-4 text-slate-400 text-[10px] bg-slate-50/50 rounded-lg border border-dashed border-slate-200 italic">
                      No supporting files uploaded. Logged bills should have PDF attachments.
                    </div>
                  ) : (
                    (selectedExpense.attachments || []).map((file, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-xl text-xs">
                        <div className="flex items-center space-x-2 truncate">
                          <Paperclip className="w-3.5 h-3.5 text-slate-400" />
                          <div className="truncate">
                            <p className="font-bold text-slate-700 truncate">{file.name}</p>
                            <p className="text-[9px] text-slate-400 font-mono">{file.size}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            onAddNotification(`Downloaded file "${file.name}"`, 'success');
                          }}
                          className="p-1 text-slate-400 hover:text-indigo-600 rounded hover:bg-slate-50 transition"
                          title="Download Receipt"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Audit / Transition updates timeline */}
              <div className="space-y-3">
                <h5 className="text-[10px] font-bold text-slate-400 uppercase font-mono tracking-wider flex items-center justify-between">
                  <span>Voucher Life-Cycle Log</span>
                  <History className="w-3.5 h-3.5 text-slate-400" />
                </h5>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {(selectedExpense.updates || []).map((up) => (
                    <div key={up.id} className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-[10px] text-slate-600 leading-relaxed relative">
                      <div className="flex items-center justify-between mb-1 font-mono text-[9px] text-slate-400">
                        <span className="font-bold text-slate-500">{up.user} ({up.role})</span>
                        <span>{up.date}</span>
                      </div>
                      <p>{up.text}</p>
                    </div>
                  ))}
                  {(selectedExpense.updates || []).length === 0 && (
                    <div className="text-center py-2 text-slate-400 text-[10px] italic">No status changes registered.</div>
                  )}
                </div>
              </div>

              {/* Comments Section */}
              <div className="space-y-3 border-t border-slate-100 pt-5">
                <h5 className="text-[10px] font-bold text-slate-400 uppercase font-mono tracking-wider flex items-center justify-between">
                  <span>Audit Discussion</span>
                  <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                </h5>

                <form onSubmit={handleAddComment} className="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Add financial comment or audit query..."
                    value={newCommentText}
                    onChange={e => setNewCommentText(e.target.value)}
                    className="flex-1 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer"
                  >
                    Send
                  </button>
                </form>

                <div className="space-y-2">
                  {(selectedExpense.comments || []).map((comm) => (
                    <div key={comm.id} className="p-3 bg-indigo-50/30 rounded-xl border border-indigo-100/40 text-[11px] text-slate-600">
                      <div className="flex items-center justify-between font-mono text-[9px] text-slate-400 mb-1">
                        <span className="font-bold text-indigo-700">{comm.user} ({comm.role})</span>
                        <span>{comm.date}</span>
                      </div>
                      <p className="leading-relaxed text-slate-700">{comm.text}</p>
                    </div>
                  ))}

                  {(selectedExpense.comments || []).length === 0 && (
                    <div className="text-center py-4 text-slate-400 text-[10px] bg-slate-50/50 rounded-lg italic">
                      No comments logged. Click above to add internal note.
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Quick Tools */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => handleExportVoucher(selectedExpense)}
                  className="w-full inline-flex items-center justify-center space-x-1.5 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 text-indigo-700 rounded-lg text-xs font-bold transition cursor-pointer"
                >
                  <FileDown className="w-4 h-4" />
                  <span>Download Formal Voucher</span>
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
