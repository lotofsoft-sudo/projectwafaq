/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  CreditCard, 
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
  Tag,
  Percent,
  CheckCircle,
  AlertTriangle,
  FileText
} from 'lucide-react';
import { Project, Invoice, Payment, Milestone, User, Comment, getVatAppliedAmount } from '../types';
import { jsPDF } from 'jspdf';

interface ProjectPaymentsViewProps {
  projects: Project[];
  milestones: Milestone[];
  invoices: Invoice[];
  setInvoices: React.Dispatch<React.SetStateAction<Invoice[]>>;
  payments: Payment[];
  setPayments: React.Dispatch<React.SetStateAction<Payment[]>>;
  currentUser: User;
  availableUsers: User[];
  onLogAudit: (action: string, module: string, oldValue?: string, newValue?: string) => void;
  onAddNotification: (text: string, type: 'info' | 'success' | 'warning' | 'alert') => void;
}

export default function ProjectPaymentsView({
  projects,
  milestones,
  invoices,
  setInvoices,
  payments,
  setPayments,
  currentUser,
  availableUsers,
  onLogAudit,
  onAddNotification,
}: ProjectPaymentsViewProps) {
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [projectSearchQuery, setProjectSearchQuery] = useState('');
  const [paymentSearchQuery, setPaymentSearchQuery] = useState('');
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);

  // Filters state
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterMethod, setFilterMethod] = useState<string>('all');

  // Modal / Form States
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);
  const [isPaymentFormOpen, setIsPaymentFormOpen] = useState(false);
  const [isInvoiceFormOpen, setIsInvoiceFormOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);

  // Payment Form Fields
  const [payProjectId, setPayProjectId] = useState('');
  const [payInvoiceId, setPayInvoiceId] = useState('');
  const [payMilestoneId, setPayMilestoneId] = useState('');
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payDate, setPayDate] = useState('');
  const [payMethod, setPayMethod] = useState('Bank Transfer');
  const [payBankRef, setPayBankRef] = useState('');
  const [payStatus, setPayStatus] = useState<'cleared' | 'pending' | 'disputed' | 'cancelled'>('cleared');

  // Invoice Form Fields (since the prompt requests "At the top add option for add invoice and add payment")
  const [invProjectId, setInvProjectId] = useState('');
  const [invMilestoneId, setInvMilestoneId] = useState('');
  const [invNumber, setInvNumber] = useState('');
  const [invAmount, setInvAmount] = useState<number>(0);
  const [invVat, setInvVat] = useState<number>(0);
  const [invRetention, setInvRetention] = useState<number>(0);
  const [invDueDate, setInvDueDate] = useState('');
  const [invStatus, setInvStatus] = useState<Invoice['status']>('draft');

  // Comments & Attachments additions in details panel
  const [newCommentText, setNewCommentText] = useState('');
  const [newFileName, setNewFileName] = useState('');
  const [newFileSize, setNewFileSize] = useState('');

  // Draft file attachments for creation/editing form
  const [draftAttachments, setDraftAttachments] = useState<{ name: string; size: string; uploadedAt?: string }[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  // Authorization checks
  const canManagePayments = useMemo(() => {
    return currentUser.role === 'General Manager' || 
           currentUser.role === 'Project Manager' || 
           currentUser.role === 'Admin' || 
           currentUser.role === 'Super Admin' ||
           currentUser.role === 'Finance Manager' ||
           currentUser.role === 'Accountant';
  }, [currentUser]);

  // Selected payment memoized
  const selectedPayment = useMemo(() => {
    return payments.find(p => p.id === selectedPaymentId) || null;
  }, [payments, selectedPaymentId]);

  // Filtered projects sidebar
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

  // Payments for the active selection
  const selectedPaymentsList = useMemo(() => {
    let list = payments;
    if (selectedProjectId !== 'all') {
      list = list.filter(p => p.projectId === selectedProjectId);
    }
    if (filterStatus !== 'all') {
      list = list.filter(p => (p.status || 'cleared') === filterStatus);
    }
    if (filterMethod !== 'all') {
      list = list.filter(p => p.paymentMethod.toLowerCase().includes(filterMethod.toLowerCase()));
    }
    if (paymentSearchQuery.trim()) {
      const q = paymentSearchQuery.toLowerCase();
      list = list.filter(p => 
        p.bankRef.toLowerCase().includes(q) || 
        p.paymentMethod.toLowerCase().includes(q) ||
        (p.invoiceNumber && p.invoiceNumber.toLowerCase().includes(q)) ||
        (p.milestoneName && p.milestoneName.toLowerCase().includes(q)) ||
        p.id.toLowerCase().includes(q)
      );
    }
    return list;
  }, [payments, selectedProjectId, filterStatus, filterMethod, paymentSearchQuery]);

  // Financial metrics for collections
  const metrics = useMemo(() => {
    const list = selectedPaymentsList;
    const totalCount = list.length;
    
    // Total Payments Received
    const totalPaymentsValue = list.reduce((sum, p) => sum + p.amount, 0);
    
    // Cleared / Confirmed payments
    const clearedPaymentsValue = list
      .filter(p => (p.status || 'cleared') === 'cleared')
      .reduce((sum, p) => sum + p.amount, 0);

    // Pending collections
    const pendingPaymentsValue = list
      .filter(p => (p.status || 'cleared') === 'pending')
      .reduce((sum, p) => sum + p.amount, 0);

    // Disputed / Delayed collections
    const disputedPaymentsValue = list
      .filter(p => (p.status || 'cleared') === 'disputed')
      .reduce((sum, p) => sum + p.amount, 0);

    return {
      totalCount,
      totalPaymentsValue,
      clearedPaymentsValue,
      pendingPaymentsValue,
      disputedPaymentsValue
    };
  }, [selectedPaymentsList]);

  // Helper: Project metadata
  const getProjectInfo = (pId: string) => {
    return projects.find(p => p.id === pId) || { name: 'Unknown Project', code: 'PROJ-XXX', clientName: 'N/A' };
  };

  // Open Log Payment Form
  const handleOpenAddPayment = () => {
    if (!canManagePayments) {
      onAddNotification('Unauthorized: Your role does not allow logging client collections.', 'alert');
      return;
    }
    setEditingPayment(null);
    const defaultProjId = selectedProjectId === 'all' ? (projects[0]?.id || '') : selectedProjectId;
    setPayProjectId(defaultProjId);
    
    // Select first invoice of this project or default empty
    const projInvoices = invoices.filter(i => i.projectId === defaultProjId);
    setPayInvoiceId(projInvoices[0]?.id || '');
    
    // Select milestone
    const projMilestones = milestones.filter(m => m.projectId === defaultProjId);
    setPayMilestoneId(projMilestones[0]?.id || '');

    setPayAmount(0);
    setPayDate(new Date().toISOString().slice(0, 10));
    setPayMethod('Bank Transfer');
    setPayBankRef(`REF-SA-${Date.now().toString().slice(-6)}`);
    setPayStatus('cleared');
    setDraftAttachments([]);
    setIsPaymentFormOpen(true);
  };

  // Open Edit Payment Form
  const handleOpenEditPayment = (p: Payment, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!canManagePayments) {
      onAddNotification('Unauthorized: Your role does not allow modifying payment receipts.', 'alert');
      return;
    }
    setEditingPayment(p);
    setPayProjectId(p.projectId);
    setPayInvoiceId(p.invoiceId || '');
    setPayMilestoneId(p.milestoneId || '');
    setPayAmount(p.amount);
    setPayDate(p.date);
    setPayMethod(p.paymentMethod.includes('Cash') ? 'Cash' : 'Bank Transfer');
    setPayBankRef(p.bankRef);
    setPayStatus(p.status || 'cleared');
    setDraftAttachments(p.attachments || []);
    setIsPaymentFormOpen(true);
  };

  // Open Invoice Form (since the header includes "Add Invoice" button as well)
  const handleOpenAddInvoice = () => {
    if (!canManagePayments) {
      onAddNotification('Unauthorized: Your role does not allow issuing valuation invoices.', 'alert');
      return;
    }
    const defaultProjId = selectedProjectId === 'all' ? (projects[0]?.id || '') : selectedProjectId;
    setInvProjectId(defaultProjId);
    
    const projMilestones = milestones.filter(m => m.projectId === defaultProjId);
    setInvMilestoneId(projMilestones[0]?.id || '');
    
    // Auto-generate invoice code template
    const projCode = projects.find(p => p.id === defaultProjId)?.code || 'PROJ';
    const cleanProjCode = projCode.split('-')[2] || projCode;
    const count = invoices.filter(i => i.projectId === defaultProjId).length + 101;
    setInvNumber(`WF-INV-${cleanProjCode}-${count}`);

    setInvAmount(0);
    setInvVat(0);
    setInvRetention(0);
    setInvDueDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10));
    setInvStatus('draft');
    setIsInvoiceFormOpen(true);
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
    onAddNotification(`Attached ${newAttachments.length} file(s) for the receipt template.`, 'info');
  };

  const handleRemoveDraftAttachment = (idx: number) => {
    setDraftAttachments(prev => prev.filter((_, i) => i !== idx));
    onAddNotification('Attachment removed.', 'info');
  };

  // Save or update Payment Received
  const handleSavePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManagePayments) return;

    if (payAmount <= 0) {
      onAddNotification('Payment collection amount must be greater than zero.', 'warning');
      return;
    }

    const linkedInvoice = invoices.find(i => i.id === payInvoiceId);
    const linkedMilestone = milestones.find(m => m.id === payMilestoneId);

    if (editingPayment) {
      // 1. Rollback previous invoice receivedAmount
      const diff = payAmount - editingPayment.amount;

      setPayments(prev => prev.map(item => {
        if (item.id === editingPayment.id) {
          const statusChanged = item.status !== payStatus;
          const nextUpdates = [...(item.updates || [])];

          if (statusChanged) {
            nextUpdates.push({
              id: `pay_up_${Date.now()}`,
              user: currentUser.name,
              role: currentUser.role,
              text: `Collection status changed from "${item.status || 'cleared'}" to "${payStatus}".`,
              date: new Date().toISOString().replace('T', ' ').substring(0, 16)
            });
          }

          return {
            ...item,
            invoiceId: payInvoiceId || undefined,
            invoiceNumber: linkedInvoice ? linkedInvoice.invoiceNumber : undefined,
            milestoneId: payMilestoneId || undefined,
            milestoneName: linkedMilestone ? linkedMilestone.name : undefined,
            amount: Number(payAmount),
            date: payDate,
            paymentMethod: payMethod === 'Cash' ? 'Cash Voucher' : 'SADAD Bank Transfer',
            bankRef: payBankRef,
            status: payStatus,
            attachments: draftAttachments,
            updates: nextUpdates
          };
        }
        return item;
      }));

      // Adjust linked invoice payment status if invoice linked
      if (payInvoiceId) {
        setInvoices(prev => prev.map(inv => {
          if (inv.id === payInvoiceId) {
            const priorReceived = inv.receivedAmount || 0;
            const updatedReceived = priorReceived + diff;
            const isFullyPaid = updatedReceived >= inv.totalAmount;

            return {
              ...inv,
              receivedAmount: updatedReceived,
              status: isFullyPaid ? 'paid' : 'partially_paid'
            };
          }
          return inv;
        }));
      }

      onLogAudit(`Updated Collection Receipt for Project`, 'Payments', `${editingPayment.amount} SAR`, `${payAmount} SAR`);
      onAddNotification(`Receipt details updated.`, 'success');
    } else {
      // Create new payment receipt
      const newPay: Payment = {
        id: `pay_${Date.now()}`,
        projectId: payProjectId,
        invoiceId: payInvoiceId || undefined,
        invoiceNumber: linkedInvoice ? linkedInvoice.invoiceNumber : undefined,
        milestoneId: payMilestoneId || undefined,
        milestoneName: linkedMilestone ? linkedMilestone.name : undefined,
        amount: Number(payAmount),
        date: payDate,
        paymentMethod: payMethod === 'Cash' ? 'Cash Voucher' : 'SADAD Bank Transfer',
        bankRef: payBankRef || `REF-SA-${Date.now().toString().slice(-6)}`,
        status: payStatus,
        comments: [],
        attachments: draftAttachments,
        updates: [
          {
            id: `pay_up_${Date.now()}`,
            user: currentUser.name,
            role: currentUser.role,
            text: `Payment of ${payAmount} SAR initially logged. Status: "${payStatus}".`,
            date: new Date().toISOString().replace('T', ' ').substring(0, 16)
          }
        ]
      };

      setPayments(prev => [...prev, newPay]);

      // If tied to an invoice, update invoice's collection numbers
      if (payInvoiceId) {
        setInvoices(prev => prev.map(inv => {
          if (inv.id === payInvoiceId) {
            const currentRec = inv.receivedAmount || 0;
            const nextRec = currentRec + Number(payAmount);
            const isFullyPaid = nextRec >= inv.totalAmount;

            return {
              ...inv,
              receivedAmount: nextRec,
              status: isFullyPaid ? 'paid' : 'partially_paid'
            };
          }
          return inv;
        }));
      }

      onLogAudit(`Recorded Client Collection Receipt`, 'Payments', undefined, `${newPay.amount} SAR`);
      onAddNotification(`Collection recorded successfully. Outstanding balances updated.`, 'success');
    }

    setIsPaymentFormOpen(false);
    setEditingPayment(null);
  };

  // Delete Payment
  const handleDeletePayment = (p: Payment, e: React.MouseEvent) => {
    const userRoleStr = currentUser?.role?.toLowerCase() || '';
    if (userRoleStr !== 'admin' && userRoleStr !== 'super admin' && userRoleStr !== 'superadmin') {
      alert("Unauthorized: Only Admin or Super Admin can delete records.");
      return;
    }

    e.stopPropagation();
    if (!canManagePayments) {
      onAddNotification('Unauthorized: Your role does not allow deleting transactions.', 'alert');
      return;
    }

    if (window.confirm(`Are you sure you want to delete this payment receipt of ${formatCurrency(p.amount)}? This will reduce the collected amounts on any linked invoices.`)) {
      setPayments(prev => prev.filter(item => item.id !== p.id));
      
      // Revert invoice receivedAmount
      if (p.invoiceId) {
        setInvoices(prev => prev.map(inv => {
          if (inv.id === p.invoiceId) {
            const currentRec = inv.receivedAmount || 0;
            const rolledBack = Math.max(0, currentRec - p.amount);
            const isFullyPaid = rolledBack >= inv.totalAmount;
            return {
              ...inv,
              receivedAmount: rolledBack,
              status: rolledBack === 0 ? 'approved' : (isFullyPaid ? 'paid' : 'partially_paid')
            };
          }
          return inv;
        }));
      }

      if (selectedPaymentId === p.id) {
        setSelectedPaymentId(null);
      }
      onLogAudit(`Deleted client payment receipt`, 'Payments', `${p.amount} SAR`, undefined);
      onAddNotification(`Receipt removed.`, 'success');
    }
  };

  // Add Comment to Payment
  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPaymentId || !newCommentText.trim()) return;

    const nextComment: Comment = {
      id: `pay_comm_${Date.now()}`,
      user: currentUser.name,
      role: currentUser.role,
      text: newCommentText.trim(),
      date: new Date().toISOString().replace('T', ' ').substring(0, 16)
    };

    setPayments(prev => prev.map(p => {
      if (p.id === selectedPaymentId) {
        const nextComments = [...(p.comments || []), nextComment];
        return { ...p, comments: nextComments };
      }
      return p;
    }));

    setNewCommentText('');
    onAddNotification('Comment posted.', 'success');
  };

  // Add individual file inside details panel
  const handleAddAttachment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPaymentId || !newFileName.trim()) return;

    const nextAttachment = {
      name: newFileName.trim(),
      size: newFileSize.trim() || '1.2 MB',
      uploadedAt: new Date().toISOString().slice(0, 10)
    };

    setPayments(prev => prev.map(p => {
      if (p.id === selectedPaymentId) {
        const nextAttachments = [...(p.attachments || []), nextAttachment];
        return { ...p, attachments: nextAttachments };
      }
      return p;
    }));

    setNewFileName('');
    setNewFileSize('');
    onAddNotification(`Linked file "${nextAttachment.name}" to this payment receipt.`, 'success');
  };

  // Save quick Draft Invoice from the header options
  const handleSaveDraftInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManagePayments) return;

    if (!invNumber.trim() || invAmount <= 0) {
      onAddNotification('Ensure reference is filled and base claim amount > 0.', 'warning');
      return;
    }

    const milestoneSelected = milestones.find(m => m.id === invMilestoneId);
    const calculatedTotal = Number(invAmount) + Number(invVat) - Number(invRetention);

    const newInv: Invoice = {
      id: `inv_${Date.now()}`,
      projectId: invProjectId,
      invoiceNumber: invNumber.trim(),
      milestoneId: invMilestoneId,
      milestoneName: milestoneSelected ? milestoneSelected.name : 'Physical Milestone Valuation',
      amount: Number(invAmount),
      vat: Number(invVat),
      retention: Number(invRetention),
      totalAmount: calculatedTotal,
      status: invStatus,
      dateCreated: new Date().toISOString().slice(0, 10),
      dueDate: invDueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      receivedAmount: 0,
      comments: [],
      attachments: [],
      updates: [
        {
          id: `inv_up_${Date.now()}`,
          user: currentUser.name,
          role: currentUser.role,
          text: `Invoice initially drafted.`,
          date: new Date().toISOString().replace('T', ' ').substring(0, 16)
        }
      ]
    };

    setInvoices(prev => [...prev, newInv]);
    onLogAudit(`Issued Valuation Progress Invoice from Payment Board: ${newInv.invoiceNumber}`, 'Invoice Module', undefined, `${calculatedTotal} SAR`);
    onAddNotification(`Invoice ${newInv.invoiceNumber} recorded under draft.`, 'success');
    
    setIsInvoiceFormOpen(false);
  };

  // Format Currency (SAR)
  const formatCurrency = (amount: number) => {
    const applied = getVatAppliedAmount(amount);
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'SAR',
      maximumFractionDigits: 0
    }).format(applied);
  };

  // Payment Status Styling
  const getStatusLabel = (status: Payment['status']) => {
    const s = status || 'cleared';
    switch (s) {
      case 'cleared': return { label: 'Cleared / Verified', style: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'pending': return { label: 'Pending Settlement', style: 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse' };
      case 'disputed': return { label: 'Disputed Claim', style: 'bg-rose-50 text-rose-700 border-rose-200' };
      case 'cancelled': return { label: 'Void / Cancelled', style: 'bg-slate-100 text-slate-700 border-slate-200' };
    }
  };

  // Export receipt voucher
  const handleExportPaymentVoucher = (p: Payment) => {
    const proj = getProjectInfo(p.projectId);
    const content = `
=====================================================================
                      OFFICIAL CASH COLLECTION RECEIPT              
=====================================================================
Transaction ID:     ${p.id}
Collection Date:    ${p.date}
Project Reference:  ${proj.code}
Project Name:       ${proj.name}
Client Entity:      ${proj.clientName}

Invoiced Link:      ${p.invoiceNumber ? p.invoiceNumber : 'Direct Collection (Advance/Retainage Release)'}
Milestone Target:   ${p.milestoneName ? p.milestoneName : 'Unspecified Milestone Segment'}
Collection Method:  ${p.paymentMethod}
Bank Wire Reference:${p.bankRef}
Receipt Status:     ${(p.status || 'cleared').toUpperCase()}

---------------------------------------------------------------------
FINANCIAL VALUE:
---------------------------------------------------------------------
Net Collection:     ${formatCurrency(p.amount)} (SAR)
---------------------------------------------------------------------

Issued & Verified By:
Corporate Finance:  Wafaq Engineering Auditor Engine
Logged by User:     ${currentUser.name} (${currentUser.role})
Audit Status:       ZATCA Compliant Transaction Log

=====================================================================
Generated by Wafaq Engineering Project Controls Manager
=====================================================================
`;

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
    pdfDoc.save(`Receipt_${p.bankRef}_ZATCA_Compliance.pdf`);

    onLogAudit(`Exported cash collection certificate for ${p.id}`, 'Payments', undefined, p.id);
    onAddNotification(`Receipt certificate downloaded.`, 'success');
  };

  return (
    <div id="payments-received-view-root" className="flex-1 flex flex-col h-full bg-slate-50 overflow-hidden">
      
      {/* Top Banner Context Section */}
      <div className="bg-white border-b border-slate-200 p-5 md:px-8 flex flex-col md:flex-row md:items-center md:justify-between shrink-0 gap-4">
        <div>
          <span className="text-xs font-mono font-bold text-emerald-600 uppercase tracking-widest block mb-1">Treasury & Client Collections</span>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Payments Received & Cash Ledger</h2>
          <p className="text-xs text-slate-500 mt-1">Log bank wire receipts, issue formal collection certificates, attach client check copies, and split complex partial milestone payments.</p>
        </div>

        {/* TOP COMPREHENSIVE ACTIONS BAR */}
        <div className="flex items-center space-x-2 shrink-0">
          {canManagePayments && (
            <>
              <button
                onClick={handleOpenAddInvoice}
                className="inline-flex items-center justify-center space-x-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Issue Valuation Invoice</span>
              </button>

              <button
                onClick={handleOpenAddPayment}
                className="inline-flex items-center justify-center space-x-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Log Payment Received</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Split Pane View */}
      <div className="flex-1 flex overflow-hidden min-h-0 w-full">
      
        {/* 1. LEFT SIDEBAR: Project Selector */}
        <div 
          id="payments-project-sidebar" 
          className={`w-72 border-r border-slate-200 bg-white flex flex-col h-full shrink-0 transition-transform lg:translate-x-0 lg:relative lg:pointer-events-auto lg:z-10 ${
            mobileDetailOpen ? '-translate-x-full absolute pointer-events-none' : 'relative z-10'
          }`}
        >
          <div className="p-4 border-b border-slate-100 bg-slate-50/60">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-widest font-mono">Projects Directory</h2>
            <p className="text-[10px] text-slate-400 mt-1">Filter incoming cash certificates</p>
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
                <h4 className="text-xs font-bold text-slate-800">All Project Inflows</h4>
                <p className="text-[10px] text-slate-400 mt-0.5">Corporate collections ledger</p>
              </div>
            </button>

            {filteredProjects.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs italic">No projects found.</div>
            ) : (
              filteredProjects.map(p => {
                const isActive = selectedProjectId === p.id;
                const pPaymentsCount = payments.filter(pPay => pPay.projectId === p.id).length;
                return (
                  <button
                    key={p.id}
                    onClick={() => {
                      setSelectedProjectId(p.id);
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
                        {pPaymentsCount} Inflows
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
          id="payments-data-viewport" 
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
              <div className="bg-emerald-50 p-2 rounded-xl text-emerald-600 border border-emerald-100 shrink-0">
                <CreditCard className="w-5 h-5" />
              </div>
              <div className="overflow-hidden">
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-mono font-extrabold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded uppercase">
                    {activeProject ? activeProject.code : 'GLOBAL'}
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 truncate">
                    {activeProject ? `${activeProject.name} - Payments Received` : 'Wafaq Enterprise Inflow Log'}
                  </h3>
                </div>
                <p className="text-[10px] text-slate-400 truncate mt-0.5">
                  {activeProject 
                    ? `Review verified, pending, and partial payment vouchers received for ${activeProject.name}.`
                    : 'A comprehensive treasury board of verified wire transfers, deposits, and cash vouchers.'
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Search bar & Filters row */}
          <div className="p-4 bg-white border-b border-slate-200 shrink-0 space-y-3">
            <div className="flex flex-wrap items-center gap-3 justify-between">
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="text" 
                  placeholder="Search by wire reference, invoice #..."
                  value={paymentSearchQuery}
                  onChange={e => setPaymentSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                />
              </div>

              {/* Filtering Controls */}
              <div className="flex flex-wrap gap-2 items-center text-xs">
                {/* Status Filter */}
                <div className="flex items-center space-x-1">
                  <span className="text-slate-400 font-mono text-[10px]">Settlement status:</span>
                  <select
                    value={filterStatus}
                    onChange={e => setFilterStatus(e.target.value)}
                    className="border border-slate-200 rounded-lg bg-white p-1 text-[11px] focus:ring-1 focus:ring-indigo-500 outline-none"
                  >
                    <option value="all">All statuses</option>
                    <option value="cleared">Cleared / Verified</option>
                    <option value="pending">Pending Settlement</option>
                    <option value="disputed">Disputed</option>
                    <option value="cancelled">Void / Cancelled</option>
                  </select>
                </div>

                {/* Method Filter */}
                <div className="flex items-center space-x-1">
                  <span className="text-slate-400 font-mono text-[10px]">Method:</span>
                  <select
                    value={filterMethod}
                    onChange={e => setFilterMethod(e.target.value)}
                    className="border border-slate-200 rounded-lg bg-white p-1 text-[11px] focus:ring-1 focus:ring-indigo-500 outline-none"
                  >
                    <option value="all">All Methods</option>
                    <option value="transfer">Bank Wire Transfer</option>
                    <option value="cash">Cash Receipt</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Main Container Workspace */}
          <div className="p-6 bg-slate-50 flex-1 overflow-y-auto space-y-6">

            {/* KPI metrics row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-fade-in">
              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase font-bold tracking-wider">Total Received Cash</span>
                  <h4 className="text-lg font-extrabold text-slate-900 mt-1">{formatCurrency(metrics.totalPaymentsValue)}</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">{metrics.totalCount} transaction receipts</p>
                </div>
                <div className="bg-emerald-50 p-2.5 rounded-xl text-emerald-600">
                  <CreditCard className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase font-bold tracking-wider">Cleared & Available</span>
                  <h4 className="text-lg font-extrabold text-emerald-600 mt-1">{formatCurrency(metrics.clearedPaymentsValue)}</h4>
                  <p className="text-[10px] text-emerald-500 mt-0.5 font-semibold">
                    {metrics.totalPaymentsValue > 0 
                      ? `${((metrics.clearedPaymentsValue / metrics.totalPaymentsValue) * 100).toFixed(1)}% cleared`
                      : '0% cleared'}
                  </p>
                </div>
                <div className="bg-emerald-50 p-2.5 rounded-xl text-emerald-600">
                  <CheckCircle className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase font-bold tracking-wider">Pending Settlement</span>
                  <h4 className="text-lg font-extrabold text-amber-600 mt-1">{formatCurrency(metrics.pendingPaymentsValue)}</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Awaiting bank verification</p>
                </div>
                <div className="bg-amber-50 p-2.5 rounded-xl text-amber-600">
                  <Clock className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase font-bold tracking-wider">Disputed Collections</span>
                  <h4 className="text-lg font-extrabold text-rose-600 mt-1">{formatCurrency(metrics.disputedPaymentsValue)}</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Disputed milestone claims</p>
                </div>
                <div className="bg-rose-50 p-2.5 rounded-xl text-rose-600">
                  <AlertTriangle className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Quick Draft Invoice Form Modal */}
            {isInvoiceFormOpen && (
              <div className="bg-white p-6 rounded-2xl border border-indigo-100 shadow-lg space-y-4 animate-fade-in">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <h4 className="text-xs font-extrabold text-slate-800 uppercase font-mono tracking-wider flex items-center space-x-1.5">
                    <FileText className="w-4 h-4 text-indigo-600" />
                    <span>Quick Issue Progress Valuation Invoice</span>
                  </h4>
                  <button 
                    type="button" 
                    onClick={() => setIsInvoiceFormOpen(false)} 
                    className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-50 transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleSaveDraftInvoice} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 uppercase font-bold">Target Project</label>
                      <select
                        required
                        value={invProjectId}
                        onChange={e => {
                          const pId = e.target.value;
                          setInvProjectId(pId);
                          const projMilestones = milestones.filter(m => m.projectId === pId);
                          setInvMilestoneId(projMilestones[0]?.id || '');

                          // Generate default invoice number template
                          const pCode = projects.find(p => p.id === pId)?.code || 'PROJ';
                          const cleanCode = pCode.split('-')[2] || pCode;
                          const count = invoices.filter(i => i.projectId === pId).length + 101;
                          setInvNumber(`WF-INV-${cleanCode}-${count}`);
                        }}
                        className="w-full border border-slate-200 rounded-lg p-2.5 text-xs mt-1 bg-white focus:ring-1 focus:ring-indigo-500 outline-none font-medium text-slate-700"
                      >
                        {projects.map(p => (
                          <option key={p.id} value={p.id}>[{p.code}] {p.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 uppercase font-bold">Valuated Milestone</label>
                      <select
                        required
                        value={invMilestoneId}
                        onChange={e => setInvMilestoneId(e.target.value)}
                        className="w-full border border-slate-200 rounded-lg p-2.5 text-xs mt-1 bg-white focus:ring-1 focus:ring-indigo-500 outline-none font-medium text-slate-700"
                      >
                        {milestones.filter(m => m.projectId === invProjectId).map(m => (
                          <option key={m.id} value={m.id}>{m.name} ({m.progress}% done)</option>
                        ))}
                        {milestones.filter(m => m.projectId === invProjectId).length === 0 && (
                          <option value="">No milestones registered</option>
                        )}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 uppercase font-bold">Invoice Reference Number</label>
                      <input
                        type="text"
                        required
                        value={invNumber}
                        onChange={e => setInvNumber(e.target.value)}
                        className="w-full border border-slate-200 rounded-lg p-2.5 text-xs mt-1 focus:ring-1 focus:ring-indigo-500 outline-none font-medium text-slate-700"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 uppercase font-bold">Net Base Claim (SAR)</label>
                      <input
                        type="number"
                        required
                        min="1"
                        value={invAmount}
                        onChange={e => {
                          const val = Number(e.target.value);
                          setInvAmount(val);
                          setInvVat(Math.round(val * 0.15));
                          setInvRetention(Math.round(val * 0.05));
                        }}
                        className="w-full border border-slate-200 rounded-lg p-2.5 text-xs mt-1 focus:ring-1 focus:ring-indigo-500 outline-none font-medium text-slate-700"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 uppercase font-bold">15% VAT Claim (SAR)</label>
                      <input
                        type="number"
                        value={invVat}
                        onChange={e => setInvVat(Number(e.target.value))}
                        className="w-full border border-slate-200 rounded-lg p-2.5 text-xs mt-1 focus:ring-1 focus:ring-indigo-500 outline-none font-medium text-slate-700"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 uppercase font-bold">Due Date</label>
                      <input
                        type="date"
                        value={invDueDate}
                        onChange={e => setInvDueDate(e.target.value)}
                        className="w-full border border-slate-200 rounded-lg p-2.5 text-xs mt-1 focus:ring-1 focus:ring-indigo-500 outline-none font-medium text-slate-700"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setIsInvoiceFormOpen(false)}
                      className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-50 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
                    >
                      Issue Draft Claim
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Creation / Editing Payment Form Modal */}
            {isPaymentFormOpen && (
              <div className="bg-white p-6 rounded-2xl border border-emerald-100 shadow-lg space-y-4 animate-fade-in">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <h4 className="text-xs font-extrabold text-slate-800 uppercase font-mono tracking-wider flex items-center space-x-1.5">
                    <CreditCard className="w-4 h-4 text-emerald-600" />
                    <span>{editingPayment ? `Edit Payment Receipt Details` : 'Record Payment Received'}</span>
                  </h4>
                  <button 
                    type="button" 
                    onClick={() => {
                      setIsPaymentFormOpen(false);
                      setEditingPayment(null);
                    }} 
                    className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-50 transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleSavePayment} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Project Selector */}
                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 uppercase font-bold">Target Project</label>
                      <select
                        required
                        disabled={!!editingPayment}
                        value={payProjectId}
                        onChange={e => {
                          const pId = e.target.value;
                          setPayProjectId(pId);
                          // Reset invoice options
                          const projInvs = invoices.filter(i => i.projectId === pId);
                          setPayInvoiceId(projInvs[0]?.id || '');
                          const projMils = milestones.filter(m => m.projectId === pId);
                          setPayMilestoneId(projMils[0]?.id || '');
                        }}
                        className="w-full border border-slate-200 rounded-lg p-2.5 text-xs mt-1 bg-white focus:ring-1 focus:ring-indigo-500 outline-none font-medium text-slate-700"
                      >
                        {projects.map(p => (
                          <option key={p.id} value={p.id}>[{p.code}] {p.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Linked Milestone */}
                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 uppercase font-bold">Linked Milestone</label>
                      <select
                        value={payMilestoneId}
                        onChange={e => setPayMilestoneId(e.target.value)}
                        className="w-full border border-slate-200 rounded-lg p-2.5 text-xs mt-1 bg-white focus:ring-1 focus:ring-indigo-500 outline-none font-medium text-slate-700"
                      >
                        <option value="">No linked milestone (General Deposit)</option>
                        {milestones.filter(m => m.projectId === payProjectId).map(m => (
                          <option key={m.id} value={m.id}>{m.name} ({m.progress}% done)</option>
                        ))}
                      </select>
                    </div>

                    {/* Linked Invoice */}
                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 uppercase font-bold">Linked Invoice claim</label>
                      <select
                        value={payInvoiceId}
                        onChange={e => {
                          const invId = e.target.value;
                          setPayInvoiceId(invId);
                          const matchedInv = invoices.find(i => i.id === invId);
                          if (matchedInv) {
                            const balance = matchedInv.totalAmount - (matchedInv.receivedAmount || 0);
                            setPayAmount(Math.max(0, balance));
                            if (matchedInv.milestoneId) {
                              setPayMilestoneId(matchedInv.milestoneId);
                            }
                          }
                        }}
                        className="w-full border border-slate-200 rounded-lg p-2.5 text-xs mt-1 bg-white focus:ring-1 focus:ring-indigo-500 outline-none font-medium text-slate-700"
                      >
                        <option value="">Unlinked collection payment</option>
                        {invoices.filter(i => i.projectId === payProjectId).map(i => {
                          const remaining = i.totalAmount - (i.receivedAmount || 0);
                          return (
                            <option key={i.id} value={i.id}>
                              {i.invoiceNumber} (Owed: {formatCurrency(remaining)})
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    {/* Payment received Date */}
                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 uppercase font-bold">Collection Date</label>
                      <input
                        type="date"
                        required
                        value={payDate}
                        onChange={e => setPayDate(e.target.value)}
                        className="w-full border border-slate-200 rounded-lg p-2.5 text-xs mt-1 focus:ring-1 focus:ring-indigo-500 outline-none font-medium text-slate-700"
                      />
                    </div>

                    {/* Payment status */}
                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 uppercase font-bold">Settlement Status</label>
                      <select
                        value={payStatus}
                        onChange={e => setPayStatus(e.target.value as any)}
                        className="w-full border border-slate-200 rounded-lg p-2.5 text-xs mt-1 bg-white focus:ring-1 focus:ring-indigo-500 outline-none font-medium text-slate-700"
                      >
                        <option value="cleared">Cleared & Available in Bank</option>
                        <option value="pending">Pending Settlement (In-Transit)</option>
                        <option value="disputed">Disputed / Under Audit</option>
                        <option value="cancelled">Cancelled / Bounced / Void</option>
                      </select>
                    </div>

                    {/* Collection Amount */}
                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 uppercase font-bold">Collected Amount Received (SAR)</label>
                      <input
                        type="number"
                        required
                        min="0"
                        placeholder="e.g. 150000"
                        value={payAmount}
                        onChange={e => setPayAmount(Number(e.target.value))}
                        className="w-full border border-slate-200 rounded-lg p-2.5 text-xs mt-1 focus:ring-1 focus:ring-indigo-500 outline-none font-medium text-slate-700 focus:outline-indigo-500"
                      />
                    </div>

                    {/* Payment Method */}
                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 uppercase font-bold">Payment Channel</label>
                      <select
                        value={payMethod}
                        onChange={e => setPayMethod(e.target.value)}
                        className="w-full border border-slate-200 rounded-lg p-2.5 text-xs mt-1 bg-white focus:ring-1 focus:ring-indigo-500 outline-none font-medium text-slate-700"
                      >
                        <option value="Bank Transfer">SADAD Bank Wire Transfer</option>
                        <option value="Cash">Cash Receipt Voucher</option>
                      </select>
                    </div>

                    {/* Bank Wire reference */}
                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-mono text-slate-400 uppercase font-bold">Bank reference/Check # / Receipt info</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. WIRE-SA-901827 or Check #109283"
                        value={payBankRef}
                        onChange={e => setPayBankRef(e.target.value)}
                        className="w-full border border-slate-200 rounded-lg p-2.5 text-xs mt-1 focus:ring-1 focus:ring-indigo-500 outline-none font-medium text-slate-700"
                      />
                    </div>
                  </div>

                  {/* Drag and Drop attachments inside Payment Form */}
                  <div className="space-y-2 pt-2">
                    <span className="block text-[10px] font-mono text-slate-400 uppercase font-bold">Payment Certificates & Client Proof Docs</span>
                    <div 
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className={`border-2 border-dashed rounded-xl p-6 text-center transition ${
                        isDragging ? 'border-emerald-500 bg-emerald-50/20' : 'border-slate-200 hover:border-emerald-400 hover:bg-slate-50/50'
                      }`}
                    >
                      <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                      <p className="text-xs font-semibold text-slate-700">Drag bank wire confirmations, check photos, or deposit slips here</p>
                      <p className="text-[10px] text-slate-400 mt-1">Accepts PDF, JPG, PNG up to 10MB each</p>
                      <input 
                        type="file" 
                        multiple 
                        id="form-pay-files"
                        className="hidden" 
                        onChange={handleFileChange}
                      />
                      <label 
                        htmlFor="form-pay-files"
                        className="inline-flex mt-3 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 rounded-lg text-[11px] font-bold cursor-pointer transition"
                      >
                        Choose Local Documents
                      </label>
                    </div>

                    {/* Form Draft Attachments list */}
                    {draftAttachments.length > 0 && (
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 space-y-1">
                        <span className="text-[9px] font-mono font-bold text-slate-400 uppercase block">Pending file additions ({draftAttachments.length})</span>
                        <div className="max-h-32 overflow-y-auto space-y-1.5">
                          {draftAttachments.map((att, index) => (
                            <div key={index} className="flex items-center justify-between text-xs bg-white p-2 rounded-lg border border-slate-200/60 shadow-2xs">
                              <div className="flex items-center space-x-2 truncate">
                                <Paperclip className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span className="font-medium text-slate-700 truncate">{att.name}</span>
                                <span className="text-[9px] text-slate-400 font-mono">({att.size})</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveDraftAttachment(index)}
                                className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 p-1 rounded-lg transition shrink-0"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end space-x-2 pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => {
                        setIsPaymentFormOpen(false);
                        setEditingPayment(null);
                      }}
                      className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-50 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
                    >
                      {editingPayment ? 'Save Inflow Receipts' : 'Record Collection Received'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Grid & Detail Panel block */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              
              {/* Receipts lists card (Left 2 columns on large screens) */}
              <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900">Payments Receipts Ledger</h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">Showing {selectedPaymentsList.length} verified client wire claims & cash inflows</p>
                  </div>
                </div>

                <div className="divide-y divide-slate-100">
                  {selectedPaymentsList.length === 0 ? (
                    <div className="p-12 text-center text-slate-400 text-xs italic">
                      <CreditCard className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                      No receipts matched the selection or search filters.
                    </div>
                  ) : (
                    selectedPaymentsList.map(p => {
                      const isSelected = selectedPaymentId === p.id;
                      const proj = getProjectInfo(p.projectId);
                      const statusAttr = getStatusLabel(p.status);
                      const hasAttachments = p.attachments && p.attachments.length > 0;
                      const commentsCount = p.comments ? p.comments.length : 0;

                      return (
                        <div
                          key={p.id}
                          onClick={() => setSelectedPaymentId(p.id)}
                          className={`p-4 transition-all hover:bg-slate-50/80 cursor-pointer flex items-start gap-4 ${
                            isSelected ? 'bg-indigo-50/50 border-l-4 border-emerald-500' : 'border-l-4 border-transparent'
                          }`}
                        >
                          <div className="bg-emerald-100/50 p-2.5 rounded-xl text-emerald-600 border border-emerald-100 shrink-0 mt-0.5">
                            <CreditCard className="w-5 h-5" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5">
                              <div className="flex items-center space-x-2 flex-wrap">
                                <span className="text-[10px] font-mono font-extrabold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded uppercase border border-indigo-100/50">
                                  {proj.code}
                                </span>
                                <h4 className="text-xs font-extrabold text-slate-800 truncate">
                                  Wire Ref: {p.bankRef}
                                </h4>
                              </div>
                              <span className="text-xs font-black text-emerald-600 font-mono bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md">
                                {formatCurrency(p.amount)}
                              </span>
                            </div>

                            <p className="text-[11px] font-medium text-slate-500 mt-1">
                              {p.invoiceNumber ? (
                                <span>Tied to Invoice: <strong className="text-slate-700">{p.invoiceNumber}</strong></span>
                              ) : (
                                <span className="italic text-slate-400">Unlinked Collection Deposit</span>
                              )}
                              {p.milestoneName && (
                                <span className="block text-[10px] text-slate-400 mt-0.5 truncate">
                                  Milestone: <strong className="text-slate-600">{p.milestoneName}</strong>
                                </span>
                              )}
                            </p>

                            {/* Additional metadata tags row */}
                            <div className="flex items-center gap-2 mt-3 flex-wrap text-[10px]">
                              <span className={`px-2 py-0.5 rounded-full font-bold border text-[9px] ${statusAttr.style}`}>
                                {statusAttr.label}
                              </span>

                              <span className="text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded flex items-center font-semibold">
                                <Calendar className="w-3 h-3 mr-1 text-slate-500" />
                                {p.date}
                              </span>

                              <span className="text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded font-bold">
                                {p.paymentMethod}
                              </span>

                              {hasAttachments && (
                                <span className="text-slate-500 bg-emerald-50 border border-emerald-100 text-[9px] px-1.5 py-0.5 rounded flex items-center font-bold">
                                  <Paperclip className="w-3 h-3 mr-1 text-emerald-500" />
                                  {p.attachments?.length} attached files
                                </span>
                              )}

                              {commentsCount > 0 && (
                                <span className="text-indigo-600 bg-indigo-50 border border-indigo-100 text-[9px] px-1.5 py-0.5 rounded flex items-center font-bold">
                                  <MessageSquare className="w-3 h-3 mr-1 text-indigo-500" />
                                  {commentsCount} comments
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Quick management control actions */}
                          {canManagePayments && (
                            <div className="flex items-center space-x-1.5 shrink-0 self-start sm:self-center">
                              <button
                                onClick={(e) => handleOpenEditPayment(p, e)}
                                className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded-lg transition"
                                title="Edit receipt details"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={(e) => handleDeletePayment(p, e)}
                                className="p-1.5 hover:bg-rose-50 text-rose-500 hover:text-rose-700 rounded-lg transition"
                                title="Delete receipt"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* 3. DETAILS EXPANSION SIDE PANEL (Comments, Audit, Files) */}
              <div id="payment-receipt-detail-drawer" className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-6">
                {selectedPayment ? (
                  <>
                    {/* Active Payment general Header info */}
                    <div className="border-b border-slate-100 pb-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded uppercase border border-indigo-100/50">
                          {getProjectInfo(selectedPayment.projectId).code}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full font-bold border text-[9px] ${getStatusLabel(selectedPayment.status).style}`}>
                          {getStatusLabel(selectedPayment.status).label}
                        </span>
                      </div>

                      <div>
                        <h4 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest">Transaction reference</h4>
                        <p className="text-sm font-extrabold text-slate-800 mt-1">{selectedPayment.bankRef}</p>
                      </div>

                      <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-150/60">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 block uppercase font-mono">Net Collection Value</span>
                          <span className="text-base font-extrabold text-emerald-600 font-mono">{formatCurrency(selectedPayment.amount)}</span>
                        </div>
                        <button
                          onClick={() => handleExportPaymentVoucher(selectedPayment)}
                          className="p-2 hover:bg-slate-200 text-slate-500 hover:text-slate-800 rounded-lg transition border border-slate-200"
                          title="Download official receipt statement"
                        >
                          <FileDown className="w-4 h-4 text-slate-600" />
                        </button>
                      </div>

                      <div className="text-[11px] text-slate-500 space-y-1.5 pt-2">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Project:</span>
                          <span className="font-bold text-slate-700 max-w-[180px] truncate">{getProjectInfo(selectedPayment.projectId).name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Payment Channel:</span>
                          <span className="font-semibold text-slate-700">{selectedPayment.paymentMethod}</span>
                        </div>
                        {selectedPayment.invoiceNumber && (
                          <div className="flex justify-between">
                            <span className="text-slate-400">Invoice Reference:</span>
                            <span className="font-mono font-bold text-slate-700">{selectedPayment.invoiceNumber}</span>
                          </div>
                        )}
                        {selectedPayment.milestoneName && (
                          <div className="flex flex-col gap-0.5 border-t border-slate-100 pt-1">
                            <span className="text-slate-400">Linked Milestone claim:</span>
                            <span className="font-bold text-slate-600 block">{selectedPayment.milestoneName}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Files / Attachments Area */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <h4 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest flex items-center space-x-1.5">
                          <Paperclip className="w-3.5 h-3.5 text-slate-500" />
                          <span>Receipt Documents ({selectedPayment.attachments?.length || 0})</span>
                        </h4>
                      </div>

                      {/* File Upload Section inside Details sidebar */}
                      <form onSubmit={handleAddAttachment} className="grid grid-cols-3 gap-2">
                        <input
                          type="text"
                          required
                          placeholder="Document Title (e.g. wire_slip.pdf)"
                          value={newFileName}
                          onChange={e => setNewFileName(e.target.value)}
                          className="col-span-2 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-indigo-500 text-slate-700"
                        />
                        <button
                          type="submit"
                          className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold transition flex items-center justify-center border border-indigo-150 cursor-pointer"
                        >
                          <Plus className="w-4 h-4 mr-1 text-indigo-600" />
                          <span>Link</span>
                        </button>
                      </form>

                      {/* Render Linked documents list */}
                      <div className="space-y-1.5 max-h-40 overflow-y-auto">
                        {!selectedPayment.attachments || selectedPayment.attachments.length === 0 ? (
                          <div className="text-center py-4 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-[11px] text-slate-400 italic">
                            No physical files attached yet.
                          </div>
                        ) : (
                          selectedPayment.attachments.map((att, idx) => (
                            <div key={idx} className="flex items-center justify-between bg-slate-50 p-2 rounded-xl border border-slate-200/60 shadow-2xs">
                              <div className="flex items-center space-x-2 truncate">
                                <FileText className="w-3.5 h-3.5 text-indigo-600" />
                                <div className="truncate">
                                  <p className="text-xs font-semibold text-slate-700 truncate">{att.name}</p>
                                  <span className="text-[9px] text-slate-400 block font-mono">Size: {att.size} | {att.uploadedAt || 'Linked'}</span>
                                </div>
                              </div>
                              <button
                                onClick={() => {
                                  setPayments(prev => prev.map(p => {
                                    if (p.id === selectedPaymentId) {
                                      const nextAtts = p.attachments?.filter((_, i) => i !== idx) || [];
                                      return { ...p, attachments: nextAtts };
                                    }
                                    return p;
                                  }));
                                  onAddNotification('File link removed from transaction.', 'info');
                                }}
                                className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 p-1 rounded-lg transition shrink-0"
                                title="Remove document link"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Comments block */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest flex items-center space-x-1.5">
                        <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
                        <span>Clarification Notes ({selectedPayment.comments?.length || 0})</span>
                      </h4>

                      <form onSubmit={handleAddComment} className="space-y-2">
                        <textarea
                          placeholder="Type notes regarding bank clearance, hold reasons..."
                          rows={2}
                          value={newCommentText}
                          onChange={e => setNewCommentText(e.target.value)}
                          className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-indigo-500 outline-none text-slate-700"
                        />
                        <div className="flex justify-end">
                          <button
                            type="submit"
                            disabled={!newCommentText.trim()}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
                          >
                            Add Note
                          </button>
                        </div>
                      </form>

                      {/* Display comments stream */}
                      <div className="space-y-2 max-h-48 overflow-y-auto pt-1">
                        {!selectedPayment.comments || selectedPayment.comments.length === 0 ? (
                          <div className="text-center py-4 text-[11px] text-slate-400 italic">No notes posted yet.</div>
                        ) : (
                          [...selectedPayment.comments].reverse().map(comm => (
                            <div key={comm.id} className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 space-y-1">
                              <div className="flex justify-between items-center text-[10px]">
                                <span className="font-extrabold text-slate-700">{comm.user} <span className="font-mono text-[9px] text-slate-400 font-medium">({comm.role})</span></span>
                                <span className="text-slate-400 font-mono text-[9px]">{comm.date}</span>
                              </div>
                              <p className="text-xs text-slate-600 whitespace-pre-line">{comm.text}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Timeline Audits section */}
                    <div className="space-y-3 border-t border-slate-100 pt-4">
                      <h4 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest flex items-center space-x-1.5">
                        <History className="w-3.5 h-3.5 text-slate-500" />
                        <span>Updates History</span>
                      </h4>

                      <div className="space-y-2 max-h-36 overflow-y-auto">
                        {!selectedPayment.updates || selectedPayment.updates.length === 0 ? (
                          <div className="text-slate-400 text-[10px] italic">Initial creation log omitted.</div>
                        ) : (
                          selectedPayment.updates.map(upd => (
                            <div key={upd.id} className="flex gap-2 items-start text-[10px]">
                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1 shrink-0" />
                              <div>
                                <p className="text-slate-600 font-medium">{upd.text}</p>
                                <span className="text-slate-400 font-mono">{upd.date} - {upd.user}</span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="py-20 text-center text-slate-400 text-xs italic">
                    <Layers className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    Select a payment transaction to expand digital slips, post clarification notes, and view the audit history timelines.
                  </div>
                )}
              </div>

            </div>

          </div>
        </div>

      </div>

    </div>
  );
}
