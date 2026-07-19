/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  ClipboardList, 
  Search, 
  Building2, 
  FolderGit2, 
  ChevronRight, 
  ChevronLeft,
  Plus, 
  DollarSign, 
  Layers, 
  Tag, 
  FileSpreadsheet, 
  ArrowRight,
  ExternalLink,
  Percent,
  Printer,
  Edit,
  Trash2,
  FileDown
} from 'lucide-react';
import { Project, BOQItem, User, getVatAppliedAmount } from '../types';

interface ProjectBOQViewProps {
  projects: Project[];
  boqList: BOQItem[];
  setBoqList: React.Dispatch<React.SetStateAction<BOQItem[]>>;
  currentUser: User;
  onLogAudit: (action: string, module: string, oldValue?: string, newValue?: string) => void;
  onAddNotification: (text: string, type: 'info' | 'success' | 'warning' | 'alert') => void;
  onViewWorkspace: (projectId: string, tab?: string) => void;
}

export default function ProjectBOQView({
  projects,
  boqList,
  setBoqList,
  currentUser,
  onLogAudit,
  onAddNotification,
  onViewWorkspace
}: ProjectBOQViewProps) {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [projectSearchQuery, setProjectSearchQuery] = useState('');
  const [boqSearchQuery, setBOQSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);

  // Form states for adding a new BOQ element
  const [showAddForm, setShowAddForm] = useState(false);
  const [itemNo, setItemNo] = useState('');
  const [description, setDescription] = useState('');
  const [unit, setUnit] = useState('m3');
  const [qty, setQty] = useState(0);
  const [rate, setRate] = useState(0);
  const [category, setCategory] = useState('Civil');

  // Form states for editing a BOQ element
  const [editingItem, setEditingItem] = useState<BOQItem | null>(null);
  const [editItemNo, setEditItemNo] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editUnit, setEditUnit] = useState('m3');
  const [editQty, setEditQty] = useState(0);
  const [editRate, setEditRate] = useState(0);
  const [editCategory, setEditCategory] = useState('Civil');

  const handleStartEdit = (item: BOQItem) => {
    setEditingItem(item);
    setEditItemNo(item.itemNo);
    setEditDescription(item.description);
    setEditUnit(item.unit);
    setEditQty(item.qty);
    setEditRate(item.rate);
    setEditCategory(item.category || 'Civil');
  };

  const handleEditBOQSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    if (!editItemNo || !editDescription || editQty <= 0 || editRate <= 0) return;

    const updatedTotal = editQty * editRate;
    const updatedList = boqList.map(b => {
      if (b.id === editingItem.id) {
        return {
          ...b,
          itemNo: editItemNo,
          description: editDescription,
          unit: editUnit,
          qty: editQty,
          rate: editRate,
          total: updatedTotal,
          category: editCategory
        };
      }
      return b;
    });

    setBoqList(updatedList);
    onLogAudit(
      `Updated BOQ Item ${editItemNo} in "${activeProject?.name}"`,
      'BOQ Central Module',
      `${editingItem.description} (${editingItem.qty} ${editingItem.unit} @ ${editingItem.rate} SAR)`,
      `${editDescription} (${editQty} ${editUnit} @ ${editRate} SAR)`
    );
    onAddNotification(`Updated BOQ item ${editItemNo} successfully`, 'success');
    setEditingItem(null);
  };

  const handleDeleteItem = (id: string) => {
    const userRoleStr = currentUser?.role?.toLowerCase() || '';
    if (userRoleStr !== 'admin' && userRoleStr !== 'super admin' && userRoleStr !== 'superadmin') {
      alert("Unauthorized: Only Admin or Super Admin can delete records.");
      return;
    }

    const item = boqList.find(b => b.id === id);
    if (!item) return;

    if (window.confirm(`Are you sure you want to permanently delete BOQ Item ${item.itemNo} (${item.description})?`)) {
      const updatedList = boqList.filter(b => b.id !== id);
      setBoqList(updatedList);
      onLogAudit(
        `Deleted BOQ Item ${item.itemNo} from "${activeProject?.name}"`,
        'BOQ Central Module',
        `${item.description} (${item.qty} ${item.unit} @ ${item.rate} SAR)`
      );
      onAddNotification(`Deleted BOQ item ${item.itemNo} successfully`, 'success');
    }
  };

  const canWrite = currentUser.role === 'General Manager' || currentUser.role === 'Project Manager' || currentUser.role === 'Admin' || currentUser.role === 'Super Admin';

  // Filter projects list
  const filteredProjects = useMemo(() => {
    return projects.filter(p => 
      p.name.toLowerCase().includes(projectSearchQuery.toLowerCase()) || 
      p.code.toLowerCase().includes(projectSearchQuery.toLowerCase()) ||
      p.clientName.toLowerCase().includes(projectSearchQuery.toLowerCase())
    );
  }, [projects, projectSearchQuery]);

  // Dynamically choose active project
  const activeProject = useMemo(() => {
    if (selectedProjectId) {
      return projects.find(p => p.id === selectedProjectId) || projects[0] || null;
    }
    return projects[0] || null;
  }, [projects, selectedProjectId]);

  // Set initial selected project on mount if not set
  React.useEffect(() => {
    if (projects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects, selectedProjectId]);

  // Filter BOQ items for active project
  const activeProjBOQs = useMemo(() => {
    if (!activeProject) return [];
    return boqList.filter(b => b.projectId === activeProject.id);
  }, [boqList, activeProject]);

  // Categories list for active project's BOQ items
  const categories = useMemo(() => {
    const list = new Set<string>();
    list.add('All');
    activeProjBOQs.forEach(item => {
      if (item.category) list.add(item.category);
    });
    return Array.from(list);
  }, [activeProjBOQs]);

  // Filter BOQ items based on search and category
  const filteredBOQItems = useMemo(() => {
    return activeProjBOQs.filter(item => {
      const matchesSearch = item.description.toLowerCase().includes(boqSearchQuery.toLowerCase()) || 
                            item.itemNo.toLowerCase().includes(boqSearchQuery.toLowerCase()) ||
                            item.category.toLowerCase().includes(boqSearchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'All' ? true : item.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [activeProjBOQs, boqSearchQuery, selectedCategory]);

  // Math metrics for current project's BOQ
  const boqMetrics = useMemo(() => {
    const totalValue = activeProjBOQs.reduce((sum, item) => sum + item.total, 0);
    const totalItems = activeProjBOQs.length;
    
    // Category Breakdown
    const categoryBreakdown: Record<string, number> = {};
    activeProjBOQs.forEach(item => {
      categoryBreakdown[item.category] = (categoryBreakdown[item.category] || 0) + item.total;
    });

    return { totalValue, totalItems, categoryBreakdown };
  }, [activeProjBOQs]);

  const handleAddBOQSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProject) return;
    if (!itemNo || !description || qty <= 0 || rate <= 0) return;

    const total = qty * rate;
    const newItem: BOQItem = {
      id: `boq_${Date.now()}`,
      projectId: activeProject.id,
      itemNo,
      description,
      unit,
      qty,
      rate,
      total,
      category
    };

    setBoqList(prev => [...prev, newItem]);
    onLogAudit(
      `Added BOQ Item ${itemNo} to "${activeProject.name}"`, 
      'BOQ Central Module', 
      undefined, 
      `${description} (${qty} ${unit} @ ${rate} SAR)`
    );
    onAddNotification(`Added BOQ item ${itemNo} successfully`, 'success');

    // Reset Form
    setItemNo('');
    setDescription('');
    setQty(0);
    setRate(0);
    setShowAddForm(false);
  };

  const formatSAR = (val: number) => {
    const applied = getVatAppliedAmount(val);
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'SAR',
      maximumFractionDigits: 0
    }).format(applied);
  };

  const handlePrintOrExport = (mode: 'print' | 'pdf') => {
    if (!activeProject) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Could not open print window. Please allow popups.');
      return;
    }
    
    const activeBOQs = boqList.filter(b => b.projectId === activeProject.id);
    const todayStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const grandTotal = activeBOQs.reduce((sum, item) => sum + item.total, 0);
    
    const rowsHTML = activeBOQs.map((item, idx) => `
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
        <title>Bill of Quantities - ${activeProject.code}</title>
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
            <span>${activeProject.code} - ${activeProject.name}</span>
          </div>
          <div class="meta-item">
            <strong>Contracting Client</strong>
            <span>${activeProject.clientName}</span>
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
              <td style="text-align: right; font-family: monospace;">${activeBOQs.reduce((sum, item) => sum + item.qty, 0).toLocaleString()}</td>
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
    
    // Log audit & notify
    const actionText = mode === 'print' ? 'Printed BOQ Ledger' : 'Exported BOQ PDF';
    const notificationText = mode === 'print' ? `BOQ Ledger sent to printer for ${activeProject.code}` : `BOQ exported as PDF for ${activeProject.code}`;
    
    onLogAudit(`${actionText} for Project ${activeProject.code}`, 'BOQ Central Module', undefined, `${grandTotal.toLocaleString()} SAR`);
    onAddNotification(notificationText, 'success');
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50/50 overflow-hidden select-none">
      
      {/* Top Banner Context Section */}
      <div className="bg-white border-b border-slate-200 p-5 md:px-8 flex flex-col md:flex-row md:items-center md:justify-between shrink-0 gap-4">
        <div>
          <span className="text-xs font-mono font-bold text-indigo-600 uppercase tracking-widest block mb-1">Quantity Surveying & Estimation</span>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Contract Bill of Quantities</h2>
          <p className="text-xs text-slate-500 mt-1">Review certified tender rates, billable item baselines, and commercial pricing schedules across all contract locations.</p>
        </div>
      </div>

      {/* Main Split Screen Area */}
      <div className="flex-1 flex overflow-hidden min-h-0 w-full">
        
        {/* LEFT COLUMN: PROJECT NAME DIRECTORY */}
        <div 
          className={`w-full lg:w-96 border-r border-slate-200 bg-white flex flex-col shrink-0 overflow-hidden min-h-0 ${
            mobileDetailOpen ? 'hidden lg:flex' : 'flex'
          }`}
        >
          {/* Search Header inside Left Directory */}
          <div className="p-4 border-b border-slate-200 space-y-3 bg-slate-50/50 shrink-0">
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block">Project Menu</span>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search contract projects..."
                value={projectSearchQuery}
                onChange={e => setProjectSearchQuery(e.target.value)}
                className="w-full bg-white text-slate-800 text-xs rounded-lg pl-8 pr-4 py-1.5 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Directory Scroll Container */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 bg-white">
            {filteredProjects.length > 0 ? (
              filteredProjects.map(proj => {
                const isSelected = activeProject?.id === proj.id;
                const projBOQItems = boqList.filter(b => b.projectId === proj.id);
                const projBOQValue = projBOQItems.reduce((sum, item) => sum + item.total, 0);

                return (
                  <div
                    key={proj.id}
                    onClick={() => {
                      setSelectedProjectId(proj.id);
                      setMobileDetailOpen(true);
                    }}
                    className={`p-4 text-left transition relative cursor-pointer hover:bg-slate-50/80 ${
                      isSelected ? 'bg-indigo-50/35' : ''
                    }`}
                  >
                    {/* Selected border marker */}
                    {isSelected && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-600" />
                    )}

                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="font-mono text-[9px] font-extrabold text-indigo-600 tracking-wider">
                          {proj.code}
                        </span>
                        <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full ${
                          proj.status === 'active' 
                            ? 'bg-emerald-50 text-emerald-700' 
                            : proj.status === 'completed' 
                              ? 'bg-blue-50 text-blue-700' 
                              : 'bg-amber-50 text-amber-700'
                        }`}>
                          {proj.status.toUpperCase()}
                        </span>
                      </div>

                      {/* Project Name - clicking this opens the BOQ (opens the detail panel) */}
                      <h3 className="font-sans font-bold text-xs text-slate-800 leading-snug line-clamp-1 hover:text-indigo-600 transition">
                        {proj.name}
                      </h3>

                      <div className="flex justify-between items-center text-[10px] text-slate-400 pt-1">
                        <span>Client: {proj.clientName}</span>
                        <span className="font-mono font-bold text-slate-700">{formatSAR(projBOQValue || proj.value * 0.85)}</span>
                      </div>

                      <div className="flex justify-between items-center text-[9px] font-mono text-slate-400 pt-1">
                        <span>{projBOQItems.length} Element lines</span>
                        <span className="text-indigo-600 font-bold flex items-center">
                          Open BOQ <ChevronRight className="w-3 h-3 ml-0.5" />
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center text-slate-400 text-xs italic">
                No matching projects located.
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: DETAILED BILL OF QUANTITIES GRID */}
        <div 
          className={`flex-1 bg-slate-50/60 overflow-y-auto flex flex-col min-h-0 ${
            mobileDetailOpen ? 'flex' : 'hidden lg:flex'
          }`}
        >
          {activeProject ? (
            <div className="flex-1 flex flex-col overflow-hidden">
              
              {/* Active Project Title Banner */}
              <div className="bg-white border-b border-slate-200 p-5 md:p-6 shrink-0 flex items-center justify-between gap-4">
                <div className="flex items-center space-x-3 overflow-hidden">
                  <button 
                    onClick={() => setMobileDetailOpen(false)}
                    className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition shrink-0 cursor-pointer"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <div className="overflow-hidden">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs font-extrabold text-indigo-600 uppercase tracking-widest shrink-0">
                        {activeProject.code}
                      </span>
                      <span className="text-slate-300 shrink-0">|</span>
                      <span className="text-xs text-slate-400 truncate font-semibold">
                        {activeProject.clientName}
                      </span>
                    </div>
                    <h3 className="text-base font-extrabold text-slate-900 tracking-tight mt-0.5 line-clamp-1">
                      {activeProject.name}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    onClick={() => handlePrintOrExport('print')}
                    className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition flex items-center space-x-1.5 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Bill</span>
                  </button>
                  <button
                    onClick={() => handlePrintOrExport('pdf')}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition flex items-center space-x-1.5 cursor-pointer"
                  >
                    <FileDown className="w-3.5 h-3.5" />
                    <span>Export PDF</span>
                  </button>
                  <button
                    onClick={() => onViewWorkspace(activeProject.id, 'boq')}
                    className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold px-3 py-1.5 rounded-lg transition flex items-center space-x-1.5 cursor-pointer"
                  >
                    <span>Open in Workspace</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Scrollable BOQ Main Workspace Content */}
              <div className="flex-1 overflow-y-auto p-5 md:p-8 space-y-6">
                
                {/* Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex items-center space-x-4">
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
                      <ClipboardList className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-mono uppercase font-bold block">Total Priced elements</span>
                      <span className="text-sm font-extrabold text-slate-800">{boqMetrics.totalItems} line items</span>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex items-center space-x-4">
                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
                      <DollarSign className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-mono uppercase font-bold block">Certified Valuation Base</span>
                      <span className="text-sm font-extrabold text-slate-800 font-mono">{formatSAR(boqMetrics.totalValue)}</span>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex items-center space-x-4">
                    <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
                      <Layers className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-mono uppercase font-bold block">Unique Trade Categories</span>
                      <span className="text-sm font-extrabold text-slate-800">{categories.length - 1} divisions</span>
                    </div>
                  </div>
                </div>

                {/* Subcategory Value Breakdown Map */}
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-3">
                  <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">Division Allocations</span>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-1">
                    {Object.entries(boqMetrics.categoryBreakdown).map(([catName, rawValue]) => {
                      const value = rawValue as number;
                      const share = boqMetrics.totalValue > 0 ? Math.round((value / boqMetrics.totalValue) * 100) : 0;
                      return (
                        <div key={catName} className="p-2.5 bg-slate-50 border border-slate-100 rounded-lg">
                          <span className="text-[10px] text-slate-500 font-bold block truncate">{catName}</span>
                          <span className="text-xs font-bold text-slate-800 block font-mono mt-1">{formatSAR(value)}</span>
                          <div className="flex items-center space-x-1.5 mt-1">
                            <div className="w-full bg-slate-200 h-1 rounded-full overflow-hidden">
                              <div className="bg-indigo-600 h-1 rounded-full" style={{ width: `${share}%` }} />
                            </div>
                            <span className="text-[8px] font-mono text-slate-400 font-bold">{share}%</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Table Control Header */}
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    
                    {/* Category selectors */}
                    <div className="flex items-center space-x-1 overflow-x-auto pb-1 no-scrollbar shrink-0">
                      {categories.map(cat => (
                        <button
                          key={cat}
                          onClick={() => setSelectedCategory(cat)}
                          className={`text-[10px] font-bold px-3 py-1.5 rounded-lg border font-mono transition shrink-0 cursor-pointer ${
                            selectedCategory === cat
                              ? 'bg-indigo-600 border-indigo-600 text-white'
                              : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-100'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>

                    {/* Table search filter */}
                    <div className="relative w-full md:w-64 shrink-0">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Filter elements..."
                        value={boqSearchQuery}
                        onChange={e => setBOQSearchQuery(e.target.value)}
                        className="w-full bg-slate-50/50 text-slate-800 text-xs rounded-lg pl-8 pr-4 py-1.5 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  {/* Add Element Quick Inline Form */}
                  {canWrite && (
                    <div className="border-t border-slate-100 pt-4">
                      {!showAddForm ? (
                        <button
                          onClick={() => setShowAddForm(true)}
                          className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition flex items-center space-x-1.5 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Draft New Priced BOQ Element</span>
                        </button>
                      ) : (
                        <form onSubmit={handleAddBOQSubmit} className="bg-slate-50/80 p-4 rounded-xl border border-slate-250 grid grid-cols-1 md:grid-cols-6 gap-3 select-none animate-in fade-in duration-200">
                          <div>
                            <label className="block text-[10px] font-mono text-gray-400 uppercase">Item #</label>
                            <input
                              type="text"
                              required
                              value={itemNo}
                              onChange={e => setItemNo(e.target.value)}
                              placeholder="e.g. 2.01"
                              className="w-full border border-gray-200 bg-white rounded p-1.5 text-xs mt-1"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-[10px] font-mono text-gray-400 uppercase">Element Description</label>
                            <input
                              type="text"
                              required
                              value={description}
                              onChange={e => setDescription(e.target.value)}
                              placeholder="Excavation and backfilling works"
                              className="w-full border border-gray-200 bg-white rounded p-1.5 text-xs mt-1"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-mono text-gray-400 uppercase">Category</label>
                            <select
                              value={category}
                              onChange={e => setCategory(e.target.value)}
                              className="w-full border border-gray-200 bg-white rounded p-1.5 text-xs mt-1"
                            >
                              {['Civil', 'Mechanical', 'Electrical', 'Plumbing', 'Finishes', 'Logistics', 'Supervision'].map(catOpt => (
                                <option key={catOpt} value={catOpt}>{catOpt}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-[10px] font-mono text-gray-400 uppercase">Unit</label>
                            <input
                              type="text"
                              required
                              value={unit}
                              onChange={e => setUnit(e.target.value)}
                              placeholder="e.g. m3"
                              className="w-full border border-gray-200 bg-white rounded p-1.5 text-xs mt-1 font-mono"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-mono text-gray-400 uppercase">Quantity</label>
                            <input
                              type="number"
                              required
                              value={qty || ''}
                              onChange={e => setQty(Number(e.target.value))}
                              className="w-full border border-gray-200 bg-white rounded p-1.5 text-xs mt-1 font-mono"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-mono text-gray-400 uppercase">Rate (SAR)</label>
                            <input
                              type="number"
                              required
                              value={rate || ''}
                              onChange={e => setRate(Number(e.target.value))}
                              className="w-full border border-gray-200 bg-white rounded p-1.5 text-xs mt-1 font-mono"
                            />
                          </div>
                          <div className="md:col-span-6 flex justify-end space-x-2 pt-2 border-t border-slate-200/50">
                            <button
                              type="button"
                              onClick={() => setShowAddForm(false)}
                              className="text-xs text-gray-500 font-bold px-3 py-1 cursor-pointer"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1.5 rounded text-xs font-bold cursor-pointer"
                            >
                              Draft Item
                            </button>
                          </div>
                        </form>
                      )}
                    </div>
                  )}

                  {/* BOQ Priced Element Ledger Table */}
                  <div className="border border-slate-150 rounded-lg overflow-hidden bg-white">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-[10px] font-mono text-slate-400 uppercase border-b border-slate-200">
                          <tr>
                            <th className="p-3">Item No</th>
                            <th className="p-3">Priced Scope Element Description</th>
                            <th className="p-3">Division</th>
                            <th className="p-3">Unit</th>
                            <th className="p-3 text-right">Tender Qty</th>
                            <th className="p-3 text-right">Unit Rate (SAR)</th>
                            <th className="p-3 text-right">Total (SAR)</th>
                            {canWrite && <th className="p-3 text-right">Actions</th>}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredBOQItems.length > 0 ? (
                            filteredBOQItems.map(item => (
                              <tr key={item.id} className="hover:bg-slate-50/20 transition-colors">
                                <td className="p-3 font-mono font-bold text-slate-600">{item.itemNo}</td>
                                <td className="p-3 font-medium text-slate-800">{item.description}</td>
                                <td className="p-3">
                                  <span className="bg-slate-100 text-slate-600 text-[9px] px-2 py-0.5 rounded-md font-mono font-bold uppercase">
                                    {item.category}
                                  </span>
                                </td>
                                <td className="p-3 font-mono text-slate-400">{item.unit}</td>
                                <td className="p-3 text-right font-mono text-slate-600 font-medium">{item.qty.toLocaleString()}</td>
                                <td className="p-3 text-right font-mono text-slate-600">{item.rate.toLocaleString()}</td>
                                <td className="p-3 text-right font-mono font-extrabold text-slate-800">{item.total.toLocaleString()}</td>
                                {canWrite && (
                                  <td className="p-3 text-right space-x-1 whitespace-nowrap">
                                    <button
                                      onClick={() => handleStartEdit(item)}
                                      className="p-1 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded transition cursor-pointer"
                                      title="Edit Element"
                                    >
                                      <Edit className="w-3.5 h-3.5 inline-block" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteItem(item.id)}
                                      className="p-1 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded transition cursor-pointer"
                                      title="Delete Element"
                                    >
                                      <Trash2 className="w-3.5 h-3.5 inline-block" />
                                    </button>
                                  </td>
                                )}
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={canWrite ? 8 : 7} className="p-12 text-center text-slate-400 italic">
                                No priced elements match your filters or categories.
                              </td>
                            </tr>
                          )}
                        </tbody>
                        {filteredBOQItems.length > 0 && (
                          <tfoot className="bg-slate-50 font-semibold text-slate-700 border-t border-slate-200">
                            <tr>
                              <td colSpan={4} className="p-3 font-bold text-slate-500 uppercase tracking-wider">Filtered Items Total</td>
                              <td className="p-3 text-right font-mono text-slate-600">
                                {filteredBOQItems.reduce((acc, b) => acc + b.qty, 0).toLocaleString()}
                              </td>
                              <td className="p-3 text-right font-mono text-slate-400">-</td>
                              <td className="p-3 text-right font-mono font-extrabold text-slate-900 text-sm">
                                {formatSAR(filteredBOQItems.reduce((acc, b) => acc + b.total, 0))}
                              </td>
                              {canWrite && <td className="p-3 text-right font-mono text-slate-400">-</td>}
                            </tr>
                          </tfoot>
                        )}
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-12 text-slate-400">
              <ClipboardList className="w-12 h-12 mb-3 text-slate-300 animate-pulse" />
              <p className="text-xs font-medium">Select a project from the left menu directory to open its bill of quantities ledger.</p>
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal Overlay */}
      {editingItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-150 select-none">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-150 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono font-bold text-indigo-600 uppercase tracking-widest block">Update Record</span>
                <h3 className="text-sm font-extrabold text-slate-950">Edit Priced BOQ Element - {editingItem.itemNo}</h3>
              </div>
              <button
                onClick={() => setEditingItem(null)}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1 rounded-lg transition cursor-pointer"
              >
                <span className="sr-only">Close</span>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleEditBOQSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-mono text-gray-400 uppercase font-bold">Item #</label>
                  <input
                    type="text"
                    required
                    value={editItemNo}
                    onChange={e => setEditItemNo(e.target.value)}
                    placeholder="e.g. 2.01"
                    className="w-full border border-gray-200 bg-white rounded-lg p-2 text-xs mt-1 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                
                <div>
                  <label className="block text-[10px] font-mono text-gray-400 uppercase font-bold">Category / Division</label>
                  <select
                    value={editCategory}
                    onChange={e => setEditCategory(e.target.value)}
                    className="w-full border border-gray-200 bg-white rounded-lg p-2 text-xs mt-1 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    {['Civil', 'Mechanical', 'Electrical', 'Plumbing', 'Finishes', 'Logistics', 'Supervision'].map(catOpt => (
                      <option key={catOpt} value={catOpt}>{catOpt}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono text-gray-400 uppercase font-bold">Element Description</label>
                <textarea
                  required
                  rows={3}
                  value={editDescription}
                  onChange={e => setEditDescription(e.target.value)}
                  placeholder="e.g. Excavation and backfilling works"
                  className="w-full border border-gray-200 bg-white rounded-lg p-2 text-xs mt-1 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-mono text-gray-400 uppercase font-bold">Unit</label>
                  <input
                    type="text"
                    required
                    value={editUnit}
                    onChange={e => setEditUnit(e.target.value)}
                    placeholder="e.g. m3"
                    className="w-full border border-gray-200 bg-white rounded-lg p-2 text-xs mt-1 font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                
                <div>
                  <label className="block text-[10px] font-mono text-gray-400 uppercase font-bold">Quantity</label>
                  <input
                    type="number"
                    required
                    min="0.01"
                    step="any"
                    value={editQty || ''}
                    onChange={e => setEditQty(Number(e.target.value))}
                    className="w-full border border-gray-200 bg-white rounded-lg p-2 text-xs mt-1 font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-gray-400 uppercase font-bold">Unit Rate (SAR)</label>
                  <input
                    type="number"
                    required
                    min="0.01"
                    step="any"
                    value={editRate || ''}
                    onChange={e => setEditRate(Number(e.target.value))}
                    className="w-full border border-gray-200 bg-white rounded-lg p-2 text-xs mt-1 font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Total Calculation Preview */}
              <div className="bg-indigo-50/50 rounded-lg p-3.5 flex justify-between items-center border border-indigo-100/60">
                <span className="text-[10px] text-indigo-700 font-mono uppercase font-extrabold">Calculated Element Value</span>
                <span className="text-sm font-black text-indigo-900 font-mono">
                  {formatSAR(editQty * editRate)}
                </span>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold px-4 py-2 rounded-lg transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
