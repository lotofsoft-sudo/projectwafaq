/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  DollarSign, 
  Search, 
  ChevronLeft,
  Briefcase,
  Plus,
  Edit2,
  Trash2,
  Printer,
  TrendingUp,
  X,
  TrendingDown,
  Percent,
  CheckCircle,
  FileText,
  Info
} from 'lucide-react';
import { Project, BudgetCategory, User, getVatAppliedAmount } from '../types';

interface ProjectBudgetsViewProps {
  projects: Project[];
  budgets: BudgetCategory[];
  setBudgets: React.Dispatch<React.SetStateAction<BudgetCategory[]>>;
  currentUser: User;
  onLogAudit: (action: string, module: string, oldValue?: string, newValue?: string) => void;
  onAddNotification: (text: string, type: 'info' | 'success' | 'warning' | 'alert') => void;
}

export default function ProjectBudgetsView({
  projects,
  budgets,
  setBudgets,
  currentUser,
  onLogAudit,
  onAddNotification,
}: ProjectBudgetsViewProps) {
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [projectSearchQuery, setProjectSearchQuery] = useState('');
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);

  // Budget category editing / creation states
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<BudgetCategory | null>(null);
  
  // New/Edit category attributes
  const [categoryName, setCategoryName] = useState('Subcontractor Payments');
  const [customCategoryName, setCustomCategoryName] = useState('');
  const [allocatedAmount, setAllocatedAmount] = useState<number | ''>('');
  const [formProjectId, setFormProjectId] = useState<string>('');
  const [formMonth, setFormMonth] = useState<string>('');
  const [filterMonth, setFilterMonth] = useState<string>('');

  // Print modal states
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Helper check for permissions
  const canManageBudgets = useMemo(() => {
    return currentUser.role === 'General Manager' || 
           currentUser.role === 'Project Manager' || 
           currentUser.role === 'Admin' || 
           currentUser.role === 'Super Admin';
  }, [currentUser]);

  // Format SAR Currency Helper
  const formatSAR = (val: number) => {
    // Note: Budgets always include VAT, so we format the raw value directly to avoid double-taxing.
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(val).replace('SAR', '').trim() + ' SAR';
  };

  // Filter projects list for the sidebar
  const filteredProjects = useMemo(() => {
    return projects.filter(p => 
      p.name.toLowerCase().includes(projectSearchQuery.toLowerCase()) || 
      p.code.toLowerCase().includes(projectSearchQuery.toLowerCase()) ||
      (p.clientName && p.clientName.toLowerCase().includes(projectSearchQuery.toLowerCase()))
    );
  }, [projects, projectSearchQuery]);

  // Active project title/info
  const activeProject = useMemo(() => {
    if (selectedProjectId === 'all') return null;
    return projects.find(p => p.id === selectedProjectId) || null;
  }, [projects, selectedProjectId]);

  // Get budgets associated with selection
  const selectedBudgets = useMemo(() => {
    let result = budgets;
    if (selectedProjectId !== 'all') {
      result = result.filter(b => b.projectId === selectedProjectId);
    }
    if (filterMonth) {
      result = result.filter(b => b.month === filterMonth);
    }
    return result;
  }, [budgets, selectedProjectId, filterMonth]);

  // Calculations for KPI Cards
  const kpiStats = useMemo(() => {
    const totalAllocated = selectedBudgets.reduce((acc, b) => acc + b.allocated, 0);
    const totalSpent = selectedBudgets.reduce((acc, b) => acc + b.spent, 0);
    const totalRemaining = totalAllocated - totalSpent;
    const utilizationPct = totalAllocated > 0 ? Math.round((totalSpent / totalAllocated) * 100) : 0;
    
    return {
      totalAllocated,
      totalSpent,
      totalRemaining,
      utilizationPct
    };
  }, [selectedBudgets]);

  // Project Info helper for tables/lists showing "all" projects
  const getProjectInfo = (pId: string) => {
    return projects.find(p => p.id === pId) || { name: 'Unknown Project', code: 'PROJ-XXX', clientName: '' };
  };

  // Form Handlers
  const handleOpenAdd = () => {
    if (!canManageBudgets) {
      onAddNotification('Unauthorized: Your role does not allow budget additions.', 'alert');
      return;
    }
    setEditingBudget(null);
    setCategoryName('Subcontractor Payments');
    setCustomCategoryName('');
    setAllocatedAmount('');
    setFormProjectId(selectedProjectId === 'all' ? (projects[0]?.id || '') : selectedProjectId);
    setFormMonth('');
    setIsAddFormOpen(true);
  };

  const handleOpenEdit = (budget: BudgetCategory) => {
    if (!canManageBudgets) {
      onAddNotification('Unauthorized: Your role does not allow budget modifications.', 'alert');
      return;
    }
    setEditingBudget(budget);
    
    const standardCategories = [
      'Subcontractor Payments', 'Procurement', 'Salary / Site Office', 'Fuel Cost', 
      'Taxi Rent', 'Accommodation Rent', 'Water', 'Civil & Structural', 
      'Electrical & Cabling', 'HVAC & Plumbing', 'Facade & Masonry'
    ];
    
    if (standardCategories.includes(budget.name)) {
      setCategoryName(budget.name);
      setCustomCategoryName('');
    } else {
      setCategoryName('Others');
      setCustomCategoryName(budget.name);
    }
    
    setAllocatedAmount(budget.allocated);
    setFormProjectId(budget.projectId);
    setFormMonth(budget.month || '');
    setIsAddFormOpen(true);
  };

  const handleDeleteBudget = (budget: BudgetCategory) => {
    const userRoleStr = currentUser?.role?.toLowerCase() || '';
    if (userRoleStr !== 'admin' && userRoleStr !== 'super admin' && userRoleStr !== 'superadmin') {
      alert("Unauthorized: Only Admin or Super Admin can delete records.");
      return;
    }

    if (!canManageBudgets) {
      onAddNotification('Unauthorized: Your role does not allow budget deletions.', 'alert');
      return;
    }
    if (window.confirm(`Are you sure you want to delete the budget category "${budget.name}"?`)) {
      setBudgets(prev => prev.filter(b => b.id !== budget.id));
      onLogAudit(`Deleted budget category "${budget.name}"`, 'Budgets', budget.name, undefined);
      onAddNotification(`Budget category "${budget.name}" deleted successfully.`, 'success');
    }
  };

  const handleSaveBudget = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageBudgets) {
      onAddNotification('Unauthorized: Your role does not allow budget modifications.', 'alert');
      return;
    }

    const finalName = categoryName === 'Others' ? customCategoryName.trim() : categoryName;
    if (!finalName) {
      onAddNotification('Please enter a valid category name.', 'warning');
      return;
    }

    const amt = Number(allocatedAmount);
    if (isNaN(amt) || amt <= 0) {
      onAddNotification('Please enter a valid allocation amount.', 'warning');
      return;
    }

    if (editingBudget) {
      // Edit existing
      setBudgets(prev => prev.map(b => {
        if (b.id === editingBudget.id) {
          return {
            ...b,
            name: finalName,
            allocated: amt,
            projectId: formProjectId,
            month: formMonth || undefined
          };
        }
        return b;
      }));
      onLogAudit(
        `Updated budget category "${editingBudget.name}" allocation to ${formatSAR(amt)}`,
        'Budgets',
        `${editingBudget.name} (${formatSAR(editingBudget.allocated)})`,
        `${finalName} (${formatSAR(amt)})`
      );
      onAddNotification(`Budget category "${finalName}" updated successfully.`, 'success');
    } else {
      // Create new
      const colors = ['emerald', 'blue', 'cyan', 'amber', 'indigo', 'violet', 'rose'];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      
      const newBudget: BudgetCategory = {
        id: `bc_${Date.now()}`,
        projectId: formProjectId,
        name: finalName,
        allocated: amt,
        spent: 0,
        color: randomColor,
        month: formMonth || undefined
      };
      setBudgets(prev => [...prev, newBudget]);
      onLogAudit(`Created budget category "${finalName}" with allocation ${formatSAR(amt)}`, 'Budgets', undefined, finalName);
      onAddNotification(`Budget category "${finalName}" added successfully.`, 'success');
    }

    setIsAddFormOpen(false);
    setEditingBudget(null);
  };

  const triggerBrowserPrint = () => {
    window.print();
  };

  return (
    <div id="budgets-view-root" className="flex-1 flex flex-col h-full bg-slate-50 overflow-hidden">
      
      {/* Top Banner Context Section */}
      <div className="bg-white border-b border-slate-200 p-5 md:px-8 flex flex-col md:flex-row md:items-center md:justify-between shrink-0 gap-4">
        <div>
          <span className="text-xs font-mono font-bold text-indigo-600 uppercase tracking-widest block mb-1">Financial Engineering & Cost Control</span>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Contract Budgets Allocation</h2>
          <p className="text-xs text-slate-500 mt-1">Manage, track, and analyze project budget allocations, utilization thresholds, and spending variances.</p>
        </div>
      </div>

      {/* Main Split Screen Area */}
      <div className="flex-1 flex overflow-hidden min-h-0 w-full">
      
        {/* 1. LEFT PANEL: Project Selection List */}
        <div 
          id="budgets-project-sidebar" 
          className={`w-72 border-r border-slate-200 bg-white flex flex-col h-full shrink-0 transition-transform lg:translate-x-0 lg:relative lg:pointer-events-auto lg:z-10 ${
            mobileDetailOpen ? '-translate-x-full absolute pointer-events-none' : 'relative z-10'
          }`}
        >
        <div className="p-4 border-b border-slate-100 bg-slate-50/60">
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-widest font-mono">Projects Directory</h2>
          <p className="text-[10px] text-slate-400 mt-1">Select a project to view budget</p>
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
          {/* Option for All Projects */}
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
              <h4 className="text-xs font-bold text-slate-800">All Company Budgets</h4>
              <p className="text-[10px] text-slate-400 mt-0.5">Consolidated portfolio baselines</p>
            </div>
          </button>

          {filteredProjects.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs italic">No projects found.</div>
          ) : (
            filteredProjects.map(p => {
              const isActive = selectedProjectId === p.id;
              const projectBudgetsCount = budgets.filter(b => b.projectId === p.id).length;
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
                    <span className="text-[10px] font-mono font-extrabold text-indigo-600 bg-indigo-50/80 px-2 py-0.5 rounded uppercase border border-indigo-100/50">
                      {p.code}
                    </span>
                    <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                      {projectBudgetsCount} Categories
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

      {/* 2. RIGHT PANEL: Budget management viewport */}
      <div 
        id="budgets-data-viewport" 
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
            <div className="bg-indigo-600/5 p-2 rounded-xl text-indigo-600 border border-indigo-100/30 shrink-0">
              <DollarSign className="w-5 h-5" />
            </div>
            <div className="overflow-hidden">
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-mono font-extrabold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded uppercase">
                  {activeProject ? activeProject.code : 'GLOBAL'}
                </span>
                <h3 className="text-sm font-bold text-slate-900 truncate">
                  {activeProject ? `${activeProject.name} - Internal Budgets` : 'Central Corporate Budgets Dashboard'}
                </h3>
              </div>
              <p className="text-[10px] text-slate-400 truncate mt-0.5">
                {activeProject 
                  ? `Configure custom category guidelines & direct material baseline accounts for ${activeProject.name}.`
                  : 'Overview of standard cost discipline allowances, expenditures, and remaining funds globally.'
                }
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <div className="relative flex items-center">
              <input
                type="month"
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
                className="px-3 py-1.5 border border-slate-200 text-slate-600 rounded-lg text-xs font-bold transition focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                title="Filter budgets by month"
              />
              {filterMonth && (
                <button
                  onClick={() => setFilterMonth('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 bg-white"
                  title="Clear month filter"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            {activeProject && (
              <button
                onClick={() => setIsPrintModalOpen(true)}
                className="inline-flex items-center justify-center space-x-1.5 px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-xs font-bold transition cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Budget</span>
              </button>
            )}
            {canManageBudgets && (
              <button
                onClick={handleOpenAdd}
                className="inline-flex items-center justify-center space-x-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Budget</span>
              </button>
            )}
          </div>
        </div>

        {/* Core management workspace */}
        <div className="p-6 bg-slate-50 flex-1 overflow-y-auto space-y-6">

          {/* VAT Inclusive Cost Baseline Notice */}
          <div className="bg-indigo-50/50 border border-indigo-100/80 rounded-xl p-4 flex items-start space-x-3 text-xs text-indigo-800">
            <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <div className="flex-1 space-y-0.5">
              <span className="font-bold block">VAT-Inclusive budget policy active</span>
              <p className="text-slate-500 leading-relaxed">
                All budget allocations, category baselines, site expenditures (spent), and remaining cash reserves are tracked and displayed as <span className="font-bold underline text-indigo-700">including VAT (15%)</span> by default. This ensures complete cost ceiling compliance and prevents project budget double-taxing.
              </p>
            </div>
          </div>

          {/* KPI Dashboard Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono text-slate-400 uppercase font-bold tracking-wider">Total Allocated Budget</span>
                <h4 className="text-lg font-extrabold text-slate-800 mt-1">{formatSAR(kpiStats.totalAllocated)}</h4>
                <p className="text-[10px] text-slate-400 mt-1">
                  {selectedProjectId === 'all' ? 'All active client projects' : 'Total scoped allocations'}
                </p>
              </div>
              <div className="bg-indigo-50 p-2.5 rounded-xl text-indigo-600">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono text-slate-400 uppercase font-bold tracking-wider">Used From Budget (Spent)</span>
                <h4 className="text-lg font-extrabold text-rose-600 mt-1">{formatSAR(kpiStats.totalSpent)}</h4>
                <div className="flex items-center space-x-1 mt-1">
                  <span className="text-[10px] font-mono font-bold text-rose-500 bg-rose-50 px-1 rounded">
                    {kpiStats.utilizationPct}% Utilization
                  </span>
                </div>
              </div>
              <div className="bg-rose-50 p-2.5 rounded-xl text-rose-600">
                <TrendingDown className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono text-slate-400 uppercase font-bold tracking-wider">Remaining Budget</span>
                <h4 className="text-lg font-extrabold text-emerald-600 mt-1">{formatSAR(kpiStats.totalRemaining)}</h4>
                <p className="text-[10px] text-slate-400 mt-1">
                  Available free cash reserves
                </p>
              </div>
              <div className="bg-emerald-50 p-2.5 rounded-xl text-emerald-600">
                <Percent className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* If form is open */}
          {isAddFormOpen && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
                <h4 className="text-xs font-extrabold text-slate-800 uppercase font-mono tracking-wider flex items-center space-x-1.5">
                  <DollarSign className="w-4 h-4 text-indigo-600" />
                  <span>{editingBudget ? 'Edit Budget Category' : 'Create New Budget Category'}</span>
                </h4>
                <button 
                  type="button" 
                  onClick={() => setIsAddFormOpen(false)} 
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-50 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveBudget} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {selectedProjectId === 'all' && !editingBudget && (
                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 uppercase font-bold">Target Project</label>
                      <select
                        required
                        value={formProjectId}
                        onChange={e => setFormProjectId(e.target.value)}
                        className="w-full border border-slate-200 rounded-lg p-2 text-xs mt-1 bg-white focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                      >
                        {projects.map(p => (
                          <option key={p.id} value={p.id}>[{p.code}] {p.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-[10px] font-mono text-slate-400 uppercase font-bold">Budget Category Name</label>
                    <select
                      value={categoryName}
                      onChange={e => setCategoryName(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg p-2 text-xs mt-1 bg-white focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    >
                      <option value="Subcontractor Payments">Subcontractor Payments</option>
                      <option value="Procurement">Procurement</option>
                      <option value="Salary / Site Office">Salary / Site Office</option>
                      <option value="Fuel Cost">Fuel Cost</option>
                      <option value="Taxi Rent">Taxi Rent</option>
                      <option value="Accommodation Rent">Accommodation Rent</option>
                      <option value="Water">Water</option>
                      <option value="Civil & Structural">Civil & Structural</option>
                      <option value="Electrical & Cabling">Electrical & Cabling</option>
                      <option value="HVAC & Plumbing">HVAC & Plumbing</option>
                      <option value="Facade & Masonry">Facade & Masonry</option>
                      <option value="Others">Others (Custom Category)</option>
                    </select>
                  </div>

                  {categoryName === 'Others' && (
                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 uppercase font-bold">Custom Name</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Scaffolding, Permits..."
                        value={customCategoryName}
                        onChange={e => setCustomCategoryName(e.target.value)}
                        className="w-full border border-slate-200 rounded-lg p-2 text-xs mt-1 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none font-medium text-slate-700"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-[10px] font-mono text-slate-400 uppercase font-bold">Allocated Funds (SAR)</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={allocatedAmount}
                      onChange={e => setAllocatedAmount(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="e.g. 250000"
                      className="w-full border border-slate-200 rounded-lg p-2 text-xs mt-1 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-slate-400 uppercase font-bold">Allocation Month (Optional)</label>
                    <input
                      type="month"
                      value={formMonth}
                      onChange={e => setFormMonth(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg p-2 text-xs mt-1 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none font-medium text-slate-700"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                  <button 
                    type="button" 
                    onClick={() => {
                      setIsAddFormOpen(false);
                      setEditingBudget(null);
                    }} 
                    className="text-xs text-slate-500 font-bold px-3.5 py-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1.5 rounded-lg text-xs font-bold transition shadow-xs cursor-pointer"
                  >
                    {editingBudget ? 'Update Budget Allocation' : 'Add Allocation Baseline'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Budgets Grid / Categories View */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {selectedBudgets.map((b) => {
              const remaining = b.allocated - b.spent;
              const utilizationPct = b.allocated > 0 ? Math.round((b.spent / b.allocated) * 100) : 0;
              const associatedProj = getProjectInfo(b.projectId);
              
              return (
                <div key={b.id} className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4 relative overflow-hidden group">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1 max-w-[70%]">
                      {selectedProjectId === 'all' && (
                        <span className="inline-block text-[8px] font-mono font-bold text-indigo-600 bg-indigo-50 px-1 rounded uppercase">
                          {associatedProj.code}
                        </span>
                      )}
                      <h4 className="font-bold text-xs text-slate-800 line-clamp-1 group-hover:text-indigo-600 transition-colors">
                        {b.name}
                        {b.month && (
                          <span className="ml-2 inline-block px-1.5 py-0.5 rounded text-[9px] bg-slate-100 text-slate-500 font-mono">
                            {b.month}
                          </span>
                        )}
                      </h4>
                    </div>
                    
                    <span className={`inline-block px-2 py-0.5 rounded-md text-[9px] font-mono font-extrabold uppercase shrink-0 ${
                      utilizationPct > 90 
                        ? 'bg-rose-50 text-rose-700 border border-rose-100' 
                        : utilizationPct > 70 
                          ? 'bg-amber-50 text-amber-700 border border-amber-100' 
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                    }`}>
                      {utilizationPct}% Used
                    </span>
                  </div>

                  {/* Financial metrics */}
                  <div className="grid grid-cols-2 gap-2 text-[10px] font-mono pt-1">
                    <div>
                      <span className="block text-slate-400 uppercase font-bold text-[8px]">Baseline Budget</span>
                      <span className="font-bold text-slate-700">{formatSAR(b.allocated)}</span>
                    </div>
                    <div className="text-right">
                      <span className="block text-slate-400 uppercase font-bold text-[8px]">Actual spent</span>
                      <span className="font-bold text-rose-500">{formatSAR(b.spent)}</span>
                    </div>
                  </div>

                  {/* Progress Bar & Remaining balance */}
                  <div className="space-y-2 pt-1">
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-300 ${
                          utilizationPct > 90 ? 'bg-rose-500' : utilizationPct > 70 ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(utilizationPct, 100)}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-[10px] font-mono">
                      <span className="text-slate-400 uppercase font-bold text-[8px]">Remaining funds:</span>
                      <span className={`font-bold ${remaining < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {formatSAR(remaining)}
                      </span>
                    </div>
                  </div>

                  {/* Actions (visible on hover on desktop, or always) */}
                  {canManageBudgets && (
                    <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-50">
                      <button
                        onClick={() => handleOpenEdit(b)}
                        className="p-1.5 hover:bg-indigo-50 text-slate-500 hover:text-indigo-600 rounded-lg transition-all duration-150 cursor-pointer"
                        title="Edit allocation"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteBudget(b)}
                        className="p-1.5 hover:bg-rose-50 text-slate-500 hover:text-rose-600 rounded-lg transition-all duration-150 cursor-pointer"
                        title="Delete category"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}

            {selectedBudgets.length === 0 && (
              <div className="bg-white p-10 border border-dashed border-slate-200 text-center text-slate-400 italic text-xs col-span-full rounded-2xl flex flex-col items-center justify-center space-y-2">
                <DollarSign className="w-8 h-8 text-slate-300" />
                <span>No internal budget allocations declared.</span>
                {canManageBudgets && (
                  <button 
                    onClick={handleOpenAdd}
                    className="mt-2 text-indigo-600 font-bold text-xs hover:underline cursor-pointer"
                  >
                    Click here to declare your first category baseline
                  </button>
                )}
              </div>
            )}
          </div>

        </div>

      </div>

      {/* 3. PRINT PREVIEW MODAL */}
      {isPrintModalOpen && activeProject && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl shadow-xl flex flex-col max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Printer className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-800">Print Budget Summary Report</h3>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={triggerBrowserPrint}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Send to Printer</span>
                </button>
                <button
                  onClick={() => setIsPrintModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-100 rounded-lg transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Printable Area - styled for both screen and print media */}
            <div className="flex-1 overflow-y-auto p-8 select-text" id="budget-report-print-area">
              <style>{`
                @media print {
                  body * {
                    visibility: hidden;
                  }
                  #budget-report-print-area, #budget-report-print-area * {
                    visibility: visible;
                  }
                  #budget-report-print-area {
                    position: absolute;
                    left: 0;
                    top: 0;
                    width: 100%;
                    padding: 0;
                  }
                }
              `}</style>
              
              <div className="space-y-6">
                {/* Company & Document Metadata */}
                <div className="flex justify-between items-start border-b border-slate-300 pb-5">
                  <div>
                    <h1 className="text-xl font-black text-slate-900 tracking-tight">WAFAQ CONTRACTING</h1>
                    <span className="text-[10px] font-mono tracking-widest text-slate-400 font-bold block uppercase mt-1">INTERNAL FINANCIAL REVIEW</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-indigo-600 block">BUDGET BASELINE REPORT</span>
                    <p className="text-[10px] text-slate-400 mt-1 font-mono">Date Generated: {new Date().toLocaleDateString()}</p>
                    <p className="text-[10px] text-slate-400 font-mono">Report Status: Baseline Approved</p>
                  </div>
                </div>

                {/* Project Details section */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest font-mono">Project Information</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                    <div>
                      <span className="block text-[8px] uppercase tracking-wider text-slate-400 font-bold">Project Name</span>
                      <span className="text-xs font-semibold text-slate-800">{activeProject.name}</span>
                    </div>
                    <div>
                      <span className="block text-[8px] uppercase tracking-wider text-slate-400 font-bold">Project Code</span>
                      <span className="text-xs font-mono font-semibold text-slate-800">{activeProject.code}</span>
                    </div>
                    <div>
                      <span className="block text-[8px] uppercase tracking-wider text-slate-400 font-bold">Client Sponsor</span>
                      <span className="text-xs font-semibold text-slate-800">{activeProject.clientName}</span>
                    </div>
                    <div>
                      <span className="block text-[8px] uppercase tracking-wider text-slate-400 font-bold">Total Approved Value</span>
                      <span className="text-xs font-mono font-bold text-indigo-600">{formatSAR(activeProject.value)}</span>
                    </div>
                  </div>
                </div>

                {/* KPI Metrics */}
                <div className="grid grid-cols-3 gap-4 border-y border-slate-200 py-4 font-mono">
                  <div className="text-center">
                    <span className="block text-[9px] uppercase tracking-widest text-slate-400 font-bold">Total Allocated Budget</span>
                    <strong className="text-md font-bold text-slate-800 block mt-1">{formatSAR(kpiStats.totalAllocated)}</strong>
                  </div>
                  <div className="text-center border-x border-slate-200">
                    <span className="block text-[9px] uppercase tracking-widest text-slate-400 font-bold">Used from Budget (Spent)</span>
                    <strong className="text-md font-bold text-rose-600 block mt-1">{formatSAR(kpiStats.totalSpent)}</strong>
                  </div>
                  <div className="text-center">
                    <span className="block text-[9px] uppercase tracking-widest text-slate-400 font-bold">Remaining Budget Reserves</span>
                    <strong className="text-md font-bold text-emerald-600 block mt-1">{formatSAR(kpiStats.totalRemaining)}</strong>
                  </div>
                </div>

                {/* Detailed Allocation Table */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest font-mono">Detailed Allocation Breakdown</h3>
                  <table className="w-full text-left border-collapse border border-slate-200">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-mono uppercase text-slate-500">
                        <th className="p-3">Category Name</th>
                        <th className="p-3 text-center">Month</th>
                        <th className="p-3 text-right">Allocated Amount</th>
                        <th className="p-3 text-right">Actual Spent</th>
                        <th className="p-3 text-right">Remaining Balance</th>
                        <th className="p-3 text-right">Usage</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                      {selectedBudgets.map((b) => {
                        const remaining = b.allocated - b.spent;
                        const usagePct = b.allocated > 0 ? Math.round((b.spent / b.allocated) * 100) : 0;
                        return (
                          <tr key={b.id} className="font-medium">
                            <td className="p-3 font-semibold text-slate-800">{b.name}</td>
                            <td className="p-3 text-center font-mono text-slate-500">{b.month || '-'}</td>
                            <td className="p-3 text-right font-mono text-slate-600">{formatSAR(b.allocated)}</td>
                            <td className="p-3 text-right font-mono text-rose-500">{formatSAR(b.spent)}</td>
                            <td className={`p-3 text-right font-mono font-bold ${remaining < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                              {formatSAR(remaining)}
                            </td>
                            <td className="p-3 text-right font-mono text-slate-500">{usagePct}%</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Approval Signatures block */}
                <div className="pt-10 grid grid-cols-2 gap-8 text-[11px] font-medium text-slate-500 border-t border-slate-200">
                  <div className="space-y-12">
                    <p>Prepared By: __________________________</p>
                    <p className="text-[10px] text-slate-400">Eng. Majid Al-Mutairi, Site Engineer</p>
                  </div>
                  <div className="space-y-12 text-right">
                    <p>Authorized Signature: __________________________</p>
                    <p className="text-[10px] text-slate-400">Wafaq General Manager</p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      </div>
    </div>
  );
}
