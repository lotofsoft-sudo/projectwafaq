/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  AlertTriangle, 
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
  Flag,
  User as UserIcon,
  Clock,
  Activity,
  PlusCircle,
  FileText,
  Shield,
  HelpCircle
} from 'lucide-react';
import { Project, Milestone, Issue, User, Comment } from '../types';

interface ProjectSiteIssuesViewProps {
  projects: Project[];
  milestones: Milestone[];
  issues: Issue[];
  setIssues: React.Dispatch<React.SetStateAction<Issue[]>>;
  currentUser: User;
  availableUsers: User[];
  onLogAudit: (action: string, module: string, oldValue?: string, newValue?: string) => void;
  onAddNotification: (text: string, type: 'info' | 'success' | 'warning' | 'alert') => void;
}

export default function ProjectSiteIssuesView({
  projects,
  milestones,
  issues,
  setIssues,
  currentUser,
  availableUsers,
  onLogAudit,
  onAddNotification,
}: ProjectSiteIssuesViewProps) {
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [projectSearchQuery, setProjectSearchQuery] = useState('');
  const [issueSearchQuery, setIssueSearchQuery] = useState('');
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);

  // Filters state
  const [filterMilestoneId, setFilterMilestoneId] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');

  // Detail Modal & Action Form States
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingIssue, setEditingIssue] = useState<Issue | null>(null);

  // Form Fields
  const [issueTitle, setIssueTitle] = useState('');
  const [issueDescription, setIssueDescription] = useState('');
  const [issueMilestoneId, setIssueMilestoneId] = useState('');
  const [issueProjectId, setIssueProjectId] = useState('');
  const [issueType, setIssueType] = useState<'site' | 'technical' | 'client_request' | 'delay' | 'risk' | 'bug'>('site');
  const [issuePriority, setIssuePriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [issueSeverity, setIssueSeverity] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [issueStatus, setIssueStatus] = useState<'open' | 'in_progress' | 'resolved' | 'closed'>('open');
  const [issueAssigneeId, setIssueAssigneeId] = useState('');
  const [issueResolution, setIssueResolution] = useState('');

  // Updates adding in modal
  const [newUpdateText, setNewUpdateText] = useState('');

  // Comment adding in modal
  const [newCommentText, setNewCommentText] = useState('');

  // Attachments adding in modal
  const [newFileName, setNewFileName] = useState('');
  const [newFileSize, setNewFileSize] = useState('');

  // Authorization helper
  const canManageIssues = useMemo(() => {
    return currentUser.role === 'General Manager' || 
           currentUser.role === 'Project Manager' || 
           currentUser.role === 'Admin' || 
           currentUser.role === 'Super Admin' ||
           currentUser.role === 'Site Engineer';
  }, [currentUser]);

  // Selected issue resolution from computed state to avoid bad setState during render
  const selectedIssueForDetails = useMemo(() => {
    return issues.find(i => i.id === selectedIssueId) || null;
  }, [issues, selectedIssueId]);

  // Project list filtering
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

  // Dynamic filter lists for current selection
  const relevantMilestones = useMemo(() => {
    if (selectedProjectId === 'all') return milestones;
    return milestones.filter(m => m.projectId === selectedProjectId);
  }, [milestones, selectedProjectId]);

  // Main issue list retrieval
  const selectedIssues = useMemo(() => {
    let list = issues;
    if (selectedProjectId !== 'all') {
      list = list.filter(i => i.projectId === selectedProjectId);
    }
    if (filterMilestoneId !== 'all') {
      list = list.filter(i => i.milestoneId === filterMilestoneId);
    }
    if (filterType !== 'all') {
      list = list.filter(i => i.type === filterType);
    }
    if (filterStatus !== 'all') {
      list = list.filter(i => i.status === filterStatus);
    }
    if (filterPriority !== 'all') {
      list = list.filter(i => i.priority === filterPriority);
    }
    if (filterSeverity !== 'all') {
      list = list.filter(i => i.severity === filterSeverity);
    }
    if (issueSearchQuery.trim()) {
      const q = issueSearchQuery.toLowerCase();
      list = list.filter(i => 
        i.title.toLowerCase().includes(q) || 
        (i.description && i.description.toLowerCase().includes(q)) ||
        i.assigneeName.toLowerCase().includes(q)
      );
    }
    return list;
  }, [issues, selectedProjectId, filterMilestoneId, filterType, filterStatus, filterPriority, filterSeverity, issueSearchQuery]);

  // KPI calculations
  const kpiStats = useMemo(() => {
    const total = selectedIssues.length;
    const open = selectedIssues.filter(i => i.status === 'open').length;
    const inProgress = selectedIssues.filter(i => i.status === 'in_progress').length;
    const resolved = selectedIssues.filter(i => i.status === 'resolved' || i.status === 'closed').length;
    const critical = selectedIssues.filter(i => i.severity === 'critical' && i.status !== 'resolved' && i.status !== 'closed').length;

    return {
      total,
      open,
      inProgress,
      resolved,
      critical
    };
  }, [selectedIssues]);

  // Project / Milestone lookup helpers
  const getProjectInfo = (pId: string) => {
    return projects.find(p => p.id === pId) || { name: 'Unknown Project', code: 'PROJ-XXX' };
  };

  const getMilestoneInfo = (mId?: string) => {
    if (!mId) return { name: 'Direct Project Scope / General' };
    return milestones.find(m => m.id === mId) || { name: 'Direct Project Scope / General' };
  };

  // Form Initializers
  const handleOpenAdd = () => {
    if (!canManageIssues) {
      onAddNotification('Unauthorized: Your role does not allow logging site issues.', 'alert');
      return;
    }
    setEditingIssue(null);
    setIssueTitle('');
    setIssueDescription('');
    setIssueProjectId(selectedProjectId === 'all' ? (projects[0]?.id || '') : selectedProjectId);
    
    // Default to first milestone of project
    const projMilestones = selectedProjectId === 'all' 
      ? milestones 
      : milestones.filter(m => m.projectId === selectedProjectId);
    setIssueMilestoneId(projMilestones[0]?.id || '');

    setIssueType('site');
    setIssuePriority('medium');
    setIssueSeverity('medium');
    setIssueStatus('open');
    setIssueAssigneeId(currentUser.id);
    setIssueResolution('');
    setIsFormOpen(true);
  };

  const handleOpenEdit = (issue: Issue, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid triggering details modal
    if (!canManageIssues) {
      onAddNotification('Unauthorized: Your role does not allow editing site issues.', 'alert');
      return;
    }
    setEditingIssue(issue);
    setIssueTitle(issue.title);
    setIssueDescription(issue.description || '');
    setIssueProjectId(issue.projectId);
    setIssueMilestoneId(issue.milestoneId || '');
    setIssueType(issue.type);
    setIssuePriority(issue.priority);
    setIssueSeverity(issue.severity);
    setIssueStatus(issue.status);
    setIssueAssigneeId(issue.assigneeId);
    setIssueResolution(issue.resolution || '');
    setIsFormOpen(true);
  };

  const handleSaveIssue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageIssues) {
      onAddNotification('Unauthorized: Your role does not allow editing issues.', 'alert');
      return;
    }

    if (!issueTitle.trim()) {
      onAddNotification('Please specify a valid issue title.', 'warning');
      return;
    }

    const assigneeObj = availableUsers.find(u => u.id === issueAssigneeId) || currentUser;

    if (editingIssue) {
      // Modify existing
      setIssues(prev => prev.map(item => {
        if (item.id === editingIssue.id) {
          const statusChanged = item.status !== issueStatus;
          const nextUpdates = [...(item.updates || [])];
          if (statusChanged) {
            nextUpdates.push({
              id: `up_${Date.now()}`,
              user: currentUser.name,
              role: currentUser.role,
              text: `Status transitioned from "${item.status}" to "${issueStatus}".`,
              date: new Date().toISOString().replace('T', ' ').substring(0, 16)
            });
          }

          return {
            ...item,
            title: issueTitle.trim(),
            description: issueDescription.trim() || undefined,
            projectId: issueProjectId,
            milestoneId: issueMilestoneId || undefined,
            type: issueType,
            priority: issuePriority,
            severity: issueSeverity,
            status: issueStatus,
            assigneeId: issueAssigneeId,
            assigneeName: assigneeObj.name,
            resolution: issueResolution.trim() || undefined,
            updates: nextUpdates
          };
        }
        return item;
      }));

      onLogAudit(`Updated site issue "${editingIssue.title}"`, 'Site Issues', editingIssue.title, issueTitle);
      onAddNotification(`Issue "${issueTitle}" updated successfully.`, 'success');
    } else {
      // Insert new
      const newIssue: Issue = {
        id: `i_${Date.now()}`,
        projectId: issueProjectId,
        milestoneId: issueMilestoneId || undefined,
        title: issueTitle.trim(),
        description: issueDescription.trim() || undefined,
        type: issueType,
        priority: issuePriority,
        severity: issueSeverity,
        status: issueStatus,
        assigneeId: issueAssigneeId,
        assigneeName: assigneeObj.name,
        dateCreated: new Date().toISOString().slice(0, 10),
        comments: [],
        attachments: [],
        resolution: issueResolution.trim() || undefined,
        updates: [
          {
            id: `up_${Date.now()}`,
            user: currentUser.name,
            role: currentUser.role,
            text: `Logged new site issue: "${issueTitle.trim()}"`,
            date: new Date().toISOString().replace('T', ' ').substring(0, 16)
          }
        ]
      };

      setIssues(prev => [...prev, newIssue]);
      onLogAudit(`Created site issue "${newIssue.title}"`, 'Site Issues', undefined, newIssue.title);
      onAddNotification(`Site Issue "${newIssue.title}" logged successfully.`, 'success');
    }

    setIsFormOpen(false);
    setEditingIssue(null);
  };

  const handleDeleteIssue = (issue: Issue, e: React.MouseEvent) => {
    const userRoleStr = currentUser?.role?.toLowerCase() || '';
    if (userRoleStr !== 'admin' && userRoleStr !== 'super admin' && userRoleStr !== 'superadmin') {
      alert("Unauthorized: Only Admin or Super Admin can delete records.");
      return;
    }

    e.stopPropagation();
    if (!canManageIssues) {
      onAddNotification('Unauthorized: Your role does not allow deleting issues.', 'alert');
      return;
    }

    if (window.confirm(`Are you sure you want to permanently delete issue "${issue.title}"?`)) {
      setIssues(prev => prev.filter(item => item.id !== issue.id));
      if (selectedIssueId === issue.id) {
        setSelectedIssueId(null);
      }
      onLogAudit(`Deleted site issue "${issue.title}"`, 'Site Issues', issue.title, undefined);
      onAddNotification(`Issue "${issue.title}" deleted successfully.`, 'success');
    }
  };

  // Timeline / Resolution Updates Actions
  const handleAddUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIssueId || !newUpdateText.trim()) return;

    const nextUpdate = {
      id: `up_${Date.now()}`,
      user: currentUser.name,
      role: currentUser.role,
      text: newUpdateText.trim(),
      date: new Date().toISOString().replace('T', ' ').substring(0, 16)
    };

    setIssues(prev => prev.map(i => {
      if (i.id === selectedIssueId) {
        const nextUpdates = [...(i.updates || []), nextUpdate];
        return { ...i, updates: nextUpdates };
      }
      return i;
    }));

    setNewUpdateText('');
    onAddNotification('Progress update posted successfully.', 'success');
  };

  // Comment Actions within selectedIssue workspace
  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIssueId || !newCommentText.trim()) return;

    const nextComment: Comment = {
      id: `ic_${Date.now()}`,
      user: currentUser.name,
      role: currentUser.role,
      text: newCommentText.trim(),
      date: new Date().toISOString().replace('T', ' ').substring(0, 16)
    };

    setIssues(prev => prev.map(i => {
      if (i.id === selectedIssueId) {
        const nextComments = [...i.comments, nextComment];
        return { ...i, comments: nextComments };
      }
      return i;
    }));

    setNewCommentText('');
  };

  // Attachment Support within selectedIssue workspace
  const handleAddAttachment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIssueId || !newFileName.trim()) return;

    const nextAttachment = {
      name: newFileName.trim(),
      size: newFileSize.trim() || '2.4 MB',
      uploadedAt: new Date().toISOString().slice(0, 10)
    };

    setIssues(prev => prev.map(i => {
      if (i.id === selectedIssueId) {
        const nextAttachments = [...(i.attachments || []), nextAttachment];
        return { ...i, attachments: nextAttachments };
      }
      return i;
    }));

    setNewFileName('');
    setNewFileSize('');
    onAddNotification(`Attached file "${nextAttachment.name}" successfully.`, 'success');
  };

  // Type styling helper
  const getTypeStyle = (type: Issue['type']) => {
    switch (type) {
      case 'site': return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'technical': return 'bg-indigo-50 text-indigo-700 border-indigo-100';
      case 'client_request': return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'delay': return 'bg-rose-50 text-rose-700 border-rose-100';
      case 'risk': return 'bg-purple-50 text-purple-700 border-purple-100';
      case 'bug': return 'bg-slate-50 text-slate-700 border-slate-100';
    }
  };

  // Priority color formatting helper
  const getPriorityStyle = (priority: 'low' | 'medium' | 'high') => {
    switch (priority) {
      case 'high': return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'medium': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'low': return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  // Severity color formatting helper
  const getSeverityStyle = (severity: 'low' | 'medium' | 'high' | 'critical') => {
    switch (severity) {
      case 'critical': return 'bg-red-600 text-white border-transparent shadow-xs animate-pulse';
      case 'high': return 'bg-red-50 text-red-700 border-red-200';
      case 'medium': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'low': return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  // Status visual label helper
  const getStatusLabel = (status: Issue['status']) => {
    switch (status) {
      case 'open': return { label: 'Open / Unresolved', style: 'bg-red-50 text-red-700 border border-red-100' };
      case 'in_progress': return { label: 'In Progress', style: 'bg-blue-50 text-blue-700 border border-blue-100' };
      case 'resolved': return { label: 'Resolved', style: 'bg-emerald-50 text-emerald-700 border border-emerald-100' };
      case 'closed': return { label: 'Closed / Final', style: 'bg-slate-100 text-slate-700' };
    }
  };

  return (
    <div id="site-issues-view-root" className="flex-1 flex flex-col h-full bg-slate-50 overflow-hidden">
      
      {/* Top Banner Context Section */}
      <div className="bg-white border-b border-slate-200 p-5 md:px-8 flex flex-col md:flex-row md:items-center md:justify-between shrink-0 gap-4">
        <div>
          <span className="text-xs font-mono font-bold text-indigo-600 uppercase tracking-widest block mb-1">Quality & Site Risk Management</span>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Active Site Issues & Technical Blockers</h2>
          <p className="text-xs text-slate-500 mt-1">Log construction delays, design/structural conflicts, client deviations, and technical blockers to orchestrate fast countermeasures.</p>
        </div>
      </div>

      {/* Main Split Screen Area */}
      <div className="flex-1 flex overflow-hidden min-h-0 w-full">
      
        {/* 1. LEFT PANEL: Project Selection List */}
        <div 
          id="issues-project-sidebar" 
          className={`w-72 border-r border-slate-200 bg-white flex flex-col h-full shrink-0 transition-transform lg:translate-x-0 lg:relative lg:pointer-events-auto lg:z-10 ${
            mobileDetailOpen ? '-translate-x-full absolute pointer-events-none' : 'relative z-10'
          }`}
        >
          <div className="p-4 border-b border-slate-100 bg-slate-50/60">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-widest font-mono">Projects Directory</h2>
            <p className="text-[10px] text-slate-400 mt-1">Select a project to filter issues</p>
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
                <h4 className="text-xs font-bold text-slate-800">All Project Issues</h4>
                <p className="text-[10px] text-slate-400 mt-0.5">Global operational overview</p>
              </div>
            </button>

            {filteredProjects.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs italic">No projects found.</div>
            ) : (
              filteredProjects.map(p => {
                const isActive = selectedProjectId === p.id;
                const projectIssuesCount = issues.filter(i => i.projectId === p.id).length;
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
                        {projectIssuesCount} Issues
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

        {/* 2. RIGHT PANEL: Issues workspace viewport */}
        <div 
          id="issues-data-viewport" 
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
              <div className="bg-rose-50 p-2 rounded-xl text-rose-600 border border-rose-100 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="overflow-hidden">
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-mono font-extrabold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded uppercase">
                    {activeProject ? activeProject.code : 'GLOBAL'}
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 truncate">
                    {activeProject ? `${activeProject.name} - Site Issues` : 'Central Corporate Issue Control'}
                  </h3>
                </div>
                <p className="text-[10px] text-slate-400 truncate mt-0.5">
                  {activeProject 
                    ? `Identify risk factors, trace technical drawings, upload photos, and coordinate resolution updates for ${activeProject.name}.`
                    : 'Systemwide overview of critical project blockages, severe site errors, and consultant resolution schedules.'
                  }
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              {canManageIssues && (
                <button
                  onClick={handleOpenAdd}
                  className="inline-flex items-center justify-center space-x-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Report Site Issue</span>
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
                  placeholder="Search issues by title, details..."
                  value={issueSearchQuery}
                  onChange={e => setIssueSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                />
              </div>

              {/* Filtering Controls */}
              <div className="flex flex-wrap gap-2 items-center text-xs">
                {/* Milestone Filter */}
                <div className="flex items-center space-x-1">
                  <span className="text-slate-400 font-mono text-[10px]">Milestone:</span>
                  <select
                    value={filterMilestoneId}
                    onChange={e => setFilterMilestoneId(e.target.value)}
                    className="border border-slate-200 rounded-lg bg-white p-1 text-[11px] focus:ring-1 focus:ring-indigo-500 outline-none max-w-[120px]"
                  >
                    <option value="all">All Milestones</option>
                    {relevantMilestones.map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>

                {/* Status Filter */}
                <div className="flex items-center space-x-1">
                  <span className="text-slate-400 font-mono text-[10px]">Status:</span>
                  <select
                    value={filterStatus}
                    onChange={e => setFilterStatus(e.target.value)}
                    className="border border-slate-200 rounded-lg bg-white p-1 text-[11px] focus:ring-1 focus:ring-indigo-500 outline-none"
                  >
                    <option value="all">All Statuses</option>
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>

                {/* Priority Filter */}
                <div className="flex items-center space-x-1">
                  <span className="text-slate-400 font-mono text-[10px]">Priority:</span>
                  <select
                    value={filterPriority}
                    onChange={e => setFilterPriority(e.target.value)}
                    className="border border-slate-200 rounded-lg bg-white p-1 text-[11px] focus:ring-1 focus:ring-indigo-500 outline-none"
                  >
                    <option value="all">All Priorities</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>

                {/* Severity Filter */}
                <div className="flex items-center space-x-1">
                  <span className="text-slate-400 font-mono text-[10px]">Severity:</span>
                  <select
                    value={filterSeverity}
                    onChange={e => setFilterSeverity(e.target.value)}
                    className="border border-slate-200 rounded-lg bg-white p-1 text-[11px] focus:ring-1 focus:ring-indigo-500 outline-none"
                  >
                    <option value="all">All Severities</option>
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>

                {/* Type Filter */}
                <div className="flex items-center space-x-1">
                  <span className="text-slate-400 font-mono text-[10px]">Type:</span>
                  <select
                    value={filterType}
                    onChange={e => setFilterType(e.target.value)}
                    className="border border-slate-200 rounded-lg bg-white p-1 text-[11px] focus:ring-1 focus:ring-indigo-500 outline-none"
                  >
                    <option value="all">All Types</option>
                    <option value="site">Site/Execution</option>
                    <option value="technical">Technical Drawing</option>
                    <option value="client_request">Client Request</option>
                    <option value="delay">Supply Delay</option>
                    <option value="risk">Safety Risk</option>
                    <option value="bug">System Issue</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Core management workspace content */}
          <div className="p-6 bg-slate-50 flex-1 overflow-y-auto space-y-6">

            {/* KPI Dashboard Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase font-bold tracking-wider">Total Project Issues</span>
                  <h4 className="text-lg font-extrabold text-slate-800 mt-1">{kpiStats.total} Issues</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">In selected directory</p>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl text-slate-600">
                  <AlertTriangle className="w-5 h-5 text-indigo-600" />
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase font-bold tracking-wider">Active Open</span>
                  <h4 className="text-lg font-extrabold text-rose-600 mt-1">{kpiStats.open} Open</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Unassigned or fresh
                  </p>
                </div>
                <div className="bg-rose-50 p-2.5 rounded-xl text-rose-600">
                  <Clock className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase font-bold tracking-wider">Mitigations Active</span>
                  <h4 className="text-lg font-extrabold text-blue-600 mt-1">{kpiStats.inProgress} In-Progress</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Engineers investigating</p>
                </div>
                <div className="bg-blue-50 p-2.5 rounded-xl text-blue-600">
                  <Activity className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase font-bold tracking-wider">Critical Escalations</span>
                  <h4 className="text-lg font-extrabold text-red-600 mt-1">{kpiStats.critical} Critical</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">High severity alert level</p>
                </div>
                <div className="bg-red-50 p-2.5 rounded-xl text-red-600">
                  <Shield className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Creation / Edit Form block */}
            {isFormOpen && (
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
                  <h4 className="text-xs font-extrabold text-slate-800 uppercase font-mono tracking-wider flex items-center space-x-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <span>{editingIssue ? 'Modify Site Issue' : 'Log New Project Site Issue'}</span>
                  </h4>
                  <button 
                    type="button" 
                    onClick={() => {
                      setIsFormOpen(false);
                      setEditingIssue(null);
                    }} 
                    className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-50 transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleSaveIssue} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Project Selector (if Global view) */}
                    {selectedProjectId === 'all' && !editingIssue && (
                      <div>
                        <label className="block text-[10px] font-mono text-slate-400 uppercase font-bold">Target Project</label>
                        <select
                          required
                          value={issueProjectId}
                          onChange={e => {
                            setIssueProjectId(e.target.value);
                            // Auto select first milestone of new project
                            const pMilestones = milestones.filter(m => m.projectId === e.target.value);
                            setIssueMilestoneId(pMilestones[0]?.id || '');
                          }}
                          className="w-full border border-slate-200 rounded-lg p-2 text-xs mt-1 bg-white focus:ring-1 focus:ring-indigo-500 outline-none font-medium text-slate-700"
                        >
                          {projects.map(p => (
                            <option key={p.id} value={p.id}>[{p.code}] {p.name}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Milestone Selector */}
                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 uppercase font-bold">Target Milestone Stage</label>
                      <select
                        value={issueMilestoneId}
                        onChange={e => setIssueMilestoneId(e.target.value)}
                        className="w-full border border-slate-200 rounded-lg p-2 text-xs mt-1 bg-white focus:ring-1 focus:ring-indigo-500 outline-none font-medium text-slate-700"
                      >
                        <option value="">General Project Scope / Not Linked</option>
                        {milestones
                          .filter(m => m.projectId === (issueProjectId || selectedProjectId))
                          .map(m => (
                            <option key={m.id} value={m.id}>{m.name} ({m.weight}%)</option>
                          ))
                        }
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-mono text-slate-400 uppercase font-bold">Issue Title / Incident Name</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Ground water leakage at block A, Subcontractor delay..."
                        value={issueTitle}
                        onChange={e => setIssueTitle(e.target.value)}
                        className="w-full border border-slate-200 rounded-lg p-2 text-xs mt-1 focus:ring-1 focus:ring-indigo-500 outline-none font-medium text-slate-700"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 uppercase font-bold">Issue Category Type</label>
                      <select
                        value={issueType}
                        onChange={e => setIssueType(e.target.value as any)}
                        className="w-full border border-slate-200 rounded-lg p-2 text-xs mt-1 bg-white focus:ring-1 focus:ring-indigo-500 outline-none font-medium text-slate-700"
                      >
                        <option value="site">Site/Execution</option>
                        <option value="technical">Technical Drawing</option>
                        <option value="client_request">Client Request</option>
                        <option value="delay">Supply Delay</option>
                        <option value="risk">Safety Risk</option>
                        <option value="bug">System Issue</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 uppercase font-bold">Priority Baseline</label>
                      <select
                        value={issuePriority}
                        onChange={e => setIssuePriority(e.target.value as any)}
                        className="w-full border border-slate-200 rounded-lg p-2 text-xs mt-1 bg-white focus:ring-1 focus:ring-indigo-500 outline-none font-medium text-slate-700"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 uppercase font-bold">Severity Level</label>
                      <select
                        value={issueSeverity}
                        onChange={e => setIssueSeverity(e.target.value as any)}
                        className="w-full border border-slate-200 rounded-lg p-2 text-xs mt-1 bg-white focus:ring-1 focus:ring-indigo-500 outline-none font-medium text-slate-700"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="critical">Critical</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 uppercase font-bold">Mitigation Status</label>
                      <select
                        value={issueStatus}
                        onChange={e => setIssueStatus(e.target.value as any)}
                        className="w-full border border-slate-200 rounded-lg p-2 text-xs mt-1 bg-white focus:ring-1 focus:ring-indigo-500 outline-none font-medium text-slate-700"
                      >
                        <option value="open">Open</option>
                        <option value="in_progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed / Finalized</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 uppercase font-bold">Lead Owner Investigator</label>
                      <select
                        value={issueAssigneeId}
                        onChange={e => setIssueAssigneeId(e.target.value)}
                        className="w-full border border-slate-200 rounded-lg p-2 text-xs mt-1 bg-white focus:ring-1 focus:ring-indigo-500 outline-none font-medium text-slate-700"
                      >
                        {availableUsers.map(u => (
                          <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                        ))}
                      </select>
                    </div>

                    <div className="md:col-span-3">
                      <label className="block text-[10px] font-mono text-slate-400 uppercase font-bold">Detailed Incident Description & Impacts</label>
                      <textarea
                        required
                        placeholder="Provide details on geological parameters, concrete delivery numbers, structural measurements, safety codes affected..."
                        value={issueDescription}
                        onChange={e => setIssueDescription(e.target.value)}
                        rows={3}
                        className="w-full border border-slate-200 rounded-lg p-2 text-xs mt-1 focus:ring-1 focus:ring-indigo-500 outline-none font-medium text-slate-700 bg-white"
                      />
                    </div>

                    <div className="md:col-span-3">
                      <label className="block text-[10px] font-mono text-slate-400 uppercase font-bold">Resolution Countersign Details (If Resolved)</label>
                      <textarea
                        placeholder="Detail exact remediation actions, waterproofing chemical code used, engineer sign-off numbers..."
                        value={issueResolution}
                        onChange={e => setIssueResolution(e.target.value)}
                        rows={2}
                        className="w-full border border-slate-200 rounded-lg p-2 text-xs mt-1 focus:ring-1 focus:ring-indigo-500 outline-none font-medium text-slate-700 bg-white"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                    <button 
                      type="button" 
                      onClick={() => {
                        setIsFormOpen(false);
                        setEditingIssue(null);
                      }} 
                      className="text-xs text-slate-500 font-bold px-3.5 py-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1.5 rounded-lg text-xs font-bold transition shadow-xs cursor-pointer"
                    >
                      {editingIssue ? 'Save Issue Modifications' : 'Log Active Site Issue'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Issues Card Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {selectedIssues.map((issue) => {
                const proj = getProjectInfo(issue.projectId);
                const milestone = getMilestoneInfo(issue.milestoneId);
                const statusInfo = getStatusLabel(issue.status);
                const typeClass = getTypeStyle(issue.type);
                const priorityClass = getPriorityStyle(issue.priority);
                const severityClass = getSeverityStyle(issue.severity);
                
                return (
                  <div 
                    key={issue.id} 
                    onClick={() => setSelectedIssueId(issue.id)}
                    className="bg-white p-5 rounded-2xl border border-slate-200/85 shadow-xs hover:shadow-md hover:border-indigo-200 transition-all duration-200 flex flex-col justify-between group relative cursor-pointer"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1 max-w-[65%]">
                          <span className="inline-block text-[8px] font-mono font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded uppercase">
                            {proj.code}
                          </span>
                          <span className="ml-1 inline-block text-[8px] font-mono text-slate-400 truncate max-w-[80px]">
                            {milestone.name}
                          </span>
                          <h4 className="font-extrabold text-xs text-slate-800 line-clamp-2 group-hover:text-indigo-600 transition-colors">
                            {issue.title}
                          </h4>
                        </div>

                        <div className="flex flex-col items-end space-y-1 shrink-0">
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-mono font-extrabold uppercase border ${statusInfo.style}`}>
                            {statusInfo.label}
                          </span>
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-mono font-bold uppercase border ${typeClass}`}>
                            {issue.type.replace('_', ' ')}
                          </span>
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-mono font-bold uppercase border ${priorityClass}`}>
                            Pri: {issue.priority}
                          </span>
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-mono font-extrabold uppercase border ${severityClass}`}>
                            Sev: {issue.severity}
                          </span>
                        </div>
                      </div>

                      <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed">
                        {issue.description || 'No further description details reported on site log.'}
                      </p>
                    </div>

                    <div className="space-y-3 pt-3 border-t border-slate-50 mt-4">
                      <div className="flex justify-between items-center text-[10px] font-mono">
                        <span className="text-slate-500 font-semibold flex items-center space-x-1">
                          <UserIcon className="w-3 h-3 text-slate-400" />
                          <span>{issue.assigneeName}</span>
                        </span>
                        <span className="text-slate-400">Created {issue.dateCreated}</span>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                        <div className="flex items-center space-x-2.5">
                          {issue.comments && issue.comments.length > 0 && (
                            <span className="flex items-center space-x-1 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                              <MessageSquare className="w-3.5 h-3.5 text-indigo-500" />
                              <span className="font-mono font-bold text-slate-700">{issue.comments.length}</span>
                            </span>
                          )}
                          {issue.attachments && issue.attachments.length > 0 && (
                            <span className="flex items-center space-x-1">
                              <Paperclip className="w-3.5 h-3.5" />
                              <span>{issue.attachments.length} files</span>
                            </span>
                          )}
                          {issue.updates && issue.updates.length > 0 && (
                            <span className="flex items-center space-x-1">
                              <Activity className="w-3.5 h-3.5 text-blue-500" />
                              <span>{issue.updates.length} updates</span>
                            </span>
                          )}
                        </div>
                        {issue.resolution && (
                          <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                            Has Resolution
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions footer (visible on hover) */}
                    {canManageIssues && (
                      <div className="flex items-center justify-end space-x-1.5 pt-2 border-t border-slate-50 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => handleOpenEdit(issue, e)}
                          className="p-1 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 rounded transition"
                          title="Edit Issue properties"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => handleDeleteIssue(issue, e)}
                          className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded transition"
                          title="Delete issue"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}

              {selectedIssues.length === 0 && (
                <div className="bg-white p-10 border border-dashed border-slate-200 text-center text-slate-400 italic text-xs col-span-full rounded-2xl flex flex-col items-center justify-center space-y-2">
                  <AlertTriangle className="w-8 h-8 text-slate-300" />
                  <span>No site issues logged matching current selections or directory filters.</span>
                  {canManageIssues && (
                    <button 
                      onClick={handleOpenAdd}
                      className="mt-2 text-indigo-600 font-bold text-xs hover:underline cursor-pointer"
                    >
                      Log a site incident or contractor issue now
                    </button>
                  )}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* 4. DETAIL & INTERACTIVE WORKSPACE MODAL */}
      {selectedIssueForDetails && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl shadow-xl flex flex-col max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-2.5">
                <div className="bg-rose-50 p-2 rounded-xl text-rose-600 border border-rose-100">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[9px] font-mono font-extrabold text-indigo-600 bg-indigo-100 px-1.5 py-0.5 rounded uppercase">
                      {getProjectInfo(selectedIssueForDetails.projectId).code}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Milestone Scope: {getMilestoneInfo(selectedIssueForDetails.milestoneId).name}
                    </span>
                  </div>
                  <h3 className="text-sm font-extrabold text-slate-900 mt-1">{selectedIssueForDetails.title}</h3>
                </div>
              </div>
              <button
                onClick={() => setSelectedIssueId(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-100 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content - Divided into two main panels */}
            <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 min-h-0">
              
              {/* Left Column: Properties, Description, Updates Timeline */}
              <div className="lg:col-span-7 p-6 space-y-6 overflow-y-auto h-full">
                
                {/* Description block */}
                <div className="space-y-2">
                  <h4 className="text-[11px] font-mono text-slate-400 uppercase font-bold tracking-wider">Site Description & Hazard Impact</h4>
                  <div className="bg-slate-50 p-4 rounded-xl text-xs text-slate-700 leading-relaxed border border-slate-100">
                    {selectedIssueForDetails.description || 'No direct hazards described on the site incident report.'}
                  </div>
                </div>

                {/* Resolution block */}
                <div className="space-y-2 pt-1">
                  <h4 className="text-[11px] font-mono text-emerald-600 uppercase font-bold tracking-wider flex items-center space-x-1">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Mitigation Resolution & Sign-Off</span>
                  </h4>
                  <div className="bg-emerald-50/50 p-4 rounded-xl text-xs text-slate-700 leading-relaxed border border-emerald-100/50">
                    {selectedIssueForDetails.resolution || (
                      <span className="text-slate-400 italic">No formal resolution signed off yet by the Site Engineer or Project Manager.</span>
                    )}
                  </div>
                </div>

                {/* Updates Timeline workspace */}
                <div className="space-y-3 pt-2">
                  <h4 className="text-[11px] font-mono text-slate-400 uppercase font-bold tracking-wider flex items-center space-x-1.5">
                    <Activity className="w-3.5 h-3.5 text-blue-500" />
                    <span>Resolution Progress Updates</span>
                  </h4>

                  {/* Updates Timeline List */}
                  <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                    {selectedIssueForDetails.updates?.map(up => (
                      <div 
                        key={up.id} 
                        className="p-3 rounded-lg border border-slate-100 bg-white shadow-2xs text-xs space-y-1.5 relative"
                      >
                        <div className="flex justify-between items-center text-[10px] font-mono text-slate-400">
                          <span className="font-bold text-slate-700">{up.user} ({up.role})</span>
                          <span>{up.date}</span>
                        </div>
                        <p className="text-slate-600 font-medium text-xs">{up.text}</p>
                      </div>
                    ))}

                    {(!selectedIssueForDetails.updates || selectedIssueForDetails.updates.length === 0) && (
                      <p className="text-[11px] text-slate-400 italic">No progress timeline updates established yet.</p>
                    )}
                  </div>

                  {/* Add Update form */}
                  {canManageIssues && (
                    <form onSubmit={handleAddUpdate} className="flex gap-2 pt-1">
                      <input
                        type="text"
                        required
                        placeholder="Post formal technical update or mitigation progress..."
                        value={newUpdateText}
                        onChange={e => setNewUpdateText(e.target.value)}
                        className="flex-1 border border-slate-200 rounded-lg p-1.5 text-xs focus:ring-1 focus:ring-indigo-500 outline-none font-medium text-slate-700"
                      />
                      <button
                        type="submit"
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer shrink-0"
                      >
                        Update Progress
                      </button>
                    </form>
                  )}
                </div>
              </div>

              {/* Right Column: Interactive Comments & File uploads */}
              <div className="lg:col-span-5 p-6 space-y-6 bg-slate-50/50 overflow-y-auto h-full">
                
                {/* Properties Overview */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3 text-xs">
                  <h4 className="text-[11px] font-mono text-slate-400 uppercase font-bold tracking-wider border-b border-slate-100 pb-1.5">Issue Properties</h4>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="block text-[9px] text-slate-400 font-mono">LEAD INVESTIGATOR</span>
                      <span className="font-bold text-slate-800">{selectedIssueForDetails.assigneeName}</span>
                    </div>
                    <div>
                      <span className="block text-[9px] text-slate-400 font-mono">INCIDENT TYPE</span>
                      <span className="font-bold text-slate-800 uppercase text-[10px]">{selectedIssueForDetails.type}</span>
                    </div>
                    <div>
                      <span className="block text-[9px] text-slate-400 font-mono">PRIORITY LEVEL</span>
                      <span className="font-bold text-slate-800 uppercase text-[10px]">{selectedIssueForDetails.priority}</span>
                    </div>
                    <div>
                      <span className="block text-[9px] text-slate-400 font-mono">SEVERITY LEVEL</span>
                      <span className="font-bold text-rose-600 uppercase text-[10px]">{selectedIssueForDetails.severity}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="block text-[9px] text-slate-400 font-mono">DATE REPORTED</span>
                      <span className="font-medium text-slate-700 font-mono">{selectedIssueForDetails.dateCreated}</span>
                    </div>
                  </div>
                </div>

                {/* File attachments widget */}
                <div className="space-y-3">
                  <h4 className="text-[11px] font-mono text-slate-400 uppercase font-bold tracking-wider">Photo Logs & Material Reports</h4>
                  
                  {/* Attachments List */}
                  <div className="space-y-1.5 max-h-32 overflow-y-auto">
                    {selectedIssueForDetails.attachments?.map((f, index) => (
                      <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200 text-xs">
                        <div className="flex items-center space-x-2 truncate">
                          <Paperclip className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                          <span className="font-medium text-slate-700 truncate">{f.name}</span>
                          <span className="text-[9px] text-slate-400 font-mono">({f.size})</span>
                        </div>
                        <a 
                          href="#" 
                          onClick={e => e.preventDefault()} 
                          className="text-[10px] text-indigo-600 hover:underline font-bold"
                        >
                          View File
                        </a>
                      </div>
                    ))}

                    {(!selectedIssueForDetails.attachments || selectedIssueForDetails.attachments.length === 0) && (
                      <p className="text-[11px] text-slate-400 italic">No incident photos or laboratory reports attached.</p>
                    )}
                  </div>

                  {/* Attachment Addition Panel */}
                  <form onSubmit={handleAddAttachment} className="bg-white p-3 rounded-xl border border-slate-200 space-y-2.5">
                    <span className="block text-[9px] font-mono text-slate-400 uppercase font-bold">Attach Incident Photo / Geological Report</span>
                    <div className="grid grid-cols-2 gap-2">
                      <input 
                        type="text"
                        required
                        placeholder="leakage_sector3.jpg..."
                        value={newFileName}
                        onChange={e => setNewFileName(e.target.value)}
                        className="border border-slate-200 rounded-lg p-1 text-xs focus:ring-1 focus:ring-indigo-500 outline-none font-medium text-slate-700"
                      />
                      <input 
                        type="text"
                        placeholder="e.g. 2.1 MB"
                        value={newFileSize}
                        onChange={e => setNewFileSize(e.target.value)}
                        className="border border-slate-200 rounded-lg p-1 text-xs focus:ring-1 focus:ring-indigo-500 outline-none font-medium text-slate-700"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full bg-slate-50 hover:bg-rose-50 text-rose-600 border border-slate-200 hover:border-rose-200 font-bold text-xs py-1.5 rounded-lg transition"
                    >
                      Attach Photo / Document
                    </button>
                  </form>
                </div>

                {/* Live comments feed */}
                <div className="space-y-3 pt-3 border-t border-slate-200">
                  <h4 className="text-[11px] font-mono text-slate-400 uppercase font-bold tracking-wider">Incident Coordination Logs</h4>
                  
                  {/* Comments list */}
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {selectedIssueForDetails.comments?.map((comment) => (
                      <div key={comment.id} className="bg-white p-3 rounded-xl border border-slate-150 text-xs space-y-1">
                        <div className="flex justify-between text-[10px] font-mono">
                          <span className="font-extrabold text-slate-700">{comment.user} ({comment.role})</span>
                          <span className="text-slate-400">{comment.date}</span>
                        </div>
                        <p className="text-slate-600 leading-relaxed">{comment.text}</p>
                      </div>
                    ))}

                    {(!selectedIssueForDetails.comments || selectedIssueForDetails.comments.length === 0) && (
                      <p className="text-[11px] text-slate-400 italic">No coordination logs reported yet.</p>
                    )}
                  </div>

                  {/* Add Comment Form */}
                  <form onSubmit={handleAddComment} className="space-y-2">
                    <textarea
                      required
                      placeholder="Type brief incident note, request for supervisor site inspection..."
                      value={newCommentText}
                      onChange={e => setNewCommentText(e.target.value)}
                      rows={2}
                      className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-indigo-500 outline-none font-medium text-slate-700 bg-white"
                    />
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold transition shadow-xs cursor-pointer"
                      >
                        Submit Site Note
                      </button>
                    </div>
                  </form>
                </div>

              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
