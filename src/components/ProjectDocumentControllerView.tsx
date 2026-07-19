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
  Percent,
  CheckCircle,
  AlertTriangle,
  FolderOpen,
  Filter,
  UserCheck,
  ChevronRight,
  FileSpreadsheet,
  Eye
} from 'lucide-react';
import { Project, Milestone, Invoice, Payment, User, Comment, DocumentController, getVatAppliedAmount } from '../types';
import { jsPDF } from 'jspdf';

interface ProjectDocumentControllerViewProps {
  projects: Project[];
  milestones: Milestone[];
  invoices: Invoice[];
  setInvoices: React.Dispatch<React.SetStateAction<Invoice[]>>;
  payments: Payment[];
  setPayments: React.Dispatch<React.SetStateAction<Payment[]>>;
  documentControllers: DocumentController[];
  setDocumentControllers: React.Dispatch<React.SetStateAction<DocumentController[]>>;
  currentUser: User;
  availableUsers: User[];
  onLogAudit: (action: string, module: string, oldValue?: string, newValue?: string) => void;
  onAddNotification: (text: string, type: 'info' | 'success' | 'warning' | 'alert') => void;
}

export default function ProjectDocumentControllerView({
  projects,
  milestones,
  invoices,
  setInvoices,
  payments,
  setPayments,
  documentControllers,
  setDocumentControllers,
  currentUser,
  availableUsers,
  onLogAudit,
  onAddNotification,
}: ProjectDocumentControllerViewProps) {
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string>('all');
  const [projectSearchQuery, setProjectSearchQuery] = useState('');
  const [docSearchQuery, setDocSearchQuery] = useState('');
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);

  // Status & Category filters
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  // Modals / Forms States
  const [isDocFormOpen, setIsDocFormOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<DocumentController | null>(null);

  // Document Controller Form fields
  const [formProjectId, setFormProjectId] = useState('');
  const [formMilestoneId, setFormMilestoneId] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formNumber, setFormNumber] = useState('');
  const [formRevision, setFormRevision] = useState('Rev A');
  const [formCategory, setFormCategory] = useState<DocumentController['category']>('Shop Drawing');
  const [formStatus, setFormStatus] = useState<DocumentController['status']>('under_review');
  const [formControllerId, setFormControllerId] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [draftAttachments, setDraftAttachments] = useState<{ name: string; size: string; uploadedAt?: string; url?: string }[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  // Direct Invoice/Payment dialog states
  const [linkDocId, setLinkDocId] = useState<string>('');
  const [invNumber, setInvNumber] = useState('');
  const [invAmount, setInvAmount] = useState<number>(0);
  const [invVat, setInvVat] = useState<number>(0);
  const [invRetention, setInvRetention] = useState<number>(0);
  const [invDueDate, setInvDueDate] = useState('');
  const [invStatus, setInvStatus] = useState<Invoice['status']>('draft');

  const [payAmount, setPayAmount] = useState<number>(0);
  const [payDate, setPayDate] = useState('');
  const [payMethod, setPayMethod] = useState('Bank Transfer');
  const [payBankRef, setPayBankRef] = useState('');
  const [payStatus, setPayStatus] = useState<'cleared' | 'pending' | 'disputed' | 'cancelled'>('cleared');
  const [payInvoiceId, setPayInvoiceId] = useState('');

  // Comment state inside details panel
  const [newCommentText, setNewCommentText] = useState('');
  // Attachment fields inside details panel
  const [newFileName, setNewFileName] = useState('');
  const [newFileSize, setNewFileSize] = useState('');

  // Authorizations
  const canManageDocs = useMemo(() => {
    return currentUser.role === 'Admin' || 
           currentUser.role === 'Super Admin' || 
           currentUser.role === 'General Manager' || 
           currentUser.role === 'Project Manager' || 
           currentUser.role === 'Document Controller';
  }, [currentUser]);

  // Selected document helper
  const selectedDoc = useMemo(() => {
    return documentControllers.find(d => d.id === selectedDocId) || null;
  }, [documentControllers, selectedDocId]);

  // Sidebar projects filtering
  const filteredProjects = useMemo(() => {
    return projects.filter(p => 
      p.name.toLowerCase().includes(projectSearchQuery.toLowerCase()) || 
      p.code.toLowerCase().includes(projectSearchQuery.toLowerCase()) ||
      (p.clientName && p.clientName.toLowerCase().includes(projectSearchQuery.toLowerCase()))
    );
  }, [projects, projectSearchQuery]);

  // Active milestones for the project
  const activeMilestonesList = useMemo(() => {
    if (selectedProjectId === 'all') return [];
    return milestones.filter(m => m.projectId === selectedProjectId);
  }, [milestones, selectedProjectId]);

  // Filtered Document Controller Logs
  const filteredDocs = useMemo(() => {
    let list = documentControllers;

    if (selectedProjectId !== 'all') {
      list = list.filter(d => d.projectId === selectedProjectId);
    }
    if (selectedMilestoneId !== 'all') {
      list = list.filter(d => d.milestoneId === selectedMilestoneId);
    }
    if (filterStatus !== 'all') {
      list = list.filter(d => d.status === filterStatus);
    }
    if (filterCategory !== 'all') {
      list = list.filter(d => d.category === filterCategory);
    }
    if (docSearchQuery.trim()) {
      const q = docSearchQuery.toLowerCase();
      list = list.filter(d => 
        d.documentTitle.toLowerCase().includes(q) ||
        d.documentNumber.toLowerCase().includes(q) ||
        d.revision.toLowerCase().includes(q) ||
        (d.assignedControllerName && d.assignedControllerName.toLowerCase().includes(q)) ||
        (d.description && d.description.toLowerCase().includes(q))
      );
    }
    return list;
  }, [documentControllers, selectedProjectId, selectedMilestoneId, filterStatus, filterCategory, docSearchQuery]);

  // Invoices tied to selected document
  const docInvoices = useMemo(() => {
    if (!selectedDocId) return [];
    return invoices.filter(i => i.documentControllerId === selectedDocId);
  }, [invoices, selectedDocId]);

  // Payments tied to selected document
  const docPayments = useMemo(() => {
    if (!selectedDocId) return [];
    return payments.filter(p => p.documentControllerId === selectedDocId);
  }, [payments, selectedDocId]);

  // Financial summary for selected document
  const docFinanceSummary = useMemo(() => {
    const totalInvoiced = docInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
    const totalPaid = docPayments.reduce((sum, p) => sum + p.amount, 0);
    return {
      totalInvoiced,
      totalPaid,
      outstanding: Math.max(0, totalInvoiced - totalPaid)
    };
  }, [docInvoices, docPayments]);

  // Project helper info
  const getProjectInfo = (pId: string) => {
    return projects.find(p => p.id === pId) || { name: 'Unknown Project', code: 'PROJ-XXX', clientName: 'N/A' };
  };

  // Open Add Doc Controller log
  const handleOpenAddDoc = () => {
    if (!canManageDocs) {
      onAddNotification('Access Denied: Document Controller permissions required.', 'alert');
      return;
    }
    setEditingDoc(null);
    const pId = selectedProjectId === 'all' ? (projects[0]?.id || '') : selectedProjectId;
    setFormProjectId(pId);

    const mId = selectedMilestoneId === 'all' ? 'none' : (selectedMilestoneId || 'none');
    setFormMilestoneId(mId);

    setFormTitle('');
    setFormNumber(`WF-DC-${getProjectInfo(pId).code.split('-')[2] || 'GEN'}-${Date.now().toString().slice(-4)}`);
    setFormRevision('Rev A');
    setFormCategory('Shop Drawing');
    setFormStatus('under_review');
    setFormControllerId(currentUser.id);
    setFormDescription('');
    setDraftAttachments([]);
    setIsDocFormOpen(true);
  };

  // Open Edit Doc Controller log
  const handleOpenEditDoc = (doc: DocumentController, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!canManageDocs) {
      onAddNotification('Access Denied: Document Controller permissions required.', 'alert');
      return;
    }
    setEditingDoc(doc);
    setFormProjectId(doc.projectId);
    setFormMilestoneId(doc.milestoneId);
    setFormTitle(doc.documentTitle);
    setFormNumber(doc.documentNumber);
    setFormRevision(doc.revision);
    setFormCategory(doc.category);
    setFormStatus(doc.status);
    setFormControllerId(doc.assignedControllerId || '');
    setFormDescription(doc.description || '');
    setDraftAttachments(doc.attachments || []);
    setIsDocFormOpen(true);
  };

  // Drag & drop file helpers
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

  const handleUploadFiveDemoFiles = () => {
    const demoFiles = [
      { name: 'WF-ARC-DET-001_SlabLayout_Rev0.dwg', size: '18.4 MB', uploadedAt: new Date().toISOString().slice(0, 10) },
      { name: 'C40_Concrete_Compressive_Strength_Cert.pdf', size: '2.4 MB', uploadedAt: new Date().toISOString().slice(0, 10) },
      { name: 'Method_Statement_Pouring_Sequence_RevB.docx', size: '1.2 MB', uploadedAt: new Date().toISOString().slice(0, 10) },
      { name: 'ZATCA_Tax_Compliance_Invoice_Report.pdf', size: '3.1 MB', uploadedAt: new Date().toISOString().slice(0, 10) },
      { name: 'Wafaq_Structural_Calculation_Sheets.xlsx', size: '4.5 MB', uploadedAt: new Date().toISOString().slice(0, 10) }
    ];
    setDraftAttachments(demoFiles);
    onAddNotification('Successfully auto-filled 5 standard engineering documents.', 'success');
  };

  const handleFiles = (fileList: FileList) => {
    const newFiles: { name: string; size: string; uploadedAt?: string; url?: string }[] = [];
    const totalSelected = fileList.length;
    const currentCount = draftAttachments.length;

    if (currentCount >= 5) {
      onAddNotification('Maximum limit of 5 attachments reached.', 'warning');
      return;
    }

    const limit = Math.min(totalSelected, 5 - currentCount);

    for (let i = 0; i < limit; i++) {
      const file = fileList[i];
      const sizeInMB = file.size / (1024 * 1024);
      const sizeStr = sizeInMB < 0.1 
        ? `${(file.size / 1024).toFixed(1)} KB` 
        : `${sizeInMB.toFixed(2)} MB`;
      newFiles.push({
        name: file.name,
        size: sizeStr,
        uploadedAt: new Date().toISOString().slice(0, 10),
        url: URL.createObjectURL(file)
      });
    }

    setDraftAttachments(prev => [...prev, ...newFiles]);

    if (totalSelected > limit) {
      onAddNotification(`Only the first ${limit} files were added. Maximum 5 attachments allowed.`, 'warning');
    } else {
      onAddNotification(`Queued ${newFiles.length} file attachments.`, 'info');
    }
  };

  const handleRemoveDraftAttachment = (idx: number) => {
    setDraftAttachments(prev => prev.filter((_, i) => i !== idx));
    onAddNotification('Attachment removed from draft.', 'info');
  };

  // Save Document Controller Log
  const handleSaveDoc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageDocs) return;

    if (!formTitle.trim() || !formNumber.trim()) {
      onAddNotification('Please fill in the Document Title and Reference Number.', 'warning');
      return;
    }

    const matchedMilestone = milestones.find(m => m.id === formMilestoneId);
    const mName = formMilestoneId === 'none' ? 'No Milestone Association' : (matchedMilestone ? matchedMilestone.name : 'Unspecified Milestone Segment');
    const controllerName = availableUsers.find(u => u.id === formControllerId)?.name || currentUser.name;

    if (editingDoc) {
      // Edit record
      setDocumentControllers(prev => prev.map(item => {
        if (item.id === editingDoc.id) {
          const statusChanged = item.status !== formStatus;
          const nextUpdates = [...(item.updates || [])];

          if (statusChanged) {
            nextUpdates.push({
              id: `dc_up_${Date.now()}`,
              user: currentUser.name,
              role: currentUser.role,
              text: `Status updated from "${getStatusLabelText(item.status)}" to "${getStatusLabelText(formStatus)}".`,
              date: new Date().toISOString().replace('T', ' ').substring(0, 16)
            });
          }

          return {
            ...item,
            projectId: formProjectId,
            milestoneId: formMilestoneId,
            milestoneName: mName,
            documentTitle: formTitle.trim(),
            documentNumber: formNumber.trim(),
            revision: formRevision.trim(),
            category: formCategory,
            status: formStatus,
            assignedControllerId: formControllerId,
            assignedControllerName: controllerName,
            description: formDescription.trim(),
            attachments: draftAttachments,
            updates: nextUpdates,
            actionDate: statusChanged ? new Date().toISOString().slice(0, 10) : item.actionDate
          };
        }
        return item;
      }));

      onLogAudit(`Updated Document Control Record`, 'Document Controller', `${editingDoc.documentNumber}`, `${formNumber}`);
      onAddNotification('Document Control record updated successfully.', 'success');
    } else {
      // Create new record
      const newDoc: DocumentController = {
        id: `dc_${Date.now()}`,
        projectId: formProjectId,
        milestoneId: formMilestoneId,
        milestoneName: mName,
        documentTitle: formTitle.trim(),
        documentNumber: formNumber.trim(),
        revision: formRevision.trim(),
        category: formCategory,
        status: formStatus,
        assignedControllerId: formControllerId,
        assignedControllerName: controllerName,
        receivedDate: new Date().toISOString().slice(0, 10),
        description: formDescription.trim(),
        attachments: draftAttachments,
        comments: [],
        updates: [
          {
            id: `dc_up_${Date.now()}`,
            user: currentUser.name,
            role: currentUser.role,
            text: `Document control log created with status "${getStatusLabelText(formStatus)}".`,
            date: new Date().toISOString().replace('T', ' ').substring(0, 16)
          }
        ]
      };

      setDocumentControllers(prev => [newDoc, ...prev]);
      onLogAudit(`Logged Document Control Record`, 'Document Controller', undefined, `${newDoc.documentNumber}`);
      onAddNotification('Document control entry logged successfully.', 'success');
    }

    setIsDocFormOpen(false);
    setEditingDoc(null);
  };

  // Delete Document Controller Log
  const handleDeleteDoc = (doc: DocumentController, e: React.MouseEvent) => {
    const userRoleStr = currentUser?.role?.toLowerCase() || '';
    if (userRoleStr !== 'admin' && userRoleStr !== 'super admin' && userRoleStr !== 'superadmin') {
      alert("Unauthorized: Only Admin or Super Admin can delete records.");
      return;
    }

    e.stopPropagation();
    if (!canManageDocs) {
      onAddNotification('Access Denied: Insufficient roles to delete log.', 'alert');
      return;
    }

    if (window.confirm(`Are you sure you want to delete Document record ${doc.documentNumber}? This will sever related invoice/payment links.`)) {
      setDocumentControllers(prev => prev.filter(item => item.id !== doc.id));
      if (selectedDocId === doc.id) {
        setSelectedDocId(null);
      }
      onLogAudit(`Deleted Document Control Entry`, 'Document Controller', `${doc.documentNumber}`, undefined);
      onAddNotification('Document control entry deleted.', 'success');
    }
  };

  // Comments Handling
  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDocId || !newCommentText.trim()) return;

    const nextComment: Comment = {
      id: `dc_comm_${Date.now()}`,
      user: currentUser.name,
      role: currentUser.role,
      text: newCommentText.trim(),
      date: new Date().toISOString().replace('T', ' ').substring(0, 16)
    };

    setDocumentControllers(prev => prev.map(d => {
      if (d.id === selectedDocId) {
        return {
          ...d,
          comments: [...(d.comments || []), nextComment],
          updates: [
            ...(d.updates || []),
            {
              id: `dc_up_${Date.now()}`,
              user: currentUser.name,
              role: currentUser.role,
              text: `Added comment: "${newCommentText.substring(0, 40)}${newCommentText.length > 40 ? '...' : ''}"`,
              date: new Date().toISOString().replace('T', ' ').substring(0, 16)
            }
          ]
        };
      }
      return d;
    }));

    setNewCommentText('');
    onAddNotification('Comment published.', 'success');
  };

  // Attach new file inside Details Panel
  const handleAddFileToSelectedDoc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDocId || !newFileName.trim()) return;

    const nextAttachment = {
      name: newFileName.trim(),
      size: newFileSize.trim() || '1.5 MB',
      uploadedAt: new Date().toISOString().slice(0, 10)
    };

    setDocumentControllers(prev => prev.map(d => {
      if (d.id === selectedDocId) {
        return {
          ...d,
          attachments: [...(d.attachments || []), nextAttachment],
          updates: [
            ...(d.updates || []),
            {
              id: `dc_up_${Date.now()}`,
              user: currentUser.name,
              role: currentUser.role,
              text: `Attached file: "${nextAttachment.name}"`,
              date: new Date().toISOString().replace('T', ' ').substring(0, 16)
            }
          ]
        };
      }
      return d;
    }));

    setNewFileName('');
    setNewFileSize('');
    onAddNotification(`File "${nextAttachment.name}" attached successfully.`, 'success');
  };

  // OPEN DIRECT DIALOGS TO ADD INVOICE OR ADD PAYMENT LINKED TO THIS DOC
  const handleOpenAddInvoiceForDoc = (docId: string) => {
    const doc = documentControllers.find(d => d.id === docId);
    if (!doc) return;

    setLinkDocId(doc.id);
    const cleanCode = getProjectInfo(doc.projectId).code.split('-')[2] || 'GEN';
    const count = invoices.filter(i => i.projectId === doc.projectId).length + 101;
    
    setInvNumber(`WF-INV-${cleanCode}-DC-${count}`);
    setInvAmount(0);
    setInvVat(0);
    setInvRetention(0);
    setInvDueDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10));
    setInvStatus('draft');
    
    setIsInvoiceModalOpen(true);
  };

  const handleOpenAddPaymentForDoc = (docId: string) => {
    const doc = documentControllers.find(d => d.id === docId);
    if (!doc) return;

    setLinkDocId(doc.id);
    // Find doc invoices to potentially select
    const docInvs = invoices.filter(i => i.documentControllerId === docId);
    setPayInvoiceId(docInvs[0]?.id || '');
    
    // Set default amount based on outstanding balance or default
    const outstanding = docInvs.reduce((sum, inv) => sum + (inv.totalAmount - (inv.receivedAmount || 0)), 0);
    setPayAmount(outstanding > 0 ? outstanding : 50000);
    
    setPayDate(new Date().toISOString().slice(0, 10));
    setPayMethod('Bank Transfer');
    setPayBankRef(`REF-DC-PAY-${Date.now().toString().slice(-5)}`);
    setPayStatus('cleared');

    setIsPaymentModalOpen(true);
  };

  // SAVE INVOICE TIED TO DOC CONTROLLER
  const handleSaveDocInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    const doc = documentControllers.find(d => d.id === linkDocId);
    if (!doc) return;

    if (invAmount <= 0) {
      onAddNotification('Invoice base amount must be greater than zero.', 'warning');
      return;
    }

    const totalCalculated = Number(invAmount) + Number(invVat) - Number(invRetention);

    const newInv: Invoice = {
      id: `inv_${Date.now()}`,
      projectId: doc.projectId,
      invoiceNumber: invNumber.trim(),
      milestoneId: doc.milestoneId,
      milestoneName: doc.milestoneName,
      documentControllerId: doc.id,
      amount: Number(invAmount),
      vat: Number(invVat),
      retention: Number(invRetention),
      totalAmount: totalCalculated,
      status: invStatus,
      dateCreated: new Date().toISOString().slice(0, 10),
      dueDate: invDueDate,
      receivedAmount: 0,
      comments: [],
      attachments: [],
      updates: [
        {
          id: `inv_up_${Date.now()}`,
          user: currentUser.name,
          role: currentUser.role,
          text: `Invoice issued via Document Controller record: ${doc.documentNumber}.`,
          date: new Date().toISOString().replace('T', ' ').substring(0, 16)
        }
      ]
    };

    setInvoices(prev => [...prev, newInv]);

    // Also push update to the Document Controller record
    setDocumentControllers(prev => prev.map(item => {
      if (item.id === doc.id) {
        return {
          ...item,
          updates: [
            ...(item.updates || []),
            {
              id: `dc_up_${Date.now()}`,
              user: currentUser.name,
              role: currentUser.role,
              text: `Issued Progress Claim Invoice ${newInv.invoiceNumber} for ${formatCurrency(totalCalculated)}.`,
              date: new Date().toISOString().replace('T', ' ').substring(0, 16)
            }
          ]
        };
      }
      return item;
    }));

    onLogAudit(`Issued Progress Claim Invoice ${newInv.invoiceNumber}`, 'Invoice Module', undefined, `${totalCalculated} SAR`);
    onAddNotification(`Invoice ${newInv.invoiceNumber} drafted & linked to Document record.`, 'success');
    setIsInvoiceModalOpen(false);
  };

  // SAVE PAYMENT TIED TO DOC CONTROLLER (PARTIAL OR FULL)
  const handleSaveDocPayment = (e: React.FormEvent) => {
    e.preventDefault();
    const doc = documentControllers.find(d => d.id === linkDocId);
    if (!doc) return;

    if (payAmount <= 0) {
      onAddNotification('Collection payment amount must be greater than zero.', 'warning');
      return;
    }

    const linkedInvoice = invoices.find(i => i.id === payInvoiceId);

    const newPay: Payment = {
      id: `pay_${Date.now()}`,
      projectId: doc.projectId,
      invoiceId: payInvoiceId || undefined,
      invoiceNumber: linkedInvoice ? linkedInvoice.invoiceNumber : undefined,
      documentControllerId: doc.id,
      amount: Number(payAmount),
      date: payDate,
      paymentMethod: payMethod === 'Cash' ? 'Cash Voucher' : 'SADAD Bank Transfer',
      bankRef: payBankRef || `REF-SA-${Date.now().toString().slice(-6)}`,
      status: payStatus,
      milestoneId: doc.milestoneId,
      milestoneName: doc.milestoneName,
      comments: [],
      attachments: [],
      updates: [
        {
          id: `pay_up_${Date.now()}`,
          user: currentUser.name,
          role: currentUser.role,
          text: `Payment logged for Document record ${doc.documentNumber}.`,
          date: new Date().toISOString().replace('T', ' ').substring(0, 16)
        }
      ]
    };

    setPayments(prev => [...prev, newPay]);

    // Update invoice collected balance if invoice is selected
    if (payInvoiceId) {
      setInvoices(prev => prev.map(inv => {
        if (inv.id === payInvoiceId) {
          const prevReceived = inv.receivedAmount || 0;
          const nextReceived = prevReceived + Number(payAmount);
          const isFullyPaid = nextReceived >= inv.totalAmount;
          return {
            ...inv,
            receivedAmount: nextReceived,
            status: isFullyPaid ? 'paid' : 'partially_paid'
          };
        }
        return inv;
      }));
    }

    // Append update log inside the Document Control entry
    setDocumentControllers(prev => prev.map(item => {
      if (item.id === doc.id) {
        return {
          ...item,
          updates: [
            ...(item.updates || []),
            {
              id: `dc_up_${Date.now()}`,
              user: currentUser.name,
              role: currentUser.role,
              text: `Logged Cash Inflow of ${formatCurrency(payAmount)} via Wire: ${newPay.bankRef}.`,
              date: new Date().toISOString().replace('T', ' ').substring(0, 16)
            }
          ]
        };
      }
      return item;
    }));

    onLogAudit(`Logged Client Collection against Document Record`, 'Payments', undefined, `${payAmount} SAR`);
    onAddNotification(`Cash receipt logged successfully. Linked balances refreshed.`, 'success');
    setIsPaymentModalOpen(false);
  };

  // Helper styles
  const getStatusLabelText = (status: DocumentController['status']) => {
    switch (status) {
      case 'pending_review': return 'Pending Controller Review';
      case 'under_review': return 'Under Client Review';
      case 'approved': return 'Approved (ZATCA Cleared)';
      case 'approved_with_comments': return 'Approved with Comments';
      case 'rejected': return 'Rejected';
      case 'revised_required': return 'Revision Required';
    }
  };

  const getStatusStyle = (status: DocumentController['status']) => {
    switch (status) {
      case 'approved': 
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'approved_with_comments': 
        return 'bg-teal-50 text-teal-700 border-teal-200';
      case 'under_review': 
        return 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse';
      case 'pending_review': 
        return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'rejected': 
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'revised_required': 
        return 'bg-orange-50 text-orange-700 border-orange-200';
    }
  };

  const formatCurrency = (amount: number) => {
    const applied = getVatAppliedAmount(amount);
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'SAR',
      maximumFractionDigits: 0
    }).format(applied);
  };

  const handlePrintDocumentRecord = (doc: DocumentController) => {
    const proj = getProjectInfo(doc.projectId);
    const content = `
=====================================================================
                    WAFAQ ENGINEERING CONTROLLED TRANSMITTAL
=====================================================================
Document Ref ID:     ${doc.id}
Document Number:     ${doc.documentNumber}
Revision Stage:      ${doc.revision}
Controlled Title:    ${doc.documentTitle}

Milestone Association:
- Milestone Code:    ${doc.milestoneId}
- Milestone Segment: ${doc.milestoneName}

Project Meta Information:
- Project Code:      ${proj.code}
- Project Name:      ${proj.name}
- Client Developer:  ${proj.clientName}

Transmittal Status:  ${getStatusLabelText(doc.status).toUpperCase()}
Logged Date:         ${doc.receivedDate}
Action/Review Date:  ${doc.actionDate || 'Awaiting Action Date'}
Assigned Controller: ${doc.assignedControllerName}

---------------------------------------------------------------------
DOCUMENT DESCRIPTION:
---------------------------------------------------------------------
${doc.description || 'No descriptive engineering summary recorded.'}

---------------------------------------------------------------------
FINANCIAL DISCLOSURES LINKED TO THIS TRANSMITTAL:
---------------------------------------------------------------------
Total Invoiced:      ${formatCurrency(docFinanceSummary.totalInvoiced)} SAR
Total Paid/Cleared:  ${formatCurrency(docFinanceSummary.totalPaid)} SAR
Remaining Exposure:  ${formatCurrency(docFinanceSummary.outstanding)} SAR

Audit Code:          ZATCA Compliance Transmittal Log
System Signature:    Verified by Wafaq Project Controls Auditor

=====================================================================
                      Wafaq Construction Controls Suite             
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
    pdfDoc.save(`Transmittal_${doc.documentNumber}_Audit.pdf`);

    onLogAudit(`Exported transmittal certificate for ${doc.documentNumber}`, 'Document Controller', undefined, doc.id);
    onAddNotification(`Transmittal certificate downloaded.`, 'success');
  };

  return (
    <div id="document-controller-view-root" className="flex-1 flex flex-col h-full bg-slate-50 overflow-hidden">
      
      {/* Top Banner Context Section */}
      <div className="bg-white border-b border-slate-200 p-5 md:px-8 flex flex-col md:flex-row md:items-center md:justify-between shrink-0 gap-4">
        <div>
          <span className="text-xs font-mono font-bold text-indigo-600 uppercase tracking-widest block mb-1">Project Engineering Controls</span>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Document Controller Panel</h2>
          <p className="text-xs text-slate-500 mt-1">Audit official site submittals, register controlled shop drawings, attach engineering files, and log milestone-linked cash collections.</p>
        </div>

        {/* TOP LEVEL DUAL OPTION ACTION BAR */}
        <div className="flex items-center space-x-2 shrink-0">
          
        </div>
      </div>

      {/* Main Workspace Split Pane */}
      <div className="flex-1 flex overflow-hidden min-h-0 w-full">
        
        {/* 1. LEFT SIDEBAR: Project & Milestone Directory */}
        <div 
          id="doc-controller-sidebar" 
          className={`w-72 border-r border-slate-200 bg-white flex flex-col h-full shrink-0 transition-transform lg:translate-x-0 lg:relative lg:pointer-events-auto lg:z-10 ${
            mobileDetailOpen ? '-translate-x-full absolute pointer-events-none' : 'relative z-10'
          }`}
        >
          {/* Projects List Filter */}
          <div className="p-4 border-b border-slate-100 bg-slate-50/60">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-widest font-mono">Projects directory</h2>
            <p className="text-[10px] text-slate-400 mt-1">Select project & milestone stage</p>
            <div className="relative mt-3">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                placeholder="Filter projects..."
                value={projectSearchQuery}
                onChange={e => setProjectSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2.5 space-y-3 bg-slate-50/30">
            
            {/* All Projects Option */}
            <div>
              <button
                onClick={() => {
                  setSelectedProjectId('all');
                  setSelectedMilestoneId('all');
                  setMobileDetailOpen(true);
                }}
                className={`w-full text-left p-3 rounded-xl transition-all cursor-pointer border flex items-center space-x-2.5 ${
                  selectedProjectId === 'all'
                    ? 'bg-white border-indigo-200 shadow-md ring-1 ring-indigo-500/5 font-bold text-indigo-700'
                    : 'bg-transparent border-transparent hover:bg-slate-100 hover:border-slate-200 text-slate-700'
                }`}
              >
                <Briefcase className={`w-4 h-4 ${selectedProjectId === 'all' ? 'text-indigo-600' : 'text-slate-400'}`} />
                <div>
                  <h4 className="text-xs font-bold">All Engineering Logs</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Corporate global register</p>
                </div>
              </button>
            </div>

            {/* List of projects */}
            <div className="space-y-1">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider pl-1 block">Engineering Projects</span>
              {filteredProjects.map(p => {
                const isActive = selectedProjectId === p.id;
                return (
                  <div key={p.id} className="space-y-1">
                    <button
                      onClick={() => {
                        setSelectedProjectId(p.id);
                        setSelectedMilestoneId('all');
                        setMobileDetailOpen(true);
                      }}
                      className={`w-full text-left p-2.5 rounded-lg transition-all cursor-pointer border ${
                        isActive 
                          ? 'bg-white border-slate-200 shadow-sm ring-1 ring-indigo-500/5 font-semibold text-slate-900' 
                          : 'bg-transparent border-transparent hover:bg-slate-100/60 text-slate-600'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-mono font-bold text-slate-400 uppercase bg-slate-100 px-1 py-0.5 rounded">
                          {p.code}
                        </span>
                        <span className="text-[9px] font-mono font-extrabold text-indigo-600">
                          {documentControllers.filter(d => d.projectId === p.id).length} items
                        </span>
                      </div>
                      <h4 className="text-xs font-bold mt-1.5 truncate">{p.name}</h4>
                    </button>

                    {/* Sub-menu milestones list if active project */}
                    {isActive && (
                      <div className="pl-3 border-l-2 border-indigo-100 ml-2 py-1 space-y-1">
                        <button
                          onClick={() => setSelectedMilestoneId('all')}
                          className={`w-full text-left py-1 px-2 rounded text-[11px] font-medium transition ${
                            selectedMilestoneId === 'all'
                              ? 'bg-indigo-50 text-indigo-700 font-bold'
                              : 'text-slate-500 hover:text-slate-800'
                          }`}
                        >
                          ● All Milestones
                        </button>
                        <button
                          onClick={() => setSelectedMilestoneId('none')}
                          className={`w-full text-left py-1 px-2 rounded text-[11px] font-medium transition flex items-center justify-between ${
                            selectedMilestoneId === 'none'
                              ? 'bg-indigo-50/80 text-indigo-700 font-bold'
                              : 'text-slate-500 hover:text-slate-800'
                          }`}
                        >
                          <span className="truncate pr-1">● No Milestone Association</span>
                        </button>
                        {activeMilestonesList.map(m => (
                          <button
                            key={m.id}
                            onClick={() => setSelectedMilestoneId(m.id)}
                            className={`w-full text-left py-1 px-2 rounded text-[11px] font-medium transition flex items-center justify-between ${
                              selectedMilestoneId === m.id
                                ? 'bg-indigo-50/80 text-indigo-700 font-bold'
                                : 'text-slate-500 hover:text-slate-800'
                            }`}
                          >
                            <span className="truncate pr-1">● {m.name}</span>
                            <span className="text-[9px] text-slate-400 font-mono">({m.progress}%)</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 2. MAIN CENTER VIEWPORT */}
        <div 
          id="doc-controller-workspace" 
          className={`flex-1 flex flex-col h-full overflow-hidden transition-transform lg:translate-x-0 lg:relative lg:pointer-events-auto lg:z-10 ${
            mobileDetailOpen ? 'translate-x-0 relative z-20 bg-white' : 'translate-x-full absolute pointer-events-none'
          }`}
        >
          {/* Main List Filters Bar */}
          <div className="p-4 bg-white border-b border-slate-200 shrink-0 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              {/* Search input */}
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="text" 
                  placeholder="Search controlled logs, rev, numbers..."
                  value={docSearchQuery}
                  onChange={e => setDocSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                />
              </div>

              {/* Status & Category filtering drop-downs */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center space-x-1 text-xs">
                  <span className="text-slate-400 font-mono text-[9px]">Status:</span>
                  <select
                    value={filterStatus}
                    onChange={e => setFilterStatus(e.target.value)}
                    className="border border-slate-200 rounded-lg bg-white p-1 text-[11px] focus:ring-1 focus:ring-indigo-500 outline-none"
                  >
                    <option value="all">All statuses</option>
                    <option value="pending_review">Pending Review</option>
                    <option value="under_review">Under Client Review</option>
                    <option value="approved">Approved</option>
                    <option value="approved_with_comments">Approved with Comments</option>
                    <option value="rejected">Rejected</option>
                    <option value="revised_required">Revision Required</option>
                  </select>
                </div>

                <div className="flex items-center space-x-1 text-xs">
                  <span className="text-slate-400 font-mono text-[9px]">Category:</span>
                  <select
                    value={filterCategory}
                    onChange={e => setFilterCategory(e.target.value)}
                    className="border border-slate-200 rounded-lg bg-white p-1 text-[11px] focus:ring-1 focus:ring-indigo-500 outline-none"
                  >
                    <option value="all">All categories</option>
                    <option value="Shop Drawing">Shop Drawing</option>
                    <option value="Material Submittal">Material Submittal</option>
                    <option value="Method Statement">Method Statement</option>
                    <option value="Inspection Request">Inspection Request</option>
                    <option value="As-Built Drawing">As-Built Drawing</option>
                    <option value="Calculation Sheet">Calculation Sheet</option>
                    <option value="Certificate">Certificate</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Add new Document Button */}
                {canManageDocs && (
                  <button
                    onClick={handleOpenAddDoc}
                    className="inline-flex items-center space-x-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition shadow-sm cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Log Submittal</span>
                  </button>
                )}
              </div>
            </div>

            {/* Breadcrumb Info label */}
            <div className="flex items-center justify-between text-[11px] bg-slate-50 p-2 rounded-lg border border-slate-100 text-slate-500">
              <div className="flex items-center space-x-1.5">
                <Briefcase className="w-3.5 h-3.5 text-indigo-500" />
                <span className="font-bold text-slate-700">Project Selection:</span>
                <span className="text-slate-600">
                  {selectedProjectId === 'all' ? 'All Corporate Inflows' : getProjectInfo(selectedProjectId).name}
                </span>
                {selectedMilestoneId !== 'all' && (
                  <>
                    <ChevronRight className="w-3 h-3 text-slate-300" />
                    <span className="font-semibold text-slate-700 bg-indigo-50 px-1.5 py-0.5 rounded text-[10px]">
                      {selectedMilestoneId === 'none' ? 'No Milestone Association' : milestones.find(m => m.id === selectedMilestoneId)?.name}
                    </span>
                  </>
                )}
              </div>
              <span className="font-mono font-semibold text-indigo-600">{filteredDocs.length} submittals mapped</span>
            </div>
          </div>

          {/* Documents Master Grid list split with details panel if selected */}
          <div className="flex-1 flex overflow-hidden">
            
            {/* List panel */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 bg-slate-50/50">
              {filteredDocs.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                  <FolderOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <h3 className="text-sm font-bold text-slate-800">No controlled submittals found</h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">This project or milestone doesn't have any Document Controller transmittals logged yet. Click "Log Submittal" to begin.</p>
                  {canManageDocs && (
                    <button
                      onClick={handleOpenAddDoc}
                      className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm transition"
                    >
                      Record First Submittal
                    </button>
                  )}
                </div>
              ) : (
                filteredDocs.map(doc => {
                  const isSelected = selectedDocId === doc.id;
                  const proj = getProjectInfo(doc.projectId);
                  
                  // Compute financial totals specifically for this doc
                  const linkedInvs = invoices.filter(i => i.documentControllerId === doc.id);
                  const linkedPays = payments.filter(p => p.documentControllerId === doc.id);
                  const docInvSum = linkedInvs.reduce((sum, i) => sum + i.totalAmount, 0);
                  const docPaySum = linkedPays.reduce((sum, p) => sum + p.amount, 0);

                  return (
                    <div
                      key={doc.id}
                      onClick={() => {
                        setSelectedDocId(doc.id);
                        setMobileDetailOpen(true);
                      }}
                      className={`bg-white rounded-2xl border transition-all cursor-pointer p-4 md:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                        isSelected 
                          ? 'border-indigo-300 ring-2 ring-indigo-500/10 shadow-md bg-indigo-50/10' 
                          : 'border-slate-200/80 hover:border-slate-300 shadow-xs hover:shadow-sm'
                      }`}
                    >
                      <div className="space-y-2 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[10px] font-mono font-extrabold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100/50 uppercase">
                            {doc.documentNumber}
                          </span>
                          <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                            {doc.revision}
                          </span>
                          <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                            {doc.category}
                          </span>
                          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${getStatusStyle(doc.status)}`}>
                            {getStatusLabelText(doc.status)}
                          </span>
                        </div>

                        <h3 className="text-xs font-bold text-slate-900 mt-2 truncate max-w-xl">{doc.documentTitle}</h3>
                        
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-slate-400 font-medium">
                          <span className="flex items-center text-slate-500 font-semibold">
                            <Briefcase className="w-3 h-3 mr-1 text-slate-400" />
                            {proj.code} • {proj.name}
                          </span>
                          <span className="flex items-center text-indigo-600 font-semibold">
                            <Percent className="w-3 h-3 mr-1" />
                            Milestone: {doc.milestoneName}
                          </span>
                          <span className="flex items-center">
                            <Calendar className="w-3 h-3 mr-1" />
                            Received: {doc.receivedDate}
                          </span>
                          {doc.attachments && doc.attachments.length > 0 && (
                            <span className="flex items-center text-emerald-600 font-bold bg-emerald-50 px-1.5 rounded">
                              <Paperclip className="w-3 h-3 mr-1" />
                              {doc.attachments.length} files
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Cash Progress Tracking right inside the card */}
                      <div className="shrink-0 flex items-center space-x-4 border-t md:border-t-0 border-slate-100 pt-3 md:pt-0">
                        <div className="text-right">
                          <span className="text-[9px] font-mono text-slate-400 uppercase font-bold block">Invoiced Balance</span>
                          <span className="text-xs font-extrabold text-slate-700">{formatCurrency(docInvSum)}</span>
                          <div className="mt-0.5 text-[9px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.2 rounded inline-block">
                            Collected: {formatCurrency(docPaySum)}
                          </div>
                        </div>

                        {/* Quick card action buttons */}
                        <div className="flex items-center space-x-1">
                          <button
                            title="Print Submittal Log"
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePrintDocumentRecord(doc);
                            }}
                            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                          
                          {canManageDocs && (
                            <>
                              <button
                                title="Edit submittal parameters"
                                onClick={(e) => handleOpenEditDoc(doc, e)}
                                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-lg transition"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                title="Delete Controlled entry"
                                onClick={(e) => handleDeleteDoc(doc, e)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-50 rounded-lg transition"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* RIGHT DETAILS PANE: Comments, Updates, Partial Inflow logs, Attachments */}
            {selectedDoc && (
              <div 
                id="doc-controller-details-panel" 
                className={`w-96 border-l border-slate-200 bg-white flex flex-col h-full shrink-0 transition-transform lg:translate-x-0 lg:relative lg:pointer-events-auto lg:z-10 ${
                  mobileDetailOpen ? 'translate-x-0' : 'translate-x-full absolute pointer-events-none'
                }`}
              >
                {/* Panel Header */}
                <div className="p-4 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between shrink-0">
                  <div className="overflow-hidden">
                    <span className="text-[10px] font-mono font-extrabold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100/50 uppercase">
                      {selectedDoc.documentNumber}
                    </span>
                    <h3 className="text-xs font-bold text-slate-800 mt-2 truncate">{selectedDoc.documentTitle}</h3>
                  </div>
                  <button 
                    onClick={() => {
                      setSelectedDocId(null);
                      setMobileDetailOpen(false);
                    }}
                    className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-600 shrink-0 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Main panel body */}
                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                  
                  {/* Status Banner */}
                  <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2">
                    <span className="text-[9px] font-mono text-slate-400 uppercase font-bold tracking-wider block">Assigned Engineer & Progress</span>
                    <div className="flex items-center space-x-2">
                      <div className="bg-indigo-50 p-1.5 rounded-lg text-indigo-600 font-bold text-xs uppercase border border-indigo-100">
                        {selectedDoc.assignedControllerName?.substring(0,2) || 'EC'}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-800">{selectedDoc.assignedControllerName}</h4>
                        <p className="text-[9px] text-slate-400 mt-0.5">Assigned Controlled Officer</p>
                      </div>
                    </div>
                    {selectedDoc.description && (
                      <p className="text-[11px] text-slate-500 bg-white p-2 rounded-lg border border-slate-100 mt-2 italic leading-relaxed">
                        "{selectedDoc.description}"
                      </p>
                    )}
                  </div>

                  {/* LIQUID CASH COLLECTION LOG (Add Invoice / Add Payments) */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-slate-400 uppercase font-bold tracking-wider flex items-center">
                        <DollarSign className="w-3.5 h-3.5 text-emerald-600 mr-1" />
                        <span>Treasury & Milestone Inflows</span>
                      </span>
                      <div className="flex items-center space-x-1.5">
                        <button
                          onClick={() => handleOpenAddInvoiceForDoc(selectedDoc.id)}
                          className="px-2 py-0.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[9px] font-extrabold rounded transition border border-indigo-200 cursor-pointer"
                        >
                          + Claim Invoice
                        </button>
                        <button
                          onClick={() => handleOpenAddPaymentForDoc(selectedDoc.id)}
                          className="px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[9px] font-extrabold rounded transition border border-emerald-200 cursor-pointer"
                        >
                          + Log Inflow
                        </button>
                      </div>
                    </div>

                    {/* Milestone Financial Summary Card */}
                    <div className="bg-gradient-to-br from-emerald-950 to-indigo-950 p-4 rounded-2xl text-white shadow-md">
                      <span className="text-[9px] font-mono text-emerald-300 uppercase tracking-wider font-bold">Liquid collection balance</span>
                      <h4 className="text-base font-extrabold mt-1">{formatCurrency(docFinanceSummary.totalPaid)}</h4>
                      <p className="text-[9px] text-indigo-200 mt-0.5">of {formatCurrency(docFinanceSummary.totalInvoiced)} Invoiced Value</p>
                      
                      <div className="grid grid-cols-2 gap-2 mt-3.5 pt-3.5 border-t border-white/10 text-[10px]">
                        <div>
                          <span className="text-white/60 block font-mono text-[9px]">Remaining Claim</span>
                          <span className="font-extrabold text-amber-300">{formatCurrency(docFinanceSummary.outstanding)}</span>
                        </div>
                        <div>
                          <span className="text-white/60 block font-mono text-[9px]">Transactions</span>
                          <span className="font-extrabold text-emerald-300">{docPayments.length} Receipts</span>
                        </div>
                      </div>
                    </div>

                    {/* Detailed transaction lines */}
                    <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                      {docInvoices.map(inv => (
                        <div key={inv.id} className="bg-slate-50 p-2 rounded-lg border border-slate-100 text-[10px] flex items-center justify-between">
                          <div>
                            <span className="font-extrabold text-slate-700">Claim Invoice: {inv.invoiceNumber}</span>
                            <span className="text-slate-400 block font-mono text-[9px] mt-0.5">Due: {inv.dueDate}</span>
                          </div>
                          <span className="font-extrabold text-indigo-600">{formatCurrency(inv.totalAmount)}</span>
                        </div>
                      ))}

                      {docPayments.map(pay => (
                        <div key={pay.id} className="bg-emerald-50/60 p-2 rounded-lg border border-emerald-100 text-[10px] flex items-center justify-between">
                          <div>
                            <span className="font-extrabold text-emerald-800">Wire Inflow: {pay.bankRef}</span>
                            <span className="text-emerald-500 block font-mono text-[9px] mt-0.5">Cleared: {pay.date}</span>
                          </div>
                          <div className="text-right">
                            <span className="font-extrabold text-emerald-700 block">{formatCurrency(pay.amount)}</span>
                            <span className="text-[8px] text-slate-400 font-mono">Partial Collection</span>
                          </div>
                        </div>
                      ))}

                      {docInvoices.length === 0 && docPayments.length === 0 && (
                        <div className="text-center py-4 text-slate-400 italic text-[11px] bg-slate-50/50 rounded-lg">
                          No financial claims or wire payments mapped yet.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ATTACHMENTS (Controlled files) */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-mono text-slate-400 uppercase font-bold tracking-wider flex items-center">
                      <Paperclip className="w-3.5 h-3.5 text-slate-400 mr-1" />
                      <span>Controlled Submittal Files</span>
                    </span>

                    {/* List of files */}
                    <div className="space-y-1.5 max-h-40 overflow-y-auto">
                      {selectedDoc.attachments && selectedDoc.attachments.length > 0 ? (
                        selectedDoc.attachments.map((file, idx) => (
                          <div key={idx} className="bg-white p-2.5 rounded-lg border border-slate-200 text-[11px] flex items-center justify-between hover:border-indigo-200 transition">
                            <div className="flex items-center space-x-2 overflow-hidden flex-1">
                              <FileText className="w-4 h-4 text-indigo-500 shrink-0" />
                              <div className="overflow-hidden">
                                <h5 className="font-bold text-slate-700 truncate" title={file.name}>{file.name}</h5>
                                <span className="text-[9px] text-slate-400 font-mono block mt-0.5">{file.size} • Uploaded {file.uploadedAt || 'N/A'}</span>
                              </div>
                            </div>
                            <div className="flex items-center space-x-1 shrink-0 ml-2">
                              {file.url && (
                                <a
                                  href={file.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-50 transition shrink-0"
                                  title="View File"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </a>
                              )}
                              <a
                                href={file.url || '#'}
                                download={file.name}
                                onClick={(e) => {
                                  if (!file.url) {
                                    e.preventDefault();
                                    onAddNotification(`File not found on server: ${file.name}`, 'alert');
                                  } else {
                                    onAddNotification(`Downloading controlled transmittal file ${file.name}...`, 'info');
                                  }
                                }}
                                className="p-1 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-50 transition shrink-0"
                                title="Download File"
                              >
                                <FileDown className="w-3.5 h-3.5" />
                              </a>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-[11px] text-slate-400 italic text-center py-3 bg-slate-50 rounded-lg">No submittal drawings attached yet.</p>
                      )}
                    </div>

                    {/* Add attachment form inside panel */}
                    <form onSubmit={handleAddFileToSelectedDoc} className="pt-2 border-t border-slate-100 flex gap-1.5">
                      <input 
                        type="text" 
                        required
                        placeholder="Document filename (e.g. mix_spec.pdf)..."
                        value={newFileName}
                        onChange={e => setNewFileName(e.target.value)}
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-[11px] focus:ring-1 focus:ring-indigo-500 outline-none"
                      />
                      <input 
                        type="text" 
                        placeholder="2.4 MB"
                        value={newFileSize}
                        onChange={e => setNewFileSize(e.target.value)}
                        className="w-16 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-[11px] text-center focus:ring-1 focus:ring-indigo-500 outline-none"
                      />
                      <button 
                        type="submit" 
                        className="p-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </form>
                  </div>

                  {/* COMMENTS */}
                  <div className="space-y-3">
                    <span className="text-[10px] font-mono text-slate-400 uppercase font-bold tracking-wider flex items-center">
                      <MessageSquare className="w-3.5 h-3.5 text-slate-400 mr-1" />
                      <span>Auditor Comments ({selectedDoc.comments?.length || 0})</span>
                    </span>

                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {selectedDoc.comments && selectedDoc.comments.length > 0 ? (
                        selectedDoc.comments.map(c => (
                          <div key={c.id} className="bg-slate-50/60 p-2.5 rounded-xl border border-slate-200/50 space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-extrabold text-slate-700">{c.user}</span>
                              <span className="text-[8px] text-slate-400 font-mono">{c.date}</span>
                            </div>
                            <span className="text-[9px] font-bold text-indigo-600 block">{c.role}</span>
                            <p className="text-[11px] text-slate-600 leading-normal">{c.text}</p>
                          </div>
                        ))
                      ) : (
                        <p className="text-[11px] text-slate-400 italic text-center py-4 bg-slate-50/40 rounded-lg">No audit remarks yet.</p>
                      )}
                    </div>

                    <form onSubmit={handleAddComment} className="flex gap-2">
                      <input 
                        type="text" 
                        required
                        placeholder="Write audit comment..."
                        value={newCommentText}
                        onChange={e => setNewCommentText(e.target.value)}
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:ring-1 focus:ring-indigo-500 outline-none"
                      />
                      <button 
                        type="submit" 
                        className="px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs transition cursor-pointer"
                      >
                        Send
                      </button>
                    </form>
                  </div>

                  {/* AUDIT UPDATES HISTORY */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-mono text-slate-400 uppercase font-bold tracking-wider flex items-center">
                      <History className="w-3.5 h-3.5 text-slate-400 mr-1" />
                      <span>Submittal Audit Logs</span>
                    </span>

                    <div className="border-l border-slate-200 ml-2.5 pl-3.5 py-1 space-y-3 max-h-48 overflow-y-auto pr-1">
                      {selectedDoc.updates && selectedDoc.updates.length > 0 ? (
                        selectedDoc.updates.map(up => (
                          <div key={up.id} className="relative text-[10px] space-y-0.5">
                            <div className="absolute -left-[20px] top-1 w-2.5 h-2.5 rounded-full bg-indigo-500 border-2 border-white" />
                            <span className="text-slate-400 font-mono block">{up.date}</span>
                            <p className="text-slate-600 font-medium">
                              <span className="font-bold text-slate-800">{up.user}</span> ({up.role}): {up.text}
                            </p>
                          </div>
                        ))
                      ) : (
                        <p className="text-[10px] text-slate-400 italic">No historical revisions tracked.</p>
                      )}
                    </div>
                  </div>

                </div>
              </div>
            )}

          </div>

        </div>
      </div>

      {/* MODAL 1: ADD / EDIT DOCUMENT CONTROLLER LOG ENTRY */}
      {isDocFormOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-2xl w-full flex flex-col max-h-[90vh] overflow-hidden">
            
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h4 className="text-xs font-extrabold text-slate-800 uppercase font-mono tracking-wider flex items-center space-x-1.5">
                <FileText className="w-4 h-4 text-indigo-600" />
                <span>{editingDoc ? 'Edit submittal parameters' : 'Log New Engineering Controlled Submittal'}</span>
              </h4>
              <button 
                type="button" 
                onClick={() => setIsDocFormOpen(false)} 
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-50 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveDoc} className="flex-1 overflow-y-auto p-5 space-y-4">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Project */}
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase font-bold">Target Project</label>
                  <select
                    required
                    value={formProjectId}
                    onChange={e => {
                      const pId = e.target.value;
                      setFormProjectId(pId);
                      const projectMils = milestones.filter(m => m.projectId === pId);
                      setFormMilestoneId(projectMils[0]?.id || '');
                    }}
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-xs mt-1 bg-white focus:ring-1 focus:ring-indigo-500 outline-none font-semibold text-slate-700"
                  >
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>[{p.code}] {p.name}</option>
                    ))}
                  </select>
                </div>

                {/* Milestone */}
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase font-bold">Milestone association</label>
                  <select
                    value={formMilestoneId}
                    onChange={e => setFormMilestoneId(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-xs mt-1 bg-white focus:ring-1 focus:ring-indigo-500 outline-none font-semibold text-slate-700"
                  >
                    <option value="none">No Milestone Association</option>
                    {milestones.filter(m => m.projectId === formProjectId).map(m => (
                      <option key={m.id} value={m.id}>{m.name} ({m.progress}% done)</option>
                    ))}
                    {milestones.filter(m => m.projectId === formProjectId).length === 0 && (
                      <option disabled value="">No milestones registered</option>
                    )}
                  </select>
                </div>

                {/* Document Title */}
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-mono text-slate-400 uppercase font-bold">Transmittal / Submittal Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Structural Rebar Steel Layout Drawing for Villa 4 Foundation"
                    value={formTitle}
                    onChange={e => setFormTitle(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-xs mt-1 focus:ring-1 focus:ring-indigo-500 outline-none font-medium text-slate-700"
                  />
                </div>

                {/* Document Number */}
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase font-bold">Document Controlled Number</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. WF-DC-MALQA-STR-004"
                    value={formNumber}
                    onChange={e => setFormNumber(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-xs mt-1 focus:ring-1 focus:ring-indigo-500 outline-none font-medium text-slate-700"
                  />
                </div>

                {/* Revision */}
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase font-bold">Revision Level</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rev 0, Rev A, Rev 2.1"
                    value={formRevision}
                    onChange={e => setFormRevision(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-xs mt-1 focus:ring-1 focus:ring-indigo-500 outline-none font-medium text-slate-700"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase font-bold">Submittal Category</label>
                  <select
                    required
                    value={formCategory}
                    onChange={e => setFormCategory(e.target.value as DocumentController['category'])}
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-xs mt-1 bg-white focus:ring-1 focus:ring-indigo-500 outline-none font-semibold text-slate-700"
                  >
                    <option value="Shop Drawing">Shop Drawing</option>
                    <option value="Material Submittal">Material Submittal</option>
                    <option value="Method Statement">Method Statement</option>
                    <option value="Inspection Request">Inspection Request</option>
                    <option value="As-Built Drawing">As-Built Drawing</option>
                    <option value="Calculation Sheet">Calculation Sheet</option>
                    <option value="Certificate">Certificate</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase font-bold">Submittal Status</label>
                  <select
                    required
                    value={formStatus}
                    onChange={e => setFormStatus(e.target.value as DocumentController['status'])}
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-xs mt-1 bg-white focus:ring-1 focus:ring-indigo-500 outline-none font-semibold text-slate-700"
                  >
                    <option value="pending_review">Pending Review</option>
                    <option value="under_review">Under Client Review</option>
                    <option value="approved">Approved</option>
                    <option value="approved_with_comments">Approved with Comments</option>
                    <option value="rejected">Rejected</option>
                    <option value="revised_required">Revision Required</option>
                  </select>
                </div>

                {/* Assigned Controller */}
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-mono text-slate-400 uppercase font-bold">Assigned Review Officer</label>
                  <select
                    required
                    value={formControllerId}
                    onChange={e => setFormControllerId(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-xs mt-1 bg-white focus:ring-1 focus:ring-indigo-500 outline-none font-semibold text-slate-700"
                  >
                    {availableUsers.map(u => (
                      <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                    ))}
                  </select>
                </div>

                {/* Description */}
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-mono text-slate-400 uppercase font-bold">Detailed specifications & parameters</label>
                  <textarea
                    rows={3}
                    placeholder="Specify materials mix design ratios, laboratory reports codes, technical codes met, structural compliance metrics, or specific drawings dimensions..."
                    value={formDescription}
                    onChange={e => setFormDescription(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-xs mt-1 focus:ring-1 focus:ring-indigo-500 outline-none font-medium text-slate-700"
                  />
                </div>
              </div>

              {/* Drag and Drop File Attachments block */}
              <div className="space-y-2">
                <label className="block text-[10px] font-mono text-slate-400 uppercase font-bold">Controlled Transmittal Attachments</label>
                
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${
                    isDragging 
                      ? 'border-indigo-500 bg-indigo-50/50 scale-[0.99]' 
                      : 'border-slate-300 hover:border-slate-400 bg-slate-50'
                  }`}
                >
                  <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-700">Drag & drop drawings or material certificates here (Up to 5 files)</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Supports PDF, DWG, BIM, XLSX, DOCX up to 50MB</p>
                  
                  <div className="flex flex-wrap items-center justify-center gap-2 mt-3">
                    <label className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-[10px] font-bold rounded-lg cursor-pointer shadow-xs transition">
                      Browse Files
                      <input 
                        type="file" 
                        multiple 
                        onChange={handleFileChange}
                        className="hidden" 
                      />
                    </label>

                    <button
                      type="button"
                      onClick={handleUploadFiveDemoFiles}
                      className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-[10px] font-bold rounded-lg shadow-xs transition cursor-pointer"
                    >
                      Add 5 Demo Engineering Files
                    </button>
                  </div>
                </div>

                {/* Queued attachments log */}
                {draftAttachments.length > 0 && (
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-2 max-h-32 overflow-y-auto">
                    <span className="text-[9px] font-mono text-slate-400 uppercase font-bold block">Queued Drawings ({draftAttachments.length})</span>
                    <div className="space-y-1.5">
                      {draftAttachments.map((f, i) => (
                        <div key={i} className="flex items-center justify-between text-[10px] bg-white p-2 rounded-md border border-slate-200">
                          <span className="font-bold text-slate-700 truncate max-w-md">{f.name} ({f.size})</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveDraftAttachment(i)}
                            className="text-rose-500 hover:text-rose-700 p-0.5 hover:bg-slate-50 rounded"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

            </form>

            <div className="p-5 border-t border-slate-100 flex justify-end space-x-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsDocFormOpen(false)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveDoc}
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
              >
                {editingDoc ? 'Apply changes' : 'Log Submittal'}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL 2: ISSUE INVOICE DIRECTLY TIED TO THE RECORD */}
      {isInvoiceModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-xl w-full flex flex-col">
            
            <div className="p-5 border-b border-slate-100 flex justify-between items-center">
              <h4 className="text-xs font-extrabold text-slate-800 uppercase font-mono tracking-wider flex items-center space-x-1.5">
                <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
                <span>Issue Milestone Valuation Claim</span>
              </h4>
              <button 
                type="button" 
                onClick={() => setIsInvoiceModalOpen(false)} 
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-50 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveDocInvoice} className="p-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase font-bold">Document controller origin</label>
                  <input
                    type="text"
                    disabled
                    value={documentControllers.find(d => d.id === linkDocId)?.documentNumber || ''}
                    className="w-full bg-slate-100 border border-slate-200 rounded-lg p-2.5 text-xs mt-1 text-slate-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase font-bold">Valuation Invoice Number</label>
                  <input
                    type="text"
                    required
                    value={invNumber}
                    onChange={e => setInvNumber(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-xs mt-1 focus:ring-1 focus:ring-indigo-500 outline-none font-semibold text-slate-700"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase font-bold">Net base claim (SAR)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={invAmount}
                    onChange={e => {
                      const base = Number(e.target.value);
                      setInvAmount(base);
                      setInvVat(Math.round(base * 0.15));
                      setInvRetention(Math.round(base * 0.05));
                    }}
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-xs mt-1 focus:ring-1 focus:ring-indigo-500 outline-none font-medium text-slate-700"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase font-bold">15% ZATCA VAT (SAR)</label>
                  <input
                    type="number"
                    value={invVat}
                    onChange={e => setInvVat(Number(e.target.value))}
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-xs mt-1 focus:ring-1 focus:ring-indigo-500 outline-none font-medium text-slate-700"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase font-bold">5% Contract Retention Holdback (SAR)</label>
                  <input
                    type="number"
                    value={invRetention}
                    onChange={e => setInvRetention(Number(e.target.value))}
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-xs mt-1 focus:ring-1 focus:ring-indigo-500 outline-none font-medium text-slate-700"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase font-bold">Invoice Due Date</label>
                  <input
                    type="date"
                    required
                    value={invDueDate}
                    onChange={e => setInvDueDate(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-xs mt-1 focus:ring-1 focus:ring-indigo-500 outline-none font-medium text-slate-700"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsInvoiceModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
                >
                  Confirm Valuation Claim
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* MODAL 3: LOG PAYMENT RECEIPT DIRECTLY TIED TO THE RECORD (SUPPORTING PARTIALS) */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-xl w-full flex flex-col">
            
            <div className="p-5 border-b border-slate-100 flex justify-between items-center">
              <h4 className="text-xs font-extrabold text-slate-800 uppercase font-mono tracking-wider flex items-center space-x-1.5">
                <PlusCircle className="w-4 h-4 text-emerald-600" />
                <span>Log Cash Inflow Receipt</span>
              </h4>
              <button 
                type="button" 
                onClick={() => setIsPaymentModalOpen(false)} 
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-50 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveDocPayment} className="p-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase font-bold">Associated invoice claim</label>
                  <select
                    value={payInvoiceId}
                    onChange={e => {
                      const matchedInv = invoices.find(inv => inv.id === e.target.value);
                      setPayInvoiceId(e.target.value);
                      if (matchedInv) {
                        setPayAmount(matchedInv.totalAmount - (matchedInv.receivedAmount || 0));
                      }
                    }}
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-xs mt-1 bg-white focus:ring-1 focus:ring-indigo-500 outline-none font-semibold text-slate-700"
                  >
                    <option value="">Direct Collection / General Advance</option>
                    {invoices.filter(i => i.projectId === documentControllers.find(d => d.id === linkDocId)?.projectId).map(i => (
                      <option key={i.id} value={i.id}>[{i.invoiceNumber}] - Outstanding: {formatCurrency(i.totalAmount - (i.receivedAmount || 0))}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase font-bold">Inflow Amount (SAR)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={payAmount}
                    onChange={e => setPayAmount(Number(e.target.value))}
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-xs mt-1 focus:ring-1 focus:ring-indigo-500 outline-none font-semibold text-slate-700"
                  />
                  <span className="text-[9px] text-slate-400 font-medium block mt-1">If partial payment, you can log another payment under this submittal later.</span>
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase font-bold">Clearing Date</label>
                  <input
                    type="date"
                    required
                    value={payDate}
                    onChange={e => setPayDate(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-xs mt-1 focus:ring-1 focus:ring-indigo-500 outline-none font-medium text-slate-700"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase font-bold">Collection Channel</label>
                  <select
                    value={payMethod}
                    onChange={e => setPayMethod(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-xs mt-1 bg-white focus:ring-1 focus:ring-indigo-500 outline-none font-semibold text-slate-700"
                  >
                    <option value="Bank Transfer">SADAD Bank Transfer</option>
                    <option value="Cash">Cash Voucher</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[10px] font-mono text-slate-400 uppercase font-bold">Bank Clearing Wire Reference (ZATCA Log)</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. SADAD-REF-8495039"
                    value={payBankRef}
                    onChange={e => setPayBankRef(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-xs mt-1 focus:ring-1 focus:ring-indigo-500 outline-none font-medium text-slate-700"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
                >
                  Clear Cash Inflow
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
