/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Plus, 
  Search, 
  MapPin, 
  User, 
  DollarSign, 
  TrendingUp, 
  Calendar, 
  FolderOpen, 
  Edit3, 
  Briefcase, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  X,
  Building2,
  ChevronRight,
  ChevronDown,
  ArrowRight,
  ChevronLeft,
  Percent,
  TrendingDown,
  Layers,
  ExternalLink
} from 'lucide-react';
import { Project, getVatAppliedAmount } from '../types';
import { WORKFLOW_STEP_NAMES } from '../data/mockData';

// Step to Tab Router Map
export function getTabForStep(stepNum: number): 'overview' | 'boq' | 'quotations' | 'po' | 'budget' | 'milestones' | 'tasks' | 'issues' | 'variations' | 'expenses' | 'invoices' | 'payments' | 'documents' {
  if (stepNum <= 5) return 'overview';
  if (stepNum === 6) return 'boq';
  if (stepNum >= 7 && stepNum <= 11) return 'quotations';
  if (stepNum === 12 || stepNum === 13) return 'po';
  if (stepNum === 14 || stepNum === 15) return 'budget';
  if (stepNum === 16) return 'tasks';
  if (stepNum === 17 || stepNum === 18) return 'milestones';
  if (stepNum === 19 || stepNum === 20) return 'tasks';
  if (stepNum === 21) return 'overview';
  if (stepNum === 22) return 'issues';
  if (stepNum === 23 || stepNum === 24) return 'variations';
  if (stepNum === 25) return 'documents';
  if (stepNum === 26) return 'invoices';
  if (stepNum === 27) return 'payments';
  if (stepNum === 28) return 'documents';
  return 'overview';
}

export function getLabelForStepTab(stepNum: number): string {
  const tab = getTabForStep(stepNum);
  const labels: Record<string, string> = {
    overview: 'Project Overview',
    boq: 'BOQ Uploads & Items',
    quotations: 'Quotations & Bid Proposals',
    po: 'Purchase Orders (POs)',
    budget: 'Project Cost Budgets',
    milestones: 'Milestone Scheduling',
    tasks: 'Site Work Tasks',
    issues: 'Active Issues Snags',
    variations: 'Contract Variations (VO)',
    expenses: 'Expenses Tracker',
    invoices: 'Client Invoices',
    payments: 'Receipt Collections',
    documents: 'Site Documents Archive'
  };
  return labels[tab] || 'Project Overview';
}

interface ProjectsOverviewProps {
  projects: Project[];
  onAddProject: (project: Omit<Project, 'id' | 'code' | 'spent' | 'currentWorkflowStep' | 'progress'>) => void;
  onUpdateProject: (project: Project) => void;
  onViewWorkspace: (projectId: string, tab?: string) => void;
  currentUser: { name: string; role: string };
}

