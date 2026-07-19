/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  CheckSquare, 
  Search, 
  ChevronLeft,
  Briefcase,
  Plus,
  Edit2,
  Trash2,
  Printer,
  X,
  CheckCircle2,
  Calendar,
  Percent,
  MessageSquare,
  Paperclip,
  Flag,
  User as UserIcon,
  AlertTriangle,
  History,
  ListTodo,
  FilePlus2,
  Clock
} from 'lucide-react';
import { Project, Milestone, Task, User, Comment, ChecklistItem } from '../types';

interface ProjectTasksViewProps {
  projects: Project[];
  milestones: Milestone[];
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  currentUser: User;
  availableUsers: User[];
  onLogAudit: (action: string, module: string, oldValue?: string, newValue?: string) => void;
  onAddNotification: (text: string, type: 'info' | 'success' | 'warning' | 'alert') => void;
}

export default function ProjectTasksView({
  projects,
  milestones,
  tasks,
  setTasks,
  currentUser,
  availableUsers,
  onLogAudit,
  onAddNotification,
}: ProjectTasksViewProps) {
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [projectSearchQuery, setProjectSearchQuery] = useState('');
  const [taskSearchQuery, setTaskSearchQuery] = useState('');
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);

  // Filters state
  const [filterMilestoneId, setFilterMilestoneId] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');

  // Detail Modal & Action Form States
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const selectedTaskForDetails = useMemo(() => {
    return tasks.find(t => t.id === selectedTaskId) || null;
  }, [tasks, selectedTaskId]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Form Fields
  const [taskName, setTaskName] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskMilestoneId, setTaskMilestoneId] = useState('');
  const [taskProjectId, setTaskProjectId] = useState('');
  const [taskPriority, setTaskPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [taskStatus, setTaskStatus] = useState<'to_do' | 'in_progress' | 'review' | 'blocked' | 'on_hold' | 'completed' | 'rework'>('to_do');
  const [taskProgress, setTaskProgress] = useState<number | ''>('');
  const [taskAssigneeId, setTaskAssigneeId] = useState('');
  const [taskStartDate, setTaskStartDate] = useState('');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskWeight, setTaskWeight] = useState<number | ''>('');

  // Checklist adding in modal
  const [newChecklistText, setNewChecklistText] = useState('');

  // Comment adding in modal
  const [newCommentText, setNewCommentText] = useState('');

  // Attachments adding in modal
  const [newFileName, setNewFileName] = useState('');
  const [newFileSize, setNewFileSize] = useState('');

  // Print modal state
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Authorization helper
  const canManageTasks = useMemo(() => {
    return currentUser.role === 'General Manager' || 
           currentUser.role === 'Project Manager' || 
           currentUser.role === 'Admin' || 
           currentUser.role === 'Super Admin' ||
           currentUser.role === 'Site Engineer';
  }, [currentUser]);

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

  // Main task list retrieval
  const selectedTasks = useMemo(() => {
    let list = tasks;
    if (selectedProjectId !== 'all') {
      list = list.filter(t => t.projectId === selectedProjectId);
    }
    if (filterMilestoneId !== 'all') {
      list = list.filter(t => t.milestoneId === filterMilestoneId);
    }
    if (filterStatus !== 'all') {
      list = list.filter(t => t.status === filterStatus);
    }
    if (filterPriority !== 'all') {
      list = list.filter(t => t.priority === filterPriority);
    }
    if (taskSearchQuery.trim()) {
      const q = taskSearchQuery.toLowerCase();
      list = list.filter(t => 
        t.name.toLowerCase().includes(q) || 
        (t.description && t.description.toLowerCase().includes(q)) ||
        t.assigneeName.toLowerCase().includes(q)
      );
    }
    return list;
  }, [tasks, selectedProjectId, filterMilestoneId, filterStatus, filterPriority, taskSearchQuery]);

  // KPI calculations
  const kpiStats = useMemo(() => {
    const total = selectedTasks.length;
    const completed = selectedTasks.filter(t => t.status === 'completed' || t.progress === 100).length;
    const inProgress = selectedTasks.filter(t => t.status === 'in_progress').length;
    const blocked = selectedTasks.filter(t => t.status === 'blocked' || t.status === 'rework').length;
    
    // Average progress
    const avgProgress = total > 0 ? Math.round(selectedTasks.reduce((acc, t) => acc + (t.progress || 0), 0) / total) : 0;

    return {
      total,
      completed,
      inProgress,
      blocked,
      avgProgress
    };
  }, [selectedTasks]);

  // Project / Milestone lookup helpers
  const getProjectInfo = (pId: string) => {
    return projects.find(p => p.id === pId) || { name: 'Unknown Project', code: 'PROJ-XXX' };
  };

  const getMilestoneInfo = (mId: string) => {
    return milestones.find(m => m.id === mId) || { name: 'Direct Project Scope / Other' };
  };

  // Form Initializers
  const handleOpenAdd = () => {
    if (!canManageTasks) {
      onAddNotification('Unauthorized: Your role does not allow adding project tasks.', 'alert');
      return;
    }
    setEditingTask(null);
    setTaskName('');
    setTaskDescription('');
    setTaskProjectId(selectedProjectId === 'all' ? (projects[0]?.id || '') : selectedProjectId);
    
    // Default to first milestone of project
    const projMilestones = selectedProjectId === 'all' 
      ? milestones 
      : milestones.filter(m => m.projectId === selectedProjectId);
    setTaskMilestoneId(projMilestones[0]?.id || '');

    setTaskPriority('medium');
    setTaskStatus('to_do');
    setTaskProgress(0);
    setTaskAssigneeId(currentUser.id);
    setTaskStartDate(new Date().toISOString().slice(0, 10));
    setTaskDueDate(new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().slice(0, 10));
    setTaskWeight('');
    setIsFormOpen(true);
  };

  const handleOpenEdit = (t: Task, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid triggering details modal
    if (!canManageTasks) {
      onAddNotification('Unauthorized: Your role does not allow editing project tasks.', 'alert');
      return;
    }
    setEditingTask(t);
    setTaskName(t.name);
    setTaskDescription(t.description || '');
    setTaskProjectId(t.projectId);
    setTaskMilestoneId(t.milestoneId);
    setTaskPriority(t.priority);
    setTaskStatus(t.status);
    setTaskProgress(t.progress);
    setTaskAssigneeId(t.assigneeId);
    setTaskStartDate(t.startDate);
    setTaskDueDate(t.dueDate);
    setTaskWeight(t.weight || '');
    setIsFormOpen(true);
  };

  const handleSaveTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageTasks) {
      onAddNotification('Unauthorized: Your role does not allow editing project tasks.', 'alert');
      return;
    }

    if (!taskName.trim()) {
      onAddNotification('Please specify a valid task title.', 'warning');
      return;
    }

    const prog = Number(taskProgress);
    if (isNaN(prog) || prog < 0 || prog > 100) {
      onAddNotification('Progress must be a percentage between 0 and 100.', 'warning');
      return;
    }

    const wt = taskWeight === '' ? undefined : Number(taskWeight);
    const assigneeObj = availableUsers.find(u => u.id === taskAssigneeId) || currentUser;

    let calculatedStatus = taskStatus;
    if (prog === 100) {
      calculatedStatus = 'completed';
    } else if (prog > 0 && calculatedStatus === 'to_do') {
      calculatedStatus = 'in_progress';
    }

    if (editingTask) {
      // Modify existing
      setTasks(prev => prev.map(item => {
        if (item.id === editingTask.id) {
          const statusChanged = item.status !== calculatedStatus;
          const nextHistory = [...(item.statusHistory || [])];
          if (statusChanged) {
            nextHistory.push({
              user: currentUser.name,
              role: currentUser.role,
              previousStatus: item.status,
              newStatus: calculatedStatus,
              date: new Date().toISOString().replace('T', ' ').substring(0, 16)
            });
          }

          return {
            ...item,
            name: taskName.trim(),
            description: taskDescription.trim() || undefined,
            projectId: taskProjectId,
            milestoneId: taskMilestoneId,
            priority: taskPriority,
            status: calculatedStatus,
            progress: prog,
            assigneeId: taskAssigneeId,
            assigneeName: assigneeObj.name,
            startDate: taskStartDate,
            dueDate: taskDueDate,
            weight: wt,
            statusHistory: nextHistory
          };
        }
        return item;
      }));

      onLogAudit(`Updated task "${editingTask.name}"`, 'Tasks', editingTask.name, taskName);
      onAddNotification(`Task "${taskName}" updated successfully.`, 'success');
    } else {
      // Insert new
      const newTask: Task = {
        id: `t_${Date.now()}`,
        projectId: taskProjectId,
        milestoneId: taskMilestoneId,
        name: taskName.trim(),
        description: taskDescription.trim() || undefined,
        priority: taskPriority,
        status: calculatedStatus,
        progress: prog,
        assigneeId: taskAssigneeId,
        assigneeName: assigneeObj.name,
        startDate: taskStartDate,
        dueDate: taskDueDate,
        weight: wt,
        comments: [],
        attachments: [],
        checklist: [],
        statusHistory: [
          {
            user: currentUser.name,
            role: currentUser.role,
            previousStatus: 'created',
            newStatus: calculatedStatus,
            date: new Date().toISOString().replace('T', ' ').substring(0, 16)
          }
        ]
      };

      setTasks(prev => [...prev, newTask]);
      onLogAudit(`Created task "${newTask.name}"`, 'Tasks', undefined, newTask.name);
      onAddNotification(`Task "${newTask.name}" created successfully.`, 'success');
    }

    setIsFormOpen(false);
    setEditingTask(null);
  };

  const handleDeleteTask = (t: Task, e: React.MouseEvent) => {
    const userRoleStr = currentUser?.role?.toLowerCase() || '';
    if (userRoleStr !== 'admin' && userRoleStr !== 'super admin' && userRoleStr !== 'superadmin') {
      alert("Unauthorized: Only Admin or Super Admin can delete records.");
      return;
    }

    e.stopPropagation();
    if (!canManageTasks) {
      onAddNotification('Unauthorized: Your role does not allow deleting tasks.', 'alert');
      return;
    }

    if (window.confirm(`Are you sure you want to permanently delete task "${t.name}"?`)) {
      setTasks(prev => prev.filter(item => item.id !== t.id));
      if (selectedTaskId === t.id) {
        setSelectedTaskId(null);
      }
      onLogAudit(`Deleted task "${t.name}"`, 'Tasks', t.name, undefined);
      onAddNotification(`Task "${t.name}" deleted successfully.`, 'success');
    }
  };

  // Checklist Actions within selectedTask workspace
  const handleAddChecklistItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTaskForDetails || !newChecklistText.trim()) return;

    const newItem: ChecklistItem = {
      id: `c_${Date.now()}`,
      text: newChecklistText.trim(),
      completed: false
    };

    setTasks(prev => prev.map(t => {
      if (t.id === selectedTaskForDetails.id) {
        const nextChecklist = [...(t.checklist || []), newItem];
        return { ...t, checklist: nextChecklist };
      }
      return t;
    }));

    setNewChecklistText('');
  };

  const toggleChecklistItem = (itemId: string) => {
    if (!selectedTaskForDetails) return;

    setTasks(prev => prev.map(t => {
      if (t.id === selectedTaskForDetails.id) {
        const nextChecklist = (t.checklist || []).map(item => {
          if (item.id === itemId) return { ...item, completed: !item.completed };
          return item;
        });
        
        // Auto update progress based on checklist completions?
        const completedCount = nextChecklist.filter(c => c.completed).length;
        const totalCount = nextChecklist.length;
        const autoProgress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : t.progress;

        const nextTask = { ...t, checklist: nextChecklist, progress: autoProgress };
        if (autoProgress === 100) {
          nextTask.status = 'completed';
        }

        return nextTask;
      }
      return t;
    }));
  };

  const removeChecklistItem = (itemId: string) => {
    if (!selectedTaskForDetails) return;

    setTasks(prev => prev.map(t => {
      if (t.id === selectedTaskForDetails.id) {
        const nextChecklist = (t.checklist || []).filter(item => item.id !== itemId);
        return { ...t, checklist: nextChecklist };
      }
      return t;
    }));
  };

  // Comment Actions within selectedTask workspace
  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTaskForDetails || !newCommentText.trim()) return;

    const nextComment: Comment = {
      id: `tc_${Date.now()}`,
      user: currentUser.name,
      role: currentUser.role,
      text: newCommentText.trim(),
      date: new Date().toISOString().replace('T', ' ').substring(0, 16)
    };

    setTasks(prev => prev.map(t => {
      if (t.id === selectedTaskForDetails.id) {
        const nextComments = [...t.comments, nextComment];
        return { ...t, comments: nextComments };
      }
      return t;
    }));

    setNewCommentText('');
  };

  // Mock Attachment support within selectedTask workspace
  const handleAddAttachment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTaskForDetails || !newFileName.trim()) return;

    const nextAttachment = {
      name: newFileName.trim(),
      size: newFileSize.trim() || '2.4 MB',
      uploadedAt: new Date().toISOString().slice(0, 10)
    };

    setTasks(prev => prev.map(t => {
      if (t.id === selectedTaskForDetails.id) {
        const nextAttachments = [...t.attachments, nextAttachment];
        return { ...t, attachments: nextAttachments };
      }
      return t;
    }));

    setNewFileName('');
    setNewFileSize('');
    onAddNotification(`Attached file "${nextAttachment.name}" successfully.`, 'success');
  };

  const triggerBrowserPrint = () => {
    window.print();
  };

  // Priority color formatting helper
  const getPriorityStyle = (priority: 'low' | 'medium' | 'high') => {
    switch (priority) {
      case 'high': return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'medium': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'low': return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  // Status visual label helper
  const getStatusLabel = (status: Task['status']) => {
    switch (status) {
      case 'to_do': return { label: 'To Do', style: 'bg-slate-100 text-slate-700' };
      case 'in_progress': return { label: 'In Progress', style: 'bg-blue-50 text-blue-700 border border-blue-100' };
      case 'review': return { label: 'Review Stage', style: 'bg-indigo-50 text-indigo-700 border border-indigo-100' };
      case 'blocked': return { label: 'Blocked / Delayed', style: 'bg-red-50 text-red-700 border border-red-100' };
      case 'on_hold': return { label: 'On Hold', style: 'bg-amber-50 text-amber-600 border border-amber-100' };
      case 'completed': return { label: 'Completed', style: 'bg-emerald-50 text-emerald-700 border border-emerald-100' };
      case 'rework': return { label: 'Rework Required', style: 'bg-purple-50 text-purple-700 border border-purple-100' };
    }
  };

  return (
    <div id="tasks-view-root" className="flex-1 flex flex-col h-full bg-slate-50 overflow-hidden">
      
      {/* Top Banner Context Section */}
      <div className="bg-white border-b border-slate-200 p-5 md:px-8 flex flex-col md:flex-row md:items-center md:justify-between shrink-0 gap-4">
        <div>
          <span className="text-xs font-mono font-bold text-indigo-600 uppercase tracking-widest block mb-1">Execution & Taskforce</span>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Contract Execution Tasks</h2>
          <p className="text-xs text-slate-500 mt-1">Configure project tasks, delegate engineering stages, review checklist status, and coordinate site notes.</p>
        </div>
      </div>

      {/* Main Split Screen Area */}
      <div className="flex-1 flex overflow-hidden min-h-0 w-full">
      
        {/* 1. LEFT PANEL: Project Selection List */}
        <div 
          id="tasks-project-sidebar" 
          className={`w-72 border-r border-slate-200 bg-white flex flex-col h-full shrink-0 transition-transform lg:translate-x-0 lg:relative lg:pointer-events-auto lg:z-10 ${
            mobileDetailOpen ? '-translate-x-full absolute pointer-events-none' : 'relative z-10'
          }`}
        >
          <div className="p-4 border-b border-slate-100 bg-slate-50/60">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-widest font-mono">Projects Directory</h2>
            <p className="text-[10px] text-slate-400 mt-1">Select a project to view tasks</p>
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
                <h4 className="text-xs font-bold text-slate-800">All Company Tasks</h4>
                <p className="text-[10px] text-slate-400 mt-0.5">Consolidated workforce execution</p>
              </div>
            </button>

            {filteredProjects.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs italic">No projects found.</div>
            ) : (
              filteredProjects.map(p => {
                const isActive = selectedProjectId === p.id;
                const projectTasksCount = tasks.filter(t => t.projectId === p.id).length;
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
                        {projectTasksCount} Tasks
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

        {/* 2. RIGHT PANEL: Tasks workspace viewport */}
        <div 
          id="tasks-data-viewport" 
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
                <CheckSquare className="w-5 h-5" />
              </div>
              <div className="overflow-hidden">
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-mono font-extrabold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded uppercase">
                    {activeProject ? activeProject.code : 'GLOBAL'}
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 truncate">
                    {activeProject ? `${activeProject.name} - Project Tasks` : 'Central Corporate Tasks Checklist'}
                  </h3>
                </div>
                <p className="text-[10px] text-slate-400 truncate mt-0.5">
                  {activeProject 
                    ? `Assign work, checklist components, attach safety guidelines, and track daily milestones for ${activeProject.name}.`
                    : 'Overview of critical site engineering tasks, active workflows, and client-assigned objectives globally.'
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
                  <span>Print Tasks Report</span>
                </button>
              )}
              {canManageTasks && (
                <button
                  onClick={handleOpenAdd}
                  className="inline-flex items-center justify-center space-x-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Task</span>
                </button>
              )}
            </div>
          </div>

          {/* Search bar & Filters row */}
          <div className="p-4 bg-white border-b border-slate-200 shrink-0 space-y-3">
            <div className="flex flex-wrap items-center gap-3 justify-between">
              <div className="relative w-full sm:w-72">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="text" 
                  placeholder="Search tasks by title, assignee, details..."
                  value={taskSearchQuery}
                  onChange={e => setTaskSearchQuery(e.target.value)}
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
                    className="border border-slate-200 rounded-lg bg-white p-1 text-[11px] focus:ring-1 focus:ring-indigo-500 outline-none max-w-[150px]"
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
                    <option value="to_do">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="review">Review</option>
                    <option value="blocked">Blocked</option>
                    <option value="on_hold">On Hold</option>
                    <option value="completed">Completed</option>
                    <option value="rework">Rework Required</option>
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
              </div>
            </div>
          </div>

          {/* Core management workspace content */}
          <div className="p-6 bg-slate-50 flex-1 overflow-y-auto space-y-6">

            {/* KPI Dashboard Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase font-bold tracking-wider">Total Active Tasks</span>
                  <h4 className="text-lg font-extrabold text-slate-800 mt-1">{kpiStats.total} Tasks</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Under selected filters</p>
                </div>
                <div className="bg-indigo-50 p-2.5 rounded-xl text-indigo-600">
                  <CheckSquare className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase font-bold tracking-wider">Completed Tasks</span>
                  <h4 className="text-lg font-extrabold text-emerald-600 mt-1">{kpiStats.completed} Done</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {kpiStats.total > 0 ? Math.round((kpiStats.completed / kpiStats.total) * 100) : 0}% Completion rate
                  </p>
                </div>
                <div className="bg-emerald-50 p-2.5 rounded-xl text-emerald-600">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase font-bold tracking-wider">Tasks In Progress</span>
                  <h4 className="text-lg font-extrabold text-blue-600 mt-1">{kpiStats.inProgress} Active</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Under active engineering</p>
                </div>
                <div className="bg-blue-50 p-2.5 rounded-xl text-blue-600">
                  <Clock className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase font-bold tracking-wider">Blocked / Rework</span>
                  <h4 className="text-lg font-extrabold text-rose-600 mt-1">{kpiStats.blocked} Blocked</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Requires supervisor response</p>
                </div>
                <div className="bg-rose-50 p-2.5 rounded-xl text-rose-600">
                  <AlertTriangle className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Creation Form block */}
            {isFormOpen && (
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
                  <h4 className="text-xs font-extrabold text-slate-800 uppercase font-mono tracking-wider flex items-center space-x-1.5">
                    <CheckSquare className="w-4 h-4 text-indigo-600" />
                    <span>{editingTask ? 'Modify Task Details' : 'Formulate New Task'}</span>
                  </h4>
                  <button 
                    type="button" 
                    onClick={() => setIsFormOpen(false)} 
                    className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-50 transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleSaveTask} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Project Selector (if Global view) */}
                    {selectedProjectId === 'all' && !editingTask && (
                      <div>
                        <label className="block text-[10px] font-mono text-slate-400 uppercase font-bold">Target Project</label>
                        <select
                          required
                          value={taskProjectId}
                          onChange={e => {
                            setTaskProjectId(e.target.value);
                            // Auto select first milestone of new project
                            const pMilestones = milestones.filter(m => m.projectId === e.target.value);
                            setTaskMilestoneId(pMilestones[0]?.id || '');
                          }}
                          className="w-full border border-slate-200 rounded-lg p-2 text-xs mt-1 bg-white focus:ring-1 focus:ring-indigo-500 outline-none font-medium"
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
                        required
                        value={taskMilestoneId}
                        onChange={e => setTaskMilestoneId(e.target.value)}
                        className="w-full border border-slate-200 rounded-lg p-2 text-xs mt-1 bg-white focus:ring-1 focus:ring-indigo-500 outline-none font-medium"
                      >
                        {milestones
                          .filter(m => m.projectId === (taskProjectId || selectedProjectId))
                          .map(m => (
                            <option key={m.id} value={m.id}>{m.name} ({m.weight}%)</option>
                          ))
                        }
                        {milestones.filter(m => m.projectId === (taskProjectId || selectedProjectId)).length === 0 && (
                          <option value="">No milestones available - please create milestones first</option>
                        )}
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-mono text-slate-400 uppercase font-bold">Task Title / Specification</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Inspect formwork alignment, Install HVAC vents..."
                        value={taskName}
                        onChange={e => setTaskName(e.target.value)}
                        className="w-full border border-slate-200 rounded-lg p-2 text-xs mt-1 focus:ring-1 focus:ring-indigo-500 outline-none font-medium text-slate-700"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 uppercase font-bold">Priority Baseline</label>
                      <select
                        value={taskPriority}
                        onChange={e => setTaskPriority(e.target.value as any)}
                        className="w-full border border-slate-200 rounded-lg p-2 text-xs mt-1 bg-white focus:ring-1 focus:ring-indigo-500 outline-none font-medium"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 uppercase font-bold">Workforce Assignee</label>
                      <select
                        value={taskAssigneeId}
                        onChange={e => setTaskAssigneeId(e.target.value)}
                        className="w-full border border-slate-200 rounded-lg p-2 text-xs mt-1 bg-white focus:ring-1 focus:ring-indigo-500 outline-none font-medium"
                      >
                        {availableUsers.map(u => (
                          <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 uppercase font-bold">Current Status</label>
                      <select
                        value={taskStatus}
                        onChange={e => setTaskStatus(e.target.value as any)}
                        className="w-full border border-slate-200 rounded-lg p-2 text-xs mt-1 bg-white focus:ring-1 focus:ring-indigo-500 outline-none font-medium"
                      >
                        <option value="to_do">To Do</option>
                        <option value="in_progress">In Progress</option>
                        <option value="review">Review Stage</option>
                        <option value="blocked">Blocked / Delayed</option>
                        <option value="on_hold">On Hold</option>
                        <option value="completed">Completed</option>
                        <option value="rework">Rework Required</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 uppercase font-bold">Current Progress (%)</label>
                      <input
                        type="number"
                        required
                        min={0}
                        max={100}
                        value={taskProgress}
                        onChange={e => setTaskProgress(e.target.value === '' ? '' : Number(e.target.value))}
                        placeholder="e.g. 50"
                        className="w-full border border-slate-200 rounded-lg p-2 text-xs mt-1 focus:ring-1 focus:ring-indigo-500 outline-none font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 uppercase font-bold">Start Date</label>
                      <input
                        type="date"
                        required
                        value={taskStartDate}
                        onChange={e => setTaskStartDate(e.target.value)}
                        className="w-full border border-slate-200 rounded-lg p-2 text-xs mt-1 focus:ring-1 focus:ring-indigo-500 outline-none font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 uppercase font-bold">Due Date / Deadline</label>
                      <input
                        type="date"
                        required
                        value={taskDueDate}
                        onChange={e => setTaskDueDate(e.target.value)}
                        className="w-full border border-slate-200 rounded-lg p-2 text-xs mt-1 focus:ring-1 focus:ring-indigo-500 outline-none font-mono"
                      />
                    </div>

                    <div className="md:col-span-3">
                      <label className="block text-[10px] font-mono text-slate-400 uppercase font-bold">Scope Description & Directives</label>
                      <textarea
                        placeholder="Detail materials, testing guidelines, compliance reports, safety checklists..."
                        value={taskDescription}
                        onChange={e => setTaskDescription(e.target.value)}
                        rows={3}
                        className="w-full border border-slate-200 rounded-lg p-2 text-xs mt-1 focus:ring-1 focus:ring-indigo-500 outline-none font-medium text-slate-700"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                    <button 
                      type="button" 
                      onClick={() => {
                        setIsFormOpen(false);
                        setEditingTask(null);
                      }} 
                      className="text-xs text-slate-500 font-bold px-3.5 py-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1.5 rounded-lg text-xs font-bold transition shadow-xs cursor-pointer"
                    >
                      {editingTask ? 'Save Task Modifications' : 'Launch Active Task'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Tasks Card Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {selectedTasks.map((t) => {
                const proj = getProjectInfo(t.projectId);
                const milestone = getMilestoneInfo(t.milestoneId);
                const statusInfo = getStatusLabel(t.status);
                const priorityClass = getPriorityStyle(t.priority);
                
                // Count completions of checklists
                const totalChecklist = t.checklist?.length || 0;
                const completedChecklist = t.checklist?.filter(c => c.completed).length || 0;

                return (
                  <div 
                    key={t.id} 
                    onClick={() => setSelectedTaskId(t.id)}
                    className="bg-white p-5 rounded-2xl border border-slate-200/85 shadow-xs hover:shadow-md hover:border-indigo-200 transition-all duration-200 flex flex-col justify-between group relative cursor-pointer"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1 max-w-[70%]">
                          <span className="inline-block text-[8px] font-mono font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded uppercase">
                            {proj.code}
                          </span>
                          <span className="ml-1.5 inline-block text-[8px] font-mono text-slate-400">
                            {milestone.name.substring(0, 15)}...
                          </span>
                          <h4 className="font-extrabold text-xs text-slate-800 line-clamp-1 group-hover:text-indigo-600 transition-colors">
                            {t.name}
                          </h4>
                        </div>

                        <div className="flex flex-col items-end space-y-1">
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-mono font-extrabold uppercase ${statusInfo.style}`}>
                            {statusInfo.label}
                          </span>
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-mono font-semibold uppercase border ${priorityClass}`}>
                            {t.priority}
                          </span>
                        </div>
                      </div>

                      <p className="text-[10px] text-slate-400 line-clamp-2">
                        {t.description || 'No direct guidelines detailed for this site engineering stage.'}
                      </p>
                    </div>

                    {/* Progress details */}
                    <div className="space-y-3 pt-3 border-t border-slate-50 mt-3">
                      <div className="flex justify-between items-center text-[10px] font-mono">
                        <span className="text-slate-500 font-semibold flex items-center space-x-1">
                          <UserIcon className="w-3 h-3 text-slate-400" />
                          <span>{t.assigneeName}</span>
                        </span>
                        <span className="text-slate-400">Due {t.dueDate}</span>
                      </div>

                      {/* Checklist counter & details icons */}
                      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                        <div className="flex items-center space-x-2.5">
                          {totalChecklist > 0 && (
                            <span className="flex items-center space-x-1 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                              <ListTodo className="w-3.5 h-3.5 text-indigo-500" />
                              <span className="font-mono font-bold text-slate-700">{completedChecklist}/{totalChecklist}</span>
                            </span>
                          )}
                          {t.comments.length > 0 && (
                            <span className="flex items-center space-x-1">
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span>{t.comments.length}</span>
                            </span>
                          )}
                          {t.attachments.length > 0 && (
                            <span className="flex items-center space-x-1">
                              <Paperclip className="w-3.5 h-3.5" />
                              <span>{t.attachments.length}</span>
                            </span>
                          )}
                        </div>
                        <span className="font-mono font-bold text-indigo-600 bg-indigo-50 px-1 rounded">{t.progress}%</span>
                      </div>

                      {/* Progress bar */}
                      <div className="w-full bg-slate-100 rounded-full h-1 overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-300 ${
                            t.progress === 100 ? 'bg-emerald-500' : t.progress > 50 ? 'bg-indigo-500' : 'bg-blue-400'
                          }`}
                          style={{ width: `${t.progress}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Actions footer (visible on hover) */}
                    {canManageTasks && (
                      <div className="flex items-center justify-end space-x-1.5 pt-2 border-t border-slate-50 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => handleOpenEdit(t, e)}
                          className="p-1 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 rounded transition"
                          title="Edit Task properties"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => handleDeleteTask(t, e)}
                          className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded transition"
                          title="Delete task"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}

              {selectedTasks.length === 0 && (
                <div className="bg-white p-10 border border-dashed border-slate-200 text-center text-slate-400 italic text-xs col-span-full rounded-2xl flex flex-col items-center justify-center space-y-2">
                  <CheckSquare className="w-8 h-8 text-slate-300" />
                  <span>No tasks active matching current selections or directory filter.</span>
                  {canManageTasks && (
                    <button 
                      onClick={handleOpenAdd}
                      className="mt-2 text-indigo-600 font-bold text-xs hover:underline cursor-pointer"
                    >
                      Assign a taskforce or add a site task now
                    </button>
                  )}
                </div>
              )}
            </div>

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
                <h3 className="text-sm font-bold text-slate-800">Print Task Review report</h3>
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
            <div className="flex-1 overflow-y-auto p-8 select-text" id="tasks-report-print-area">
              <style>{`
                @media print {
                  body * {
                    visibility: hidden;
                  }
                  #tasks-report-print-area, #tasks-report-print-area * {
                    visibility: visible;
                  }
                  #tasks-report-print-area {
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
                    <span className="text-[10px] font-mono tracking-widest text-slate-400 font-bold block uppercase mt-1">ENGINEERING TASKFORCE REPORT</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-indigo-600 block">PROJECT EXECUTION TASKS</span>
                    <p className="text-[10px] text-slate-400 mt-1 font-mono">Date Generated: {new Date().toLocaleDateString()}</p>
                    <p className="text-[10px] text-slate-400 font-mono">Status: Active Operations</p>
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
                      <span className="block text-[8px] uppercase tracking-wider text-slate-400 font-bold">Progress Rate</span>
                      <span className="text-xs font-mono font-bold text-indigo-600">{kpiStats.avgProgress}% Average</span>
                    </div>
                  </div>
                </div>

                {/* KPI metrics row */}
                <div className="grid grid-cols-4 gap-4 border-y border-slate-200 py-4 font-mono text-center">
                  <div>
                    <span className="block text-[9px] uppercase tracking-widest text-slate-400 font-bold">Total Tasks</span>
                    <strong className="text-md font-bold text-slate-800 block mt-1">{kpiStats.total} Items</strong>
                  </div>
                  <div className="border-l border-slate-200">
                    <span className="block text-[9px] uppercase tracking-widest text-slate-400 font-bold">Completed</span>
                    <strong className="text-md font-bold text-emerald-600 block mt-1">{kpiStats.completed} Done</strong>
                  </div>
                  <div className="border-l border-slate-200">
                    <span className="block text-[9px] uppercase tracking-widest text-slate-400 font-bold">In Progress</span>
                    <strong className="text-md font-bold text-blue-600 block mt-1">{kpiStats.inProgress} Active</strong>
                  </div>
                  <div className="border-l border-slate-200">
                    <span className="block text-[9px] uppercase tracking-widest text-slate-400 font-bold">Blocked</span>
                    <strong className="text-md font-bold text-red-600 block mt-1">{kpiStats.blocked} Items</strong>
                  </div>
                </div>

                {/* Detailed tasks table */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest font-mono">Detailed Tasks & Assignments</h3>
                  <table className="w-full text-left border-collapse border border-slate-200">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-mono uppercase text-slate-500">
                        <th className="p-3">Task Name / Description</th>
                        <th className="p-3">Assignee</th>
                        <th className="p-3">Target Date</th>
                        <th className="p-3 text-right">Priority</th>
                        <th className="p-3 text-right">Progress</th>
                        <th className="p-3 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                      {selectedTasks.map((t) => {
                        const statusInfo = getStatusLabel(t.status);
                        return (
                          <tr key={t.id} className="font-medium">
                            <td className="p-3">
                              <span className="font-bold text-slate-800 block">{t.name}</span>
                              <span className="text-[10px] text-slate-400 font-normal block mt-0.5">{t.description || 'No direct description'}</span>
                            </td>
                            <td className="p-3 text-slate-600">{t.assigneeName}</td>
                            <td className="p-3 font-mono text-slate-600">{t.dueDate}</td>
                            <td className="p-3 text-right">
                              <span className="font-mono text-[10px] uppercase font-bold text-amber-700">{t.priority}</span>
                            </td>
                            <td className="p-3 text-right font-mono font-bold text-indigo-600">{t.progress}%</td>
                            <td className="p-3 text-right">
                              <span className="inline-block text-[9px] font-bold uppercase text-slate-700">
                                {statusInfo.label}
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
                    <p>Report Compiled By: __________________________</p>
                    <p className="text-[10px] text-slate-400">Operations Control Specialist</p>
                  </div>
                  <div className="space-y-12 text-right">
                    <p>Client Project Representative Acceptance: __________________________</p>
                    <p className="text-[10px] text-slate-400">Chief Consultant Engineer</p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* 4. DETAIL & INTERACTIVE WORKSPACE MODAL */}
      {selectedTaskForDetails && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl shadow-xl flex flex-col max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="bg-indigo-50 p-2 rounded-xl text-indigo-600">
                  <CheckSquare className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[9px] font-mono font-extrabold text-indigo-600 bg-indigo-100 px-1.5 py-0.5 rounded uppercase">
                      {getProjectInfo(selectedTaskForDetails.projectId).code}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Milestone: {getMilestoneInfo(selectedTaskForDetails.milestoneId).name}
                    </span>
                  </div>
                  <h3 className="text-sm font-extrabold text-slate-900 mt-1">{selectedTaskForDetails.name}</h3>
                </div>
              </div>
              <button
                onClick={() => setSelectedTaskId(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-100 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content - Divided into two main panels */}
            <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
              
              {/* Left Column: Properties, Description, Checklists */}
              <div className="lg:col-span-7 p-6 space-y-6">
                
                {/* Description block */}
                <div className="space-y-2">
                  <h4 className="text-[11px] font-mono text-slate-400 uppercase font-bold tracking-wider">Directives & Scope</h4>
                  <div className="bg-slate-50 p-4 rounded-xl text-xs text-slate-700 leading-relaxed border border-slate-100">
                    {selectedTaskForDetails.description || 'No direct scope requirements described. Please coordinate with PM.'}
                  </div>
                </div>

                {/* Checklist workspace */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[11px] font-mono text-slate-400 uppercase font-bold tracking-wider">Task Checklist Steps</h4>
                    <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-mono font-bold">
                      {selectedTaskForDetails.checklist?.filter(c => c.completed).length || 0} of {selectedTaskForDetails.checklist?.length || 0} Done
                    </span>
                  </div>

                  {/* Checklist List */}
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {selectedTaskForDetails.checklist?.map(item => (
                      <div 
                        key={item.id} 
                        className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 hover:bg-slate-50/50 text-xs transition"
                      >
                        <label className="flex items-center space-x-3 cursor-pointer select-none">
                          <input 
                            type="checkbox"
                            checked={item.completed}
                            onChange={() => toggleChecklistItem(item.id)}
                            className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 transition"
                          />
                          <span className={`font-medium ${item.completed ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                            {item.text}
                          </span>
                        </label>

                        <button
                          type="button"
                          onClick={() => removeChecklistItem(item.id)}
                          className="text-slate-400 hover:text-rose-600 p-1 rounded-lg transition"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}

                    {(!selectedTaskForDetails.checklist || selectedTaskForDetails.checklist.length === 0) && (
                      <p className="text-[11px] text-slate-400 italic">No checklist steps established yet. Establish checkpoints below.</p>
                    )}
                  </div>

                  {/* Add Checklist form */}
                  <form onSubmit={handleAddChecklistItem} className="flex gap-2 pt-1">
                    <input
                      type="text"
                      placeholder="Add critical checklist item..."
                      value={newChecklistText}
                      onChange={e => setNewChecklistText(e.target.value)}
                      className="flex-1 border border-slate-200 rounded-lg p-1.5 text-xs focus:ring-1 focus:ring-indigo-500 outline-none font-medium"
                    />
                    <button
                      type="submit"
                      className="bg-slate-100 hover:bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-200 hover:border-indigo-200 transition"
                    >
                      Add Step
                    </button>
                  </form>
                </div>

                {/* Status history tracking */}
                <div className="space-y-3 pt-3 border-t border-slate-100">
                  <h4 className="text-[11px] font-mono text-slate-400 uppercase font-bold tracking-wider flex items-center space-x-1">
                    <History className="w-3.5 h-3.5" />
                    <span>State Audit Trail</span>
                  </h4>
                  <div className="space-y-2.5 max-h-40 overflow-y-auto text-[10px] font-medium text-slate-500">
                    {selectedTaskForDetails.statusHistory?.map((h, i) => (
                      <div key={i} className="flex items-start space-x-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1 shrink-0" />
                        <div className="flex-1">
                          <p>
                            <span className="font-bold text-slate-700">{h.user}</span> ({h.role}) updated status from{' '}
                            <span className="font-mono text-slate-400">{h.previousStatus}</span> to{' '}
                            <span className="font-mono font-bold text-indigo-600">{h.newStatus}</span>.
                          </p>
                          <span className="text-[9px] text-slate-400 mt-0.5 block">{h.date}</span>
                        </div>
                      </div>
                    ))}

                    {(!selectedTaskForDetails.statusHistory || selectedTaskForDetails.statusHistory.length === 0) && (
                      <p className="text-slate-400 italic">No historical changes captured yet.</p>
                    )}
                  </div>
                </div>

              </div>

              {/* Right Column: Interactive Comments & File uploads */}
              <div className="lg:col-span-5 p-6 space-y-6 bg-slate-50/50">
                
                {/* Properties Overview */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3 text-xs">
                  <h4 className="text-[11px] font-mono text-slate-400 uppercase font-bold tracking-wider border-b border-slate-100 pb-1.5">Task Metadata</h4>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="block text-[9px] text-slate-400 font-mono">ASSIGNEE</span>
                      <span className="font-bold text-slate-800">{selectedTaskForDetails.assigneeName}</span>
                    </div>
                    <div>
                      <span className="block text-[9px] text-slate-400 font-mono">PRIORITY</span>
                      <span className="font-bold text-slate-800 uppercase text-[10px]">{selectedTaskForDetails.priority}</span>
                    </div>
                    <div>
                      <span className="block text-[9px] text-slate-400 font-mono">TIMELINE</span>
                      <span className="font-medium text-slate-700 font-mono">{selectedTaskForDetails.startDate} / {selectedTaskForDetails.dueDate}</span>
                    </div>
                    <div>
                      <span className="block text-[9px] text-slate-400 font-mono">TASK WEIGHT</span>
                      <span className="font-bold text-slate-800 font-mono">{selectedTaskForDetails.weight ? `${selectedTaskForDetails.weight}%` : 'Not Weighted'}</span>
                    </div>
                  </div>
                </div>

                {/* File attachments widget */}
                <div className="space-y-3">
                  <h4 className="text-[11px] font-mono text-slate-400 uppercase font-bold tracking-wider">Directives & Photo Logs</h4>
                  
                  {/* Attachments List */}
                  <div className="space-y-1.5 max-h-32 overflow-y-auto">
                    {selectedTaskForDetails.attachments?.map((f, index) => (
                      <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200 text-xs">
                        <div className="flex items-center space-x-2 truncate">
                          <Paperclip className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
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

                    {(!selectedTaskForDetails.attachments || selectedTaskForDetails.attachments.length === 0) && (
                      <p className="text-[11px] text-slate-400 italic">No blueprints, photos or log reports attached.</p>
                    )}
                  </div>

                  {/* Attachment Addition Panel */}
                  <form onSubmit={handleAddAttachment} className="bg-white p-3 rounded-xl border border-slate-200 space-y-2.5">
                    <span className="block text-[9px] font-mono text-slate-400 uppercase font-bold">Attach Blueprint / Material Report</span>
                    <div className="grid grid-cols-2 gap-2">
                      <input 
                        type="text"
                        required
                        placeholder="Filename.pdf..."
                        value={newFileName}
                        onChange={e => setNewFileName(e.target.value)}
                        className="border border-slate-200 rounded-lg p-1 text-xs focus:ring-1 focus:ring-indigo-500 outline-none font-medium"
                      />
                      <input 
                        type="text"
                        placeholder="e.g. 1.8 MB (Size)"
                        value={newFileSize}
                        onChange={e => setNewFileSize(e.target.value)}
                        className="border border-slate-200 rounded-lg p-1 text-xs focus:ring-1 focus:ring-indigo-500 outline-none font-medium"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full bg-slate-50 hover:bg-indigo-50 text-indigo-600 border border-slate-200 hover:border-indigo-200 font-bold text-xs py-1.5 rounded-lg transition"
                    >
                      Attach Verified File
                    </button>
                  </form>
                </div>

                {/* Live comments feed */}
                <div className="space-y-3 pt-3 border-t border-slate-200">
                  <h4 className="text-[11px] font-mono text-slate-400 uppercase font-bold tracking-wider">Site Comments & Coordination</h4>
                  
                  {/* Comments list */}
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {selectedTaskForDetails.comments.map((comment) => (
                      <div key={comment.id} className="bg-white p-3 rounded-xl border border-slate-150 text-xs space-y-1">
                        <div className="flex justify-between text-[10px] font-mono">
                          <span className="font-extrabold text-slate-700">{comment.user} ({comment.role})</span>
                          <span className="text-slate-400">{comment.date}</span>
                        </div>
                        <p className="text-slate-600 leading-relaxed">{comment.text}</p>
                      </div>
                    ))}

                    {selectedTaskForDetails.comments.length === 0 && (
                      <p className="text-[11px] text-slate-400 italic">No coordination logs yet. Use form below to update site staff.</p>
                    )}
                  </div>

                  {/* Add Comment Form */}
                  <form onSubmit={handleAddComment} className="space-y-2">
                    <textarea
                      required
                      placeholder="Type site update, delay alerts, or inspection request..."
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
                        Submit Coordinate Log
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
