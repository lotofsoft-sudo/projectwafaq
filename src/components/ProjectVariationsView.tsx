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
  Upload
} from 'lucide-react';
import { Project, Variation, User, Comment, getVatAppliedAmount } from '../types';
import { jsPDF } from 'jspdf';

interface ProjectVariationsViewProps {
  projects: Project[];
  variations: Variation[];
  setVariations: React.Dispatch<React.SetStateAction<Variation[]>>;
  currentUser: User;
  availableUsers: User[];
  onLogAudit: (action: string, module: string, oldValue?: string, newValue?: string) => void;
  onAddNotification: (text: string, type: 'info' | 'success' | 'warning' | 'alert') => void;
}

export default function ProjectVariationsView({
  projects,
  variations,
  setVariations,
  currentUser,
  availableUsers,
  onLogAudit,
  onAddNotification,
}: ProjectVariationsViewProps) {
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [projectSearchQuery, setProjectSearchQuery] = useState('');
  const [variationSearchQuery, setVariationSearchQuery] = useState('');
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);

  // Filters state
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterImpactLevel, setFilterImpactLevel] = useState<string>('all');

  // Detail Modal & Action Form States
  const [selectedVariationId, setSelectedVariationId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingVariation, setEditingVariation] = useState<Variation | null>(null);
  const [isPdfPreviewOpen, setIsPdfPreviewOpen] = useState(false);

  // Form Fields
  const [voRefNumber, setVoRefNumber] = useState('');
  const [voTitle, setVoTitle] = useState('');
  const [voDescription, setVoDescription] = useState('');
  const [voProjectId, setVoProjectId] = useState('');
  const [voCostImpact, setVoCostImpact] = useState<number>(0);
  const [voTimeImpactDays, setVoTimeImpactDays] = useState<number>(0);
  const [voApprovalStatus, setVoApprovalStatus] = useState<'draft' | 'pending' | 'approved' | 'rejected'>('draft');

  // Comments & Attachments adding in details panel
  const [newCommentText, setNewCommentText] = useState('');
  const [newFileName, setNewFileName] = useState('');
  const [newFileSize, setNewFileSize] = useState('');

  // Draft file attachments for creation/editing form
  const [draftAttachments, setDraftAttachments] = useState<{ name: string; size: string; uploadedAt?: string }[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  // Authorization checks
  const canManageVariations = useMemo(() => {
    return currentUser.role === 'General Manager' || 
           currentUser.role === 'Project Manager' || 
           currentUser.role === 'Admin' || 
           currentUser.role === 'Super Admin';
  }, [currentUser]);

  // Selected variation memoized to avoid re-render loop
  const selectedVariation = useMemo(() => {
    return variations.find(v => v.id === selectedVariationId) || null;
  }, [variations, selectedVariationId]);

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

  // Filtered Variations List
  const selectedVariationsList = useMemo(() => {
    let list = variations;
    if (selectedProjectId !== 'all') {
      list = list.filter(v => v.projectId === selectedProjectId);
    }
    if (filterStatus !== 'all') {
      list = list.filter(v => v.approvalStatus === filterStatus);
    }
    if (filterImpactLevel !== 'all') {
      if (filterImpactLevel === 'high') {
        list = list.filter(v => v.costImpact >= 100000);
      } else if (filterImpactLevel === 'medium') {
        list = list.filter(v => v.costImpact >= 25000 && v.costImpact < 100000);
      } else {
        list = list.filter(v => v.costImpact < 25000);
      }
    }
    if (variationSearchQuery.trim()) {
      const q = variationSearchQuery.toLowerCase();
      list = list.filter(v => 
        v.title.toLowerCase().includes(q) || 
        v.description.toLowerCase().includes(q) ||
        (v.refNumber && v.refNumber.toLowerCase().includes(q))
      );
    }
    return list;
  }, [variations, selectedProjectId, filterStatus, filterImpactLevel, variationSearchQuery]);

  // Metrics Calculations
  const metrics = useMemo(() => {
    const list = selectedVariationsList;
    const totalCount = list.length;
    const approvedCount = list.filter(v => v.approvalStatus === 'approved').length;
    const pendingCount = list.filter(v => v.approvalStatus === 'pending').length;
    const draftCount = list.filter(v => v.approvalStatus === 'draft').length;

    const totalApprovedCost = list
      .filter(v => v.approvalStatus === 'approved')
      .reduce((sum, v) => sum + v.costImpact, 0);

    const totalPendingCost = list
      .filter(v => v.approvalStatus === 'pending')
      .reduce((sum, v) => sum + v.costImpact, 0);

    const totalTimeImpactApproved = list
      .filter(v => v.approvalStatus === 'approved')
      .reduce((sum, v) => sum + v.timeImpactDays, 0);

    return {
      totalCount,
      approvedCount,
      pendingCount,
      draftCount,
      totalApprovedCost,
      totalPendingCost,
      totalTimeImpactApproved
    };
  }, [selectedVariationsList]);

  // Project metadata helper
  const getProjectInfo = (pId: string) => {
    return projects.find(p => p.id === pId) || { name: 'Unknown Project', code: 'PROJ-XXX', budget: 0, clientName: 'N/A' };
  };

  // Form Initializers
  const handleOpenAdd = () => {
    if (!canManageVariations) {
      onAddNotification('Unauthorized: Your role does not allow drafting variations.', 'alert');
      return;
    }
    setEditingVariation(null);
    setVoRefNumber(`VO-${getProjectInfo(selectedProjectId === 'all' ? projects[0]?.id : selectedProjectId).code}-${Date.now().toString().slice(-4)}`);
    setVoTitle('');
    setVoDescription('');
    setVoProjectId(selectedProjectId === 'all' ? (projects[0]?.id || '') : selectedProjectId);
    setVoCostImpact(0);
    setVoTimeImpactDays(0);
    setVoApprovalStatus('draft');
    setDraftAttachments([]);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (v: Variation, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!canManageVariations) {
      onAddNotification('Unauthorized: Your role does not allow editing variations.', 'alert');
      return;
    }
    setEditingVariation(v);
    setVoRefNumber(v.refNumber || `VO-${getProjectInfo(v.projectId).code}-${v.id.slice(-3)}`);
    setVoTitle(v.title);
    setVoDescription(v.description);
    setVoProjectId(v.projectId);
    setVoCostImpact(v.costImpact);
    setVoTimeImpactDays(v.timeImpactDays);
    setVoApprovalStatus(v.approvalStatus);
    setDraftAttachments(v.attachments || []);
    setIsFormOpen(true);
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

  const handleSaveVariation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageVariations) {
      onAddNotification('Unauthorized: Your role does not allow saving variation changes.', 'alert');
      return;
    }

    if (!voTitle.trim()) {
      onAddNotification('Please specify a valid Variation title.', 'warning');
      return;
    }

    if (editingVariation) {
      setVariations(prev => prev.map(item => {
        if (item.id === editingVariation.id) {
          const statusChanged = item.approvalStatus !== voApprovalStatus;
          const nextUpdates = [...(item.updates || [])];

          if (statusChanged) {
            nextUpdates.push({
              id: `v_up_${Date.now()}`,
              user: currentUser.name,
              role: currentUser.role,
              text: `Status transitioned from "${item.approvalStatus}" to "${voApprovalStatus}".`,
              date: new Date().toISOString().replace('T', ' ').substring(0, 16)
            });
          }

          return {
            ...item,
            refNumber: voRefNumber.trim(),
            title: voTitle.trim(),
            description: voDescription.trim(),
            projectId: voProjectId,
            costImpact: Number(voCostImpact),
            timeImpactDays: Number(voTimeImpactDays),
            approvalStatus: voApprovalStatus,
            attachments: draftAttachments,
            updates: nextUpdates
          };
        }
        return item;
      }));

      onLogAudit(`Updated variation "${voTitle}"`, 'Variations', editingVariation.title, voTitle);
      onAddNotification(`Variation "${voTitle}" updated successfully.`, 'success');
    } else {
      const newVar: Variation = {
        id: `v_${Date.now()}`,
        refNumber: voRefNumber.trim(),
        projectId: voProjectId,
        title: voTitle.trim(),
        description: voDescription.trim(),
        costImpact: Number(voCostImpact),
        timeImpactDays: Number(voTimeImpactDays),
        approvalStatus: voApprovalStatus,
        dateCreated: new Date().toISOString().slice(0, 10),
        comments: [],
        attachments: draftAttachments,
        updates: [
          {
            id: `v_up_${Date.now()}`,
            user: currentUser.name,
            role: currentUser.role,
            text: `Variation order initiated as "${voApprovalStatus}".`,
            date: new Date().toISOString().replace('T', ' ').substring(0, 16)
          }
        ]
      };

      setVariations(prev => [...prev, newVar]);
      onLogAudit(`Initiated new Variation "${newVar.title}"`, 'Variations', undefined, newVar.title);
      onAddNotification(`Variation order draft created under reference ${newVar.refNumber}.`, 'success');
    }

    setIsFormOpen(false);
    setEditingVariation(null);
  };

  const handleDeleteVariation = (v: Variation, e: React.MouseEvent) => {
    const userRoleStr = currentUser?.role?.toLowerCase() || '';
    if (userRoleStr !== 'admin' && userRoleStr !== 'super admin' && userRoleStr !== 'superadmin') {
      alert("Unauthorized: Only Admin or Super Admin can delete records.");
      return;
    }

    e.stopPropagation();
    if (!canManageVariations) {
      onAddNotification('Unauthorized: Your role does not allow deleting variations.', 'alert');
      return;
    }

    if (window.confirm(`Are you sure you want to permanently delete Variation order ${v.refNumber || v.title}?`)) {
      setVariations(prev => prev.filter(item => item.id !== v.id));
      if (selectedVariationId === v.id) {
        setSelectedVariationId(null);
      }
      onLogAudit(`Deleted variation order "${v.title}"`, 'Variations', v.title, undefined);
      onAddNotification(`Variation order deleted successfully.`, 'success');
    }
  };

  // Add Comment inside Detail panel
  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVariationId || !newCommentText.trim()) return;

    const nextComment: Comment = {
      id: `v_comm_${Date.now()}`,
      user: currentUser.name,
      role: currentUser.role,
      text: newCommentText.trim(),
      date: new Date().toISOString().replace('T', ' ').substring(0, 16)
    };

    setVariations(prev => prev.map(v => {
      if (v.id === selectedVariationId) {
        const nextComments = [...(v.comments || []), nextComment];
        return { ...v, comments: nextComments };
      }
      return v;
    }));

    setNewCommentText('');
    onAddNotification('Comment logged successfully.', 'success');
  };

  // Add Attachment inside Detail panel
  const handleAddAttachment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVariationId || !newFileName.trim()) return;

    const nextAttachment = {
      name: newFileName.trim(),
      size: newFileSize.trim() || '1.8 MB',
      uploadedAt: new Date().toISOString().slice(0, 10)
    };

    setVariations(prev => prev.map(v => {
      if (v.id === selectedVariationId) {
        const nextAttachments = [...(v.attachments || []), nextAttachment];
        return { ...v, attachments: nextAttachments };
      }
      return v;
    }));

    setNewFileName('');
    setNewFileSize('');
    onAddNotification(`Uploaded file "${nextAttachment.name}" successfully.`, 'success');
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
  const getStatusLabel = (status: Variation['approvalStatus']) => {
    switch (status) {
      case 'draft': return { label: 'Draft / Proposed', style: 'bg-slate-100 text-slate-700 border-slate-200' };
      case 'pending': return { label: 'Pending Review', style: 'bg-amber-50 text-amber-700 border-amber-200' };
      case 'approved': return { label: 'Client Approved', style: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'rejected': return { label: 'Rejected / Void', style: 'bg-rose-50 text-rose-700 border-rose-200' };
    }
  };

  // Formal Export as simulated PDF download
  const handleExportPdfDownload = (v: Variation) => {
    const proj = getProjectInfo(v.projectId);
    const content = `
=========================================
      OFFICIAL VARIATION ORDER (VO)      
=========================================
Reference:    ${v.refNumber || `VO-${v.id}`}
Date Issued:  ${v.dateCreated}
Project Code: ${proj.code}
Project Name: ${proj.name}
Client Name:  ${proj.clientName}
Status:       ${v.approvalStatus.toUpperCase()}

-----------------------------------------
1. DETAILED DESCRIPTION OF WORKS:
-----------------------------------------
${v.description}

-----------------------------------------
2. FINANCIAL & SCHEDULE RECAP:
-----------------------------------------
Original Contract Sum:    ${formatCurrency(proj.budget)}
Variation Order Cost:     ${formatCurrency(v.costImpact)}
New Adjusted Contract Sum: ${formatCurrency(proj.budget + v.costImpact)}
Time Schedule Impact:     +${v.timeImpactDays} Days

-----------------------------------------
3. SIGN-OFF & AUTHORIZATION:
-----------------------------------------
Contractor Representative:
Name: ${currentUser.name} (${currentUser.role})
Signature Signature: Verified Electronic Sign-Off
Date: ${new Date().toISOString().slice(0, 10)}

Client Authorization Stamp:
Status: [ ${v.approvalStatus.toUpperCase()} ]
Signed-Off By Client Supervisor
Date: ${v.approvalStatus === 'approved' ? v.dateCreated : 'Pending Formal Sign-Off'}

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
    pdfDoc.save(`${v.refNumber || `VO-${v.id}`}_formal_order.pdf`);

    onLogAudit(`Exported PDF for Variation Order "${v.refNumber || v.title}"`, 'Variations', undefined, v.refNumber);
    onAddNotification(`Formal Variation document saved as TXT/PDF.`, 'success');
  };

  return (
    <div id="variations-view-root" className="flex-1 flex flex-col h-full bg-slate-50 overflow-hidden">
      
      {/* Top Banner Context Section */}
      <div className="bg-white border-b border-slate-200 p-5 md:px-8 flex flex-col md:flex-row md:items-center md:justify-between shrink-0 gap-4">
        <div>
          <span className="text-xs font-mono font-bold text-indigo-600 uppercase tracking-widest block mb-1">Contract & Scope Amendments</span>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Project Variation Orders (VO)</h2>
          <p className="text-xs text-slate-500 mt-1">Track financial deviations, schedule increases, draft pending claims, upload client letters, and finalize authorized VOs.</p>
        </div>
      </div>

      {/* Split Pane View */}
      <div className="flex-1 flex overflow-hidden min-h-0 w-full">
      
        {/* 1. LEFT SIDEBAR: Project Selector */}
        <div 
          id="variations-project-sidebar" 
          className={`w-72 border-r border-slate-200 bg-white flex flex-col h-full shrink-0 transition-transform lg:translate-x-0 lg:relative lg:pointer-events-auto lg:z-10 ${
            mobileDetailOpen ? '-translate-x-full absolute pointer-events-none' : 'relative z-10'
          }`}
        >
          <div className="p-4 border-b border-slate-100 bg-slate-50/60">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-widest font-mono">Projects Directory</h2>
            <p className="text-[10px] text-slate-400 mt-1">Select a project to filter VOs</p>
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
                <h4 className="text-xs font-bold text-slate-800">All Project Variations</h4>
                <p className="text-[10px] text-slate-400 mt-0.5">Corporate financial timeline</p>
              </div>
            </button>

            {filteredProjects.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs italic">No projects found.</div>
            ) : (
              filteredProjects.map(p => {
                const isActive = selectedProjectId === p.id;
                const pVarsCount = variations.filter(v => v.projectId === p.id).length;
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
                        {pVarsCount} VOs
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
          id="variations-data-viewport" 
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
                <TrendingUp className="w-5 h-5" />
              </div>
              <div className="overflow-hidden">
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-mono font-extrabold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded uppercase">
                    {activeProject ? activeProject.code : 'GLOBAL'}
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 truncate">
                    {activeProject ? `${activeProject.name} - Variation Orders` : 'Wafaq Variation & Claim Control'}
                  </h3>
                </div>
                <p className="text-[10px] text-slate-400 truncate mt-0.5">
                  {activeProject 
                    ? `Create draft scope amendments, claim adjustments, and schedule impacts for ${activeProject.name}.`
                    : 'Consolidated corporate summary of all proposed, drafted, pending, and approved contract modifications.'
                  }
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              {canManageVariations && (
                <button
                  onClick={handleOpenAdd}
                  className="inline-flex items-center justify-center space-x-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Variation (VO)</span>
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
                  placeholder="Search variations by title, reference..."
                  value={variationSearchQuery}
                  onChange={e => setVariationSearchQuery(e.target.value)}
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
                    <option value="draft">Draft</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>

                {/* Impact Level Filter */}
                <div className="flex items-center space-x-1">
                  <span className="text-slate-400 font-mono text-[10px]">Impact Level:</span>
                  <select
                    value={filterImpactLevel}
                    onChange={e => setFilterImpactLevel(e.target.value)}
                    className="border border-slate-200 rounded-lg bg-white p-1 text-[11px] focus:ring-1 focus:ring-indigo-500 outline-none"
                  >
                    <option value="all">All Sizes</option>
                    <option value="high">Major Impact (&gt;= 100k SAR)</option>
                    <option value="medium">Medium Impact (25k-100k SAR)</option>
                    <option value="low">Minor Impact (&lt; 25k SAR)</option>
                  </select>
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
                  <span className="text-[10px] font-mono text-slate-400 uppercase font-bold tracking-wider">Approved VO Total</span>
                  <h4 className="text-lg font-extrabold text-emerald-600 mt-1">{formatCurrency(metrics.totalApprovedCost)}</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">{metrics.approvedCount} approved claims</p>
                </div>
                <div className="bg-emerald-50 p-2.5 rounded-xl text-emerald-600">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase font-bold tracking-wider">Pending VO Value</span>
                  <h4 className="text-lg font-extrabold text-amber-600 mt-1">{formatCurrency(metrics.totalPendingCost)}</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">{metrics.pendingCount} in evaluation</p>
                </div>
                <div className="bg-amber-50 p-2.5 rounded-xl text-amber-600">
                  <DollarSign className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase font-bold tracking-wider">Schedule Extension</span>
                  <h4 className="text-lg font-extrabold text-blue-600 mt-1">+{metrics.totalTimeImpactApproved} Days</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Approved time adjustment</p>
                </div>
                <div className="bg-blue-50 p-2.5 rounded-xl text-blue-600">
                  <Clock className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase font-bold tracking-wider">Draft VOs</span>
                  <h4 className="text-lg font-extrabold text-slate-700 mt-1">{metrics.draftCount} Drafts</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Proposed internal scope</p>
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
                    <FileText className="w-4 h-4 text-indigo-600" />
                    <span>{editingVariation ? 'Modify Variation Order' : 'Initiate Dynamic Variation Order (VO)'}</span>
                  </h4>
                  <button 
                    type="button" 
                    onClick={() => {
                      setIsFormOpen(false);
                      setEditingVariation(null);
                    }} 
                    className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-50 transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleSaveVariation} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Project Selector (if Global view) */}
                    {selectedProjectId === 'all' && !editingVariation && (
                      <div>
                        <label className="block text-[10px] font-mono text-slate-400 uppercase font-bold">Target Project</label>
                        <select
                          required
                          value={voProjectId}
                          onChange={e => {
                            setVoProjectId(e.target.value);
                            setVoRefNumber(`VO-${getProjectInfo(e.target.value).code}-${Date.now().toString().slice(-4)}`);
                          }}
                          className="w-full border border-slate-200 rounded-lg p-2 text-xs mt-1 bg-white focus:ring-1 focus:ring-indigo-500 outline-none font-medium text-slate-700"
                        >
                          {projects.map(p => (
                            <option key={p.id} value={p.id}>[{p.code}] {p.name}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 uppercase font-bold">VO Ref Code / Serial</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. VO-A1-002"
                        value={voRefNumber}
                        onChange={e => setVoRefNumber(e.target.value)}
                        className="w-full border border-slate-200 rounded-lg p-2 text-xs mt-1 focus:ring-1 focus:ring-indigo-500 outline-none font-medium text-slate-700 bg-slate-50"
                      />
                    </div>

                    <div className={selectedProjectId !== 'all' || editingVariation ? 'md:col-span-2' : ''}>
                      <label className="block text-[10px] font-mono text-slate-400 uppercase font-bold">Variation Title</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Upgrade AC System to VRF units, Relocate Boundary walls..."
                        value={voTitle}
                        onChange={e => voTitle ? {} : setVoTitle(e.target.value)}
                        defaultValue={voTitle}
                        className="w-full border border-slate-200 rounded-lg p-2 text-xs mt-1 focus:ring-1 focus:ring-indigo-500 outline-none font-medium text-slate-700"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 uppercase font-bold">Cost Impact (SAR Value)</label>
                      <input
                        type="number"
                        required
                        min="0"
                        placeholder="e.g. 45000"
                        value={voCostImpact}
                        onChange={e => setVoCostImpact(Number(e.target.value))}
                        className="w-full border border-slate-200 rounded-lg p-2 text-xs mt-1 focus:ring-1 focus:ring-indigo-500 outline-none font-medium text-slate-700"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 uppercase font-bold">Time Impact (Calendar Days)</label>
                      <input
                        type="number"
                        required
                        min="0"
                        placeholder="e.g. 15"
                        value={voTimeImpactDays}
                        onChange={e => setVoTimeImpactDays(Number(e.target.value))}
                        className="w-full border border-slate-200 rounded-lg p-2 text-xs mt-1 focus:ring-1 focus:ring-indigo-500 outline-none font-medium text-slate-700"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 uppercase font-bold">Initial Review Status</label>
                      <select
                        value={voApprovalStatus}
                        onChange={e => setVoApprovalStatus(e.target.value as any)}
                        className="w-full border border-slate-200 rounded-lg p-2 text-xs mt-1 bg-white focus:ring-1 focus:ring-indigo-500 outline-none font-medium text-slate-700"
                      >
                        <option value="draft">Draft (Internal Proposing)</option>
                        <option value="pending">Pending Client Decision</option>
                        <option value="approved">Approved & Registered</option>
                        <option value="rejected">Rejected / Cancelled</option>
                      </select>
                    </div>

                    <div className="md:col-span-3">
                      <label className="block text-[10px] font-mono text-slate-400 uppercase font-bold">Scope of Works Detail / Justifications</label>
                      <textarea
                        required
                        placeholder="Provide detailed breakdown of labor, material revisions, structural engineers drawings altered, and contract clauses justification..."
                        value={voDescription}
                        onChange={e => setVoDescription(e.target.value)}
                        rows={3}
                        className="w-full border border-slate-200 rounded-lg p-2 text-xs mt-1 focus:ring-1 focus:ring-indigo-500 outline-none font-medium text-slate-700 bg-white"
                      />
                    </div>

                    <div className="md:col-span-3">
                      <label className="block text-[10px] font-mono text-slate-400 uppercase font-bold mb-1">Supporting Documentation & Attachments</label>
                      
                      <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => document.getElementById('form-file-input')?.click()}
                        className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center ${
                          isDragging 
                            ? 'border-indigo-500 bg-indigo-50/50 scale-[1.01]' 
                            : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300'
                        }`}
                      >
                        <input
                          id="form-file-input"
                          type="file"
                          multiple
                          onChange={handleFileChange}
                          className="hidden"
                        />
                        <Upload className={`w-8 h-8 mb-2 transition-transform duration-200 ${isDragging ? 'text-indigo-600 scale-110' : 'text-slate-400'}`} />
                        <span className="text-xs font-semibold text-slate-700">
                          {isDragging ? 'Drop your files here!' : 'Drag & drop supporting files here, or click to browse'}
                        </span>
                        <span className="text-[10px] text-slate-400 mt-1">
                          Supports PDF, Images, Word, Excel, CAD drawings, etc. (Max 25MB per file)
                        </span>
                      </div>

                      {/* Display Selected Files list */}
                      {draftAttachments.length > 0 && (
                        <div className="mt-3 space-y-2">
                          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                            Prepared Attachments ({draftAttachments.length})
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
                        setEditingVariation(null);
                      }} 
                      className="text-xs text-slate-500 font-bold px-3.5 py-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1.5 rounded-lg text-xs font-bold transition shadow-xs cursor-pointer"
                    >
                      {editingVariation ? 'Apply VO Changes' : 'Draft Variation Order'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Variations Card Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {selectedVariationsList.map((v) => {
                const proj = getProjectInfo(v.projectId);
                const statusInfo = getStatusLabel(v.approvalStatus);
                
                return (
                  <div 
                    key={v.id} 
                    onClick={() => setSelectedVariationId(v.id)}
                    className="bg-white p-5 rounded-2xl border border-slate-200/85 shadow-xs hover:shadow-md hover:border-indigo-200 transition-all duration-200 flex flex-col justify-between group relative cursor-pointer"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1 max-w-[65%]">
                          <span className="inline-block text-[8px] font-mono font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded uppercase">
                            {proj.code}
                          </span>
                          <span className="ml-1 inline-block text-[9px] font-mono text-slate-400 font-semibold">
                            {v.refNumber || `VO-${v.id.slice(-3)}`}
                          </span>
                          <h4 className="font-extrabold text-xs text-slate-800 line-clamp-2 group-hover:text-indigo-600 transition-colors">
                            {v.title}
                          </h4>
                        </div>

                        <div className="flex flex-col items-end space-y-1 shrink-0">
                          <span className={`px-2 py-0.5 rounded text-[8px] font-mono font-extrabold uppercase border ${statusInfo.style}`}>
                            {statusInfo.label}
                          </span>
                        </div>
                      </div>

                      <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed">
                        {v.description || 'No additional scope details logged.'}
                      </p>
                    </div>

                    {/* Financial details inside card */}
                    <div className="grid grid-cols-2 gap-2 my-3 p-2 bg-slate-50 rounded-xl border border-slate-100">
                      <div>
                        <span className="text-[9px] font-mono text-slate-400 block">COST IMPACT</span>
                        <span className="text-xs font-extrabold text-slate-700">{formatCurrency(v.costImpact)}</span>
                      </div>
                      <div>
                        <span className="text-[9px] font-mono text-slate-400 block">TIME IMPACT</span>
                        <span className="text-xs font-extrabold text-slate-700">+{v.timeImpactDays} Days</span>
                      </div>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-slate-50 mt-2">
                      <div className="flex justify-between items-center text-[9px] font-mono text-slate-400">
                        <span>Issued: {v.dateCreated}</span>
                        <div className="flex items-center space-x-2">
                          {(v.comments || []).length > 0 && (
                            <span className="flex items-center space-x-0.5">
                              <MessageSquare className="w-3 h-3" />
                              <span>{(v.comments || []).length}</span>
                            </span>
                          )}
                          {(v.attachments || []).length > 0 && (
                            <span className="flex items-center space-x-0.5">
                              <Paperclip className="w-3 h-3" />
                              <span>{(v.attachments || []).length}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action buttons shown on hover */}
                    {canManageVariations && (
                      <div className="flex items-center justify-end space-x-1.5 pt-2 border-t border-slate-50 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => handleOpenEdit(v, e)}
                          className="p-1 text-slate-400 hover:text-indigo-600 rounded hover:bg-slate-50 transition"
                          title="Edit Variation"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => handleDeleteVariation(v, e)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-slate-50 transition"
                          title="Delete Variation"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleExportPdfDownload(v);
                          }}
                          className="p-1 text-indigo-500 hover:text-indigo-700 rounded hover:bg-slate-50 transition"
                          title="Export VO Document"
                        >
                          <FileDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}

              {selectedVariationsList.length === 0 && (
                <div className="col-span-full text-center py-12 bg-white rounded-2xl border border-dashed border-slate-200">
                  <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-slate-400 text-xs font-medium">No Variation Orders matched your filters.</p>
                  <p className="text-slate-300 text-[10px] mt-1">Select all projects or log a new claim.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 3. SLIDE OVER: DETAIL WORKSPACE PANEL FOR SELECTED VARIATION */}
        {selectedVariation && (
          <div className="w-96 border-l border-slate-200 bg-white flex flex-col h-full shrink-0 overflow-y-auto">
            {/* Slide Header */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="overflow-hidden">
                <span className="text-[10px] font-mono text-slate-400 font-bold uppercase block">
                  Reference: {selectedVariation.refNumber || `VO-${selectedVariation.id}`}
                </span>
                <h4 className="text-xs font-extrabold text-slate-800 truncate uppercase tracking-tight mt-0.5">
                  {selectedVariation.title}
                </h4>
              </div>
              <button 
                onClick={() => setSelectedVariationId(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-6">
              
              {/* Financial Status Summary card */}
              <div className="bg-slate-900 text-white p-4 rounded-xl space-y-3 shadow-xs font-sans">
                <div className="flex justify-between items-center border-b border-white/10 pb-2">
                  <span className="text-[10px] font-mono text-slate-300 font-bold">STATUS</span>
                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded border ${
                    selectedVariation.approvalStatus === 'approved' 
                      ? 'bg-emerald-500 text-white border-transparent'
                      : selectedVariation.approvalStatus === 'pending'
                        ? 'bg-amber-500 text-white border-transparent'
                        : selectedVariation.approvalStatus === 'rejected'
                          ? 'bg-rose-500 text-white border-transparent'
                          : 'bg-slate-600 text-slate-200 border-transparent'
                  }`}>
                    {selectedVariation.approvalStatus.toUpperCase()}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[9px] text-slate-400 font-mono block uppercase">Cost Adjustment</span>
                    <span className="text-sm font-extrabold tracking-tight text-amber-400">
                      {formatCurrency(selectedVariation.costImpact)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 font-mono block uppercase">Schedule Adjustment</span>
                    <span className="text-sm font-extrabold tracking-tight text-blue-300">
                      +{selectedVariation.timeImpactDays} Days
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[10px]">
                  <span className="text-slate-400">Contract Code:</span>
                  <span className="font-mono font-bold">{getProjectInfo(selectedVariation.projectId).code}</span>
                </div>
              </div>

              {/* Scope Description */}
              <div>
                <h5 className="text-[10px] font-bold text-slate-400 uppercase font-mono tracking-wider">Detailed Scope Description</h5>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                  {selectedVariation.description}
                </p>
              </div>

              {/* Attachments Section */}
              <div className="space-y-3">
                <h5 className="text-[10px] font-bold text-slate-400 uppercase font-mono tracking-wider flex items-center justify-between">
                  <span>Supporting Documents & Photos</span>
                  <span className="text-[9px] font-mono text-indigo-600">{(selectedVariation.attachments || []).length} items</span>
                </h5>

                {/* Upload Form */}
                <form onSubmit={handleAddAttachment} className="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Doc Name, e.g. Client_Letter.pdf"
                    value={newFileName}
                    onChange={e => setNewFileName(e.target.value)}
                    className="flex-1 border border-slate-200 rounded-lg px-2.5 py-1 text-xs outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <input
                    type="text"
                    placeholder="2.5 MB"
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
                  {(selectedVariation.attachments || []).length === 0 ? (
                    <div className="text-center py-4 text-slate-400 text-[10px] bg-slate-50/50 rounded-lg border border-dashed border-slate-200 italic">
                      No files uploaded. Draft claims usually require official client authorization letters.
                    </div>
                  ) : (
                    (selectedVariation.attachments || []).map((file, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-xl hover:border-indigo-100 transition">
                        <div className="flex items-center space-x-2.5 min-w-0">
                          <Paperclip className="w-4 h-4 text-slate-400 shrink-0" />
                          <div className="min-w-0">
                            <h6 className="text-xs font-bold text-slate-700 truncate">{file.name}</h6>
                            <p className="text-[9px] text-slate-400 font-mono">{file.size} • Uploaded {file.uploadedAt || 'Recently'}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            // simulate file deletion
                            setVariations(prev => prev.map(v => {
                              if (v.id === selectedVariation.id) {
                                return { ...v, attachments: (v.attachments || []).filter((_, fIdx) => fIdx !== idx) };
                              }
                              return v;
                            }));
                            onAddNotification(`Attachment removed.`, 'info');
                          }}
                          className="p-1 text-slate-400 hover:text-rose-600 transition"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Comments Thread Section */}
              <div className="space-y-3">
                <h5 className="text-[10px] font-bold text-slate-400 uppercase font-mono tracking-wider flex items-center justify-between">
                  <span>Contractual Notes & Comments</span>
                  <span className="text-[9px] font-mono text-indigo-600">{(selectedVariation.comments || []).length} items</span>
                </h5>

                <form onSubmit={handleAddComment} className="space-y-2">
                  <textarea
                    required
                    placeholder="Add a comment regarding negotiation or signoff..."
                    value={newCommentText}
                    onChange={e => setNewCommentText(e.target.value)}
                    rows={2}
                    className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-indigo-500 outline-none bg-white text-slate-700"
                  />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-bold rounded-lg transition"
                    >
                      Post Note
                    </button>
                  </div>
                </form>

                <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                  {(selectedVariation.comments || []).length === 0 ? (
                    <div className="text-center py-4 text-slate-400 text-[10px] bg-slate-50/50 rounded-lg border border-dashed border-slate-200 italic">
                      No comments logged.
                    </div>
                  ) : (
                    (selectedVariation.comments || []).map((c, idx) => (
                      <div key={idx} className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                        <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-1">
                          <span className="font-bold text-slate-600">{c.user} ({c.role})</span>
                          <span>{c.date}</span>
                        </div>
                        <p className="text-slate-600 font-medium">{c.text}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* PDF Preview Actions */}
              <div className="pt-4 border-t border-slate-100 flex gap-2">
                <button
                  onClick={() => handleExportPdfDownload(selectedVariation)}
                  className="w-full inline-flex items-center justify-center space-x-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Formal VO</span>
                </button>
              </div>

            </div>
          </div>
        )}

      </div>

    </div>
  );
}
