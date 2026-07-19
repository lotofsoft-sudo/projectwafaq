/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useRef } from 'react';
import { Project, PurchaseOrder, User, Document, getPurchaseOrderDisplayValues } from '../types';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  FileText, 
  Upload, 
  Check, 
  X, 
  FileDown, 
  AlertCircle, 
  Calendar, 
  DollarSign, 
  Eye,
  Search,
  Layers,
  Clock,
  ShieldCheck,
  CheckCircle,
  Award
} from 'lucide-react';

interface PurchaseOrdersManagerProps {
  projectId?: string; // If passed, scope only to this project
  projects: Project[];
  purchaseOrders: PurchaseOrder[];
  setPurchaseOrders: React.Dispatch<React.SetStateAction<PurchaseOrder[]>>;
  currentUser: User;
  onLogAudit: (action: string, module: string, oldValue?: string, newValue?: string) => void;
  onAddNotification: (text: string, type: 'info' | 'success' | 'warning' | 'alert') => void;
  documents?: Document[];
  setDocuments?: React.Dispatch<React.SetStateAction<Document[]>>;
}

export default function PurchaseOrdersManager({
  projectId,
  projects,
  purchaseOrders,
  setPurchaseOrders,
  currentUser,
  onLogAudit,
  onAddNotification,
  documents,
  setDocuments,
}: PurchaseOrdersManagerProps) {
  
  // States
  const [selectedProjFilter, setSelectedProjFilter] = useState<string>(projectId || 'all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Synchronize state when the projectId prop changes (e.g. from the sidebar click)
  React.useEffect(() => {
    setSelectedProjFilter(projectId || 'all');
    setFormProjectId(projectId || (projects[0]?.id || ''));
  }, [projectId, projects]);

  // Form States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPoId, setEditingPoId] = useState<string | null>(null);
  const [previewAttachmentFile, setPreviewAttachmentFile] = useState<{ po: PurchaseOrder; name: string; size: string; data?: string; } | null>(null);

  // Form Fields
  const [formProjectId, setFormProjectId] = useState<string>(projectId || (projects[0]?.id || ''));
  const [formPoNumber, setFormPoNumber] = useState<string>('');
  const [formDate, setFormDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [formValue, setFormValue] = useState<number>(0);
  const [formScopeOfWork, setFormScopeOfWork] = useState<string>('');
  const [formPaymentTerms, setFormPaymentTerms] = useState<string>('');
  const [formWarranty, setFormWarranty] = useState<string>('');
  const [formCompletionDate, setFormCompletionDate] = useState<string>('');
  const [formWithVat, setFormWithVat] = useState<boolean>(true);

  // Attachments State
  const [formAttachments, setFormAttachments] = useState<{ name: string; size: string; data?: string; }[]>([]);
  const [dragOver, setDragOver] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset form helper
  const resetForm = () => {
    setEditingPoId(null);
    setFormProjectId(projectId || (projects[0]?.id || ''));
    setFormPoNumber('');
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormValue(0);
    setFormScopeOfWork('');
    setFormPaymentTerms('');
    setFormWarranty('');
    setFormCompletionDate('');
    setFormAttachments([]);
    setFormWithVat(true);
    setIsFormOpen(false);
  };

  // Populate form for editing
  const handleEditPo = (po: PurchaseOrder) => {
    setEditingPoId(po.id);
    setFormProjectId(po.projectId);
    setFormPoNumber(po.poNumber);
    setFormDate(po.date);
    setFormValue(po.value);
    setFormScopeOfWork(po.scopeOfWork);
    setFormPaymentTerms(po.paymentTerms);
    setFormWarranty(po.warranty);
    setFormCompletionDate(po.completionDate);
    setFormWithVat(po.withVat !== false);
    
    // Setup attachments from PO model
    const initialAttachments = po.attachments && po.attachments.length > 0 
      ? po.attachments 
      : (po.fileName ? [{ name: po.fileName, size: po.fileSize || 'N/A', data: po.fileData }] : []);
    
    setFormAttachments(initialAttachments);
    setIsFormOpen(true);
  };

  // Delete handler
  const handleDeletePo = (id: string, poNo: string, pId: string) => {
    const userRoleStr = currentUser?.role?.toLowerCase() || '';
    if (userRoleStr !== 'admin' && userRoleStr !== 'super admin' && userRoleStr !== 'superadmin') {
      alert("Unauthorized: Only Admin or Super Admin can delete records.");
      return;
    }

    if (!window.confirm(`Are you sure you want to delete Purchase Order ${poNo}?`)) {
      return;
    }

    const matchedProject = projects.find(p => p.id === pId);
    const projectName = matchedProject ? matchedProject.name : 'Unknown';

    setPurchaseOrders(prev => prev.filter(po => po.id !== id));

    // Remove from Document Controller if synced
    if (setDocuments) {
      const docIdPrefix = `doc_po_${id}`;
      setDocuments(prev => prev.filter(d => !d.id.startsWith(docIdPrefix)));
    }

    onLogAudit(`Deleted Purchase Order ${poNo} of Project ${projectName}`, 'Purchase Orders Module');
    onAddNotification(`Purchase Order ${poNo} deleted successfully.`, 'info');
  };

  // Add file helper
  const addFileToAttachments = (file: File) => {
    setFormAttachments(prev => {
      if (prev.length >= 3) {
        onAddNotification('Maximum 3 files are allowed per Purchase Order.', 'warning');
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

  // Drag and Drop
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

  // Handle Form Submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formPoNumber.trim()) {
      onAddNotification('Please specify a PO Registration Number.', 'warning');
      return;
    }
    if (formValue <= 0) {
      onAddNotification('Please specify a valid PO Value greater than 0 SAR.', 'warning');
      return;
    }
    if (!formScopeOfWork.trim()) {
      onAddNotification('Please describe the contract scope of work.', 'warning');
      return;
    }

    const mainFile = formAttachments[0];
    const newPoId = editingPoId || `po_${Date.now()}`;
    const calculatedVat = formWithVat ? Math.round(formValue * 0.15) : 0;

    const newPo: PurchaseOrder = {
      id: newPoId,
      projectId: formProjectId,
      poNumber: formPoNumber,
      date: formDate,
      value: formValue,
      scopeOfWork: formScopeOfWork,
      paymentTerms: formPaymentTerms || 'N/A',
      warranty: formWarranty || 'N/A',
      completionDate: formCompletionDate || formDate,
      fileName: mainFile ? mainFile.name : undefined,
      fileSize: mainFile ? mainFile.size : undefined,
      fileData: mainFile ? mainFile.data : undefined,
      attachments: formAttachments,
      withVat: formWithVat,
      vatAmount: calculatedVat,
    };

    if (editingPoId) {
      // Update existing
      setPurchaseOrders(prev => prev.map(po => po.id === editingPoId ? newPo : po));
      onAddNotification(`Purchase Order ${formPoNumber} updated successfully.`, 'success');
      onLogAudit(`Updated Purchase Order ${formPoNumber} details`, 'Purchase Orders Module');
    } else {
      // Create new
      setPurchaseOrders(prev => [newPo, ...prev]);
      onAddNotification(`Purchase Order ${formPoNumber} created successfully.`, 'success');
      onLogAudit(`Registered new Purchase Order ${formPoNumber} with total value of ${formValue.toLocaleString()} SAR ${formWithVat ? '(with VAT)' : '(without VAT)'}`, 'Purchase Orders Module');
    }

    // Document sync
    if (setDocuments) {
      const docIdPrefix = `doc_po_${newPoId}`;
      setDocuments(prev => {
        // Filter out any previous documents for this PO
        const filtered = prev.filter(d => !d.id.startsWith(docIdPrefix));
        const newDocs = formAttachments.map((att, idx) => ({
          id: `${docIdPrefix}_${idx}`,
          projectId: formProjectId,
          name: att.name,
          category: 'PO' as const,
          version: 'v1.0',
          uploadedBy: currentUser.name,
          uploadedAt: formDate,
          size: att.size || '3.4 MB',
          tags: ['PO', 'Client Agreement', `Attachment ${idx + 1}`],
          description: `Contract attachment file: ${formPoNumber} - ${formScopeOfWork.substring(0, 50)}...`
        }));
        return [...filtered, ...newDocs];
      });
    }

    resetForm();
  };

  // Download Attachment Handler
  const handleDownloadAttachmentFile = (filename: string, fileData?: string) => {
    if (!filename) return;
    
    try {
      let url = '';
      if (fileData) {
        url = fileData;
      } else {
        const content = `[Wafaq Contracting Co. Original Purchase Order Document: ${filename}]`;
        const blob = new Blob([content], { type: 'application/octet-stream' });
        url = URL.createObjectURL(blob);
      }
      
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      if (!fileData) {
        URL.revokeObjectURL(url);
      }
      onAddNotification(`Attachment "${filename}" downloaded successfully.`, 'success');
    } catch (err) {
      console.error('Error downloading file:', err);
      onAddNotification('Failed to download file attachment.', 'alert');
    }
  };

  // Format Helpers
  const formatSAR = (amount: number) => {
    return `${amount.toLocaleString()} SAR`;
  };

  const getProjectInfo = (pId: string) => {
    return projects.find(p => p.id === pId) || { name: 'Unknown Project', code: 'PROJ-XXX', clientName: '' };
  };

  // Filter & Search computation
  const filteredPurchaseOrders = useMemo(() => {
    return purchaseOrders.filter(po => {
      // Project match
      if (selectedProjFilter !== 'all' && po.projectId !== selectedProjFilter) {
        return false;
      }
      // Search keywords matching PO Number, scope of work, project name, vendor (clientName), or ID
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        const projInfo = getProjectInfo(po.projectId);
        const matchesPoNum = (po.poNumber || '').toLowerCase().includes(query);
        const matchesPoId = (po.id || '').toLowerCase().includes(query);
        const matchesProjId = (po.projectId || '').toLowerCase().includes(query);
        const matchesProjCode = (projInfo?.code || '').toLowerCase().includes(query);
        const matchesScope = (po.scopeOfWork || '').toLowerCase().includes(query);
        const matchesProj = (projInfo?.name || '').toLowerCase().includes(query);
        const matchesTerms = (po.paymentTerms || '').toLowerCase().includes(query);
        const matchesVendor = (projInfo?.clientName || '').toLowerCase().includes(query);
        
        return matchesPoNum || matchesPoId || matchesProjId || matchesProjCode || matchesScope || matchesProj || matchesTerms || matchesVendor;
      }
      return true;
    });
  }, [purchaseOrders, selectedProjFilter, searchQuery]);

  return (
    <div className="space-y-6">
      
      {/* SECTION HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider font-mono flex items-center space-x-2">
            <Layers className="w-4 h-4 text-indigo-600" />
            <span>Client Purchase Orders (PO) Manager</span>
          </h2>
          <p className="text-[11px] text-gray-500">
            {projectId 
              ? `Manage and upload signed purchase orders, receive dates, total contract values, and scope files for this workspace.`
              : 'Register, edit, and keep tracking of registered client PO contracts and multiple supporting attachments.'
            }
          </p>
        </div>

        {/* Action Button */}
        <button
          type="button"
          onClick={() => {
            resetForm();
            setIsFormOpen(true);
          }}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2 rounded-lg transition shadow-sm hover:shadow flex items-center space-x-2 self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New PO</span>
        </button>
      </div>

      {/* FILTER CONTROLS */}
      <div className="bg-slate-50/50 p-4 rounded-xl border border-gray-150 grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
        {/* Search Bar */}
        <div className="md:col-span-8 relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search PO number, scope keywords, payment terms, project name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white pl-9 pr-4 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-sans"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-[10px] font-bold"
            >
              Clear
            </button>
          )}
        </div>

        {/* Project Selector - Shown only when not scoped to a specific project */}
        <div className="md:col-span-4">
          {projectId ? (
            <div className="text-[10px] font-mono text-gray-400 bg-gray-100/50 p-2 rounded-lg text-right">
              Locked to Project: <span className="font-bold text-slate-700">{getProjectInfo(projectId).name}</span>
            </div>
          ) : (
            <select
              value={selectedProjFilter}
              onChange={(e) => setSelectedProjFilter(e.target.value)}
              className="w-full bg-white p-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="all">All Projects</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* PURCHASE ORDERS GRID LIST */}
      {filteredPurchaseOrders.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 border border-dashed border-gray-250 rounded-2xl">
          <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-xs text-gray-500 font-medium font-sans">No Client Purchase Orders matched the filter criteria.</p>
          <button
            type="button"
            onClick={() => {
              resetForm();
              setIsFormOpen(true);
            }}
            className="mt-3 inline-flex items-center space-x-1 text-indigo-600 hover:text-indigo-800 text-xs font-bold hover:underline"
          >
            <span>Register a new PO now</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filteredPurchaseOrders.map((po) => {
            const proj = getProjectInfo(po.projectId);
            return (
              <div 
                key={po.id} 
                className="bg-white rounded-xl border border-gray-200/85 hover:border-indigo-300 shadow-sm hover:shadow-md transition-all p-5 flex flex-col justify-between space-y-4"
              >
                {/* Header Info */}
                <div className="flex justify-between items-start gap-2 border-b border-gray-50 pb-3">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-[10px] bg-slate-100 text-slate-700 font-bold px-1.5 py-0.5 rounded">
                        {proj.code}
                      </span>
                      <span className="text-xs font-bold text-gray-800 truncate block max-w-[200px]" title={proj.name}>
                        {proj.name}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1 text-[10px] text-gray-400 font-mono">
                      <Clock className="w-3 h-3 text-gray-400 shrink-0" />
                      <span>PO Date: {po.date}</span>
                    </div>
                  </div>
                  
                  <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full flex items-center space-x-1 shrink-0">
                    <ShieldCheck className="w-3 h-3 text-emerald-500" />
                    <span>PO SIGNED</span>
                  </span>
                </div>

                {/* Scope & Details section */}
                <div className="space-y-3.5 flex-1">
                  <div>
                    <span className="block text-[8px] font-mono text-gray-400 uppercase font-extrabold tracking-wider">PO Registration Number</span>
                    <span className="font-bold font-mono text-xs text-indigo-900 bg-indigo-50/40 border border-indigo-100/55 rounded-lg px-2 py-1 block mt-0.5 w-max">
                      {po.poNumber}
                    </span>
                  </div>

                  {(() => {
                    const disp = getPurchaseOrderDisplayValues(po);
                    return (
                      <div className="bg-slate-50 border border-slate-100 rounded-lg p-2.5 space-y-1.5">
                        <span className="block text-[8px] font-mono text-gray-400 uppercase font-extrabold tracking-wider">PO Contract Financials</span>
                        <div className="grid grid-cols-3 gap-2 text-[11px]">
                          <div>
                            <span className="block text-[8px] text-slate-400 font-mono uppercase">Base (Excl. VAT)</span>
                            <span className="font-bold text-slate-700 font-mono">{formatSAR(disp.value)}</span>
                          </div>
                          <div>
                            <span className="block text-[8px] text-slate-400 font-mono uppercase">VAT Amount</span>
                            <span className="font-semibold text-slate-600 font-mono">
                              {formatSAR(disp.vatAmount)}
                            </span>
                          </div>
                          <div>
                            <span className="block text-[8px] text-slate-400 font-mono uppercase">Total (Incl. VAT)</span>
                            <span className="font-black text-emerald-600 font-mono">
                              {formatSAR(disp.total)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  <div>
                    <span className="block text-[8px] font-mono text-gray-400 uppercase font-extrabold tracking-wider">Contract Scope of Work</span>
                    <p className="text-xs text-gray-600 font-sans leading-relaxed mt-0.5 line-clamp-3 hover:line-clamp-none transition-all duration-300 cursor-pointer" title="Click to expand">
                      {po.scopeOfWork}
                    </p>
                  </div>

                  {/* Payment, Warranty and Completion details */}
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-50/80 text-[11px] bg-slate-50/50 p-2.5 rounded-lg">
                    <div>
                      <span className="block text-[8px] font-mono text-slate-500 uppercase font-bold">Payment Terms</span>
                      <p className="text-gray-600 font-sans mt-0.5 line-clamp-2" title={po.paymentTerms}>{po.paymentTerms}</p>
                    </div>
                    <div>
                      <span className="block text-[8px] font-mono text-slate-500 uppercase font-bold">Warranty Terms</span>
                      <p className="text-gray-600 font-sans mt-0.5 line-clamp-2" title={po.warranty}>{po.warranty}</p>
                    </div>
                    <div className="col-span-2 flex items-center justify-between pt-1 border-t border-slate-100 text-[10px]">
                      <span className="text-slate-400 font-mono">Planned Completion Date:</span>
                      <span className="font-mono text-slate-700 font-bold flex items-center space-x-1">
                        <Calendar className="w-3 h-3 text-slate-400 inline" />
                        <span>{po.completionDate}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Attachments Section */}
                <div className="space-y-1.5 pt-2 border-t border-gray-50">
                  <span className="block text-[8px] font-mono text-gray-400 uppercase font-extrabold tracking-wider">PO Certified Attachments</span>
                  {(() => {
                    const attachmentsList = po.attachments && po.attachments.length > 0 
                      ? po.attachments 
                      : (po.fileName ? [{ name: po.fileName, size: po.fileSize || 'N/A', data: po.fileData }] : []);
                    
                    if (attachmentsList.length === 0) {
                      return (
                        <p className="text-[10px] text-gray-400 italic">No files attached to this purchase order.</p>
                      );
                    }

                    return (
                      <div className="space-y-1">
                        {attachmentsList.map((att, idx) => (
                          <div key={idx} className="flex items-center justify-between border border-gray-100 p-2 rounded-lg bg-gray-50/50">
                            <div className="flex items-center space-x-1.5 text-[11px] truncate text-slate-700 font-semibold max-w-[65%]">
                              <FileText className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                              <span className="truncate" title={att.name}>{att.name}</span>
                              <span className="text-[9px] text-gray-400 font-mono font-normal shrink-0">({att.size || 'N/A'})</span>
                            </div>
                            <div className="flex items-center space-x-2 shrink-0">
                              <button
                                type="button"
                                onClick={() => setPreviewAttachmentFile({ po, name: att.name, size: att.size || 'N/A', data: att.data })}
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
                        ))}
                      </div>
                    );
                  })()}
                </div>

                {/* Controls - Edit & Delete */}
                <div className="flex justify-between items-center pt-2.5 border-t border-gray-50 text-[11px]">
                  <span className="text-[10px] text-slate-400 font-mono">
                    Owner: <span className="font-bold">{currentUser.role === 'Admin' ? 'Management' : currentUser.name}</span>
                  </span>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => handleEditPo(po)}
                      className="text-gray-500 hover:text-indigo-600 font-bold flex items-center space-x-1 px-2 py-1 rounded hover:bg-slate-50 cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeletePo(po.id, po.poNumber, po.projectId)}
                      className="text-gray-400 hover:text-rose-600 font-bold flex items-center space-x-1 px-2 py-1 rounded hover:bg-rose-50 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ADD/EDIT MODAL FORM */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200">
            {/* Modal Header */}
            <div className="bg-indigo-900 text-white p-5 rounded-t-2xl flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider font-mono">
                  {editingPoId ? `Edit Purchase Order (${formPoNumber})` : 'Register Client Issued Purchase Order (PO)'}
                </h3>
                <p className="text-[10px] text-indigo-200">Provide legal PO registration details and contract terms</p>
              </div>
              <button 
                type="button" 
                onClick={resetForm}
                className="text-indigo-200 hover:text-white p-1 rounded-lg transition hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Project selector */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-mono text-gray-500 uppercase font-bold">Target Project *</label>
                  {projectId ? (
                    <input 
                      type="text" 
                      value={getProjectInfo(projectId).name} 
                      disabled 
                      className="w-full bg-gray-50 border border-gray-200 p-2 rounded-lg text-xs font-semibold text-gray-500 cursor-not-allowed"
                    />
                  ) : (
                    <select
                      value={formProjectId}
                      onChange={(e) => setFormProjectId(e.target.value)}
                      className="w-full bg-white border border-gray-200 p-2 rounded-lg text-xs focus:ring-1 focus:ring-indigo-500"
                    >
                      {projects.map(p => (
                        <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
                      ))}
                    </select>
                  )}
                </div>

                {/* PO Number */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-mono text-gray-500 uppercase font-bold">PO Registration Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. PO-AL-AJLAN-2025-881"
                    value={formPoNumber}
                    onChange={(e) => setFormPoNumber(e.target.value)}
                    className="w-full bg-white border border-gray-200 p-2 rounded-lg text-xs focus:ring-1 focus:ring-indigo-500 font-mono font-bold text-gray-800"
                  />
                </div>

                {/* PO receive date */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-mono text-gray-500 uppercase font-bold">PO Receive / Registration Date *</label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full bg-white border border-gray-200 p-2 rounded-lg text-xs focus:ring-1 focus:ring-indigo-500 font-mono"
                  />
                </div>

                {/* PO Value */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-mono text-gray-500 uppercase font-bold">Total Contract PO Value (SAR - Excl. VAT) *</label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 font-mono text-xs">SAR</span>
                    <input
                      type="number"
                      required
                      min="1"
                      placeholder="12500000"
                      value={formValue || ''}
                      onChange={(e) => setFormValue(Number(e.target.value))}
                      className="w-full bg-white border border-gray-200 pl-12 pr-4 p-2 rounded-lg text-xs focus:ring-1 focus:ring-indigo-500 font-mono font-black text-emerald-600"
                    />
                  </div>
                </div>

                {/* Planned completion date */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-mono text-gray-500 uppercase font-bold">Contract Planned Completion Date *</label>
                  <input
                    type="date"
                    required
                    value={formCompletionDate}
                    onChange={(e) => setFormCompletionDate(e.target.value)}
                    className="w-full bg-white border border-gray-200 p-2 rounded-lg text-xs focus:ring-1 focus:ring-indigo-500 font-mono"
                  />
                </div>

                {/* VAT Option */}
                <div className="space-y-1 md:col-span-2">
                  <label className="block text-[10px] font-mono text-gray-500 uppercase font-bold">VAT Option *</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormWithVat(true)}
                      className={`py-2 px-3 rounded-lg text-xs font-bold font-mono border transition flex items-center justify-center space-x-1 cursor-pointer ${
                        formWithVat 
                          ? 'bg-indigo-550 border-indigo-500 bg-indigo-50 text-indigo-700' 
                          : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-indigo-600 mr-1 inline-block"></span>
                      <span>With VAT (15%)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormWithVat(false)}
                      className={`py-2 px-3 rounded-lg text-xs font-bold font-mono border transition flex items-center justify-center space-x-1 cursor-pointer ${
                        !formWithVat 
                          ? 'bg-indigo-550 border-indigo-500 bg-indigo-50 text-indigo-700' 
                          : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-slate-400 mr-1 inline-block"></span>
                      <span>Without VAT (0%)</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Live Financial Breakdown */}
              {formValue > 0 && (
                <div className="bg-indigo-50/40 border border-indigo-100 rounded-xl p-4 space-y-2">
                  <div className="text-[9px] font-mono text-indigo-800 uppercase font-bold pb-1 border-b border-indigo-150/50">
                    Live Purchase Order Financial Recap (SAR)
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <span className="block text-[8px] text-gray-400 font-mono uppercase">Base Value</span>
                      <span className="font-semibold text-gray-700 font-mono">{formatSAR(formValue)}</span>
                    </div>
                    <div>
                      <span className="block text-[8px] text-gray-400 font-mono uppercase">VAT Amount (15%)</span>
                      <span className={`font-semibold font-mono ${formWithVat ? 'text-indigo-600' : 'text-gray-400'}`}>
                        {formatSAR(formWithVat ? Math.round(formValue * 0.15) : 0)}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[8px] text-gray-400 font-mono uppercase font-bold">Total PO Value</span>
                      <span className="font-extrabold text-emerald-600 font-mono text-sm block">
                        {formatSAR(formValue + (formWithVat ? Math.round(formValue * 0.15) : 0))}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Scope of work */}
              <div className="space-y-1">
                <label className="block text-[10px] font-mono text-gray-500 uppercase font-bold">Contract Scope of Work *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Describe the overall civil, structural, architectural, MEP or fit-out services ordered by client representatives..."
                  value={formScopeOfWork}
                  onChange={(e) => setFormScopeOfWork(e.target.value)}
                  className="w-full bg-white border border-gray-200 p-2 rounded-lg text-xs focus:ring-1 focus:ring-indigo-500 leading-relaxed font-sans"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Payment terms */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-mono text-gray-500 uppercase font-bold">Payment Terms</label>
                  <textarea
                    rows={2}
                    placeholder="e.g. 10% advance payment, monthly progress invoices with 5% retention..."
                    value={formPaymentTerms}
                    onChange={(e) => setFormPaymentTerms(e.target.value)}
                    className="w-full bg-white border border-gray-200 p-2 rounded-lg text-xs focus:ring-1 focus:ring-indigo-500 text-gray-700"
                  />
                </div>

                {/* Warranty terms */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-mono text-gray-500 uppercase font-bold">Warranty Terms</label>
                  <textarea
                    rows={2}
                    placeholder="e.g. 2-year operational and 10-year structural warranty..."
                    value={formWarranty}
                    onChange={(e) => setFormWarranty(e.target.value)}
                    className="w-full bg-white border border-gray-200 p-2 rounded-lg text-xs focus:ring-1 focus:ring-indigo-500 text-gray-700"
                  />
                </div>
              </div>

              {/* Upload signed contract file */}
              <div className="space-y-1.5 pt-2">
                <label className="block text-[10px] font-mono text-gray-500 uppercase font-bold">
                  Purchase Order Certified Files (Max 3 files, at least 1 required) *
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
                          className="text-rose-500 hover:text-rose-700 text-xs font-bold hover:underline cursor-pointer bg-transparent border-0 p-0"
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
                    className={`border-2 border-dashed rounded-xl p-6 text-center transition cursor-pointer ${
                      dragOver ? 'border-indigo-500 bg-indigo-50/50' : 'border-gray-200 hover:border-indigo-400'
                    }`}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="w-6 h-6 text-indigo-500 mx-auto mb-2" />
                    <p className="text-xs text-gray-700 font-bold">Drag & drop readymade PO contract file here ({formAttachments.length}/3)</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">Supports PDF, Excel, CAD up to 15MB (Select up to 3 files)</p>
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

              {/* Buttons */}
              <div className="pt-4 border-t border-gray-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs px-4 py-2 rounded-lg transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-5 py-2 rounded-lg transition flex items-center space-x-1.5 cursor-pointer shadow"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>{editingPoId ? 'Save Changes' : 'Register Purchase Order'}</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ORIGINAL ATTACHMENT PREVIEW MODAL */}
      {previewAttachmentFile && (() => {
        const po = previewAttachmentFile.po;
        const proj = getProjectInfo(po.projectId);
        const fileName = previewAttachmentFile.name;
        const fileSize = previewAttachmentFile.size;
        const fileData = previewAttachmentFile.data;
        const fileExt = fileName.split('.').pop()?.toUpperCase() || 'PDF';

        return (
          <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-slate-900 rounded-xl w-full max-w-5xl h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-750">
              
              {/* Preview Header */}
              <div className="bg-slate-800 border-b border-slate-700/60 p-4 flex items-center justify-between text-white">
                <div className="flex items-center space-x-2 truncate pr-4">
                  <div className="bg-indigo-500/20 text-indigo-300 p-1.5 rounded-lg">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="truncate">
                    <h4 className="text-xs font-black truncate">{fileName}</h4>
                    <p className="text-[9px] text-gray-400 font-mono uppercase mt-0.5">
                      Type: <span className="text-indigo-400 font-bold">{fileExt}</span> • Size: {fileSize} • PO #: {po.poNumber} • Project: {proj.name}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleDownloadAttachmentFile(fileName, fileData)}
                    className="bg-slate-700 hover:bg-slate-600 text-slate-200 hover:text-white px-2.5 py-1.5 rounded transition flex items-center space-x-1 cursor-pointer text-xs"
                    title="Download File"
                  >
                    <FileDown className="w-4 h-4" />
                    <span className="hidden sm:inline">Download File</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPreviewAttachmentFile(null)}
                    className="bg-rose-600 hover:bg-rose-700 text-white px-3 py-1.5 rounded font-bold transition flex items-center space-x-1 cursor-pointer text-xs"
                  >
                    <X className="w-4 h-4" />
                    <span>Close</span>
                  </button>
                </div>
              </div>

              {/* Simulated Document Sheet View */}
              <div className="w-full max-w-4xl mx-auto bg-white shadow-2xl relative overflow-y-auto text-slate-800 rounded-b-xl max-h-[80vh] font-sans flex-1 my-4">
                {fileData ? (
                  fileData.startsWith('data:application/pdf') || fileName.toLowerCase().endsWith('.pdf') ? (
                    <div className="w-full h-full min-h-[60vh]">
                      <iframe
                        src={fileData}
                        title={fileName}
                        className="w-full h-full border-0"
                      />
                    </div>
                  ) : fileData.startsWith('data:image') || /\.(png|jpe?g|gif|svg|webp)$/i.test(fileName) ? (
                    <div className="w-full h-full min-h-[60vh] bg-slate-50 flex items-center justify-center p-6 overflow-auto">
                      <img
                        src={fileData}
                        alt={fileName}
                        className="max-w-full max-h-full object-contain rounded-lg shadow-sm"
                      />
                    </div>
                  ) : (
                    <div className="p-12 text-center text-slate-500 font-sans space-y-3 min-h-[40vh] flex flex-col items-center justify-center">
                      <FileText className="w-16 h-16 text-slate-300 mx-auto animate-pulse" />
                      <h4 className="text-sm font-bold text-slate-800">Format Preview Not Directly Renderable</h4>
                      <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                        This is a raw contract document file ({fileExt}). Click below to download and view on your local machine.
                      </p>
                      <div className="pt-4">
                        <button
                          type="button"
                          onClick={() => handleDownloadAttachmentFile(fileName, fileData)}
                          className="inline-flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-bold text-xs transition cursor-pointer animate-bounce"
                        >
                          <FileDown className="w-4 h-4" />
                          <span>Download & Open File</span>
                        </button>
                      </div>
                    </div>
                  )
                ) : (
                  <div className="p-12 text-center text-slate-500 font-sans space-y-3 min-h-[40vh] flex flex-col items-center justify-center">
                    <Award className="w-16 h-16 text-indigo-500/20 mx-auto" />
                    <h4 className="text-sm font-bold text-slate-800">Mock Signed PO Attachment Document</h4>
                    <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                      This represents the legally sealed contract document file uploaded during registration. Since this is an initial mock entry, it contains a generated preview placeholder.
                    </p>
                    <div className="pt-4">
                      <button
                        type="button"
                        onClick={() => handleDownloadAttachmentFile(fileName, fileData)}
                        className="inline-flex items-center space-x-2 bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-lg font-bold text-xs transition cursor-pointer"
                      >
                        <FileDown className="w-4 h-4" />
                        <span>Download Simulated document.pdf</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>
        );
      })()}

    </div>
  );
}
