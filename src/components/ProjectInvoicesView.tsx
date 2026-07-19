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
  Tag,
  CreditCard,
  Percent,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { Project, Invoice, Payment, Milestone, User, Comment, getVatAppliedAmount, getInvoiceDisplayValues } from '../types';
import { jsPDF } from 'jspdf';

interface ProjectInvoicesViewProps {
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

export default function ProjectInvoicesView({
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
}: ProjectInvoicesViewProps) {
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [projectSearchQuery, setProjectSearchQuery] = useState('');
  const [invoiceSearchQuery, setInvoiceSearchQuery] = useState('');
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);

  // Filters state
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterMilestone, setFilterMilestone] = useState<string>('all');

  // Modal / Form States
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [isInvoiceFormOpen, setIsInvoiceFormOpen] = useState(false);
  const [isPaymentFormOpen, setIsPaymentFormOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);

  // Invoice Form Fields
  const [invProjectId, setInvProjectId] = useState('');
  const [invMilestoneId, setInvMilestoneId] = useState('');
  const [invNumber, setInvNumber] = useState('');
  const [invAmount, setInvAmount] = useState<number>(0);
  const [invVat, setInvVat] = useState<number>(0);
  const [invRetention, setInvRetention] = useState<number>(0);
  const [invDueDate, setInvDueDate] = useState('');
  const [invStatus, setInvStatus] = useState<Invoice['status']>('draft');
  const [invAttachedFile, setInvAttachedFile] = useState('');

  // Payment Form Fields
  const [payInvoiceId, setPayInvoiceId] = useState('');
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payDate, setPayDate] = useState('');
  const [payMethod, setPayMethod] = useState<'Cash' | 'Bank Transfer'>('Bank Transfer');
  const [payBankRef, setPayBankRef] = useState('');

  // Comments & Attachments additions in details panel / form
  const [newCommentText, setNewCommentText] = useState('');
  const [newFileName, setNewFileName] = useState('');
  const [newFileSize, setNewFileSize] = useState('');

  // Draft file attachments for creation/editing form
  const [draftAttachments, setDraftAttachments] = useState<{ name: string; size: string; uploadedAt?: string }[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  // Authorization checks
  const canManageInvoices = useMemo(() => {
    return currentUser.role === 'General Manager' || 
           currentUser.role === 'Project Manager' || 
           currentUser.role === 'Admin' || 
           currentUser.role === 'Super Admin' ||
           currentUser.role === 'Finance Manager' ||
           currentUser.role === 'Accountant';
  }, [currentUser]);

  // Selected invoice memoized
  const selectedInvoice = useMemo(() => {
    return invoices.find(i => i.id === selectedInvoiceId) || null;
  }, [invoices, selectedInvoiceId]);

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

  // Milestones available for the selected project
  const activeProjectMilestones = useMemo(() => {
    if (selectedProjectId === 'all') return milestones;
    return milestones.filter(m => m.projectId === selectedProjectId);
  }, [milestones, selectedProjectId]);

  // Invoices for the active selection
  const selectedInvoicesList = useMemo(() => {
    let list = invoices;
    if (selectedProjectId !== 'all') {
      list = list.filter(i => i.projectId === selectedProjectId);
    }
    if (filterStatus !== 'all') {
      list = list.filter(i => i.status === filterStatus);
    }
    if (filterMilestone !== 'all') {
      list = list.filter(i => i.milestoneId === filterMilestone);
    }
    if (invoiceSearchQuery.trim()) {
      const q = invoiceSearchQuery.toLowerCase();
      list = list.filter(i => 
        i.invoiceNumber.toLowerCase().includes(q) || 
        i.milestoneName.toLowerCase().includes(q) ||
        (i.id && i.id.toLowerCase().includes(q))
      );
    }
    return list;
  }, [invoices, selectedProjectId, filterStatus, filterMilestone, invoiceSearchQuery]);

  // Payments for the selected invoice
  const selectedInvoicePayments = useMemo(() => {
    if (!selectedInvoiceId) return [];
    return payments.filter(p => p.invoiceId === selectedInvoiceId);
  }, [payments, selectedInvoiceId]);

  // Financial Summary Metrics
  const metrics = useMemo(() => {
    const list = selectedInvoicesList;
    const totalCount = list.length;
    
    // Total gross invoiced (totalAmount)
    const totalInvoiced = list.reduce((sum, i) => sum + getInvoiceDisplayValues(i).totalAmount, 0);
    
    // Total collections received
    const totalCollected = list.reduce((sum, i) => sum + (i.receivedAmount || 0), 0);
    
    // Outstanding unpaid balance
    const outstandingUnpaid = Math.max(0, totalInvoiced - totalCollected);
    
    // Counts by status
    const submittedCount = list.filter(i => i.status === 'submitted').length;
    const approvedCount = list.filter(i => i.status === 'approved').length;
    const paidCount = list.filter(i => i.status === 'paid' || i.status === 'partially_paid').length;
    const draftCount = list.filter(i => i.status === 'draft').length;

    return {
      totalCount,
      totalInvoiced,
      totalCollected,
      outstandingUnpaid,
      submittedCount,
      approvedCount,
      paidCount,
      draftCount
    };
  }, [selectedInvoicesList]);

  // Helper: Project metadata
  const getProjectInfo = (pId: string) => {
    return projects.find(p => p.id === pId) || { name: 'Unknown Project', code: 'PROJ-XXX', clientName: 'N/A' };
  };

  // Open Add Invoice Form
  const handleOpenAddInvoice = () => {
    if (!canManageInvoices) {
      onAddNotification('Unauthorized: Your role does not allow issuing valuation invoices.', 'alert');
      return;
    }
    setEditingInvoice(null);
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
    setInvAttachedFile('');
    setDraftAttachments([]);
    setIsInvoiceFormOpen(true);
  };

  // Open Edit Invoice Form
  const handleOpenEditInvoice = (inv: Invoice, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!canManageInvoices) {
      onAddNotification('Unauthorized: Your role does not allow modifying invoices.', 'alert');
      return;
    }
    setEditingInvoice(inv);
    setInvProjectId(inv.projectId);
    setInvMilestoneId(inv.milestoneId);
    setInvNumber(inv.invoiceNumber);
    setInvAmount(inv.amount);
    setInvVat(inv.vat);
    setInvRetention(inv.retention);
    setInvDueDate(inv.dueDate);
    setInvStatus(inv.status);
    setInvAttachedFile(inv.attachedInvoiceFile || '');
    setDraftAttachments(inv.attachments || []);
    setIsInvoiceFormOpen(true);
  };

  // Open Log Payment Form
  const handleOpenAddPayment = () => {
    if (!canManageInvoices) {
      onAddNotification('Unauthorized: Your role does not allow logging client collections.', 'alert');
      return;
    }
    
    // Choose first invoice with an unpaid balance
    const eligibleInvoices = invoices.filter(i => 
      i.status !== 'paid' && 
      (selectedProjectId === 'all' || i.projectId === selectedProjectId)
    );

    if (eligibleInvoices.length === 0) {
      onAddNotification('There are no outstanding invoices awaiting collections.', 'warning');
      return;
    }

    const firstEligible = eligibleInvoices[0];
    setPayInvoiceId(firstEligible.id);
    const balance = firstEligible.totalAmount - (firstEligible.receivedAmount || 0);
    setPayAmount(Math.max(0, balance));
    setPayDate(new Date().toISOString().slice(0, 10));
    setPayMethod('Bank Transfer');
    setPayBankRef('');
    setIsPaymentFormOpen(true);
  };

  // Open Log Payment Form SPECIFIC to an invoice
  const handleOpenPaymentForInvoice = (inv: Invoice, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!canManageInvoices) {
      onAddNotification('Unauthorized: Your role does not allow logging client collections.', 'alert');
      return;
    }
    const balance = inv.totalAmount - (inv.receivedAmount || 0);
    if (balance <= 0) {
      onAddNotification(`Invoice ${inv.invoiceNumber} is already fully collected/paid.`, 'info');
      return;
    }
    setPayInvoiceId(inv.id);
    setPayAmount(balance);
    setPayDate(new Date().toISOString().slice(0, 10));
    setPayMethod('Bank Transfer');
    setPayBankRef('');
    setIsPaymentFormOpen(true);
  };

  // Auto computations
  const handleAutoCalcInvoice = () => {
    const vatVal = Math.round(invAmount * 0.15); // Standard 15% KSA VAT
    const retentionVal = Math.round(invAmount * 0.05); // Typical 5% Retention held by clients
    setInvVat(vatVal);
    setInvRetention(retentionVal);
    onAddNotification('Re-computed 15% KSA VAT & standard 5% Client Retention.', 'info');
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
    onAddNotification(`Attached ${newAttachments.length} file(s) for the invoice draft.`, 'info');
  };

  const handleRemoveDraftAttachment = (idx: number) => {
    setDraftAttachments(prev => prev.filter((_, i) => i !== idx));
    onAddNotification('Attachment removed.', 'info');
  };

  // Save or update invoice
  const handleSaveInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageInvoices) return;

    if (!invNumber.trim()) {
      onAddNotification('Invoice Reference Number is required.', 'warning');
      return;
    }

    if (invAmount <= 0) {
      onAddNotification('Invoice net valuation must be greater than zero.', 'warning');
      return;
    }

    const milestoneSelected = milestones.find(m => m.id === invMilestoneId);
    const calculatedTotal = Number(invAmount) + Number(invVat) - Number(invRetention);

    if (editingInvoice) {
      setInvoices(prev => prev.map(item => {
        if (item.id === editingInvoice.id) {
          const statusChanged = item.status !== invStatus;
          const nextUpdates = [...(item.updates || [])];

          if (statusChanged) {
            nextUpdates.push({
              id: `inv_up_${Date.now()}`,
              user: currentUser.name,
              role: currentUser.role,
              text: `Invoice state transitioned from "${item.status}" to "${invStatus}".`,
              date: new Date().toISOString().replace('T', ' ').substring(0, 16)
            });
          }

          // Adjust received amount state depending on status
          let updatedReceivedAmount = item.receivedAmount || 0;
          if (invStatus === 'paid' && updatedReceivedAmount < calculatedTotal) {
            updatedReceivedAmount = calculatedTotal;
          }

          return {
            ...item,
            milestoneId: invMilestoneId,
            milestoneName: milestoneSelected ? milestoneSelected.name : 'Physical Milestone Valuation',
            invoiceNumber: invNumber.trim(),
            amount: Number(invAmount),
            vat: Number(invVat),
            retention: Number(invRetention),
            totalAmount: calculatedTotal,
            dueDate: invDueDate,
            status: invStatus,
            receivedAmount: updatedReceivedAmount,
            attachments: draftAttachments,
            updates: nextUpdates
          };
        }
        return item;
      }));

      onLogAudit(`Updated Valuation Invoice ${invNumber}`, 'Invoices', `${editingInvoice.totalAmount} SAR`, `${calculatedTotal} SAR`);
      onAddNotification(`Invoice ${invNumber} updated successfully.`, 'success');
    } else {
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
        dueDate: invDueDate,
        receivedAmount: invStatus === 'paid' ? calculatedTotal : 0,
        comments: [],
        attachments: draftAttachments,
        updates: [
          {
            id: `inv_up_${Date.now()}`,
            user: currentUser.name,
            role: currentUser.role,
            text: `Invoice initially drafted under status: "${invStatus}".`,
            date: new Date().toISOString().replace('T', ' ').substring(0, 16)
          }
        ]
      };

      setInvoices(prev => [...prev, newInv]);
      onLogAudit(`Created Progress Invoice ${newInv.invoiceNumber}`, 'Invoices', undefined, `${newInv.totalAmount} SAR`);
      onAddNotification(`Invoice ${newInv.invoiceNumber} logged under ID ${newInv.id}.`, 'success');
    }

    setIsInvoiceFormOpen(false);
    setEditingInvoice(null);
  };

  // Record Collection Payment (Partial or Full)
  const handleSavePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageInvoices) return;

    if (payAmount <= 0) {
      onAddNotification('Payment collection amount must be greater than zero.', 'warning');
      return;
    }

    const targetInvoice = invoices.find(i => i.id === payInvoiceId);
    if (!targetInvoice) {
      onAddNotification('Invoice not found.', 'alert');
      return;
    }

    const outstandingBalance = targetInvoice.totalAmount - (targetInvoice.receivedAmount || 0);
    if (payAmount > outstandingBalance + 1) { // small floating buffer
      if (!window.confirm(`The payment of ${formatCurrency(payAmount)} exceeds the outstanding unpaid balance of ${formatCurrency(outstandingBalance)}. Do you want to proceed and mark the invoice overpaid?`)) {
        return;
      }
    }

    const previousReceived = targetInvoice.receivedAmount || 0;
    const nextReceived = previousReceived + payAmount;
    const isFullyPaid = nextReceived >= targetInvoice.totalAmount;

    // Update Invoice status and received amount
    setInvoices(prev => prev.map(inv => {
      if (inv.id === targetInvoice.id) {
        const nextUpdates = [...(inv.updates || [])];
        nextUpdates.push({
          id: `inv_up_pay_${Date.now()}`,
          user: currentUser.name,
          role: currentUser.role,
          text: `Logged collection payment of ${formatCurrency(payAmount)}. New status: ${isFullyPaid ? 'Fully Paid' : 'Partially Paid'}.`,
          date: new Date().toISOString().replace('T', ' ').substring(0, 16)
        });

        return {
          ...inv,
          receivedAmount: nextReceived,
          status: isFullyPaid ? 'paid' : 'partially_paid',
          paymentDate: payDate,
          paymentMethod: payMethod,
          updates: nextUpdates
        };
      }
      return inv;
    }));

    // Create the new Payment receipt record
    const newPaymentReceipt: Payment = {
      id: `pay_${Date.now()}`,
      projectId: targetInvoice.projectId,
      invoiceId: targetInvoice.id,
      invoiceNumber: targetInvoice.invoiceNumber,
      amount: payAmount,
      date: payDate,
      bankRef: payMethod === 'Bank Transfer' ? (payBankRef || `REF-SA-${Date.now().toString().slice(-6)}`) : 'Cash Receipt In-Hand',
      paymentMethod: payMethod === 'Bank Transfer' ? 'SADAD Bank Transfer' : 'Cash Voucher'
    };

    setPayments(prev => [...prev, newPaymentReceipt]);
    onLogAudit(`Recorded Payment of ${payAmount} SAR for Invoice ${targetInvoice.invoiceNumber}`, 'Payments', undefined, `${payAmount} SAR`);
    onAddNotification(`Successfully recorded collection of ${formatCurrency(payAmount)} for Invoice ${targetInvoice.invoiceNumber}.`, 'success');
    
    setIsPaymentFormOpen(false);
  };

  // Delete invoice
  const handleDeleteInvoice = (inv: Invoice, e: React.MouseEvent) => {
    const userRoleStr = currentUser?.role?.toLowerCase() || '';
    if (userRoleStr !== 'admin' && userRoleStr !== 'super admin' && userRoleStr !== 'superadmin') {
      alert("Unauthorized: Only Admin or Super Admin can delete records.");
      return;
    }

    e.stopPropagation();
    if (!canManageInvoices) {
      onAddNotification('Unauthorized: Your role does not allow deleting invoices.', 'alert');
      return;
    }

    if (window.confirm(`Are you sure you want to permanently delete Progress Invoice "${inv.invoiceNumber}"? This will also disconnect associated payments.`)) {
      setInvoices(prev => prev.filter(item => item.id !== inv.id));
      setPayments(prev => prev.filter(p => p.invoiceId !== inv.id));
      if (selectedInvoiceId === inv.id) {
        setSelectedInvoiceId(null);
      }
      onLogAudit(`Deleted progress invoice ${inv.invoiceNumber}`, 'Invoices', `${inv.totalAmount} SAR`, undefined);
      onAddNotification(`Invoice ${inv.invoiceNumber} deleted successfully.`, 'success');
    }
  };

  // Add Comment
  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoiceId || !newCommentText.trim()) return;

    const nextComment: Comment = {
      id: `inv_comm_${Date.now()}`,
      user: currentUser.name,
      role: currentUser.role,
      text: newCommentText.trim(),
      date: new Date().toISOString().replace('T', ' ').substring(0, 16)
    };

    setInvoices(prev => prev.map(inv => {
      if (inv.id === selectedInvoiceId) {
        const nextComments = [...(inv.comments || []), nextComment];
        return { ...inv, comments: nextComments };
      }
      return inv;
    }));

    setNewCommentText('');
    onAddNotification('Comment logged successfully.', 'success');
  };

  // Upload/Add individual file in details panel
  const handleAddAttachment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoiceId || !newFileName.trim()) return;

    const nextAttachment = {
      name: newFileName.trim(),
      size: newFileSize.trim() || '1.8 MB',
      uploadedAt: new Date().toISOString().slice(0, 10)
    };

    setInvoices(prev => prev.map(inv => {
      if (inv.id === selectedInvoiceId) {
        const nextAttachments = [...(inv.attachments || []), nextAttachment];
        return { ...inv, attachments: nextAttachments };
      }
      return inv;
    }));

    setNewFileName('');
    setNewFileSize('');
    onAddNotification(`File "${nextAttachment.name}" successfully linked to the invoice.`, 'success');
  };

  const formatRawCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'SAR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatInvoiceValue = (invoice: Invoice, type: 'amount' | 'vat' | 'totalAmount') => {
    const displayVals = getInvoiceDisplayValues(invoice);
    return formatRawCurrency(displayVals[type]);
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

  // Status visual attributes
  const getStatusLabel = (status: Invoice['status']) => {
    switch (status) {
      case 'draft': return { label: 'Draft Progress Invoice', style: 'bg-slate-100 text-slate-700 border-slate-200' };
      case 'submitted': return { label: 'Submitted to Client', style: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
      case 'approved': return { label: 'Approved Valuation', style: 'bg-blue-50 text-blue-700 border-blue-200' };
      case 'rejected': return { label: 'Rejected Valuation', style: 'bg-rose-50 text-rose-700 border-rose-200' };
      case 'partially_paid': return { label: 'Partially Collected', style: 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse' };
      case 'paid': return { label: 'Fully Collected', style: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    }
  };

  // Export voucher as plain text / simulated PDF
  const handleExportInvoiceVoucher = (inv: Invoice) => {
    const proj = getProjectInfo(inv.projectId);
    const relatedPayments = payments.filter(p => p.invoiceId === inv.id);
    
    let paymentsSummary = relatedPayments.length > 0 
      ? relatedPayments.map((p, idx) => `   ${idx + 1}. [${p.date}] Amount Received: ${formatCurrency(p.amount)} | Reference: ${p.bankRef} (${p.paymentMethod})`).join('\n')
      : '   No payments/collections recorded yet.';

    const outstanding = Math.max(0, inv.totalAmount - (inv.receivedAmount || 0));

    const content = `
=====================================================================
                    OFFICIAL VALUATION PROGRESS INVOICE              
=====================================================================
Invoice Reference:  ${inv.invoiceNumber}
Invoicing Date:     ${inv.dateCreated}
Due Date:           ${inv.dueDate}
Project Identifier: ${proj.code}
Project Name:       ${proj.name}
Client Name:        ${proj.clientName}
Invoiced Milestone: ${inv.milestoneName}
Current Status:     ${inv.status.toUpperCase()}

---------------------------------------------------------------------
1. VALUATION SUMMARIES:
---------------------------------------------------------------------
Work Progress Net:    ${formatInvoiceValue(inv, 'amount')}
Standard KSA 15% VAT: ${formatInvoiceValue(inv, 'vat')}
Contractor Retention: - ${formatCurrency(inv.retention)} (5% Client Holdback)
---------------------------------------------------------------------
Total Gross Invoiced: ${formatInvoiceValue(inv, 'totalAmount')}

---------------------------------------------------------------------
2. COLLECTION & PAYMENT SUMMARY:
---------------------------------------------------------------------
Total Invoiced:       ${formatInvoiceValue(inv, 'totalAmount')}
Total Collected:      ${formatCurrency(inv.receivedAmount || 0)}
Outstanding Balance:  ${formatCurrency(outstanding)}

Detailed Payment Log:
${paymentsSummary}

---------------------------------------------------------------------
3. VERIFICATION & SIGN-OFF:
---------------------------------------------------------------------
Issuer Authorization:
Authorized by: ${currentUser.name} (${currentUser.role})
Verified via Electronic Signature

Financial Auditor Review:
Approval Release Date: ${inv.status === 'paid' ? inv.dueDate : 'In-Process'}
Registered with KSA ZATCA Tax Compliance Engine

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
    pdfDoc.save(`Invoice_${inv.invoiceNumber}_ZATCA_Audit.pdf`);

    onLogAudit(`Exported official invoice voucher ${inv.invoiceNumber}`, 'Invoices', undefined, inv.id);
    onAddNotification(`Invoice exported to compliant TXT format.`, 'success');
  };

  return (
    <div id="invoices-view-root" className="flex-1 flex flex-col h-full bg-slate-50 overflow-hidden">
      
      {/* Top Banner Context Section */}
      <div className="bg-white border-b border-slate-200 p-5 md:px-8 flex flex-col md:flex-row md:items-center md:justify-between shrink-0 gap-4">
        <div>
          <span className="text-xs font-mono font-bold text-indigo-600 uppercase tracking-widest block mb-1">Contract Billings & Collections</span>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Milestone Valuations & Invoices</h2>
          <p className="text-xs text-slate-500 mt-1">Submit milestone progress claims, track client certificates, monitor ZATCA tax liabilities, and manage full or partial collection payments.</p>
        </div>

        {/* TOP COMPREHENSIVE ACTIONS BAR */}
        <div className="flex items-center space-x-2 shrink-0">
          {canManageInvoices && (
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
                <CreditCard className="w-3.5 h-3.5" />
                <span>Record Client Payment</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Split Pane View */}
      <div className="flex-1 flex overflow-hidden min-h-0 w-full">
      
        {/* 1. LEFT SIDEBAR: Project Selector */}
        <div 
          id="invoices-project-sidebar" 
          className={`w-72 border-r border-slate-200 bg-white flex flex-col h-full shrink-0 transition-transform lg:translate-x-0 lg:relative lg:pointer-events-auto lg:z-10 ${
            mobileDetailOpen ? '-translate-x-full absolute pointer-events-none' : 'relative z-10'
          }`}
        >
          <div className="p-4 border-b border-slate-100 bg-slate-50/60">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-widest font-mono">Projects Directory</h2>
            <p className="text-[10px] text-slate-400 mt-1">Select project to view milestone claims</p>
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
                setFilterMilestone('all');
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
                <h4 className="text-xs font-bold text-slate-800">All Client Billings</h4>
                <p className="text-[10px] text-slate-400 mt-0.5">Corporate collections dashboard</p>
              </div>
            </button>

            {filteredProjects.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs italic">No projects found.</div>
            ) : (
              filteredProjects.map(p => {
                const isActive = selectedProjectId === p.id;
                const pInvoicesCount = invoices.filter(i => i.projectId === p.id).length;
                return (
                  <button
                    key={p.id}
                    onClick={() => {
                      setSelectedProjectId(p.id);
                      setFilterMilestone('all');
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
                        {pInvoicesCount} Claims
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
          id="invoices-data-viewport" 
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
                <FileText className="w-5 h-5" />
              </div>
              <div className="overflow-hidden">
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-mono font-extrabold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded uppercase">
                    {activeProject ? activeProject.code : 'GLOBAL'}
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 truncate">
                    {activeProject ? `${activeProject.name} - Billing Ledger` : 'Wafaq Enterprise Billing Registry'}
                  </h3>
                </div>
                <p className="text-[10px] text-slate-400 truncate mt-0.5">
                  {activeProject 
                    ? `Review progress-certificate valuations, retainage releases, and cash collection invoices for ${activeProject.name}.`
                    : 'A consolidated, real-time audit grid of all progress billings, tax receipts, and payment cycles.'
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
                  placeholder="Search by invoice #, milestone..."
                  value={invoiceSearchQuery}
                  onChange={e => setInvoiceSearchQuery(e.target.value)}
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
                    <option value="draft">Draft Invoice</option>
                    <option value="submitted">Submitted</option>
                    <option value="approved">Approved Valuation</option>
                    <option value="partially_paid">Partially Collected</option>
                    <option value="paid">Fully Collected</option>
                    <option value="rejected">Rejected / Void</option>
                  </select>
                </div>

                {/* Milestone Filter */}
                <div className="flex items-center space-x-1">
                  <span className="text-slate-400 font-mono text-[10px]">Milestone:</span>
                  <select
                    value={filterMilestone}
                    onChange={e => setFilterMilestone(e.target.value)}
                    className="border border-slate-200 rounded-lg bg-white p-1 text-[11px] focus:ring-1 focus:ring-indigo-500 outline-none max-w-[180px] truncate"
                  >
                    <option value="all">All Milestones</option>
                    {activeProjectMilestones.map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
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
                  <span className="text-[10px] font-mono text-slate-400 uppercase font-bold tracking-wider">Gross Invoiced Valuations</span>
                  <h4 className="text-lg font-extrabold text-slate-900 mt-1">{formatCurrency(metrics.totalInvoiced)}</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">{metrics.totalCount} valuation certificates</p>
                </div>
                <div className="bg-indigo-50 p-2.5 rounded-xl text-indigo-600">
                  <FileText className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase font-bold tracking-wider">Total Cash Collected</span>
                  <h4 className="text-lg font-extrabold text-emerald-600 mt-1">{formatCurrency(metrics.totalCollected)}</h4>
                  <p className="text-[10px] text-emerald-500 mt-0.5 font-semibold">
                    {metrics.totalInvoiced > 0 
                      ? `${((metrics.totalCollected / metrics.totalInvoiced) * 100).toFixed(1)}% liquidation rate`
                      : '0% liquidation'}
                  </p>
                </div>
                <div className="bg-emerald-50 p-2.5 rounded-xl text-emerald-600">
                  <CheckCircle className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase font-bold tracking-wider">Outstanding Receivables</span>
                  <h4 className="text-lg font-extrabold text-amber-600 mt-1">{formatCurrency(metrics.outstandingUnpaid)}</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Awaiting client release</p>
                </div>
                <div className="bg-amber-50 p-2.5 rounded-xl text-amber-600">
                  <Clock className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase font-bold tracking-wider">In-Review Pipelines</span>
                  <h4 className="text-lg font-extrabold text-slate-700 mt-1">{metrics.submittedCount + metrics.approvedCount} Certificates</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">{metrics.draftCount} drafts in ledger</p>
                </div>
                <div className="bg-slate-100 p-2.5 rounded-xl text-slate-600">
                  <History className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Creation / Editing Invoice Form Modal */}
            {isInvoiceFormOpen && (
              <div className="bg-white p-6 rounded-2xl border border-indigo-100 shadow-lg space-y-4 animate-fade-in">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <h4 className="text-xs font-extrabold text-slate-800 uppercase font-mono tracking-wider flex items-center space-x-1.5">
                    <FileText className="w-4 h-4 text-indigo-600" />
                    <span>{editingInvoice ? `Edit Valuation Progress Invoice - ${editingInvoice.invoiceNumber}` : 'Draft Progress Milestone Invoice'}</span>
                  </h4>
                  <button 
                    type="button" 
                    onClick={() => {
                      setIsInvoiceFormOpen(false);
                      setEditingInvoice(null);
                    }} 
                    className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-50 transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleSaveInvoice} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Project Selector */}
                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 uppercase font-bold">Target Project</label>
                      <select
                        required
                        disabled={!!editingInvoice}
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

                    {/* Milestone Selector */}
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

                    {/* Due Date */}
                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 uppercase font-bold">Payment Due Date</label>
                      <input
                        type="date"
                        required
                        value={invDueDate}
                        onChange={e => setInvDueDate(e.target.value)}
                        className="w-full border border-slate-200 rounded-lg p-2.5 text-xs mt-1 focus:ring-1 focus:ring-indigo-500 outline-none font-medium text-slate-700"
                      />
                    </div>

                    {/* Invoice Reference Number */}
                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 uppercase font-bold">Invoice Number (ZATCA Format)</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. WF-INV-MALQA-101"
                        value={invNumber}
                        onChange={e => setInvNumber(e.target.value)}
                        className="w-full border border-slate-200 rounded-lg p-2.5 text-xs mt-1 focus:ring-1 focus:ring-indigo-500 outline-none font-medium text-slate-700"
                      />
                    </div>

                    {/* Status */}
                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 uppercase font-bold">Billing Status</label>
                      <select
                        value={invStatus}
                        onChange={e => setInvStatus(e.target.value as any)}
                        className="w-full border border-slate-200 rounded-lg p-2.5 text-xs mt-1 bg-white focus:ring-1 focus:ring-indigo-500 outline-none font-medium text-slate-700"
                      >
                        <option value="draft">Draft Progress Voucher</option>
                        <option value="submitted">Submitted Valuation Certificate</option>
                        <option value="approved">Approved Progress Valuation</option>
                        <option value="partially_paid">Partially Paid / Collected</option>
                        <option value="paid">Fully Paid / Cleared</option>
                        <option value="rejected">Rejected / Disputed Claim</option>
                      </select>
                    </div>

                    {/* Gross Base Claim Amount */}
                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 uppercase font-bold">Net Base Valuation (SAR - Excl. VAT)</label>
                      <input
                        type="number"
                        required
                        min="0"
                        placeholder="e.g. 500000"
                        value={invAmount}
                        onChange={e => setInvAmount(Number(e.target.value))}
                        className="w-full border border-slate-200 rounded-lg p-2.5 text-xs mt-1 focus:ring-1 focus:ring-indigo-500 outline-none font-medium text-slate-700"
                      />
                    </div>

                    {/* VAT Amount (15%) */}
                    <div>
                      <div className="flex justify-between items-center">
                        <label className="block text-[10px] font-mono text-slate-400 uppercase font-bold">VAT (SAR - 15%)</label>
                        <button
                          type="button"
                          onClick={handleAutoCalcInvoice}
                          className="text-[9px] font-bold text-indigo-600 hover:text-indigo-800 hover:underline"
                        >
                          Auto Compute 15%
                        </button>
                      </div>
                      <input
                        type="number"
                        min="0"
                        placeholder="e.g. 75000"
                        value={invVat}
                        onChange={e => setInvVat(Number(e.target.value))}
                        className="w-full border border-slate-200 rounded-lg p-2.5 text-xs mt-1 focus:ring-1 focus:ring-indigo-500 outline-none font-medium text-slate-700"
                      />
                    </div>

                    {/* Retention held by client (5%) */}
                    <div>
                      <div className="flex justify-between items-center">
                        <label className="block text-[10px] font-mono text-slate-400 uppercase font-bold">Client Retention Hold (SAR - 5%)</label>
                      </div>
                      <input
                        type="number"
                        min="0"
                        placeholder="e.g. 25000"
                        value={invRetention}
                        onChange={e => setInvRetention(Number(e.target.value))}
                        className="w-full border border-slate-200 rounded-lg p-2.5 text-xs mt-1 focus:ring-1 focus:ring-indigo-500 outline-none font-medium text-slate-700"
                      />
                    </div>

                    {/* Total billing (calculated) */}
                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 uppercase font-bold">Calculated ZATCA Net Invoiced (SAR)</label>
                      <input
                        type="text"
                        disabled
                        value={formatCurrency(Number(invAmount) + Number(invVat) - Number(invRetention))}
                        className="w-full border border-slate-200 rounded-lg p-2.5 text-xs mt-1 bg-slate-50 font-bold text-slate-800"
                      />
                    </div>

                    {/* Drag and Drop Attachments section */}
                    <div className="md:col-span-3">
                      <label className="block text-[10px] font-mono text-slate-400 uppercase font-bold mb-1">Supporting Progress Measurement Sheet / PDF Invoice</label>
                      
                      <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => document.getElementById('invoice-form-file-input')?.click()}
                        className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center ${
                          isDragging 
                            ? 'border-indigo-500 bg-indigo-50/50 scale-[1.01]' 
                            : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300'
                        }`}
                      >
                        <input
                          id="invoice-form-file-input"
                          type="file"
                          multiple
                          onChange={handleFileChange}
                          className="hidden"
                        />
                        <Upload className={`w-8 h-8 mb-2 transition-transform duration-200 ${isDragging ? 'text-indigo-600 scale-110' : 'text-slate-400'}`} />
                        <span className="text-xs font-semibold text-slate-700">
                          {isDragging ? 'Drop files here!' : 'Drag & drop progress sheets / certificates here, or click to browse'}
                        </span>
                        <span className="text-[10px] text-slate-400 mt-1">
                          Supports PDF, Excel, JPG, CAD drawings (Max 25MB)
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
                        setIsInvoiceFormOpen(false);
                        setEditingInvoice(null);
                      }} 
                      className="text-xs text-slate-500 font-bold px-3.5 py-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1.5 rounded-lg text-xs font-bold transition shadow-xs cursor-pointer"
                    >
                      {editingInvoice ? 'Apply Changes' : 'Record Progress Claim'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Creation Payment Form Modal */}
            {isPaymentFormOpen && (
              <div className="bg-white p-6 rounded-2xl border border-emerald-100 shadow-lg space-y-4 animate-fade-in max-w-2xl mx-auto">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <h4 className="text-xs font-extrabold text-slate-800 uppercase font-mono tracking-wider flex items-center space-x-1.5">
                    <CreditCard className="w-4 h-4 text-emerald-600" />
                    <span>Record Client Collection Payment Receipt</span>
                  </h4>
                  <button 
                    type="button" 
                    onClick={() => setIsPaymentFormOpen(false)} 
                    className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-50 transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleSavePayment} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Invoice Selector */}
                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-mono text-slate-400 uppercase font-bold">Select Unpaid Target Invoice</label>
                      <select
                        required
                        value={payInvoiceId}
                        onChange={e => {
                          const invId = e.target.value;
                          setPayInvoiceId(invId);
                          const target = invoices.find(i => i.id === invId);
                          if (target) {
                            const displayTotal = getInvoiceDisplayValues(target).totalAmount;
                            const balance = displayTotal - (target.receivedAmount || 0);
                            setPayAmount(Math.max(0, balance));
                          }
                        }}
                        className="w-full border border-slate-200 rounded-lg p-2.5 text-xs mt-1 bg-white focus:ring-1 focus:ring-indigo-500 outline-none font-medium text-slate-700"
                      >
                        {invoices.filter(i => i.status !== 'paid' && (selectedProjectId === 'all' || i.projectId === selectedProjectId)).map(i => {
                          const displayTotal = getInvoiceDisplayValues(i).totalAmount;
                          const outstanding = displayTotal - (i.receivedAmount || 0);
                          const proj = getProjectInfo(i.projectId);
                          return (
                            <option key={i.id} value={i.id}>
                              [{proj.code}] {i.invoiceNumber} - Unpaid: {formatRawCurrency(outstanding)} (Total: {formatInvoiceValue(i, 'totalAmount')})
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    {/* Amount Received */}
                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 uppercase font-bold">Collection Payment Amount (SAR)</label>
                      <input
                        type="number"
                        required
                        min="1"
                        placeholder="e.g. 100000"
                        value={payAmount}
                        onChange={e => setPayAmount(Number(e.target.value))}
                        className="w-full border border-slate-200 rounded-lg p-2.5 text-xs mt-1 focus:ring-1 focus:ring-indigo-500 outline-none font-medium text-slate-700"
                      />
                    </div>

                    {/* Date Received */}
                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 uppercase font-bold">Date Received / Deposited</label>
                      <input
                        type="date"
                        required
                        value={payDate}
                        onChange={e => setPayDate(e.target.value)}
                        className="w-full border border-slate-200 rounded-lg p-2.5 text-xs mt-1 focus:ring-1 focus:ring-indigo-500 outline-none font-medium text-slate-700"
                      />
                    </div>

                    {/* Payment Method */}
                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 uppercase font-bold">Payment Method</label>
                      <select
                        value={payMethod}
                        onChange={e => setPayMethod(e.target.value as any)}
                        className="w-full border border-slate-200 rounded-lg p-2.5 text-xs mt-1 bg-white focus:ring-1 focus:ring-indigo-500 outline-none font-medium text-slate-700"
                      >
                        <option value="Bank Transfer">Wire / SADAD Bank Transfer</option>
                        <option value="Cash">Cash Ledger Office Receipt</option>
                      </select>
                    </div>

                    {/* Reference Info */}
                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 uppercase font-bold">Bank Reference # / Cash Slip ID</label>
                      <input
                        type="text"
                        placeholder={payMethod === 'Bank Transfer' ? 'e.g. TXN-92138012' : 'e.g. CASH-V-503'}
                        value={payBankRef}
                        onChange={e => setPayBankRef(e.target.value)}
                        className="w-full border border-slate-200 rounded-lg p-2.5 text-xs mt-1 focus:ring-1 focus:ring-indigo-500 outline-none font-medium text-slate-700"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                    <button 
                      type="button" 
                      onClick={() => setIsPaymentFormOpen(false)} 
                      className="text-xs text-slate-500 font-bold px-3.5 py-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-1.5 rounded-lg text-xs font-bold transition shadow-xs cursor-pointer"
                    >
                      Record Payment Receipt
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Invoices Card Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {selectedInvoicesList.map((inv) => {
                const proj = getProjectInfo(inv.projectId);
                const statusInfo = getStatusLabel(inv.status);
                const displayTotal = getInvoiceDisplayValues(inv).totalAmount;
                const outstanding = Math.max(0, displayTotal - (inv.receivedAmount || 0));
                
                return (
                  <div 
                    key={inv.id} 
                    onClick={() => setSelectedInvoiceId(inv.id)}
                    className={`bg-white p-5 rounded-2xl border hover:shadow-md transition-all duration-200 flex flex-col justify-between group relative cursor-pointer ${
                      selectedInvoiceId === inv.id 
                        ? 'border-indigo-500 ring-1 ring-indigo-500/5 shadow-xs' 
                        : 'border-slate-200/85 shadow-xs'
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1 max-w-[65%]">
                          <span className="inline-block text-[8px] font-mono font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded uppercase">
                            {proj.code}
                          </span>
                          <span className="ml-1 inline-block text-[9px] font-mono text-slate-400 font-semibold">
                            {inv.id}
                          </span>
                          <h4 className="font-extrabold text-xs text-slate-800 line-clamp-1 group-hover:text-indigo-600 transition-colors">
                            {inv.invoiceNumber}
                          </h4>
                          <span className="inline-flex items-center space-x-1 text-[9px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded font-mono font-medium mt-1">
                            <Layers className="w-2.5 h-2.5" />
                            <span className="truncate max-w-[120px]">{inv.milestoneName}</span>
                          </span>
                        </div>

                        <div className="flex flex-col items-end space-y-1 shrink-0">
                          <span className={`px-2 py-0.5 rounded text-[8px] font-mono font-extrabold uppercase border ${statusInfo.style}`}>
                            {statusInfo.label}
                          </span>
                        </div>
                      </div>

                      {/* Display Client Meta info */}
                      <p className="text-[10px] text-slate-500 mt-1">
                        Client: <span className="font-semibold text-slate-700">{proj.clientName}</span>
                      </p>
                    </div>

                    {/* Financial details inside card */}
                    <div className="grid grid-cols-3 gap-2 my-3.5 p-2 bg-slate-50 rounded-xl border border-slate-100">
                      <div>
                        <span className="text-[8px] font-mono text-slate-400 block">TOTAL VALUE</span>
                        <span className="text-[10px] font-extrabold text-slate-800">{formatInvoiceValue(inv, 'totalAmount')}</span>
                      </div>
                      <div>
                        <span className="text-[8px] font-mono text-slate-400 block">COLLECTED</span>
                        <span className="text-[10px] font-extrabold text-emerald-600">{formatRawCurrency(inv.receivedAmount || 0)}</span>
                      </div>
                      <div>
                        <span className="text-[8px] font-mono text-slate-400 block">UNPAID BAL</span>
                        <span className={`text-[10px] font-extrabold ${outstanding > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
                          {formatRawCurrency(outstanding)}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2 pt-2.5 border-t border-slate-50 mt-2">
                      <div className="flex justify-between items-center text-[9px] font-mono text-slate-400">
                        <span>Created: {inv.dateCreated}</span>
                        <span>Due: {inv.dueDate}</span>
                      </div>

                      <div className="flex justify-between items-center pt-1.5">
                        <div className="flex space-x-2">
                          <span className="text-[9px] text-slate-400 flex items-center space-x-0.5">
                            <MessageSquare className="w-3 h-3" />
                            <span>{inv.comments?.length || 0}</span>
                          </span>
                          <span className="text-[9px] text-slate-400 flex items-center space-x-0.5">
                            <Paperclip className="w-3 h-3" />
                            <span>{(inv.attachments?.length || 0) + (inv.attachedInvoiceFile ? 1 : 0)}</span>
                          </span>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center space-x-1 opacity-80 group-hover:opacity-100 transition">
                          <button
                            title="Export Audit Voucher"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleExportInvoiceVoucher(inv);
                            }}
                            className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-md"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>

                          {canManageInvoices && (
                            <>
                              {outstanding > 0 && (
                                <button
                                  title="Log Payment Receipt"
                                  onClick={(e) => handleOpenPaymentForInvoice(inv, e)}
                                  className="p-1 text-slate-400 hover:text-emerald-600 hover:bg-slate-100 rounded-md"
                                >
                                  <CreditCard className="w-3.5 h-3.5" />
                                </button>
                              )}
                              <button
                                title="Edit Invoice Details"
                                onClick={(e) => handleOpenEditInvoice(inv, e)}
                                className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-md"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                title="Delete Invoice"
                                onClick={(e) => handleDeleteInvoice(inv, e)}
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-md"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {selectedInvoicesList.length === 0 && (
                <div className="col-span-full bg-white border border-slate-200/60 p-12 text-center rounded-2xl">
                  <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <h3 className="text-sm font-bold text-slate-700">No milestone claims found</h3>
                  <p className="text-xs text-slate-400 mt-1">There are no invoices Matching your current search/filter combination.</p>
                  {canManageInvoices && (
                    <button
                      onClick={handleOpenAddInvoice}
                      className="mt-4 inline-flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Draft First Progress Invoice</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Selected Invoice Full Detail Section (Double drawer pattern) */}
            {selectedInvoice && (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
                
                {/* Panel 1: Invoice metadata overview */}
                <div className="lg:border-r lg:border-slate-100 lg:pr-6 space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-mono text-slate-400 font-extrabold block">INVOICE IDENTITY</span>
                      <h3 className="text-base font-extrabold text-slate-950 mt-0.5">{selectedInvoice.invoiceNumber}</h3>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">DB Unique ID: {selectedInvoice.id}</p>
                    </div>
                    <button
                      onClick={() => setSelectedInvoiceId(null)}
                      className="p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-lg"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1.5 border-b border-slate-50">
                      <span className="text-slate-400">Project:</span>
                      <span className="font-semibold text-slate-700 text-right truncate max-w-[150px]" title={getProjectInfo(selectedInvoice.projectId).name}>
                        {getProjectInfo(selectedInvoice.projectId).name}
                      </span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-50">
                      <span className="text-slate-400">Milestone:</span>
                      <span className="font-semibold text-slate-700 text-right truncate max-w-[150px]" title={selectedInvoice.milestoneName}>
                        {selectedInvoice.milestoneName}
                      </span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-50">
                      <span className="text-slate-400">Issue Date:</span>
                      <span className="font-semibold text-slate-700 font-mono">{selectedInvoice.dateCreated}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-50">
                      <span className="text-slate-400">Payment Due Date:</span>
                      <span className="font-semibold text-slate-700 font-mono">{selectedInvoice.dueDate}</span>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                    <span className="text-[10px] font-mono text-slate-400 font-bold block">FINANCIAL RECAP SHEET</span>
                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Gross Progress Claim:</span>
                        <span className="font-semibold text-slate-800">{formatInvoiceValue(selectedInvoice, 'amount')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">VAT Component:</span>
                        <span className="font-semibold text-slate-800">{formatInvoiceValue(selectedInvoice, 'vat')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Contractor Retention (5%):</span>
                        <span className="font-semibold text-rose-600">- {formatRawCurrency(selectedInvoice.retention)}</span>
                      </div>
                      <div className="flex justify-between border-t border-slate-200/60 pt-2 font-bold text-slate-900 text-sm">
                        <span>ZATCA Gross Billing:</span>
                        <span>{formatInvoiceValue(selectedInvoice, 'totalAmount')}</span>
                      </div>
                      <div className="flex justify-between text-emerald-600 font-bold pt-1">
                        <span>Collected To-Date:</span>
                        <span>{formatRawCurrency(selectedInvoice.receivedAmount || 0)}</span>
                      </div>
                      <div className="flex justify-between text-amber-600 font-bold border-t border-dashed border-slate-200/80 pt-1.5">
                        <span>Outstanding Uncollected:</span>
                        <span>{formatRawCurrency(Math.max(0, getInvoiceDisplayValues(selectedInvoice).totalAmount - (selectedInvoice.receivedAmount || 0)))}</span>
                      </div>
                    </div>
                  </div>

                  {/* Export Options */}
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleExportInvoiceVoucher(selectedInvoice)}
                      className="flex-1 inline-flex items-center justify-center space-x-1 p-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Print Certificate</span>
                    </button>
                    {canManageInvoices && (
                      <button
                        onClick={(e) => handleOpenEditInvoice(selectedInvoice, e)}
                        className="flex-1 inline-flex items-center justify-center space-x-1 p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Edit Voucher</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Panel 2: Payments / Collections ledger (Partial collection) */}
                <div className="lg:border-r lg:border-slate-100 lg:px-6 space-y-4">
                  <div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-mono text-slate-400 font-extrabold block">COLLECTIONS RECEIPT TIMELINE</span>
                      {canManageInvoices && (selectedInvoice.totalAmount - (selectedInvoice.receivedAmount || 0)) > 0 && (
                        <button
                          onClick={(e) => handleOpenPaymentForInvoice(selectedInvoice, e)}
                          className="text-[10px] font-bold text-emerald-600 hover:text-emerald-800 hover:underline flex items-center space-x-0.5"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Record Collection</span>
                        </button>
                      )}
                    </div>
                    
                    <div className="mt-3 space-y-3 max-h-64 overflow-y-auto pr-1">
                      {selectedInvoicePayments.length === 0 ? (
                        <div className="bg-slate-50 border border-slate-100 rounded-xl p-6 text-center text-xs text-slate-400">
                          <CreditCard className="w-7 h-7 text-slate-300 mx-auto mb-2" />
                          <span>No client collections received yet.</span>
                          <p className="text-[10px] text-slate-400 mt-0.5">Use "Record Collection" to log partial payments.</p>
                        </div>
                      ) : (
                        selectedInvoicePayments.map((p) => (
                          <div key={p.id} className="bg-white border border-slate-150 p-3 rounded-xl space-y-1.5 shadow-xs hover:border-emerald-200 transition">
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] font-mono font-bold text-slate-400">{p.id}</span>
                              <span className="text-xs font-extrabold text-emerald-600">{formatCurrency(p.amount)}</span>
                            </div>
                            <div className="flex justify-between text-[10px] text-slate-500">
                              <span className="font-medium text-slate-700">{p.paymentMethod}</span>
                              <span>{p.date}</span>
                            </div>
                            <div className="bg-slate-50/80 px-2 py-1 rounded text-[9px] text-slate-400 font-mono truncate">
                              Ref: {p.bankRef}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Document Attachments Panel */}
                  <div className="pt-2">
                    <span className="text-[10px] font-mono text-slate-400 font-extrabold block mb-2">VALUATION ATTACHMENTS</span>
                    
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {selectedInvoice.attachedInvoiceFile && (
                        <div className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200/60 rounded-xl text-xs">
                          <div className="flex items-center space-x-2 truncate">
                            <Paperclip className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                            <span className="font-bold text-slate-700 truncate text-[11px]">{selectedInvoice.attachedInvoiceFile}</span>
                          </div>
                          <span className="text-[9px] font-mono text-slate-400">Uploaded</span>
                        </div>
                      )}

                      {(!selectedInvoice.attachments || selectedInvoice.attachments.length === 0) && !selectedInvoice.attachedInvoiceFile ? (
                        <div className="text-center py-4 text-slate-400 text-xs italic bg-slate-50 rounded-xl border border-dashed border-slate-200">
                          No documentation files attached.
                        </div>
                      ) : (
                        selectedInvoice.attachments?.map((file, idx) => (
                          <div key={idx} className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200/60 rounded-xl text-xs">
                            <div className="flex items-center space-x-2 truncate">
                              <Paperclip className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <div className="truncate">
                                <p className="font-bold text-slate-700 truncate text-[11px]">{file.name}</p>
                                <p className="text-[9px] text-slate-400 font-mono">{file.size}</p>
                              </div>
                            </div>
                            <span className="text-[9px] font-mono text-slate-400">{file.uploadedAt}</span>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Inline Quick Add File Form */}
                    <form onSubmit={handleAddAttachment} className="mt-3 flex items-center space-x-2">
                      <div className="relative flex-1">
                        <Paperclip className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          required
                          placeholder="Doc_Ref_Sheet_V2.pdf"
                          value={newFileName}
                          onChange={e => setNewFileName(e.target.value)}
                          className="w-full pl-8 pr-2 py-1.5 border border-slate-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                      <input
                        type="text"
                        placeholder="2.4 MB"
                        value={newFileSize}
                        onChange={e => setNewFileSize(e.target.value)}
                        className="w-16 px-2 py-1.5 border border-slate-200 rounded-lg text-xs text-center outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                      <button
                        type="submit"
                        className="p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </form>
                  </div>
                </div>

                {/* Panel 3: Discussion & Audit Log History */}
                <div className="space-y-4">
                  {/* Comments section */}
                  <div>
                    <span className="text-[10px] font-mono text-slate-400 font-extrabold block">VALUATION BOARD COLLABORATION</span>
                    
                    <div className="mt-3 space-y-2.5 max-h-52 overflow-y-auto pr-1">
                      {(!selectedInvoice.comments || selectedInvoice.comments.length === 0) ? (
                        <div className="text-center py-6 text-slate-400 text-xs italic bg-slate-50/50 rounded-xl">
                          No board communication recorded.
                        </div>
                      ) : (
                        selectedInvoice.comments.map((c) => (
                          <div key={c.id} className="bg-slate-50/70 p-2.5 rounded-xl border border-slate-100 space-y-1">
                            <div className="flex justify-between items-center text-[10px]">
                              <span className="font-extrabold text-slate-800">{c.user}</span>
                              <span className="text-[9px] text-slate-400 font-mono">{c.date}</span>
                            </div>
                            <span className="text-[9px] font-mono font-bold text-indigo-600 bg-indigo-50 px-1 rounded uppercase tracking-wider block w-fit">
                              {c.role}
                            </span>
                            <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">{c.text}</p>
                          </div>
                        ))
                      )}
                    </div>

                    <form onSubmit={handleAddComment} className="mt-3 flex items-center space-x-2">
                      <input
                        type="text"
                        required
                        placeholder="Add comment, claim dispute, or payment follow-up..."
                        value={newCommentText}
                        onChange={e => setNewCommentText(e.target.value)}
                        className="flex-1 px-3 py-1.5 border border-slate-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                      <button
                        type="submit"
                        className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition"
                      >
                        Post
                      </button>
                    </form>
                  </div>

                  {/* Audit Trail Updates */}
                  <div className="border-t border-slate-100 pt-4">
                    <span className="text-[10px] font-mono text-slate-400 font-extrabold block mb-2">SYSTEM AUDIT TRAIL</span>
                    <div className="space-y-2 max-h-40 overflow-y-auto pr-1 text-[10px]">
                      {selectedInvoice.updates?.map((u) => (
                        <div key={u.id} className="flex items-start space-x-2 text-slate-500">
                          <History className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-slate-600 font-medium">
                              <span className="font-bold text-slate-800">{u.user}</span> ({u.role}): {u.text}
                            </p>
                            <span className="text-[8px] text-slate-400 font-mono">{u.date}</span>
                          </div>
                        </div>
                      ))}
                      {(!selectedInvoice.updates || selectedInvoice.updates.length === 0) && (
                        <p className="text-slate-400 italic text-center py-2">No historical audits recorded.</p>
                      )}
                    </div>
                  </div>
                </div>

              </div>
            )}

          </div>
        </div>

      </div>

    </div>
  );
}