export default function ProjectsOverview({
  projects,
  onAddProject,
  onUpdateProject,
  onViewWorkspace,
  currentUser
}: ProjectsOverviewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed' | 'pending' | 'cancelled'>('all');
  
  // Master-Detail layout selection state
  const [selectedOverviewId, setSelectedOverviewId] = useState<string | null>(null);
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);
  const [showPipelineSteps, setShowPipelineSteps] = useState(false);

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  // Form states for Create Project
  const [addName, setAddName] = useState('');
  const [addClient, setAddClient] = useState('');
  const [addValue, setAddValue] = useState(0);
  const [addBudget, setAddBudget] = useState(0);
  const [addLocation, setAddLocation] = useState('');
  const [addManager, setAddManager] = useState('');
  const [addStartDate, setAddStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [addEndDate, setAddEndDate] = useState(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10));
  const [addDesc, setAddDesc] = useState('');

  // Form states for Edit Project
  const [editName, setEditName] = useState('');
  const [editClient, setEditClient] = useState('');
  const [editValue, setEditValue] = useState(0);
  const [editBudget, setEditBudget] = useState(0);
  const [editLocation, setEditLocation] = useState('');
  const [editManager, setEditManager] = useState('');
  const [editStartDate, setEditStartDate] = useState('');
  const [editEndDate, setEditEndDate] = useState('');
  const [editStatus, setEditStatus] = useState<'active' | 'completed' | 'cancelled' | 'pending'>('pending');
  const [editDesc, setEditDesc] = useState('');
  const [editProgress, setEditProgress] = useState(0);

  // Ref to serial list scroll container for scroll-reset optimization
  const listContainerRef = useRef<HTMLDivElement>(null);

  // Filter projects based on query and status filter
  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            p.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            p.siteLocation.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' ? true : p.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [projects, searchQuery, statusFilter]);

  // Reset scroll container position when tabs or search changes
  useEffect(() => {
    if (listContainerRef.current) {
      listContainerRef.current.scrollTop = 0;
    }
  }, [statusFilter, searchQuery]);

  // Dynamically select the active project in focus
  const activeOverviewProject = useMemo(() => {
    if (!selectedOverviewId) {
      return filteredProjects[0] || null;
    }
    const found = filteredProjects.find(p => p.id === selectedOverviewId);
    return found || filteredProjects[0] || null;
  }, [filteredProjects, selectedOverviewId]);

  // Overall Statistics helper
  const stats = useMemo(() => {
    const totalVal = projects.reduce((acc, p) => acc + p.value, 0);
    const totalBudget = projects.reduce((acc, p) => acc + p.budget, 0);
    const activeCount = projects.filter(p => p.status === 'active').length;
    const completedCount = projects.filter(p => p.status === 'completed').length;
    return { totalVal, totalBudget, activeCount, completedCount };
  }, [projects]);

  const handleOpenEdit = (proj: Project) => {
    setEditingProject(proj);
    setEditName(proj.name);
    setEditClient(proj.clientName);
    setEditValue(proj.value);
    setEditBudget(proj.budget);
    setEditLocation(proj.siteLocation);
    setEditManager(proj.siteManager);
    setEditStartDate(proj.startDate);
    setEditEndDate(proj.endDate);
    setEditStatus(proj.status);
    setEditDesc(proj.description);
    setEditProgress(proj.progress);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addName || !addClient) return;

    onAddProject({
      name: addName,
      clientName: addClient,
      value: Number(addValue),
      budget: Number(addBudget),
      siteLocation: addLocation || 'Riyadh, Saudi Arabia',
      siteManager: addManager || currentUser.name,
      startDate: addStartDate,
      endDate: addEndDate,
      description: addDesc || 'Newly initialized contract scope.',
      status: 'pending'
    });

    // Reset create fields
    setAddName('');
    setAddClient('');
    setAddValue(0);
    setAddBudget(0);
    setAddLocation('');
    setAddManager('');
    setAddStartDate(new Date().toISOString().slice(0, 10));
    setAddEndDate(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10));
    setAddDesc('');
    setShowCreateModal(false);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProject) return;

    onUpdateProject({
      ...editingProject,
      name: editName,
      clientName: editClient,
      value: Number(editValue),
      budget: Number(editBudget),
      siteLocation: editLocation,
      siteManager: editManager,
      startDate: editStartDate,
      endDate: editEndDate,
      status: editStatus,
      description: editDesc,
      progress: editProgress
    });

    setEditingProject(null);
  };

  const formatSAR = (val: number) => {
    const applied = getVatAppliedAmount(val);
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'SAR',
      maximumFractionDigits: 0
    }).format(applied);
  };

  const formatRawSAR = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'SAR',
      maximumFractionDigits: 0
    }).format(val);
  };

  // Status Badge styles helper
  const getStatusStyle = (status: Project['status']) => {
    const styles = {
      active: { bg: 'bg-emerald-50 text-emerald-800 border-emerald-200', dot: 'bg-emerald-500' },
      completed: { bg: 'bg-blue-50 text-blue-800 border-blue-200', dot: 'bg-blue-500' },
      pending: { bg: 'bg-amber-50 text-amber-800 border-amber-200', dot: 'bg-amber-500' },
      cancelled: { bg: 'bg-rose-50 text-rose-800 border-rose-200', dot: 'bg-rose-500' }
    };
    return styles[status] || styles.pending;
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50/50 overflow-hidden select-none">
      
      {/* Top Banner Context Section */}
      <div className="bg-white border-b border-slate-200 p-5 md:px-8 flex flex-col md:flex-row md:items-center md:justify-between shrink-0 gap-4">
        <div>
          <span className="text-xs font-mono font-bold text-indigo-600 uppercase tracking-widest block mb-1">Corporate Portfolio</span>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Contract Projects Central</h2>
          <p className="text-xs text-slate-500 mt-1">Manage and audit Saudi commercial construction contracts, budgets, and operational progress.</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition flex items-center justify-center space-x-2 shadow-sm cursor-pointer active-scale select-none shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Initialize Project</span>
        </button>
      </div>

      {/* Mini KPIs Bar */}
      <div className="px-5 md:px-8 py-3 bg-white/40 border-b border-slate-200 grid grid-cols-2 md:grid-cols-4 gap-4 shrink-0">
        <div className="bg-white p-2.5 border border-slate-150 rounded-xl shadow-2xs flex items-center space-x-3">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
            <Briefcase className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-mono uppercase font-bold tracking-wider block">Total Contracts</span>
            <span className="text-xs font-extrabold text-slate-800">{projects.length} Awards</span>
          </div>
        </div>

        <div className="bg-white p-2.5 border border-slate-150 rounded-xl shadow-2xs flex items-center space-x-3">
          <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-mono uppercase font-bold tracking-wider block">Portfolio Value</span>
            <span className="text-xs font-extrabold text-slate-800">{formatSAR(stats.totalVal)}</span>
          </div>
        </div>

        <div className="bg-white p-2.5 border border-slate-150 rounded-xl shadow-2xs flex items-center space-x-3">
          <div className="p-2 bg-sky-50 text-sky-600 rounded-lg">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-mono uppercase font-bold tracking-wider block">Active On-Site</span>
            <span className="text-xs font-extrabold text-slate-800">{stats.activeCount} Projects</span>
          </div>
        </div>

        <div className="bg-white p-2.5 border border-slate-150 rounded-xl shadow-2xs flex items-center space-x-3">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
            <CheckCircle className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-mono uppercase font-bold tracking-wider block">Completed</span>
            <span className="text-xs font-extrabold text-slate-800">{stats.completedCount} Projects</span>
          </div>
        </div>
      </div>

      {/* Main Split Screen Area */}
      <div className="flex-1 flex overflow-hidden min-h-0 w-full">
        
        {/* LEFT COLUMN: SERIAL PROJECTS LIST */}
        <div 
          className={`w-full lg:w-96 border-r border-slate-200 bg-white flex flex-col shrink-0 overflow-hidden min-h-0 ${
            mobileDetailOpen ? 'hidden lg:flex' : 'flex'
          }`}
        >
          {/* Filters & Search Header inside Left Bar */}
          <div className="p-4 border-b border-slate-200 space-y-3 bg-slate-50/50 shrink-0">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search contracts..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-white text-slate-800 text-xs rounded-lg pl-8 pr-4 py-1.5 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Filter Pill Tabs - Scrollable */}
            <div className="flex items-center space-x-1 overflow-x-auto pb-1 no-scrollbar select-none">
              {(['all', 'active', 'pending', 'completed', 'cancelled'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setStatusFilter(f)}
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-md border uppercase font-mono transition shrink-0 cursor-pointer ${
                    statusFilter === f 
                      ? 'bg-slate-900 border-slate-900 text-white' 
                      : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Serial Scrollable Container */}
          <div 
            ref={listContainerRef} 
            className="flex-1 overflow-y-auto divide-y divide-slate-100 bg-white"
          >
            {filteredProjects.length > 0 ? (
              filteredProjects.map(proj => {
                const isSelected = activeOverviewProject?.id === proj.id;
                const statusInfo = getStatusStyle(proj.status);

                return (
                  <div
                    key={proj.id}
                    onClick={() => {
                      setSelectedOverviewId(proj.id);
                      setMobileDetailOpen(true);
                    }}
                    className={`p-4 text-left transition relative cursor-pointer hover:bg-slate-50/80 ${
                      isSelected ? 'bg-indigo-50/30' : ''
                    }`}
                  >
                    {/* Selected Left border marker */}
                    {isSelected && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-600" />
                    )}

                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-mono text-[9px] font-extrabold text-indigo-600 tracking-wider">
                          {proj.code}
                        </span>
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold font-mono uppercase border ${statusInfo.bg}`}>
                          <span className={`w-1 h-1 rounded-full ${statusInfo.dot} mr-1`} />
                          {proj.status}
                        </span>
                      </div>

                      <h3 className="font-sans font-bold text-xs text-slate-800 leading-snug line-clamp-2">
                        {proj.name}
                      </h3>

                      <div className="flex justify-between items-center text-[10px] text-slate-400">
                        <span className="truncate max-w-[150px] font-medium">{proj.clientName}</span>
                        <span className="font-mono font-bold text-slate-700">{formatSAR(proj.value)}</span>
                      </div>

                      {/* Spark progress bar */}
                      <div className="space-y-1">
                        <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-350 ${proj.progress === 100 ? 'bg-emerald-500' : 'bg-indigo-600'}`}
                            style={{ width: `${proj.progress}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[8px] font-mono text-slate-400">
                          <span>Workflow Step {proj.currentWorkflowStep}/28</span>
                          <span className="font-bold">{proj.progress}% Done</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center text-slate-400 text-xs italic">
                No matching projects found
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: PROJECT SPECIFIC DETAILED REPORT */}
        <div 
          className={`flex-1 bg-slate-50/60 overflow-y-auto flex flex-col min-h-0 ${
            mobileDetailOpen ? 'flex' : 'hidden lg:flex'
          }`}
        >
          {activeOverviewProject ? (
            <div className="flex-1 flex flex-col overflow-hidden">
              
              {/* Detail Header & Mobile Navigation Back */}
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
                        {activeOverviewProject.code}
                      </span>
                      <span className="text-slate-300 shrink-0">|</span>
                      <span className="text-xs text-slate-400 truncate font-semibold">
                        {activeOverviewProject.clientName}
                      </span>
                    </div>
                    <h3 className="text-base font-extrabold text-slate-900 tracking-tight mt-0.5 line-clamp-1">
                      {activeOverviewProject.name}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold font-mono uppercase border ${
                    getStatusStyle(activeOverviewProject.status).bg
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${getStatusStyle(activeOverviewProject.status).dot} mr-1.5`} />
                    {activeOverviewProject.status}
                  </span>
                </div>
              </div>

              {/* Scrollable Specific Project Report Section */}
              <div className="flex-1 overflow-y-auto p-5 md:p-8 space-y-6">
                
                {/* Physical Completion and Workflow Step Info */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">Workflow Progress</span>
                      <h4 className="text-sm font-extrabold text-slate-800">
                        Pipeline step {activeOverviewProject.currentWorkflowStep} of 28
                      </h4>
                      <p className="text-xs text-indigo-600 font-mono font-medium">
                        Step {activeOverviewProject.currentWorkflowStep}: Currently active contract milestones
                      </p>
                    </div>
                    <div className="bg-indigo-50 text-indigo-600 rounded-xl p-3 flex items-center justify-center font-mono font-extrabold text-base border border-indigo-100">
                      {activeOverviewProject.progress}%
                    </div>
                  </div>

                  {/* High Resolution Progress Slider */}
                  <div className="space-y-2">
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-350 ${
                          activeOverviewProject.progress === 100 ? 'bg-emerald-500' : 'bg-indigo-600'
                        }`}
                        style={{ width: `${activeOverviewProject.progress}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center text-xs text-slate-400 font-medium pt-1">
                      <span>Mobilization</span>
                      <span>Mid-Execution</span>
                      <span>Handover & Closing</span>
                    </div>
                  </div>
                </div>

                {/* Collapsible 28 Operational Steps Pipeline */}
                <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3">
                  <button
                    onClick={() => setShowPipelineSteps(!showPipelineSteps)}
                    className="w-full flex items-center justify-between text-left text-xs font-mono font-bold text-slate-600 uppercase tracking-wider select-none cursor-pointer hover:text-indigo-600 transition"
                  >
                    <div className="flex items-center space-x-2">
                      <Layers className="w-4 h-4 text-indigo-500" />
                      <span>Show 28 Operational Steps Pipeline</span>
                    </div>
                    {showPipelineSteps ? (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    )}
                  </button>

                  {showPipelineSteps && (
                    <div className="pt-2 border-t border-slate-100 max-h-72 overflow-y-auto space-y-1.5 pr-2 no-scrollbar animate-in fade-in duration-200">
                      {WORKFLOW_STEP_NAMES.map((stepName, index) => {
                        const stepNum = index + 1;
                        
                        // Calculate step status
                        let stepStatus: 'pending' | 'in_progress' | 'completed' = 'pending';
                        if (activeOverviewProject.workflowStepsStatuses && activeOverviewProject.workflowStepsStatuses[stepNum]) {
                          stepStatus = activeOverviewProject.workflowStepsStatuses[stepNum];
                        } else {
                          if (stepNum < activeOverviewProject.currentWorkflowStep) stepStatus = 'completed';
                          else if (stepNum === activeOverviewProject.currentWorkflowStep) stepStatus = 'in_progress';
                        }

                        const tab = getTabForStep(stepNum);
                        const label = getLabelForStepTab(stepNum);

                        return (
                          <div 
                            key={stepNum}
                            className="flex items-center justify-between p-2 rounded-lg border border-slate-100 hover:bg-slate-50 transition text-xs"
                          >
                            <div className="flex items-center space-x-2.5 min-w-0">
                              {/* Status Indicator circle */}
                              {stepStatus === 'completed' ? (
                                <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center text-white text-[9px] font-bold shrink-0">✓</div>
                              ) : stepStatus === 'in_progress' ? (
                                <div className="w-4 h-4 rounded-full bg-indigo-500 ring-2 ring-indigo-200 animate-pulse shrink-0" />
                              ) : (
                                <div className="w-4 h-4 rounded-full border-2 border-slate-200 bg-white shrink-0" />
                              )}
                              
                              <span className="font-semibold text-slate-700 truncate">
                                <span className="font-mono text-[10px] text-slate-400 mr-1.5">Step {stepNum}</span>
                                {stepName}
                              </span>
                            </div>

                            <button
                              onClick={() => onViewWorkspace(activeOverviewProject.id, tab)}
                              className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center space-x-1 font-mono shrink-0 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded cursor-pointer transition"
                              title={`Navigate to ${label}`}
                            >
                              <span>{label.split(' ')[1] || label}</span>
                              <ExternalLink className="w-3 h-3" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Specific Project Bento-style Metrics Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  
                  {/* Contract Value Box */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs flex items-start space-x-4">
                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                      <DollarSign className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">Award Contract Value</span>
                      <span className="text-base font-extrabold text-slate-800 block">
                        {formatSAR(activeOverviewProject.value)}
                      </span>
                      <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-md inline-block">
                        SAR Net Inflow
                      </span>
                    </div>
                  </div>

                  {/* Budget Allocation Box */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs flex items-start space-x-4">
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                      <Briefcase className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">Internal Cost Budget</span>
                      <span className="text-base font-extrabold text-slate-800 block">
                        {formatRawSAR(activeOverviewProject.budget)}
                      </span>
                      <span className="text-[10px] text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded-md inline-block">
                        Incl. VAT (15%)
                      </span>
                    </div>
                  </div>

                  {/* Costs Incurred (Spent) Box */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs flex flex-col justify-between space-y-4">
                    <div className="flex items-start space-x-4">
                      <div className="p-3 bg-sky-50 text-sky-600 rounded-xl">
                        <Percent className="w-5 h-5" />
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">Actual Site Expenditures</span>
                        <span className="text-base font-extrabold text-slate-800 block">
                          {formatRawSAR(activeOverviewProject.spent)}
                        </span>
                        <span className="text-[10px] text-sky-600 font-bold bg-sky-50 px-2 py-0.5 rounded-md inline-block">
                          VAT Included
                        </span>
                      </div>
                    </div>
                    
                    {/* Spent Utilization Gauge */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex justify-between text-[10px] font-mono">
                        <span className="text-slate-400">Budget Utilization</span>
                        <span className="font-extrabold text-slate-700">
                          {activeOverviewProject.budget > 0 
                            ? Math.round((activeOverviewProject.spent / activeOverviewProject.budget) * 100) 
                            : 0}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div 
                           className="h-full bg-sky-500 rounded-full"
                           style={{ 
                            width: `${activeOverviewProject.budget > 0 
                              ? Math.min(100, Math.round((activeOverviewProject.spent / activeOverviewProject.budget) * 100)) 
                              : 0}%` 
                           }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Net Margin Profit Margin */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs flex flex-col justify-between space-y-4">
                    <div className="flex items-start space-x-4">
                      <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                        <TrendingUp className="w-5 h-5" />
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">Estimated Gross Margin</span>
                        <span className="text-base font-extrabold text-slate-800 block">
                          {formatRawSAR(getVatAppliedAmount(activeOverviewProject.value) - activeOverviewProject.budget)}
                        </span>
                      </div>
                    </div>

                    <div className="text-[10px] font-medium text-amber-600 flex items-center bg-amber-50 px-2 py-1 rounded-md self-start font-mono font-bold">
                      <TrendingUp className="w-3.5 h-3.5 mr-1" />
                      <span>{getVatAppliedAmount(activeOverviewProject.value) > 0 ? Math.round(((getVatAppliedAmount(activeOverviewProject.value) - activeOverviewProject.budget) / getVatAppliedAmount(activeOverviewProject.value)) * 100) : 0}% Contract Profit</span>
                    </div>
                  </div>

                </div>

                {/* Scope & Contract Overview text */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-3">
                  <h4 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
                    Contracted Engineering Scope of Work
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed font-normal">
                    {activeOverviewProject.description}
                  </p>
                </div>

                {/* Logistics & Site Assignment Metadata */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
                  <h4 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
                    Site Logistics & Assignments
                  </h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                    <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
                      <div className="flex items-center text-slate-400 space-x-1">
                        <User className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-mono font-bold uppercase">Project Manager</span>
                      </div>
                      <span className="font-semibold text-slate-800 block truncate">
                        {activeOverviewProject.siteManager}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
                      <div className="flex items-center text-slate-400 space-x-1">
                        <MapPin className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-mono font-bold uppercase">Site Location HQ</span>
                      </div>
                      <span className="font-semibold text-slate-800 block truncate">
                        {activeOverviewProject.siteLocation}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
                      <div className="flex items-center text-slate-400 space-x-1">
                        <Calendar className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-mono font-bold uppercase">Contract Period</span>
                      </div>
                      <span className="font-mono text-[11px] font-semibold text-slate-800 block">
                        {activeOverviewProject.startDate} <span className="text-slate-300">to</span> {activeOverviewProject.endDate}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Specific Project Action toolbar */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row gap-3 justify-between items-center shadow-xs">
                  <button
                    onClick={() => handleOpenEdit(activeOverviewProject)}
                    className="w-full sm:w-auto text-slate-600 hover:bg-slate-100 px-4 py-2 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition border border-slate-200 cursor-pointer active-scale"
                  >
                    <Edit3 className="w-4 h-4 text-slate-400" />
                    <span>Edit Contract Details</span>
                  </button>

                  <button
                    onClick={() => onViewWorkspace(activeOverviewProject.id)}
                    className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl transition flex items-center justify-center space-x-2 cursor-pointer active-scale shadow-md shadow-indigo-600/15"
                  >
                    <span>Launch Projects Workspace</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-12 text-slate-400">
              <Briefcase className="w-12 h-12 mb-3 text-slate-300" />
              <p className="text-xs font-medium">Select a project from the portfolio to view detailed contract audit and site log data.</p>
            </div>
          )}
        </div>

      </div>

      {/* CREATE NEW PROJECT MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-950/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs select-none animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="bg-slate-900 text-white p-5 border-b border-slate-800 flex justify-between items-center">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 font-mono">Initialize Contract</span>
                <h4 className="text-sm font-bold text-slate-100 mt-1">New Construction Scope Award</h4>
              </div>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white transition p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-[10px] font-mono text-slate-400 uppercase font-bold mb-1">Project Name / Description</label>
                  <input
                    type="text"
                    required
                    value={addName}
                    onChange={e => setAddName(e.target.value)}
                    placeholder="e.g. Al-Fursan Villa Housing Block C"
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                
                <div className="col-span-2">
                  <label className="block text-[10px] font-mono text-slate-400 uppercase font-bold mb-1">Client Developer</label>
                  <input
                    type="text"
                    required
                    value={addClient}
                    onChange={e => setAddClient(e.target.value)}
                    placeholder="e.g. ROSHN Real Estate Development"
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase font-bold mb-1">Contract Value (SAR)</label>
                  <input
                    type="number"
                    required
                    value={addValue || ''}
                    onChange={e => setAddValue(Number(e.target.value))}
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase font-bold mb-1">Internal Cost Budget (SAR)</label>
                  <input
                    type="number"
                    required
                    value={addBudget || ''}
                    onChange={e => setAddBudget(Number(e.target.value))}
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase font-bold mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={addStartDate}
                    onChange={e => setAddStartDate(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase font-bold mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    value={addEndDate}
                    onChange={e => setAddEndDate(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-[10px] font-mono text-slate-400 uppercase font-bold mb-1">Site Location HQ</label>
                  <input
                    type="text"
                    value={addLocation}
                    onChange={e => setAddLocation(e.target.value)}
                    placeholder="e.g. Al-Narjis District, Riyadh, KSA"
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-[10px] font-mono text-slate-400 uppercase font-bold mb-1">Site Project Manager</label>
                  <input
                    type="text"
                    value={addManager}
                    onChange={e => setAddManager(e.target.value)}
                    placeholder="e.g. Tariq Al-Mansoor"
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-[10px] font-mono text-slate-400 uppercase font-bold mb-1">Scope Summary Overview</label>
                  <textarea
                    value={addDesc}
                    onChange={e => setAddDesc(e.target.value)}
                    placeholder="Specify brief engineering and material scope of works."
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 h-20 resize-none"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 border-t border-slate-100 pt-4">
                <button 
                  type="button" 
                  onClick={() => setShowCreateModal(false)}
                  className="text-xs text-slate-500 font-bold px-4 py-2 cursor-pointer hover:bg-slate-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl text-xs font-bold transition cursor-pointer shadow-md shadow-indigo-600/10 active-scale"
                >
                  Initialize Contract
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT EXISTING PROJECT MODAL */}
      {editingProject && (
        <div className="fixed inset-0 bg-slate-950/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs select-none animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="bg-slate-900 text-white p-5 border-b border-slate-800 flex justify-between items-center">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 font-mono">Modify Contract Details</span>
                <h4 className="text-sm font-bold text-slate-100 mt-1">{editingProject.code} - {editingProject.name}</h4>
              </div>
              <button 
                onClick={() => setEditingProject(null)}
                className="text-slate-400 hover:text-white transition p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-[10px] font-mono text-slate-400 uppercase font-bold mb-1">Project Title</label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                
                <div className="col-span-2">
                  <label className="block text-[10px] font-mono text-slate-400 uppercase font-bold mb-1">Client Developer</label>
                  <input
                    type="text"
                    required
                    value={editClient}
                    onChange={e => setEditClient(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase font-bold mb-1">Contract Value (SAR)</label>
                  <input
                    type="number"
                    required
                    value={editValue}
                    onChange={e => setEditValue(Number(e.target.value))}
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase font-bold mb-1">Internal Budget (SAR)</label>
                  <input
                    type="number"
                    required
                    value={editBudget}
                    onChange={e => setEditBudget(Number(e.target.value))}
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase font-bold mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={editStartDate}
                    onChange={e => setEditStartDate(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase font-bold mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    value={editEndDate}
                    onChange={e => setEditEndDate(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase font-bold mb-1">Operational Status</label>
                  <select
                    value={editStatus}
                    onChange={e => setEditStatus(e.target.value as any)}
                    className="w-full border border-slate-200 bg-white rounded-lg p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  >
                    <option value="pending">Pending</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase font-bold mb-1">Physical Progress (%)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    max="100"
                    value={editProgress}
                    onChange={e => setEditProgress(Number(e.target.value))}
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-[10px] font-mono text-slate-400 uppercase font-bold mb-1">Site Location HQ</label>
                  <input
                    type="text"
                    value={editLocation}
                    onChange={e => setEditLocation(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-[10px] font-mono text-slate-400 uppercase font-bold mb-1">Site Project Manager</label>
                  <input
                    type="text"
                    value={editManager}
                    onChange={e => setEditManager(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-[10px] font-mono text-slate-400 uppercase font-bold mb-1">Scope Summary Overview</label>
                  <textarea
                    value={editDesc}
                    onChange={e => setEditDesc(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 h-20 resize-none"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 border-t border-slate-100 pt-4">
                <button 
                  type="button" 
                  onClick={() => setEditingProject(null)}
                  className="text-xs text-slate-500 font-bold px-4 py-2 cursor-pointer hover:bg-slate-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl text-xs font-bold transition cursor-pointer shadow-md shadow-indigo-600/10 active-scale"
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
