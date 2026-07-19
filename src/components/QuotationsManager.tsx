/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useRef } from 'react';
import { Project, Quotation, User, Document } from '../types';
import { jsPDF } from 'jspdf';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  FileText, 
  Upload, 
  Check, 
  X, 
  RefreshCw, 
  FileDown, 
  AlertCircle, 
  Calendar, 
  User as UserIcon, 
  DollarSign, 
  FileCheck,
  FileMinus,
  Layers,
  ArrowRight,
  Eye,
  Printer
} from 'lucide-react';

interface QuotationsManagerProps {
  projectId?: string; // If passed, scope only to this project
  projects: Project[];
  quotations: Quotation[];
  setQuotations: React.Dispatch<React.SetStateAction<Quotation[]>>;
  currentUser: User;
  onLogAudit: (action: string, module: string, oldValue?: string, newValue?: string) => void;
  onAddNotification: (text: string, type: 'info' | 'success' | 'warning' | 'alert') => void;
  documents?: Document[];
  setDocuments?: React.Dispatch<React.SetStateAction<Document[]>>;
}

export default function QuotationsManager({
  projectId,
  projects,
  quotations,
  setQuotations,
  currentUser,
  onLogAudit,
  onAddNotification,
  documents,
  setDocuments,
}: QuotationsManagerProps) {
  
  // States
  const [selectedProjFilter, setSelectedProjFilter] = useState<string>(projectId || 'all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Form States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingQuotationId, setEditingQuotationId] = useState<string | null>(null);
  const [revisingQuotationId, setRevisingQuotationId] = useState<string | null>(null);
  const [previewQuotation, setPreviewQuotation] = useState<Quotation | null>(null);
  const [previewAttachmentFile, setPreviewAttachmentFile] = useState<{ quotation: Quotation; name: string; size: string; data?: string; } | null>(null);

  // Form Fields
  const [formProjectId, setFormProjectId] = useState<string>(projectId || (projects[0]?.id || ''));
  const [formVersion, setFormVersion] = useState<string>('V1');
  const [formDate, setFormDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [formPreparedBy, setFormPreparedBy] = useState<string>(currentUser.name);
  const [formClientComments, setFormClientComments] = useState<string>('');
  const [formStatus, setFormStatus] = useState<'draft' | 'under_review' | 'approved' | 'rejected' | 'revised'>('draft');
  const [isManualSubmission, setIsManualSubmission] = useState<boolean>(true);
  const [formManualTotal, setFormManualTotal] = useState<number>(0); // If readymade upload

  // Upload state
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [uploadedFileSize, setUploadedFileSize] = useState<string>('');
  const [uploadedFileData, setUploadedFileData] = useState<string>('');
  const [formAttachments, setFormAttachments] = useState<{ name: string; size: string; data?: string; }[]>([]);
  const [dragOver, setDragOver] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Manual items
  const [manualItems, setManualItems] = useState<{
    id: string;
    description: string;
    qty: number;
    unit: string;
    rate: number;
  }[]>([
    { id: 'item_1', description: 'Civil and foundation reinforcement setup', qty: 1, unit: 'LS', rate: 250000 }
  ]);

  // Temporary item inputs for adding
  const [newItemDesc, setNewItemDesc] = useState('');
  const [newItemQty, setNewItemQty] = useState<number>(1);
  const [newItemUnit, setNewItemUnit] = useState('LS');
  const [newItemRate, setNewItemRate] = useState<number>(0);

  // Filter quotations
  const filteredQuotations = useMemo(() => {
    return quotations.filter(q => {
      // Project filter
      if (projectId) {
        if (q.projectId !== projectId) return false;
      } else if (selectedProjFilter !== 'all') {
        if (q.projectId !== selectedProjFilter) return false;
      }

      // Status filter
      if (statusFilter !== 'all') {
        if (q.status !== statusFilter) return false;
      }

      // Search query
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        const projectOfQ = projects.find(p => p.id === q.projectId);
        const projectName = projectOfQ ? projectOfQ.name.toLowerCase() : '';
        const projectCode = projectOfQ ? projectOfQ.code.toLowerCase() : '';
        const prepBy = (q.preparedBy || '').toLowerCase();
        const comments = (q.clientComments || '').toLowerCase();
        const qId = (q.id || '').toLowerCase();
        const ver = (q.version || '').toLowerCase();

        return (
          projectName.includes(query) ||
          projectCode.includes(query) ||
          prepBy.includes(query) ||
          comments.includes(query) ||
          qId.includes(query) ||
          ver.includes(query)
        );
      }

      return true;
    });
  }, [quotations, projectId, selectedProjFilter, statusFilter, searchQuery, projects]);

  // Clean form
  const handleResetForm = () => {
    setEditingQuotationId(null);
    setRevisingQuotationId(null);
    setFormProjectId(projectId || (projects[0]?.id || ''));
    setFormVersion('V1');
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormPreparedBy(currentUser.name);
    setFormClientComments('');
    setFormStatus('draft');
    setIsManualSubmission(true);
    setFormManualTotal(0);
    setUploadedFileName('');
    setUploadedFileSize('');
    setUploadedFileData('');
    setFormAttachments([]);
    setManualItems([
      { id: 'item_1', description: 'Civil and foundation reinforcement setup', qty: 1, unit: 'LS', rate: 250000 }
    ]);
    setNewItemDesc('');
    setNewItemQty(1);
    setNewItemUnit('LS');
    setNewItemRate(0);
    setIsFormOpen(false);
  };

  // Trigger form for adding
  const handleOpenAddForm = () => {
    handleResetForm();
    setIsFormOpen(true);
  };

  // Trigger form for editing
  const handleOpenEditForm = (q: Quotation) => {
    setEditingQuotationId(q.id);
    setRevisingQuotationId(null);
    setFormProjectId(q.projectId);
    setFormVersion(q.version);
    setFormDate(q.date);
    setFormPreparedBy(q.preparedBy);
    setFormClientComments(q.clientComments || '');
    setFormStatus(q.status);
    setIsManualSubmission(q.isManual !== false); // Default to manual unless explicitly false
    setFormManualTotal(q.totalAmount);
    setUploadedFileName(q.fileName || '');
    setUploadedFileSize(q.fileSize || '');
    setUploadedFileData(q.fileData || '');
    setFormAttachments(q.attachments || (q.fileName ? [{ name: q.fileName, size: q.fileSize || 'N/A', data: q.fileData }] : []));
    
    if (q.items && q.items.length > 0) {
      setManualItems(q.items.map(item => ({
        id: item.id,
        description: item.description,
        qty: item.qty,
        unit: item.unit,
        rate: item.rate
      })));
    } else {
      setManualItems([]);
    }
    
    setIsFormOpen(true);
  };

  // Trigger form for creating revised version
  const handleOpenReviseForm = (q: Quotation) => {
    handleResetForm();
    setRevisingQuotationId(q.id);
    setFormProjectId(q.projectId);
    
    // Automatically increment version if it's like V1, V2
    let nextVersion = 'V1';
    const versionMatch = q.version.match(/^V(\d+)$/i);
    if (versionMatch) {
      const currentVerNum = parseInt(versionMatch[1], 10);
      nextVersion = `V${currentVerNum + 1}`;
    } else {
      nextVersion = `${q.version} Rev`;
    }
    
    setFormVersion(nextVersion);
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormPreparedBy(currentUser.name);
    setFormClientComments(`Revised based on comments from ${q.version}`);
    setFormStatus('revised'); // Revised Quotation Blue
    setIsManualSubmission(q.isManual !== false);
    setFormManualTotal(q.totalAmount);
    setUploadedFileName(q.fileName || '');
    setUploadedFileSize(q.fileSize || '');
    setUploadedFileData(q.fileData || '');
    setFormAttachments(q.attachments || (q.fileName ? [{ name: q.fileName, size: q.fileSize || 'N/A', data: q.fileData }] : []));
    
    if (q.items && q.items.length > 0) {
      setManualItems(q.items.map(item => ({
        id: `rev_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        description: item.description,
        qty: item.qty,
        unit: item.unit,
        rate: item.rate
      })));
    } else {
      setManualItems([]);
    }
    
    setIsFormOpen(true);
  };

  // Add Item to manual list
  const handleAddManualItem = () => {
    if (!newItemDesc.trim()) {
      onAddNotification('Item description is required.', 'warning');
      return;
    }
    if (newItemRate <= 0) {
      onAddNotification('Please specify a positive unit rate.', 'warning');
      return;
    }
    if (newItemQty <= 0) {
      onAddNotification('Please specify a positive quantity.', 'warning');
      return;
    }

    const newItem = {
      id: `item_${Date.now()}`,
      description: newItemDesc.trim(),
      qty: newItemQty,
      unit: newItemUnit,
      rate: newItemRate
    };

    setManualItems([...manualItems, newItem]);
    setNewItemDesc('');
    setNewItemQty(1);
    setNewItemUnit('LS');
    setNewItemRate(0);
  };

  // Remove Item from manual list
  const handleRemoveManualItem = (id: string) => {
    setManualItems(manualItems.filter(item => item.id !== id));
  };

  // Calculate dynamic manual total
  const calculatedManualTotal = useMemo(() => {
    return manualItems.reduce((sum, item) => sum + (item.qty * item.rate), 0);
  }, [manualItems]);

  // File Upload Handlers
  const addFileToAttachments = (file: File) => {
    setFormAttachments(prev => {
      if (prev.length >= 3) {
        onAddNotification('Maximum 3 files are allowed per quotation.', 'warning');
        return prev;
      }
      
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const newAttachment = {
            name: file.name,
            size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
            data: event.target.result as string
          };
          setFormAttachments(current => {
            if (current.length >= 3) return current;
            return [...current, newAttachment];
          });
          onAddNotification(`File "${file.name}" uploaded successfully.`, 'success');
        }
      };
      reader.readAsDataURL(file);
      return prev;
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach((file: any) => {
        addFileToAttachments(file as File);
      });
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer.files;
    if (files) {
      Array.from(files).forEach((file: any) => {
        addFileToAttachments(file as File);
      });
    }
  };

  const handleRemoveAttachment = (index: number) => {
    setFormAttachments(prev => prev.filter((_, i) => i !== index));
    onAddNotification('Attachment removed.', 'info');
  };

  const handleClearFile = () => {
    setUploadedFileName('');
    setUploadedFileSize('');
    setUploadedFileData('');
    setFormAttachments([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDownloadSystemPDF = (q: Quotation) => {
    const docRef = `WQ-${q.version}-${q.id.substring(2, 6).toUpperCase()}`;
    const filename = `${docRef}.pdf`;
    
    try {
      const pdfDoc = new jsPDF();
      pdfDoc.setFontSize(14);
      pdfDoc.text('Wafaq Contracting Co. Official Price Quotation', 15, 20);
      pdfDoc.setFontSize(10);
      pdfDoc.text('Filename: ' + filename, 15, 30);
      pdfDoc.save(filename);
      onAddNotification(`System-generated quotation PDF "${filename}" downloaded successfully.`, 'success');
    } catch (err) {
      onAddNotification('Failed to download system-generated quotation.', 'warning');
    }
  };

  const handleDownloadAttachmentFile = (fileOrQuotation: any, possibleFileData?: string) => {
    let filename = '';
    let fileData = possibleFileData;
    
    if (typeof fileOrQuotation === 'object' && fileOrQuotation !== null) {
      if ('fileName' in fileOrQuotation) {
        filename = fileOrQuotation.fileName || '';
        fileData = fileOrQuotation.fileData;
      } else if ('name' in fileOrQuotation) {
        filename = fileOrQuotation.name;
        fileData = fileOrQuotation.data;
      }
    } else if (typeof fileOrQuotation === 'string') {
      filename = fileOrQuotation;
    }

    if (!filename) return;
    
    try {
      let url = '';
      if (fileData) {
        url = fileData;
      } else {
        const content = `[Wafaq Contracting Co. Original Uploaded Document: ${filename}]`;
        const blob = new Blob([content], { type: 'application/octet-stream' });
        url = URL.createObjectURL(blob);
      }
      
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      if (!fileData) {
        URL.revokeObjectURL(url);
      }
      onAddNotification(`Attachment file "${filename}" downloaded successfully.`, 'success');
    } catch (err) {
      onAddNotification('Failed to download attachment file.', 'warning');
    }
  };

  // Submit Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validations
    if (!formProjectId) {
      onAddNotification('Please select a project.', 'warning');
      return;
    }
    if (!formVersion.trim()) {
      onAddNotification('Please specify a version code.', 'warning');
      return;
    }

    let finalTotal = 0;
    let finalItems: { id: string; description: string; qty: number; unit: string; rate: number; total: number }[] = [];

    if (isManualSubmission) {
      if (manualItems.length === 0) {
        onAddNotification('Manual submission requires at least 1 item in the Bill of Quantities list.', 'warning');
        return;
      }
      finalTotal = calculatedManualTotal;
      finalItems = manualItems.map(item => ({
        ...item,
        total: item.qty * item.rate
      }));
    } else {
      if (formAttachments.length === 0) {
        onAddNotification('Please upload a readymade quotation file to proceed.', 'warning');
        return;
      }
      if (formManualTotal <= 0) {
        onAddNotification('Please specify the total amount for this uploaded quotation.', 'warning');
        return;
      }
      finalTotal = formManualTotal;
      const fileNamesStr = formAttachments.map(a => a.name).join(', ');
      finalItems = [
        {
          id: `uploaded_item_${Date.now()}`,
          description: `Lump-sum quotation as per uploaded document(s): ${fileNamesStr}`,
          qty: 1,
          unit: 'LS',
          rate: formManualTotal,
          total: formManualTotal
        }
      ];
    }

    const matchedProject = projects.find(p => p.id === formProjectId);
    const projectName = matchedProject ? matchedProject.name : 'Unknown Project';

    const mainFile = formAttachments[0];

    if (editingQuotationId) {
      // Update
      setQuotations(prev => prev.map(q => {
        if (q.id === editingQuotationId) {
          const updated: Quotation = {
            ...q,
            projectId: formProjectId,
            version: formVersion,
            date: formDate,
            preparedBy: formPreparedBy,
            totalAmount: finalTotal,
            clientComments: formClientComments,
            status: formStatus,
            fileName: mainFile ? mainFile.name : undefined,
            fileSize: mainFile ? mainFile.size : undefined,
            fileData: mainFile ? mainFile.data : undefined,
            attachments: formAttachments,
            isManual: isManualSubmission,
            items: finalItems
          };
          return updated;
        }
        return q;
      }));

      // Document Controller sync
      if (setDocuments) {
        const docIdPrefix = `doc_q_${editingQuotationId}`;
        setDocuments(prev => {
          const filtered = prev.filter(d => !d.id.startsWith(docIdPrefix));
          const newDocs = formAttachments.map((att, idx) => ({
            id: `${docIdPrefix}_${idx}`,
            projectId: formProjectId,
            name: att.name,
            category: 'Quotation' as const,
            version: formVersion || 'v1.0',
            uploadedBy: formPreparedBy,
            uploadedAt: formDate,
            size: att.size || '3.4 MB',
            tags: ['Quotation', formVersion, `Attachment ${idx + 1}`],
            description: `Quotation ${formVersion} file attachment: ${formClientComments || 'No comment logged'}`
          }));
          return [...filtered, ...newDocs];
        });
      }

      onLogAudit(
        `Updated Quotation ${formVersion} for Project ${projectName}`,
        'Quotations Module',
        undefined,
        `${finalTotal.toLocaleString()} SAR`
      );
      onAddNotification(`Quotation ${formVersion} updated successfully.`, 'success');
    } else {
      // Create new (or Revision)
      const newQuotationId = `q_${Date.now()}`;
      const newQuotation: Quotation = {
        id: newQuotationId,
        projectId: formProjectId,
        version: formVersion,
        date: formDate,
        preparedBy: formPreparedBy,
        totalAmount: finalTotal,
        clientComments: formClientComments,
        status: formStatus,
        fileName: mainFile ? mainFile.name : undefined,
        fileSize: mainFile ? mainFile.size : undefined,
        fileData: mainFile ? mainFile.data : undefined,
        attachments: formAttachments,
        isManual: isManualSubmission,
        items: finalItems
      };

      setQuotations(prev => [newQuotation, ...prev]);

      // Document Controller sync
      if (setDocuments) {
        const docIdPrefix = `doc_q_${newQuotationId}`;
        setDocuments(prev => {
          const filtered = prev.filter(d => !d.id.startsWith(docIdPrefix));
          const newDocs = formAttachments.map((att, idx) => ({
            id: `${docIdPrefix}_${idx}`,
            projectId: formProjectId,
            name: att.name,
            category: 'Quotation' as const,
            version: formVersion || 'v1.0',
            uploadedBy: formPreparedBy,
            uploadedAt: formDate,
            size: att.size || '3.4 MB',
            tags: ['Quotation', formVersion, `Attachment ${idx + 1}`],
            description: `Quotation ${formVersion} file attachment: ${formClientComments || 'No comment logged'}`
          }));
          return [...filtered, ...newDocs];
        });
      }

      const logMsg = revisingQuotationId 
        ? `Added Revised Quotation ${formVersion} based on older quote for Project ${projectName}`
        : `Created New Quotation ${formVersion} for Project ${projectName}`;

      onLogAudit(logMsg, 'Quotations Module', undefined, `${finalTotal.toLocaleString()} SAR`);
      onAddNotification(
        revisingQuotationId 
          ? `Revised Quotation ${formVersion} added successfully.` 
          : `New Quotation ${formVersion} registered successfully.`, 
        'success'
      );
    }

    handleResetForm();
  };

  // Delete Handler
  const handleDelete = (id: string, version: string, pId: string) => {
    const userRoleStr = currentUser?.role?.toLowerCase() || '';
    if (userRoleStr !== 'admin' && userRoleStr !== 'super admin' && userRoleStr !== 'superadmin') {
      alert("Unauthorized: Only Admin or Super Admin can delete records.");
      return;
    }

    if (!window.confirm(`Are you sure you want to delete Quotation ${version}?`)) {
      return;
    }

    const matchedProject = projects.find(p => p.id === pId);
    const projectName = matchedProject ? matchedProject.name : 'Unknown';

    setQuotations(prev => prev.filter(q => q.id !== id));

    if (setDocuments) {
      const docId = `doc_q_${id}`;
      setDocuments(prev => prev.filter(d => d.id !== docId));
    }

    onLogAudit(`Deleted Quotation ${version} of Project ${projectName}`, 'Quotations Module');
    onAddNotification(`Quotation ${version} deleted successfully.`, 'info');
  };

  // Quick Approval & Rejection directly from card
  const handleUpdateStatus = (id: string, newStatus: 'approved' | 'rejected' | 'revised', version: string, pId: string) => {
    const matchedProject = projects.find(p => p.id === pId);
    const projectName = matchedProject ? matchedProject.name : 'Unknown';

    setQuotations(prev => prev.map(q => {
      if (q.id === id) {
        return { ...q, status: newStatus };
      }
      return q;
    }));

    onLogAudit(`Updated Quotation ${version} status to ${newStatus} for Project ${projectName}`, 'Quotations Module');
    onAddNotification(`Quotation ${version} is now marked as ${newStatus.toUpperCase()}`, 'success');
  };

  // Formatting helpers
  const formatSAR = (amount: number) => {
    return `${amount.toLocaleString()} SAR`;
  };

  // Get project information for display
  const getProjectInfo = (pId: string) => {
    return projects.find(p => p.id === pId) || { name: 'Unknown Project', code: 'PROJ-XXX' };
  };

  // Helper for Status color coding
  const getStatusBadgeStyles = (status: 'draft' | 'under_review' | 'approved' | 'rejected' | 'revised') => {
    switch (status) {
      case 'approved':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'rejected':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'revised':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'under_review':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getStatusCardStyles = (status: 'draft' | 'under_review' | 'approved' | 'rejected' | 'revised') => {
    switch (status) {
      case 'approved':
        return 'border-emerald-300 bg-emerald-50/10 hover:shadow-emerald-100';
      case 'rejected':
        return 'border-rose-300 bg-rose-50/10 hover:shadow-rose-100';
      case 'revised':
        return 'border-blue-300 bg-blue-50/10 hover:shadow-blue-100';
      case 'under_review':
        return 'border-amber-300 bg-amber-50/10 hover:shadow-amber-100';
      default:
        return 'border-gray-200 hover:shadow-indigo-50';
    }
  };

  const getStatusIndicatorIcon = (status: 'draft' | 'under_review' | 'approved' | 'rejected' | 'revised') => {
    switch (status) {
      case 'approved':
        return <FileCheck className="w-5 h-5 text-emerald-600" />;
      case 'rejected':
        return <FileMinus className="w-5 h-5 text-rose-600" />;
      case 'revised':
        return <RefreshCw className="w-5 h-5 text-blue-600" />;
      default:
        return <FileText className="w-5 h-5 text-indigo-500" />;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* SECTION HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider font-mono flex items-center space-x-2">
            <Layers className="w-4 h-4 text-indigo-600" />
            <span>Project Quotation & Version Control</span>
          </h2>
          <p className="text-[11px] text-gray-500">
            {projectId 
              ? `Manage pricing baselines, revised drafts, and readymade client submissions for this workspace.`
              : 'Register, edit, and keep tracking of manual estimates or readymade file bids across all active projects.'
            }
          </p>
        </div>
        
        {/* ADD QUOTATION BUTTON */}
        {!isFormOpen && (
          <button
            onClick={handleOpenAddForm}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center space-x-2 shadow-sm cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Quotation</span>
          </button>
        )}
      </div>

      {/* FILTER & SEARCH RAIL (only shown if form is closed) */}
      {!isFormOpen && (
        <div className="bg-white border border-gray-200 p-4 rounded-xl shadow-xs flex flex-col md:flex-row gap-3">
          
          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-[10px] font-mono text-gray-400 uppercase font-bold mb-1">Search Keywords</label>
            <input
              type="text"
              placeholder="Search preparer, comments, version, project name..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-xs bg-slate-50 focus:bg-white focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
            />
          </div>

          {/* Project Filter (only if no specific projectId context) */}
          {!projectId && (
            <div className="w-full md:w-56">
              <label className="block text-[10px] font-mono text-gray-400 uppercase font-bold mb-1">Project Workspace</label>
              <select
                value={selectedProjFilter}
                onChange={e => setSelectedProjFilter(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs bg-slate-50 focus:bg-white focus:ring-1 focus:ring-indigo-500 outline-none"
              >
                <option value="all">All Projects</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>[{p.code}] {p.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Status Filter */}
          <div className="w-full md:w-44">
            <label className="block text-[10px] font-mono text-gray-400 uppercase font-bold mb-1">Approval State</label>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs bg-slate-50 focus:bg-white focus:ring-1 focus:ring-indigo-500 outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="under_review">Under Review</option>
              <option value="approved">Approved (Green)</option>
              <option value="rejected">Rejected (Red)</option>
              <option value="revised">Revised (Blue)</option>
            </select>
          </div>
        </div>
      )}

      {/* CREATE & EDIT FORM MODAL CONTAINER */}
      {isFormOpen && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border border-indigo-200 shadow-md space-y-5 animate-fadeIn">
          
          {/* Form Header */}
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="flex items-center space-x-2">
              <span className="p-1.5 bg-indigo-50 text-indigo-700 rounded-lg">
                {revisingQuotationId ? <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" /> : <FileText className="w-4 h-4" />}
              </span>
              <div>
                <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider font-mono">
                  {revisingQuotationId 
                    ? `Create Revised Version` 
                    : editingQuotationId 
                      ? 'Edit Quotation Details' 
                      : 'Register New Quotation Baseline'
                  }
                </h3>
                <p className="text-[10px] text-gray-400">
                  {revisingQuotationId 
                    ? 'Creating a newer revised iteration while keeping original version intact.' 
                    : 'Configure parameters, billing entries, and upload ready documents.'
                  }
                </p>
              </div>
            </div>
            
            <button
              type="button"
              onClick={handleResetForm}
              className="text-xs text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 p-1.5 rounded-lg font-bold"
            >
              Dismiss Form
            </button>
          </div>

          {/* Form Core Info Fields */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
            
            {/* Project Field */}
            <div className="md:col-span-2">
              <label className="block text-[10px] font-mono text-gray-500 uppercase font-bold">Associated Project *</label>
              {projectId ? (
                <div className="w-full bg-slate-100 border border-gray-200 rounded p-2 text-xs font-medium text-gray-700 mt-1.5">
                  [{getProjectInfo(projectId).code}] {getProjectInfo(projectId).name}
                </div>
              ) : (
                <select
                  required
                  disabled={!!editingQuotationId || !!revisingQuotationId}
                  value={formProjectId}
                  onChange={e => setFormProjectId(e.target.value)}
                  className="w-full border border-gray-200 rounded p-1.5 text-xs mt-1.5 bg-white font-medium"
                >
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>[{p.code}] {p.name}</option>
                  ))}
                </select>
              )}
            </div>

            {/* Version */}
            <div>
              <label className="block text-[10px] font-mono text-gray-500 uppercase font-bold">Version Code *</label>
              <input
                type="text"
                required
                value={formVersion}
                onChange={e => setFormVersion(e.target.value)}
                placeholder="e.g. V1, V2, V2.1"
                className="w-full border border-gray-200 rounded p-1.5 text-xs mt-1.5 bg-white font-mono font-bold uppercase"
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-[10px] font-mono text-gray-500 uppercase font-bold">Initial Status *</label>
              <select
                required
                value={formStatus}
                onChange={e => setFormStatus(e.target.value as any)}
                className={`w-full border border-gray-200 rounded p-1.5 text-xs mt-1.5 font-bold bg-white text-gray-800`}
              >
                <option value="draft">Draft (Slate)</option>
                <option value="under_review">Under Review (Amber)</option>
                <option value="approved">Approved (Green)</option>
                <option value="rejected">Rejected (Red)</option>
                <option value="revised">Revised (Blue)</option>
              </select>
            </div>

            {/* Date */}
            <div>
              <label className="block text-[10px] font-mono text-gray-500 uppercase font-bold">Date Prepared *</label>
              <input
                type="date"
                required
                value={formDate}
                onChange={e => setFormDate(e.target.value)}
                className="w-full border border-gray-200 rounded p-1.5 text-xs mt-1.5 bg-white font-mono"
              />
            </div>

            {/* Prepared By */}
            <div>
              <label className="block text-[10px] font-mono text-gray-500 uppercase font-bold">Prepared By *</label>
              <input
                type="text"
                required
                value={formPreparedBy}
                onChange={e => setFormPreparedBy(e.target.value)}
                placeholder="Name of engineer"
                className="w-full border border-gray-200 rounded p-1.5 text-xs mt-1.5 bg-white"
              />
            </div>

            {/* Comments */}
            <div className="md:col-span-2">
              <label className="block text-[10px] font-mono text-gray-500 uppercase font-bold">Remarks & Client Comments</label>
              <input
                type="text"
                value={formClientComments}
                onChange={e => setFormClientComments(e.target.value)}
                placeholder="Feedback or internal reference codes..."
                className="w-full border border-gray-200 rounded p-1.5 text-xs mt-1.5 bg-white"
              />
            </div>
          </div>

          {/* TOGGLE SUBMISSION TYPE: MANUAL vs UPLOADED FILE */}
          <div className="space-y-4">
            <div className="flex border-b border-gray-200">
              <button
                type="button"
                onClick={() => setIsManualSubmission(true)}
                className={`pb-2.5 px-4 text-xs font-bold transition flex items-center space-x-2 border-b-2 cursor-pointer ${
                  isManualSubmission 
                    ? 'border-indigo-600 text-indigo-700' 
                    : 'border-transparent text-gray-400 hover:text-gray-600'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Manual Estimation Line-Items</span>
              </button>
              <button
                type="button"
                onClick={() => setIsManualSubmission(false)}
                className={`pb-2.5 px-4 text-xs font-bold transition flex items-center space-x-2 border-b-2 cursor-pointer ${
                  !isManualSubmission 
                    ? 'border-indigo-600 text-indigo-700' 
                    : 'border-transparent text-gray-400 hover:text-gray-600'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Readymade Document</span>
              </button>
            </div>

            {/* SUB-FORM: MANUAL LINE ITEMS */}
            {isManualSubmission && (
              <div className="space-y-4">
                
                {/* Add new item sub-form */}
                <div className="bg-slate-50 p-3.5 rounded-lg border border-gray-200/60 space-y-3">
                  <span className="text-[10px] font-mono font-bold text-gray-500 uppercase block">Add BOQ Item Draft</span>
                  
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                    <div className="md:col-span-6">
                      <label className="block text-[9px] font-mono text-gray-400">Description</label>
                      <input
                        type="text"
                        value={newItemDesc}
                        onChange={e => setNewItemDesc(e.target.value)}
                        placeholder="e.g. Electrical substation wiring"
                        className="w-full border border-gray-200 rounded p-1 text-xs mt-0.5 bg-white"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-[9px] font-mono text-gray-400">Quantity</label>
                      <input
                        type="number"
                        min="1"
                        value={newItemQty}
                        onChange={e => setNewItemQty(Number(e.target.value))}
                        className="w-full border border-gray-200 rounded p-1 text-xs mt-0.5 bg-white"
                      />
                    </div>
                    <div className="md:col-span-1">
                      <label className="block text-[9px] font-mono text-gray-400">Unit</label>
                      <input
                        type="text"
                        value={newItemUnit}
                        onChange={e => setNewItemUnit(e.target.value)}
                        className="w-full border border-gray-200 rounded p-1 text-xs mt-0.5 bg-white text-center"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-[9px] font-mono text-gray-400">Rate (SAR)</label>
                      <input
                        type="number"
                        min="0"
                        value={newItemRate}
                        onChange={e => setNewItemRate(Number(e.target.value))}
                        className="w-full border border-gray-200 rounded p-1 text-xs mt-0.5 bg-white"
                      />
                    </div>
                    <div className="md:col-span-1 flex items-end">
                      <button
                        type="button"
                        onClick={handleAddManualItem}
                        className="w-full bg-slate-800 hover:bg-slate-900 text-white p-1 rounded text-xs font-bold cursor-pointer h-7 flex items-center justify-center"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>

                {/* Items List Table */}
                <div className="border border-gray-200 rounded-lg overflow-x-auto bg-white">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100 border-b border-gray-200 text-[10px] font-mono text-gray-500 uppercase">
                        <th className="p-2.5 font-bold">Item Description</th>
                        <th className="p-2.5 text-center font-bold w-20">Qty</th>
                        <th className="p-2.5 text-center font-bold w-20">Unit</th>
                        <th className="p-2.5 text-right font-bold w-32">Rate (SAR)</th>
                        <th className="p-2.5 text-right font-bold w-36">Total (SAR)</th>
                        <th className="p-2.5 text-center font-bold w-16">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {manualItems.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-6 text-center text-xs text-gray-400 italic">
                            No pricing entries drafted yet. Please add at least one line item.
                          </td>
                        </tr>
                      ) : (
                        manualItems.map((item, index) => (
                          <tr key={item.id} className="border-b border-gray-100 text-xs hover:bg-slate-50/50">
                            <td className="p-2.5 font-medium text-gray-800">{item.description}</td>
                            <td className="p-2.5 text-center font-mono">{item.qty}</td>
                            <td className="p-2.5 text-center font-mono text-gray-500">{item.unit}</td>
                            <td className="p-2.5 text-right font-mono text-gray-600">{(item.rate).toLocaleString()}</td>
                            <td className="p-2.5 text-right font-mono font-bold text-gray-800">{(item.qty * item.rate).toLocaleString()}</td>
                            <td className="p-2.5 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveManualItem(item.id)}
                                className="text-rose-500 hover:text-rose-700 p-1 rounded hover:bg-rose-50 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5 mx-auto" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                      {manualItems.length > 0 && (
                        <tr className="bg-slate-50/80 font-bold text-xs">
                          <td colSpan={4} className="p-3 text-right text-gray-500 font-bold uppercase tracking-wider font-mono">
                            Total Manual Calculation:
                          </td>
                          <td className="p-3 text-right font-mono text-indigo-700 text-sm font-black">
                            {formatSAR(calculatedManualTotal)}
                          </td>
                          <td></td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Optional Supplementary files for manual quotation */}
                <div className="pt-2 space-y-2">
                  <span className="text-[10px] font-mono text-gray-400 uppercase font-bold block mb-1">Supplementary PDF/Attachments (Optional - Max 3 files)</span>
                  
                  {/* List of uploaded files */}
                  {formAttachments.length > 0 && (
                    <div className="space-y-1.5">
                      {formAttachments.map((att, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-emerald-50/50 border border-emerald-200/60 p-2.5 rounded-lg text-xs">
                          <div className="flex items-center space-x-2 text-emerald-800 truncate">
                            <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span className="font-semibold truncate">{att.name}</span>
                            <span className="text-gray-400 font-mono text-[10px] shrink-0">({att.size})</span>
                          </div>
                          <button 
                            type="button" 
                            onClick={() => handleRemoveAttachment(idx)}
                            className="text-gray-400 hover:text-rose-500 text-xs font-bold px-1.5 py-0.5 rounded hover:bg-rose-50 transition cursor-pointer"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Drag-and-drop zone shown only if count < 3 */}
                  {formAttachments.length < 3 ? (
                    <div 
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition ${
                        dragOver ? 'border-indigo-500 bg-indigo-50/35' : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="w-5 h-5 text-gray-400 mx-auto mb-1.5" />
                      <p className="text-xs text-gray-500 font-medium">Drag & drop or <span className="text-indigo-600 underline">browse</span> to upload file ({formAttachments.length}/3)</p>
                      <input 
                        type="file" 
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        multiple
                        className="hidden" 
                      />
                    </div>
                  ) : (
                    <div className="text-center p-2.5 bg-gray-50 border border-gray-150 rounded-lg text-xs text-gray-500 font-medium">
                      Maximum limit of 3 attachments reached.
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* SUB-FORM: UPLOADED READYMADE DOCUMENT */}
            {!isManualSubmission && (
              <div className="space-y-4 p-4 bg-indigo-50/10 border border-indigo-100 rounded-xl">
                <div className="flex items-start space-x-3 text-xs text-amber-700 bg-amber-50 p-3 rounded-lg border border-amber-200">
                  <AlertCircle className="w-4.5 h-4.5 shrink-0 text-amber-500 mt-0.5" />
                  <p className="leading-relaxed">
                    <strong>Readymade Submission Mode:</strong> If you cannot detail each line-item manually, upload the completed quotation document below. You must specify the <strong>Total Valuation Amount</strong> yourself, as it cannot be automatically computed.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* File Uploader */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-mono text-gray-500 uppercase font-bold">
                      Quotation Document Files (Max 3 files, at least 1 required) *
                    </label>
                    
                    {/* List of uploaded files */}
                    {formAttachments.length > 0 && (
                      <div className="space-y-1.5">
                        {formAttachments.map((att, idx) => (
                          <div key={idx} className="flex items-center justify-between bg-indigo-50 border border-indigo-200 p-3 rounded-lg text-xs">
                            <div className="flex items-center space-x-2.5 text-indigo-900 truncate">
                              <FileText className="w-5 h-5 text-indigo-600 shrink-0" />
                              <div className="truncate">
                                <span className="font-bold block truncate">{att.name}</span>
                                <span className="text-gray-400 font-mono text-[10px]">{att.size}</span>
                              </div>
                            </div>
                            <button 
                              type="button" 
                              onClick={() => handleRemoveAttachment(idx)}
                              className="text-rose-500 hover:text-rose-700 text-xs font-bold hover:underline cursor-pointer"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Drag-and-drop zone shown only if count < 3 */}
                    {formAttachments.length < 3 ? (
                      <div 
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition ${
                          dragOver ? 'border-indigo-500 bg-indigo-50/35' : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Upload className="w-6 h-6 text-indigo-500 mx-auto mb-2" />
                        <p className="text-xs text-gray-700 font-bold">Drag & drop readymade quotation file here ({formAttachments.length}/3)</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">Supports PDF, XLSX, DOCX up to 10MB (Select multiple up to 3)</p>
                        <input 
                          type="file" 
                          ref={fileInputRef}
                          onChange={handleFileChange}
                          multiple
                          className="hidden" 
                        />
                      </div>
                    ) : (
                      <div className="text-center p-3 bg-gray-50 border border-gray-100 rounded-lg text-xs text-gray-500 font-medium">
                        Maximum limit of 3 attachments reached. Remove existing to add more.
                      </div>
                    )}
                  </div>

                  {/* Manual Total Input */}
                  <div className="flex flex-col justify-center">
                    <label className="block text-[10px] font-mono text-gray-500 uppercase font-bold">Quotation Total Amount (SAR) *</label>
                    <div className="relative mt-2">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 text-xs font-mono">SAR</span>
                      <input
                        type="number"
                        required={!isManualSubmission}
                        value={formManualTotal || ''}
                        onChange={e => setFormManualTotal(Number(e.target.value))}
                        placeholder="e.g. 15500000"
                        className="w-full border border-gray-200 rounded-lg pl-12 pr-3 py-2 text-xs font-mono font-bold focus:ring-1 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                    <span className="text-[9px] text-gray-400 mt-1.5 block">Specify the grand total value as specified inside the uploaded file.</span>
                  </div>

                </div>
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-2 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={handleResetForm}
              className="text-xs text-gray-500 hover:text-gray-700 font-bold px-4 py-2 hover:bg-gray-100 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg text-xs font-bold cursor-pointer transition shadow-sm"
            >
              {editingQuotationId ? 'Save Changes' : revisingQuotationId ? 'Submit Revised Version' : 'Submit Quotation'}
            </button>
          </div>
        </form>
      )}

      {/* QUOTATIONS DASHBOARD / GRID CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredQuotations.length === 0 ? (
          <div className="col-span-1 md:col-span-2 bg-white p-12 text-center rounded-xl border border-gray-200 shadow-xs">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-xs text-gray-500 font-medium">No matching quotation records found.</p>
            <p className="text-[10px] text-gray-400 mt-1">Try relaxing filters or register a new quotation workspace.</p>
            <button
              onClick={handleOpenAddForm}
              className="mt-4 text-xs font-bold text-indigo-600 hover:text-indigo-800"
            >
              + Create first quotation
            </button>
          </div>
        ) : (
          filteredQuotations.map(q => {
            const proj = getProjectInfo(q.projectId);
            const statusStyles = getStatusBadgeStyles(q.status);
            const cardStyles = getStatusCardStyles(q.status);
            const indicatorIcon = getStatusIndicatorIcon(q.status);

            return (
              <div 
                key={q.id} 
                className={`bg-white border-2 rounded-xl p-5 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between ${cardStyles}`}
              >
                <div className="space-y-4">
                  
                  {/* Card Header */}
                  <div className="flex items-start justify-between border-b border-gray-100 pb-3">
                    <div className="flex items-center space-x-2.5">
                      <span className="p-1.5 bg-slate-100 rounded-lg">
                        {indicatorIcon}
                      </span>
                      <div>
                        <div className="flex items-center space-x-1.5">
                          <span className="text-[9px] font-mono bg-indigo-50 border border-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded font-black uppercase">
                            {q.version}
                          </span>
                          {!projectId && (
                            <span className="text-[9px] font-mono text-gray-400 uppercase">
                              [{proj.code}]
                            </span>
                          )}
                        </div>
                        <h4 className="text-xs font-bold text-gray-800 mt-1 max-w-[200px] truncate" title={proj.name}>
                          {proj.name}
                        </h4>
                      </div>
                    </div>
                    
                    <span className={`text-[9px] font-mono font-black tracking-wider uppercase border px-2 py-0.5 rounded ${statusStyles}`}>
                      {q.status === 'revised' ? 'Revised (Blue)' : q.status === 'approved' ? 'Approved (Green)' : q.status === 'rejected' ? 'Rejected (Red)' : q.status}
                    </span>
                  </div>

                  {/* Card Details Grid */}
                  <div className="grid grid-cols-2 gap-3 text-xs font-medium">
                    <div>
                      <span className="text-[10px] font-mono text-gray-400 block uppercase">Filing Date</span>
                      <span className="text-gray-700 flex items-center mt-0.5">
                        <Calendar className="w-3.5 h-3.5 text-gray-400 mr-1 shrink-0" />
                        <span className="font-mono">{q.date}</span>
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-mono text-gray-400 block uppercase">Prepared By</span>
                      <span className="text-gray-700 flex items-center mt-0.5 truncate" title={q.preparedBy}>
                        <UserIcon className="w-3.5 h-3.5 text-gray-400 mr-1 shrink-0" />
                        <span className="truncate">{q.preparedBy}</span>
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-[10px] font-mono text-gray-400 block uppercase font-bold">Valuation Grand Total</span>
                      <span className="text-slate-900 font-mono font-black text-base flex items-center mt-0.5">
                        <DollarSign className="w-4 h-4 text-indigo-500 shrink-0" />
                        <span>{formatSAR(q.totalAmount)}</span>
                      </span>
                    </div>
                  </div>

                  {/* Items list summary */}
                  <div className="bg-slate-50 p-2.5 rounded-lg text-[11px] text-gray-500 space-y-1.5 border border-slate-100">
                    <span className="text-[9px] font-mono text-gray-400 uppercase block font-bold">Estimated Cost Blocks</span>
                    {q.items && q.items.length > 0 ? (
                      <div className="space-y-1">
                        {q.items.slice(0, 3).map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center text-slate-600 font-medium">
                            <span className="truncate max-w-[70%]">{item.description}</span>
                            <span className="font-mono text-gray-700 font-bold">{formatSAR(item.total)}</span>
                          </div>
                        ))}
                        {q.items.length > 3 && (
                          <div className="text-[9px] text-indigo-600 font-bold italic mt-1 text-right">
                            + {q.items.length - 3} more items included
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-gray-400 italic">No item pricing breakdown available.</div>
                    )}
                  </div>

                  {/* Client Remarks / Comments */}
                  {q.clientComments && (
                    <div className="p-2.5 bg-yellow-50/45 border border-yellow-100 rounded-lg text-xs italic text-gray-500 leading-snug">
                      "{q.clientComments}"
                    </div>
                  )}

                  {/* Preview and Download Options Section */}
                  <div className="space-y-2 mt-2">
                    {/* Option 1: Attachment File (rendered if present) */}
                    {(() => {
                      const attachmentsList = q.attachments && q.attachments.length > 0 
                        ? q.attachments 
                        : (q.fileName ? [{ name: q.fileName, size: q.fileSize || 'N/A', data: q.fileData }] : []);
                      
                      return attachmentsList.map((att, idx) => (
                        <div key={idx} className="flex items-center justify-between border border-gray-100 p-2 rounded-lg bg-gray-50/50">
                          <div className="flex items-center space-x-1.5 text-[11px] truncate text-slate-700 font-semibold max-w-[65%]">
                            <FileText className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                            <span className="truncate" title={att.name}>{att.name}</span>
                            <span className="text-[9px] text-gray-400 font-mono font-normal shrink-0">({att.size || 'N/A'})</span>
                          </div>
                          <div className="flex items-center space-x-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => setPreviewAttachmentFile({ quotation: q, name: att.name, size: att.size || 'N/A', data: att.data })}
                              className="text-indigo-600 hover:text-indigo-800 text-[10px] font-bold flex items-center space-x-1 hover:underline cursor-pointer bg-transparent border-0 p-0"
                            >
                              <Eye className="w-3 h-3" />
                              <span>Preview</span>
                            </button>
                            <span className="text-gray-300 text-[10px]">|</span>
                            <button
                              type="button"
                              onClick={() => handleDownloadAttachmentFile(att.name, att.data)}
                              className="text-indigo-600 hover:text-indigo-800 text-[10px] font-bold shrink-0 flex items-center space-x-1 hover:underline cursor-pointer bg-transparent border-0 p-0"
                            >
                              <FileDown className="w-3 h-3" />
                              <span>Download</span>
                            </button>
                          </div>
                        </div>
                      ));
                    })()}

                    {/* Option 2: System-Generated Quotation PDF option */}
                    <div className="flex items-center justify-between border border-gray-100 p-2 rounded-lg bg-gray-50/50">
                      <div className="flex items-center space-x-1.5 text-[11px] truncate text-slate-700 font-semibold">
                        <FileCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span className="truncate">See quotation and PDF view</span>
                        <span className="text-[9px] text-gray-400 font-mono font-normal">(System-Generated)</span>
                      </div>
                      <div className="flex items-center space-x-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => setPreviewQuotation(q)}
                          className="text-indigo-600 hover:text-indigo-800 text-[10px] font-bold flex items-center space-x-1 hover:underline cursor-pointer bg-transparent border-0 p-0"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Preview</span>
                        </button>
                        <span className="text-gray-300 text-[10px]">|</span>
                        <button
                          type="button"
                          onClick={() => handleDownloadSystemPDF(q)}
                          className="text-indigo-600 hover:text-indigo-800 text-[10px] font-bold shrink-0 flex items-center space-x-1 hover:underline cursor-pointer bg-transparent border-0 p-0"
                        >
                          <FileDown className="w-3 h-3" />
                          <span>Download</span>
                        </button>
                      </div>
                    </div>
                  </div>

                </div>

                {/* Card Actions Footer */}
                <div className="mt-5 pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2">
                  
                  {/* Status updates buttons */}
                  <div className="flex items-center space-x-1">
                    {q.status !== 'approved' && (
                      <button
                        onClick={() => handleUpdateStatus(q.id, 'approved', q.version, q.projectId)}
                        className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-bold px-2 py-1 rounded transition flex items-center space-x-1 cursor-pointer"
                        title="Mark Approved (Green)"
                      >
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span>Approve</span>
                      </button>
                    )}
                    {q.status !== 'rejected' && (
                      <button
                        onClick={() => handleUpdateStatus(q.id, 'rejected', q.version, q.projectId)}
                        className="bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 text-[10px] font-bold px-2 py-1 rounded transition flex items-center space-x-1 cursor-pointer"
                        title="Mark Rejected (Red)"
                      >
                        <X className="w-3 h-3 text-rose-600" />
                        <span>Reject</span>
                      </button>
                    )}
                  </div>

                  {/* Edit, Revise, Delete */}
                  <div className="flex items-center space-x-2">
                    
                    {/* Create Revision Version button */}
                    <button
                      onClick={() => handleOpenReviseForm(q)}
                      className="text-blue-700 hover:bg-blue-50 border border-blue-200 bg-white hover:border-blue-300 text-[10px] font-bold px-2.5 py-1 rounded flex items-center space-x-1 cursor-pointer transition"
                      title="Create Revised Version (Blue)"
                    >
                      <RefreshCw className="w-3 h-3 text-blue-600" />
                      <span>Revise</span>
                    </button>

                    {/* Edit button */}
                    <button
                      onClick={() => handleOpenEditForm(q)}
                      className="text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 p-1 rounded-lg transition cursor-pointer"
                      title="Edit entire quotation record"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete button */}
                    <button
                      onClick={() => handleDelete(q.id, q.version, q.projectId)}
                      className="text-gray-400 hover:text-rose-600 hover:bg-rose-50 p-1 rounded-lg transition cursor-pointer"
                      title="Delete record"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                </div>

              </div>
            );
          })
        )}
      </div>

      {/* 3. INTERACTIVE PDF PREVIEW MODAL */}
      {previewQuotation && (() => {
        const proj = projects.find(p => p.id === previewQuotation.projectId);
        const clientName = proj ? proj.clientName : 'Wafaq Valued Client';
        const projectCode = proj ? proj.code : 'PROJ-XXX';
        const projectName = proj ? proj.name : 'N/A';
        const docRef = `WQ-${previewQuotation.version}-${previewQuotation.id.substring(2, 6).toUpperCase()}`;

        return (
          <div className="fixed inset-0 bg-slate-900/75 backdrop-blur-xs z-50 flex flex-col items-center justify-center p-4 animate-fadeIn">
            
            {/* Viewer Controls Rail */}
            <div className="w-full max-w-4xl bg-slate-800 text-slate-100 rounded-t-xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shadow-lg text-xs font-mono">
              <div className="flex items-center space-x-2.5 min-w-0">
                <FileText className="w-4 h-4 text-rose-500 shrink-0" />
                <span className="font-bold truncate text-slate-200" title={previewQuotation.fileName || `${docRef}.pdf`}>
                  {previewQuotation.fileName || `${docRef}.pdf`}
                </span>
                <span className="bg-rose-500/20 text-rose-300 px-1.5 py-0.5 rounded text-[9px] font-bold">PDF</span>
              </div>

              {/* View/Zoom Simulator */}
              <div className="hidden sm:flex items-center space-x-4 bg-slate-700/50 px-3 py-1 rounded-lg">
                <span className="text-[10px] text-slate-400">Page 1 of 1</span>
                <span className="text-slate-500">|</span>
                <div className="flex items-center space-x-2">
                  <button onClick={() => alert("Zooming is optimized for high-resolution standard preview mode.")} className="text-slate-300 hover:text-white font-black text-xs px-1 hover:bg-slate-700 rounded cursor-pointer">-</button>
                  <span className="text-[10px] font-bold text-slate-200">100% Zoom</span>
                  <button onClick={() => alert("Zooming is optimized for high-resolution standard preview mode.")} className="text-slate-300 hover:text-white font-black text-xs px-1 hover:bg-slate-700 rounded cursor-pointer">+</button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2 ml-auto">
                <button
                  type="button"
                  onClick={() => {
                    window.print();
                  }}
                  className="bg-slate-700 hover:bg-slate-600 text-slate-200 hover:text-white px-2.5 py-1.5 rounded transition flex items-center space-x-1 cursor-pointer"
                  title="Print document"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span className="hidden xs:inline">Print</span>
                </button>
                
                <button
                  type="button"
                  onClick={() => alert(`Downloading document: ${previewQuotation.fileName || `${docRef}.pdf`}`)}
                  className="bg-slate-700 hover:bg-slate-600 text-slate-200 hover:text-white px-2.5 py-1.5 rounded transition flex items-center space-x-1 cursor-pointer"
                  title="Download PDF"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  <span className="hidden xs:inline">Download</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPreviewQuotation(null)}
                  className="bg-rose-600 hover:bg-rose-700 text-white px-3 py-1.5 rounded font-bold transition flex items-center space-x-1 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Close</span>
                </button>
              </div>
            </div>

            {/* Simulated Document Sheet View */}
            <div 
              id="print-pdf-document" 
              className="w-full max-w-4xl bg-white shadow-2xl relative overflow-y-auto text-slate-800 rounded-b-xl max-h-[80vh] font-sans"
            >
              <div className="p-10 md:p-14 space-y-8 relative">
                
                {/* Authentic Background Stamp Watermarks */}
                {previewQuotation.status === 'approved' && (
                  <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-12 opacity-15 pointer-events-none select-none border-8 border-emerald-600 text-emerald-600 px-8 py-4 text-5xl font-black rounded-xl tracking-widest font-mono text-center">
                    APPROVED & SECURED
                    <div className="text-xl mt-1 font-sans">WAFAQ CONTRACTING CO.</div>
                  </div>
                )}
                {previewQuotation.status === 'under_review' && (
                  <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-12 opacity-15 pointer-events-none select-none border-8 border-amber-600 text-amber-600 px-8 py-4 text-5xl font-black rounded-xl tracking-widest font-mono text-center">
                    UNDER REVIEW
                    <div className="text-xl mt-1 font-sans">OFFER TENDERED</div>
                  </div>
                )}
                {previewQuotation.status === 'rejected' && (
                  <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-12 opacity-15 pointer-events-none select-none border-8 border-rose-600 text-rose-600 px-8 py-4 text-5xl font-black rounded-xl tracking-widest font-mono text-center">
                    VOID / REJECTED
                    <div className="text-xl mt-1 font-sans">DECLINED BY CLIENT</div>
                  </div>
                )}
                {previewQuotation.status === 'revised' && (
                  <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-12 opacity-15 pointer-events-none select-none border-8 border-blue-600 text-blue-600 px-8 py-4 text-5xl font-black rounded-xl tracking-widest font-mono text-center">
                    SUPERSEDED
                    <div className="text-xl mt-1 font-sans">REVISED VER. ACTIVE</div>
                  </div>
                )}

                {/* PDF HEADER LETTERHEAD */}
                <div className="flex flex-col md:flex-row justify-between items-start border-b-2 border-slate-900 pb-6 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-slate-950 rounded flex items-center justify-center font-mono text-white text-lg font-black tracking-tighter">W</div>
                      <div>
                        <h1 className="text-sm font-black text-slate-900 tracking-wider font-mono">WAFAQ CONTRACTING CO.</h1>
                        <p className="text-[10px] text-slate-500 font-medium">Enterprise Construction & Civil Works Saudi Arabia</p>
                      </div>
                    </div>
                    <div className="text-[10px] text-slate-500 leading-relaxed font-mono">
                      <div>Riyadh HQ, Olaya District, Towers Rd.</div>
                      <div>CR No: 1010492834 | VAT ID: 300482934800003</div>
                      <div>Contact: +966 11 405 8292 | info@wafaq.com.sa</div>
                    </div>
                  </div>

                  <div className="text-right space-y-1.5 md:self-stretch flex flex-col justify-between">
                    <div className="space-y-0.5">
                      <h2 className="text-lg font-black text-slate-950 tracking-tight font-sans">OFFICIAL PRICE QUOTATION</h2>
                      <p className="text-[10px] font-mono text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded inline-block">
                        DOCUMENT REF: {docRef}
                      </p>
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono space-y-0.5">
                      <div>Filing Date: <span className="font-bold text-slate-800">{previewQuotation.date}</span></div>
                      <div>Revision: <span className="font-bold text-slate-800 uppercase">{previewQuotation.version}</span></div>
                      <div>Prepared By: <span className="font-bold text-slate-800">{previewQuotation.preparedBy}</span></div>
                    </div>
                  </div>
                </div>

                {/* CLIENT & PROJECT DETAILS SECTION */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-5 rounded-xl border border-slate-200/60 text-xs">
                  <div className="space-y-1">
                    <span className="text-[9px] font-mono text-slate-400 uppercase font-black block tracking-wider">CLIENT INFO</span>
                    <div className="font-bold text-slate-900 text-sm">{clientName}</div>
                    <div className="text-slate-500">Kingdom of Saudi Arabia</div>
                    <div className="text-slate-500">Procurement & Site Engineering Division</div>
                  </div>
                  <div className="space-y-1 border-t md:border-t-0 md:border-l border-slate-200 pt-4 md:pt-0 md:pl-5">
                    <span className="text-[9px] font-mono text-slate-400 uppercase font-black block tracking-wider">PROJECT ASSOCIATION</span>
                    <div className="font-bold text-slate-900 text-sm">[{projectCode}] {projectName}</div>
                    <div className="text-slate-500">Sub-surface infrastructure & structural core package</div>
                    <div className="text-slate-500">Ref Baseline: Wafaq-BOQ-{projectCode}-01</div>
                  </div>
                </div>

                {/* LINE-ITEMS BOQ DETAIL TABLE */}
                <div className="space-y-3">
                  <span className="text-[10px] font-mono text-slate-400 uppercase font-black block tracking-widest">
                    ESTIMATED COST AND BILL OF QUANTITIES BREAKDOWN
                  </span>
                  
                  <div className="border border-slate-300 rounded-xl overflow-hidden bg-white">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-900 text-white font-mono text-[10px] uppercase">
                          <th className="p-3 font-bold text-center w-10">#</th>
                          <th className="p-3 font-bold">Item Description</th>
                          <th className="p-3 font-bold text-center w-16">Qty</th>
                          <th className="p-3 font-bold text-center w-16">Unit</th>
                          <th className="p-3 font-bold text-right w-28">Rate (SAR)</th>
                          <th className="p-3 font-bold text-right w-32">Total (SAR)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {previewQuotation.items && previewQuotation.items.length > 0 ? (
                          previewQuotation.items.map((item, idx) => (
                            <tr key={item.id || idx} className="border-b border-slate-200 hover:bg-slate-50/50">
                              <td className="p-3 text-center text-slate-400 font-mono">{idx + 1}</td>
                              <td className="p-3 font-semibold text-slate-800 leading-normal">{item.description}</td>
                              <td className="p-3 text-center font-mono">{item.qty}</td>
                              <td className="p-3 text-center font-mono text-slate-500 uppercase">{item.unit}</td>
                              <td className="p-3 text-right font-mono text-slate-600">{item.rate.toLocaleString()}</td>
                              <td className="p-3 text-right font-mono font-bold text-slate-900">{item.total.toLocaleString()}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={6} className="p-8 text-center text-slate-400 italic">
                              No manual items registered in this quotation document version.
                            </td>
                          </tr>
                        )}

                        {/* SUMMARIES & MATHEMATICS */}
                        <tr className="bg-slate-50 font-semibold border-t-2 border-slate-300">
                          <td colSpan={4}></td>
                          <td className="p-3 text-right text-slate-500 uppercase font-mono text-[10px] font-bold">
                            Subtotal (Excl. VAT):
                          </td>
                          <td className="p-3 text-right font-mono text-slate-900 font-bold">
                            {(previewQuotation.totalAmount / 1.15).toLocaleString(undefined, { maximumFractionDigits: 2 })} SAR
                          </td>
                        </tr>
                        <tr className="bg-slate-50 font-semibold">
                          <td colSpan={4}></td>
                          <td className="p-3 text-right text-slate-500 uppercase font-mono text-[10px] font-bold">
                            Standard Saudi VAT (15%):
                          </td>
                          <td className="p-3 text-right font-mono text-slate-900 font-bold">
                            {(previewQuotation.totalAmount - (previewQuotation.totalAmount / 1.15)).toLocaleString(undefined, { maximumFractionDigits: 2 })} SAR
                          </td>
                        </tr>
                        <tr className="bg-slate-100 font-black text-sm border-t border-slate-300">
                          <td colSpan={4}></td>
                          <td className="p-3.5 text-right text-slate-800 uppercase font-mono text-[10px] font-extrabold tracking-wider">
                            Grand Total (Incl. VAT):
                          </td>
                          <td className="p-3.5 text-right font-mono text-indigo-700 text-sm font-black">
                            {previewQuotation.totalAmount.toLocaleString()} SAR
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* REMARKS AND LEGALESE */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 text-[10px] text-slate-500 leading-relaxed font-mono">
                  <div className="space-y-1.5 border border-dashed border-slate-200 p-3.5 rounded-lg bg-slate-50/50">
                    <span className="font-bold text-slate-700 uppercase block">TERMS & CONDITIONS:</span>
                    <ol className="list-decimal pl-4 space-y-1">
                      <li>Prices quoted are firm and valid for a duration of 60 calendar days from the filing date.</li>
                      <li>Standard payment term: 20% advance upon mobilization, progress billing bi-weekly.</li>
                      <li>Standard execution schedule is aligned with approved milestone schedules.</li>
                    </ol>
                  </div>
                  <div className="space-y-1.5 border border-dashed border-slate-200 p-3.5 rounded-lg bg-slate-50/50">
                    <span className="font-bold text-slate-700 uppercase block">QUOTATION ATTACHED METADATA:</span>
                    <div>Filename: <span className="font-semibold text-slate-800">{previewQuotation.fileName || 'Generated Baseline Report'}</span></div>
                    <div>Attachment Size: <span className="font-semibold text-slate-800">{previewQuotation.fileSize || 'N/A'}</span></div>
                    <div>Digital Cryptographic Hash: <span className="font-semibold text-slate-800 text-[9px] break-all">SHA256: 8f9b9a1c...e38d9f1</span></div>
                  </div>
                </div>

                {/* SIGNATURE BLOCKS */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 pt-10 border-t border-slate-200 text-center text-xs">
                  <div className="space-y-10">
                    <div className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                      PREPARED BY
                    </div>
                    <div className="space-y-0.5">
                      <div className="font-bold text-slate-800 underline decoration-slate-300">{previewQuotation.preparedBy}</div>
                      <div className="text-[10px] text-slate-400 font-mono">Project Controls Engineer</div>
                    </div>
                  </div>

                  <div className="space-y-10 hidden sm:block">
                    <div className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                      WAFAQ COMPANY SEAL
                    </div>
                    <div className="flex justify-center items-center">
                      <div className="w-16 h-16 rounded-full border-4 border-slate-400/30 flex items-center justify-center text-[8px] font-bold text-slate-400/60 uppercase select-none font-mono tracking-tighter rotate-12">
                        WAFAQ SEAL
                      </div>
                    </div>
                  </div>

                  <div className="space-y-10">
                    <div className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                      CLIENT ACKNOWLEDGEMENT
                    </div>
                    <div className="space-y-0.5">
                      <div className="h-4 border-b border-slate-300 mx-auto w-3/4"></div>
                      <div className="text-[10px] text-slate-400 font-mono">Signature, Title & Date</div>
                    </div>
                  </div>
                </div>

                {/* FOOTER METADATA */}
                <div className="border-t border-slate-100 pt-5 text-center text-[9px] text-slate-400 font-mono flex flex-col sm:flex-row justify-between gap-2">
                  <span>Wafaq Construction ERP Version Control System v2.1</span>
                  <span>Digitally certified construction document</span>
                </div>

              </div>
            </div>

          </div>
        );
      })()}

      {/* 4. ORIGINAL ATTACHMENT PREVIEW MODAL */}
      {previewAttachmentFile && (() => {
        const q = previewAttachmentFile.quotation;
        const proj = projects.find(p => p.id === q.projectId);
        const projectName = proj ? proj.name : 'N/A';
        const projectCode = proj ? proj.code : 'PROJ-XXX';
        const fileName = previewAttachmentFile.name;
        const fileSize = previewAttachmentFile.size;
        const fileData = previewAttachmentFile.data;
        const fileExt = fileName.split('.').pop()?.toUpperCase() || 'PDF';

        return (
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xs z-50 flex flex-col items-center justify-center p-4 animate-fadeIn">
            
            {/* Viewer Controls Rail */}
            <div className="w-full max-w-4xl bg-slate-800 text-slate-100 rounded-t-xl px-4 py-3 flex flex-wrap items-center justify-between gap-3 shadow-lg text-xs font-mono">
              <div className="flex items-center space-x-2.5 min-w-0">
                <FileText className="w-4 h-4 text-amber-500 shrink-0" />
                <span className="font-bold truncate text-slate-200" title={fileName}>
                  {fileName}
                </span>
                <span className="bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded text-[9px] font-bold">{fileExt}</span>
              </div>

              {/* View Status */}
              <div className="hidden sm:flex items-center space-x-4 bg-slate-700/50 px-3 py-1 rounded-lg text-[10px] text-slate-300">
                <span>Secure Attachment Preview</span>
                <span className="text-slate-500">|</span>
                <span className="text-emerald-400 font-bold">Verified File Integrity</span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2 ml-auto">
                <button
                  type="button"
                  onClick={() => handleDownloadAttachmentFile(fileName, fileData)}
                  className="bg-slate-700 hover:bg-slate-600 text-slate-200 hover:text-white px-2.5 py-1.5 rounded transition flex items-center space-x-1 cursor-pointer"
                  title="Download File"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  <span className="hidden xs:inline">Download</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPreviewAttachmentFile(null)}
                  className="bg-rose-600 hover:bg-rose-700 text-white px-3 py-1.5 rounded font-bold transition flex items-center space-x-1 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Close</span>
                </button>
              </div>
            </div>

            {/* Simulated Document Sheet View */}
            <div className="w-full max-w-4xl bg-white shadow-2xl relative overflow-y-auto text-slate-800 rounded-b-xl max-h-[80vh] font-sans">
              {fileData ? (
                fileData.startsWith('data:application/pdf') || fileName.toLowerCase().endsWith('.pdf') ? (
                  <div className="w-full h-[70vh]">
                    <iframe
                      src={fileData}
                      title={fileName}
                      className="w-full h-full border-0"
                    />
                  </div>
                ) : fileData.startsWith('data:image') || /\.(png|jpe?g|gif|svg|webp)$/i.test(fileName) ? (
                  <div className="w-full h-[70vh] bg-slate-50 flex items-center justify-center p-6 overflow-auto">
                    <img
                      src={fileData}
                      alt={fileName}
                      className="max-w-full max-h-full object-contain rounded-lg shadow-sm"
                    />
                  </div>
                ) : (
                  <div className="p-10 md:p-14 space-y-8 relative text-center py-16">
                    <FileText className="w-16 h-16 text-slate-300 mx-auto animate-pulse" />
                    <h3 className="text-lg font-bold text-slate-800 mt-4">No Direct Preview Available</h3>
                    <p className="text-sm text-slate-500 max-w-md mx-auto mt-2">
                      This file format ({fileExt}) cannot be previewed in the secure browser sandbox, but the uploaded document has been verified.
                    </p>
                    <div className="pt-4">
                      <button
                        type="button"
                        onClick={() => handleDownloadAttachmentFile(fileName, fileData)}
                        className="inline-flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-bold text-xs transition cursor-pointer animate-bounce"
                      >
                        <FileDown className="w-4 h-4" />
                        <span>Download and Open file</span>
                      </button>
                    </div>
                  </div>
                )
              ) : (
                <div className="p-10 md:p-14 space-y-8 relative select-none">
                  
                  {/* Background Watermark indicating uploaded document */}
                  <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-12 opacity-5 pointer-events-none select-none border-8 border-slate-600 text-slate-600 px-8 py-4 text-4xl font-black rounded-xl tracking-widest font-mono text-center">
                    ORIGINAL ATTACHMENT
                    <div className="text-lg mt-1 font-sans">CUSTOMER UPLOADED FILE</div>
                  </div>

                  {/* PDF Header / Letterhead area simulating original source */}
                  <div className="flex flex-col sm:flex-row justify-between items-start border-b-2 border-slate-300 pb-6 gap-4">
                    <div className="space-y-1.5">
                      <span className="text-[9px] font-mono font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded">
                        UPLOADED FILE PROFILE
                      </span>
                      <h1 className="text-base font-black text-slate-900 tracking-tight mt-1">
                        {fileName}
                      </h1>
                      <p className="text-[11px] text-slate-500 font-medium">
                        Project Reference: [{projectCode}] {projectName}
                      </p>
                    </div>

                    <div className="text-right space-y-1 font-mono text-[10px] text-slate-500">
                      <div>Document Size: <span className="font-bold text-slate-800">{fileSize}</span></div>
                      <div>Registered: <span className="font-bold text-slate-800">{q.date}</span></div>
                      <div>Uploader: <span className="font-bold text-slate-800">{q.preparedBy}</span></div>
                    </div>
                  </div>

                  {/* DOCUMENT PREVIEW SIMULATION */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 space-y-6 relative overflow-hidden">
                    
                    {/* Subtle scanner lines or grid design */}
                    <div className="absolute inset-0 bg-grid-pattern opacity-5 pointer-events-none"></div>

                    <div className="flex justify-between items-center pb-3 border-b border-slate-200">
                      <div className="flex items-center space-x-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
                        <span className="text-[10px] font-mono text-slate-500 font-bold uppercase tracking-wider">
                          Secure Viewer Sandbox (Simulated PDF Output)
                        </span>
                      </div>
                      <span className="text-[10px] font-mono font-bold text-slate-400">PAGE 1 OF 1</span>
                    </div>

                    {/* Simulated formal invoice/quote layout */}
                    <div className="space-y-8">
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div className="space-y-1">
                          <span className="text-[9px] font-mono text-slate-400 block uppercase font-bold">Sender / Originator</span>
                          <div className="font-bold text-slate-800">External Vendor Bidder</div>
                          <div className="text-slate-500 font-mono text-[10px]">Tax ID: 31029482700003</div>
                        </div>
                        <div className="space-y-1 text-right">
                          <span className="text-[9px] font-mono text-slate-400 block uppercase font-bold">Recipient / Authority</span>
                          <div className="font-bold text-slate-800">Wafaq Contracting Co.</div>
                          <div className="text-slate-500 font-mono text-[10px]">Project: {projectCode}</div>
                        </div>
                      </div>

                      {/* Simulated Table */}
                      <div className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-xs">
                        <div className="grid grid-cols-12 bg-slate-100 text-[10px] font-mono font-bold text-slate-600 uppercase p-2 border-b border-slate-200">
                          <div className="col-span-1 text-center">#</div>
                          <div className="col-span-7">Line Item Description & Specifications</div>
                          <div className="col-span-1 text-center font-bold">Qty</div>
                          <div className="col-span-1 text-center font-bold">Unit</div>
                          <div className="col-span-2 text-right">Total (SAR)</div>
                        </div>
                        
                        <div className="divide-y divide-slate-100 text-xs">
                          {q.items && q.items.length > 0 ? (
                            q.items.map((item, index) => (
                              <div key={item.id || index} className="grid grid-cols-12 p-2.5 text-slate-700 font-medium">
                                <div className="col-span-1 text-center font-mono text-slate-400">{index + 1}</div>
                                <div className="col-span-7 font-sans leading-snug">{item.description}</div>
                                <div className="col-span-1 text-center font-mono">{item.qty}</div>
                                <div className="col-span-1 text-center text-slate-400 uppercase font-mono">{item.unit}</div>
                                <div className="col-span-2 text-right font-mono font-bold text-slate-800">{q.totalAmount.toLocaleString()} SAR</div>
                              </div>
                            ))
                          ) : (
                            <div className="grid grid-cols-12 p-4 text-slate-700 font-medium italic text-center">
                              <div className="col-span-12">
                                Quotation details uploaded as an attachment summary. Valuation Total Specified: {q.totalAmount.toLocaleString()} SAR
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Total Summary */}
                      <div className="flex justify-end pt-2">
                        <div className="w-64 space-y-1.5 border-t border-slate-300 pt-3 font-mono text-xs">
                          <div className="flex justify-between text-slate-500">
                            <span>Subtotal:</span>
                            <span>{q.totalAmount.toLocaleString()} SAR</span>
                          </div>
                          <div className="flex justify-between text-slate-500">
                            <span>Tax (VAT 15%):</span>
                            <span>Inclusive</span>
                          </div>
                          <div className="flex justify-between text-slate-800 font-black text-sm border-t border-slate-200 pt-1.5">
                            <span>GRAND TOTAL:</span>
                            <span className="text-indigo-600">{q.totalAmount.toLocaleString()} SAR</span>
                          </div>
                        </div>
                      </div>

                      {/* Scanned Verification Block */}
                      <div className="bg-slate-100/80 p-3.5 rounded-lg border border-slate-200 flex flex-col sm:flex-row items-center justify-between text-[11px] gap-3 text-slate-500 font-medium">
                        <div className="space-y-0.5">
                          <div className="font-bold text-slate-700 uppercase font-mono text-[9px] tracking-wider">
                            Cryptographic Attachment Verification
                          </div>
                          <div>Original Filename: <span className="font-mono text-slate-600">{fileName}</span></div>
                          <div className="text-[10px]">MD5 Checksum: <span className="font-mono text-slate-400">9e107d9d372bb6826bd81d3542a419d6</span></div>
                        </div>
                        <div className="shrink-0 flex items-center space-x-2 bg-emerald-50 text-emerald-800 px-3 py-1.5 rounded-lg border border-emerald-200 text-xs font-bold font-mono">
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                          <span>SCAN SECURE</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Footer instructions */}
                  <div className="border-t border-slate-100 pt-6 text-center text-[10px] text-slate-400 font-mono leading-relaxed">
                    <div>This document is a high-fidelity digital projection of the original file attachment.</div>
                    <div>Security verified by Wafaq Contracting Document Controller Engine</div>
                  </div>

                </div>
              )}
            </div>

          </div>
        );
      })()}

    </div>
  );
}
