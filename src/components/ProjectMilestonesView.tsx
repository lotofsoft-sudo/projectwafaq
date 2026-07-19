/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  Flag, 
  Search, 
  ChevronLeft,
  Briefcase,
  Plus,
  Edit2,
  Trash2,
  Printer,
  TrendingUp,
  X,
  CheckCircle2,
  Calendar,
  Percent,
  AlertCircle
} from 'lucide-react';
import { Project, Milestone, User } from '../types';

interface ProjectMilestonesViewProps {
  projects: Project[];
  milestones: Milestone[];
  setMilestones: React.Dispatch<React.SetStateAction<Milestone[]>>;
  currentUser: User;
  onLogAudit: (action: string, module: string, oldValue?: string, newValue?: string) => void;
  onAddNotification: (text: string, type: 'info' | 'success' | 'warning' | 'alert') => void;
}

export default function ProjectMilestonesView({
  projects,
  milestones,
  setMilestones,
  currentUser,
  onLogAudit,
  onAddNotification,
}: ProjectMilestonesViewProps) {
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [projectSearchQuery, setProjectSearchQuery] = useState('');
  const [milestoneSearchQuery, setMilestoneSearchQuery] = useState('');
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);

  // Forms state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null);

  // Form Fields
  const [milestoneName, setMilestoneName] = useState('');
  const [weight, setWeight] = useState<number | ''>('');
  const [progress, setProgress] = useState<number | ''>('');
  const [status, setStatus] = useState<'pending' | 'in_progress' | 'completed'>('pending');
  const [dueDate, setDueDate] = useState('');
  const [formProjectId, setFormProjectId] = useState('');
  const [details, setDetails] = useState('');

  // Print modal state
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Authorization helper
  const canManageMilestones = useMemo(() => {
    return currentUser.role === 'General Manager' || 
           currentUser.role === 'Project Manager' || 
           currentUser.role === 'Admin' || 
           currentUser.role === 'Super Admin';
  }, [currentUser]);

  // Project List Filter for Sidebar
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

  // Selected milestones list based on selected project & search filter
  const selectedMilestones = useMemo(() => {
    let list = milestones;
    if (selectedProjectId !== 'all') {
      list = list.filter(m => m.projectId === selectedProjectId);
    }
    if (milestoneSearchQuery.trim()) {
      const q = milestoneSearchQuery.toLowerCase();
      list = list.filter(m => 
        m.name.toLowerCase().includes(q) || 
        m.dueDate.includes(q) ||
        m.status.toLowerCase().includes(q)
      );
    }
    return list;
  }, [milestones, selectedProjectId, milestoneSearchQuery]);

  // KPI Calculations
  const kpiStats = useMemo(() => {
    const total = selectedMilestones.length;
    const completed = selectedMilestones.filter(m => m.status === 'completed' || m.progress === 100).length;
    
    // Weighted progress computation
    const totalWeight = selectedMilestones.reduce((acc, m) => acc + (m.weight || 0), 0);
    const weightedProgressSum = selectedMilestones.reduce((acc, m) => acc + ((m.progress || 0) * (m.weight || 0)), 0);
    const avgProgress = totalWeight > 0 ? Math.round(weightedProgressSum / totalWeight) : 0;

    return {
      total,
      completed,
      avgProgress
    };
  }, [selectedMilestones]);

  // Project code / name helper
  const getProjectInfo = (pId: string) => {
    return projects.find(p => p.id === pId) || { name: 'Unknown Project', code: 'PROJ-XXX', clientName: '' };
  };

  // Form actions
  const handleOpenAdd = () => {
    if (!canManageMilestones) {
      onAddNotification('Unauthorized: Your role does not allow editing project milestones.', 'alert');
      return;
    }
    setEditingMilestone(null);
    setMilestoneName('');
    setWeight('');
    setProgress(0);
    setStatus('pending');
    setDueDate(new Date().toISOString().slice(0, 10));
    setFormProjectId(selectedProjectId === 'all' ? (projects[0]?.id || '') : selectedProjectId);
    setDetails('');
    setIsFormOpen(true);
  };

  const handleOpenEdit = (m: Milestone) => {
    if (!canManageMilestones) {
      onAddNotification('Unauthorized: Your role does not allow editing project milestones.', 'alert');
      return;
    }
    setEditingMilestone(m);
    setMilestoneName(m.name);
    setWeight(m.weight);
    setProgress(m.progress);
    setStatus(m.status);
    setDueDate(m.dueDate);
    setFormProjectId(m.projectId);
    setDetails(m.details || '');
    setIsFormOpen(true);
  };

  const handleDeleteMilestone = (m: Milestone) => {
    const userRoleStr = currentUser?.role?.toLowerCase() || '';
    if (userRoleStr !== 'admin' && userRoleStr !== 'super admin' && userRoleStr !== 'superadmin') {
      alert("Unauthorized: Only Admin or Super Admin can delete records.");
      return;
    }

    if (!canManageMilestones) {
      onAddNotification('Unauthorized: Your role does not allow deleting project milestones.', 'alert');
      return;
    }
    if (window.confirm(`Are you sure you want to delete the milestone "${m.name}"?`)) {
      setMilestones(prev => prev.filter(item => item.id !== m.id));
      onLogAudit(`Deleted milestone "${m.name}"`, 'Milestones', m.name, undefined);
      onAddNotification(`Milestone "${m.name}" deleted successfully.`, 'success');
    }
  };

  const handleSaveMilestone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageMilestones) {
      onAddNotification('Unauthorized: Your role does not allow modifying project milestones.', 'alert');
      return;
    }

    if (!milestoneName.trim()) {
      onAddNotification('Please enter a valid milestone name.', 'warning');
      return;
    }

    const wt = Number(weight);
    if (isNaN(wt) || wt < 0 || wt > 100) {
      onAddNotification('Weight must be a percentage between 0 and 100.', 'warning');
      return;
    }

    const prog = Number(progress);
    if (isNaN(prog) || prog < 0 || prog > 100) {
      onAddNotification('Progress must be a percentage between 0 and 100.', 'warning');
      return;
    }

    // Auto update status based on progress value
    let calculatedStatus = status;
    if (prog === 100) {
      calculatedStatus = 'completed';
    } else if (prog > 0) {
      calculatedStatus = 'in_progress';
    } else {
      calculatedStatus = 'pending';
    }

    if (editingMilestone) {
      // Edit existing
      setMilestones(prev => prev.map(item => {
        if (item.id === editingMilestone.id) {
          return {
            ...item,
            name: milestoneName.trim(),
            weight: wt,
            progress: prog,
            status: calculatedStatus,
            dueDate,
            projectId: formProjectId,
            details: details.trim() || undefined
          };
        }
        return item;
      }));
      onLogAudit(
        `Updated milestone "${editingMilestone.name}" to progress ${prog}%`,
        'Milestones',
        `${editingMilestone.name} (${editingMilestone.progress}%)`,
        `${milestoneName} (${prog}%)`
      );
      onAddNotification(`Milestone "${milestoneName}" updated successfully.`, 'success');
    } else {
      // Add new
      const newMilestone: Milestone = {
        id: `m_${Date.now()}`,
        projectId: formProjectId,
        name: milestoneName.trim(),
        weight: wt,
        progress: prog,
        status: calculatedStatus,
        dueDate,
        details: details.trim() || undefined
      };
      setMilestones(prev => [...prev, newMilestone]);
      onLogAudit(`Created milestone "${newMilestone.name}" with weight ${wt}%`, 'Milestones', undefined, newMilestone.name);
      onAddNotification(`Milestone "${newMilestone.name}" added successfully.`, 'success');
    }

    setIsFormOpen(false);
    setEditingMilestone(null);
  };

  const triggerBrowserPrint = () => {
    window.print();
  };

  return (
    <div id="milestones-view-root" className="flex-1 flex flex-col h-full bg-slate-50 overflow-hidden">
      
      {/* Top Banner Context Section */}
      <div className="bg-white border-b border-slate-200 p-5 md:px-8 flex flex-col md:flex-row md:items-center md:justify-between shrink-0 gap-4">
        <div>
          <span className="text-xs font-mono font-bold text-indigo-600 uppercase tracking-widest block mb-1">Scheduling & Milestones</span>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Contract Milestones Checklist</h2>
          <p className="text-xs text-slate-500 mt-1">Define contract-critical milestones, track progress against deliverables, and print progress validation reports.</p>
        </div>
      </div>

      {/* Main Split Screen Area */}
      <div className="flex-1 flex overflow-hidden min-h-0 w-full">
      
        {/* 1. LEFT PANEL: Project Selection List */}
        <div 
          id="milestones-project-sidebar" 
          className={`w-72 border-r border-slate-200 bg-white flex flex-col h-full shrink-0 transition-transform lg:translate-x-0 lg:relative lg:pointer-events-auto lg:z-10 ${
            mobileDetailOpen ? '-translate-x-full absolute pointer-events-none' : 'relative z-10'
          }`}
        >
        <div className="p-4 border-b border-slate-100 bg-slate-50/60">
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-widest font-mono">Projects Directory</h2>
          <p className="text-[10px] text-slate-400 mt-1">Select a project to view milestones</p>
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
              <h4 className="text-xs font-bold text-slate-800">All Company Milestones</h4>
              <p className="text-[10px] text-slate-400 mt-0.5">Consolidated portfolio targets</p>
            </div>
          </button>

          {filteredProjects.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs italic">No projects found.</div>
          ) : (
            filteredProjects.map(p => {
              const isActive = selectedProjectId === p.id;
              const projectMilestonesCount = milestones.filter(m => m.projectId === p.id).length;
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
                      {projectMilestonesCount} Targets
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

      {/* 2. RIGHT PANEL: Milestones viewport */}
      <div 
        id="milestones-data-viewport" 
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
              <Flag className="w-5 h-5" />
            </div>
            <div className="overflow-hidden">
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-mono font-extrabold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded uppercase">
                  {activeProject ? activeProject.code : 'GLOBAL'}
                </span>
                <h3 className="text-sm font-bold text-slate-900 truncate">
                  {activeProject ? `${activeProject.name} - Project Milestones` : 'Central Corporate Milestones Registry'}
                </h3>
              </div>
              <p className="text-[10px] text-slate-400 truncate mt-0.5">
                {activeProject 
                  ? `Configure structural delivery milestones, schedule targets, and weight distributions for ${activeProject.name}.`
                  : 'Overview of critical construction project stages, due dates, and progress baselines globally.'
                }
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            {activeProject && (
              <button
                onClick={() => setIsPrintModalOpen(true)}
                className="inline-flex items-center justify-center space-x-1.5 px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-xs font-bold transition cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Milestones</span>
              </button>
            )}
            {canManageMilestones && (
              <button
                onClick={handleOpenAdd}
                className="inline-flex items-center justify-center space-x-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Milestone</span>
              </button>
            )}
          </div>
        </div>

        {/* Search bar inside content viewport */}
        <div className="px-6 py-3 bg-white border-b border-slate-100 shrink-0 flex items-center justify-between">
          <div className="relative w-72">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search milestones by name or date..."
              value={milestoneSearchQuery}
              onChange={e => setMilestoneSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
            />
          </div>
          <p className="text-[10px] text-slate-400 font-mono">
            Showing <span className="font-bold text-slate-700">{selectedMilestones.length}</span> of {milestones.filter(m => selectedProjectId === 'all' || m.projectId === selectedProjectId).length} milestones
          </p>
        </div>

        {/* Core management workspace */}
        <div className="p-6 bg-slate-50 flex-1 overflow-y-auto space-y-6">

          {/* KPI Dashboard Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono text-slate-400 uppercase font-bold tracking-wider">Total Scheduled Milestones</span>
                <h4 className="text-lg font-extrabold text-slate-800 mt-1">{kpiStats.total} Stages</h4>
                <p className="text-[10px] text-slate-400 mt-1">
                  {selectedProjectId === 'all' ? 'Across all client contracts' : 'Project-wise delivery framework'}
                </p>
              </div>
              <div className="bg-indigo-50 p-2.5 rounded-xl text-indigo-600">
                <Flag className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono text-slate-400 uppercase font-bold tracking-wider">Completed Milestones</span>
                <h4 className="text-lg font-extrabold text-emerald-600 mt-1">{kpiStats.completed} Completed</h4>
                <div className="flex items-center space-x-1 mt-1">
                  <span className="text-[10px] font-mono font-bold text-emerald-600 bg-emerald-50 px-1 rounded">
                    {kpiStats.total > 0 ? Math.round((kpiStats.completed / kpiStats.total) * 100) : 0}% Done
                  </span>
                </div>
              </div>
              <div className="bg-emerald-50 p-2.5 rounded-xl text-emerald-600">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono text-slate-400 uppercase font-bold tracking-wider">Weighted Project Progress</span>
                <h4 className="text-lg font-extrabold text-indigo-600 mt-1">{kpiStats.avgProgress}% Overall</h4>
                <p className="text-[10px] text-slate-400 mt-1">
                  Weighted sum based on milestone weights
                </p>
              </div>
              <div className="bg-indigo-50 p-2.5 rounded-xl text-indigo-600">
                <Percent className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Form section if open */}
          {isFormOpen && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
                <h4 className="text-xs font-extrabold text-slate-800 uppercase font-mono tracking-wider flex items-center space-x-1.5">
                  <Flag className="w-4 h-4 text-indigo-600" />
                  <span>{editingMilestone ? 'Modify Milestone Details' : 'Formulate New Milestone'}</span>
                </h4>
                <button 
                  type="button" 
                  onClick={() => setIsFormOpen(false)} 
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-50 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveMilestone} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {selectedProjectId === 'all' && !editingMilestone && (
                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 uppercase font-bold">Target Project</label>
                      <select
                        required
                        value={formProjectId}
                        onChange={e => setFormProjectId(e.target.value)}
                        className="w-full border border-slate-200 rounded-lg p-2 text-xs mt-1 bg-white focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none font-medium"
                      >
                        {projects.map(p => (
                          <option key={p.id} value={p.id}>[{p.code}] {p.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-mono text-slate-400 uppercase font-bold">Milestone Title / Scope</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Concrete slab pour Block C, HVAC testing..."
                      value={milestoneName}
                      onChange={e => setMilestoneName(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg p-2 text-xs mt-1 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none font-medium text-slate-700"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-slate-400 uppercase font-bold">Relative Weight (%)</label>
                    <input
                      type="number"
                      required
                      min={0}
                      max={100}
                      value={weight}
                      onChange={e => setWeight(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="e.g. 20 (Percent of total project)"
                      className="w-full border border-slate-200 rounded-lg p-2 text-xs mt-1 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-slate-400 uppercase font-bold">Current Progress (%)</label>
                    <input
                      type="number"
                      required
                      min={0}
                      max={100}
                      value={progress}
                      onChange={e => setProgress(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="e.g. 50 (Percent completed)"
                      className="w-full border border-slate-200 rounded-lg p-2 text-xs mt-1 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-slate-400 uppercase font-bold">Target Date / Due Date</label>
                    <input
                      type="date"
                      required
                      value={dueDate}
                      onChange={e => setDueDate(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg p-2 text-xs mt-1 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none font-mono"
                    />
                  </div>

                  <div className="md:col-span-3">
                    <label className="block text-[10px] font-mono text-slate-400 uppercase font-bold">Scope Details & Deliverables</label>
                    <textarea
                      placeholder="Specify material standards, quality checks, site inspector expectations..."
                      value={details}
                      onChange={e => setDetails(e.target.value)}
                      rows={3}
                      className="w-full border border-slate-200 rounded-lg p-2 text-xs mt-1 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none font-medium text-slate-700"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                  <button 
                    type="button" 
                    onClick={() => {
                      setIsFormOpen(false);
                      setEditingMilestone(null);
                    }} 
                    className="text-xs text-slate-500 font-bold px-3.5 py-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1.5 rounded-lg text-xs font-bold transition shadow-xs cursor-pointer"
                  >
                    {editingMilestone ? 'Save Milestone Adjustments' : 'Commit Milestone Stage'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Milestones Card Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {selectedMilestones.map((m) => {
              const proj = getProjectInfo(m.projectId);
              return (
                <div key={m.id} className="bg-white p-5 rounded-2xl border border-slate-200/85 shadow-xs space-y-4 flex flex-col justify-between group relative overflow-hidden">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 max-w-[70%]">
                        {selectedProjectId === 'all' && (
                          <span className="inline-block text-[8px] font-mono font-bold text-indigo-600 bg-indigo-50 px-1 rounded uppercase">
                            {proj.code}
                          </span>
                        )}
                        <h4 className="font-bold text-xs text-slate-800 line-clamp-1 group-hover:text-indigo-600 transition-colors">
                          {m.name}
                        </h4>
                      </div>

                      <span className={`inline-block px-2 py-0.5 rounded-md text-[9px] font-mono font-extrabold uppercase shrink-0 ${
                        m.status === 'completed' 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                          : m.status === 'in_progress' 
                            ? 'bg-blue-50 text-blue-700 border border-blue-100' 
                            : 'bg-slate-50 text-slate-500 border border-slate-100'
                      }`}>
                        {m.status === 'completed' ? 'Completed' : m.status === 'in_progress' ? 'In Progress' : 'Pending'}
                      </span>
                    </div>

                    <p className="text-[10px] text-slate-400 line-clamp-2 mt-1">
                      {m.details || 'No detailed scope specifications added yet.'}
                    </p>
                  </div>

                  {/* Weight, Due Date, Progress */}
                  <div className="space-y-3 pt-2 border-t border-slate-50">
                    <div className="flex justify-between items-center text-[10px] font-mono">
                      <div className="flex items-center space-x-1 text-slate-400">
                        <Calendar className="w-3.5 h-3.5 shrink-0" />
                        <span>Due {m.dueDate}</span>
                      </div>
                      <span className="text-slate-500 font-bold">Weight: {m.weight}%</span>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[10px] font-mono font-bold">
                        <span className="text-slate-400">Completion</span>
                        <span className="text-indigo-600">{m.progress}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-300 ${
                            m.progress === 100 ? 'bg-emerald-500' : m.progress > 0 ? 'bg-indigo-500' : 'bg-slate-300'
                          }`}
                          style={{ width: `${m.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  {/* Actions footer */}
                  {canManageMilestones && (
                    <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-50 mt-1">
                      <button
                        onClick={() => handleOpenEdit(m)}
                        className="p-1.5 hover:bg-indigo-50 text-slate-500 hover:text-indigo-600 rounded-lg transition-all duration-150 cursor-pointer"
                        title="Edit milestone"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteMilestone(m)}
                        className="p-1.5 hover:bg-rose-50 text-slate-500 hover:text-rose-600 rounded-lg transition-all duration-150 cursor-pointer"
                        title="Delete milestone"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}

            {selectedMilestones.length === 0 && (
              <div className="bg-white p-10 border border-dashed border-slate-200 text-center text-slate-400 italic text-xs col-span-full rounded-2xl flex flex-col items-center justify-center space-y-2">
                <Flag className="w-8 h-8 text-slate-300" />
                <span>No milestones scheduled matching the selection.</span>
                {canManageMilestones && (
                  <button 
                    onClick={handleOpenAdd}
                    className="mt-2 text-indigo-600 font-bold text-xs hover:underline cursor-pointer"
                  >
                    Click here to schedule your first project stage milestone
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
                <h3 className="text-sm font-bold text-slate-800">Print Milestone Review Report</h3>
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

            {/* Printable Area */}
            <div className="flex-1 overflow-y-auto p-8 select-text" id="milestones-report-print-area">
              <style>{`
                @media print {
                  body * {
                    visibility: hidden;
                  }
                  #milestones-report-print-area, #milestones-report-print-area * {
                    visibility: visible;
                  }
                  #milestones-report-print-area {
                    position: absolute;
                    left: 0;
                    top: 0;
                    width: 100%;
                    padding: 0;
                  }
                }
              `}</style>
              
              <div className="space-y-6">
                {/* Header */}
                <div className="flex justify-between items-start border-b border-slate-300 pb-5">
                  <div>
                    <h1 className="text-xl font-black text-slate-900 tracking-tight">WAFAQ CONTRACTING</h1>
                    <span className="text-[10px] font-mono tracking-widest text-slate-400 font-bold block uppercase mt-1">ENGINEERING & PROGRESS REVIEW</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-indigo-600 block">PROJECT MILESTONES REPORT</span>
                    <p className="text-[10px] text-slate-400 mt-1 font-mono">Date Generated: {new Date().toLocaleDateString()}</p>
                    <p className="text-[10px] text-slate-400 font-mono">Status: Verified Schedule</p>
                  </div>
                </div>

                {/* Project Details */}
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
                      <span className="block text-[8px] uppercase tracking-wider text-slate-400 font-bold">Weighted Completion</span>
                      <span className="text-xs font-mono font-bold text-indigo-600">{kpiStats.avgProgress}% Completed</span>
                    </div>
                  </div>
                </div>

                {/* KPI metrics row */}
                <div className="grid grid-cols-3 gap-4 border-y border-slate-200 py-4 font-mono text-center">
                  <div>
                    <span className="block text-[9px] uppercase tracking-widest text-slate-400 font-bold">Total Milestones</span>
                    <strong className="text-md font-bold text-slate-800 block mt-1">{kpiStats.total} Deliverables</strong>
                  </div>
                  <div className="border-x border-slate-200">
                    <span className="block text-[9px] uppercase tracking-widest text-slate-400 font-bold">Stages Completed</span>
                    <strong className="text-md font-bold text-emerald-600 block mt-1">{kpiStats.completed} Stages</strong>
                  </div>
                  <div>
                    <span className="block text-[9px] uppercase tracking-widest text-slate-400 font-bold">Weighted Progress</span>
                    <strong className="text-md font-bold text-indigo-600 block mt-1">{kpiStats.avgProgress}% Done</strong>
                  </div>
                </div>

                {/* Detailed milestones table */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest font-mono">Detailed Schedule & Deliverables</h3>
                  <table className="w-full text-left border-collapse border border-slate-200">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-mono uppercase text-slate-500">
                        <th className="p-3">Milestone Scope / Stage</th>
                        <th className="p-3">Target Date</th>
                        <th className="p-3 text-right">Relative Weight</th>
                        <th className="p-3 text-right">Actual Progress</th>
                        <th className="p-3 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                      {selectedMilestones.map((m) => {
                        return (
                          <tr key={m.id} className="font-medium">
                            <td className="p-3">
                              <span className="font-bold text-slate-800 block">{m.name}</span>
                              <span className="text-[10px] text-slate-400 font-normal block mt-0.5">{m.details || 'No additional notes'}</span>
                            </td>
                            <td className="p-3 font-mono text-slate-600">{m.dueDate}</td>
                            <td className="p-3 text-right font-mono text-slate-600">{m.weight}%</td>
                            <td className="p-3 text-right font-mono font-bold text-indigo-600">{m.progress}%</td>
                            <td className="p-3 text-right">
                              <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                                m.status === 'completed' ? 'bg-emerald-50 text-emerald-700' : m.status === 'in_progress' ? 'bg-blue-50 text-blue-700' : 'bg-slate-50 text-slate-500'
                              }`}>
                                {m.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Sign-offs */}
                <div className="pt-10 grid grid-cols-2 gap-8 text-[11px] font-medium text-slate-500 border-t border-slate-200">
                  <div className="space-y-12">
                    <p>Prepared By: __________________________</p>
                    <p className="text-[10px] text-slate-400">Project Quality Manager</p>
                  </div>
                  <div className="space-y-12 text-right">
                    <p>Client Acceptance Sign-off: __________________________</p>
                    <p className="text-[10px] text-slate-400">Supervising Consultant Engineer</p>
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
