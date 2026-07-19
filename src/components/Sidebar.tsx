/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { 
  LayoutDashboard, 
  Briefcase, 
  ShieldCheck, 
  FilePieChart, 
  History, 
  Building2, 
  TrendingUp, 
  FolderGit2,
  FolderOpen,
  ClipboardList,
  Users,
  FileText,
  Layers,
  DollarSign,
  Flag,
  CheckSquare,
  X,
  AlertTriangle,
  CreditCard,
  Settings
} from 'lucide-react';
import { Project, User, Role, Permission } from '../types';

interface SidebarProps {
  currentView: string;
  setCurrentView: (view: string) => void;
  projects: Project[];
  selectedProjectId: string | null;
  setSelectedProjectId: (id: string | null) => void;
  isOpen?: boolean;
  onClose?: () => void;
  appName?: string;
  logoDark?: string;
  currentUser?: User;
  roles?: Role[];
}

export default function Sidebar({
  currentView,
  setCurrentView,
  projects,
  selectedProjectId,
  setSelectedProjectId,
  isOpen = false,
  onClose,
  appName = 'Wafaq ERP',
  logoDark = '',
  currentUser,
  roles,
}: SidebarProps) {
  
  const permissions: Permission | undefined = useMemo(() => {
    return roles?.find(r => r.name === currentUser?.role)?.permissions;
  }, [roles, currentUser]);

  const navItems = [
    ...(permissions?.viewDashboard !== false ? [{ id: 'dashboard', label: 'Executive Dashboard', icon: LayoutDashboard }] : []),
    ...(permissions?.viewProjectDetails !== false ? [{ id: 'project', label: 'Project', icon: FolderOpen }] : []),
    ...(permissions?.viewProjectsWorkspace !== false ? [{ id: 'projects', label: 'Projects Workspace', icon: Briefcase }] : []),
    ...(permissions?.viewRolesAndPermissions !== false ? [{ id: 'roles', label: 'Access & Permissions', icon: ShieldCheck }] : []),
    ...(permissions?.viewAnalyticalReports !== false ? [{ id: 'reports', label: 'Analytical Reports', icon: FilePieChart }] : []),
    ...(permissions?.viewAuditLogs !== false ? [{ id: 'audit', label: 'System Audit Logs', icon: History }] : []),
    ...(permissions?.viewSystemSettings !== false ? [{ id: 'settings', label: 'System Settings', icon: Settings }] : []),
  ];

  // Calculate average completion across projects for the health card
  const avgProgress = useMemo(() => {
    if (projects.length === 0) return 94;
    return Math.round(projects.reduce((acc, p) => acc + p.progress, 0) / projects.length);
  }, [projects]);

  return (
    <aside 
      id="sidebar-container" 
      className={`fixed inset-y-0 left-0 z-50 lg:relative lg:translate-x-0 w-68 bg-white text-slate-800 flex flex-col h-screen border-r border-slate-200 shrink-0 select-none transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      {/* Brand Header */}
      <div id="sidebar-brand-wrapper" className="p-5 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center space-x-3 overflow-hidden">
          {logoDark ? (
            <div className="flex items-center space-x-2.5 overflow-hidden">
              <img 
                src={logoDark} 
                alt={appName || "Logo"} 
                className="h-8 max-h-8 object-contain rounded shrink-0" 
                referrerPolicy="no-referrer"
              />
              <div className="min-w-0">
                <h1 id="brand-title" className="font-sans font-bold tracking-tight text-sm leading-tight text-slate-800 uppercase truncate">
                  {appName}
                </h1>
                <span id="brand-subtitle" className="text-[9px] font-sans uppercase tracking-widest text-slate-400 font-semibold block">CONTRACTING SUITE</span>
              </div>
            </div>
          ) : (
            <>
              <div id="brand-icon" className="w-8 h-8 bg-indigo-600 text-white rounded flex items-center justify-center font-bold text-lg shadow-xs shrink-0">
                {appName ? appName[0].toUpperCase() : 'W'}
              </div>
              <div className="min-w-0">
                <h1 id="brand-title" className="font-sans font-bold tracking-tight text-md leading-none text-slate-800 uppercase truncate">
                  {appName}
                </h1>
                <span id="brand-subtitle" className="text-[10px] font-sans uppercase tracking-widest text-slate-400 font-semibold block mt-1">CONTRACTING SUITE</span>
              </div>
            </>
          )}
        </div>
        {onClose && (
          <button 
            onClick={onClose}
            className="lg:hidden p-1.5 hover:bg-gray-100 rounded-lg text-slate-500 cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Main Navigation */}
      <nav id="sidebar-navigation" className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div id="nav-section-title" className="px-3 mb-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
          Main Modules
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id || 
            (item.id === 'project' && [
              'project', 'project-boq', 'project-clients', 'project-quotations', 'project-purchase-orders', 'project-budgets', 'project-milestones', 'project-expenses', 'project-invoices', 'project-payments', 'project-tasks', 'project-issues', 'project-variations', 'project-document-controller'
            ].includes(currentView)) ||
            (item.id === 'roles' && [
              'roles', 'users'
            ].includes(currentView));
          const isProjectBoqActive = currentView === 'project-boq';
          
          return (
            <div key={item.id} className="space-y-1">
              <button
                id={`nav-btn-${item.id}`}
                onClick={() => {
                  setCurrentView(item.id);
                  if (item.id !== 'projects') {
                    setSelectedProjectId(null);
                  } else if (projects.length > 0 && !selectedProjectId) {
                    setSelectedProjectId(projects[0].id);
                  }
                  onClose?.();
                }}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
                  isActive 
                    ? 'bg-indigo-50 text-indigo-700 font-semibold' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>

              {/* If it's the 'roles' item, render user management sub-menu */}
              {item.id === 'roles' && (
                <div className="pl-6 space-y-1 mt-1">
                  <button
                    id="nav-btn-user-management"
                    onClick={() => {
                      setCurrentView('users');
                      setSelectedProjectId(null);
                      onClose?.();
                    }}
                    className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer ${
                      currentView === 'users'
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                    }`}
                  >
                    <Users className={`w-3.5 h-3.5 ${currentView === 'users' ? 'text-indigo-600' : 'text-slate-400'}`} />
                    <span>User Management</span>
                  </button>
                </div>
              )}

              {/* If it's the 'project' item, render sub-menu */}
              {item.id === 'project' && (
                <div className="pl-6 space-y-1 mt-1">
                  {permissions?.viewProjectBOQ !== false && ( <button
                    id="nav-btn-project-boq"
                    onClick={() => {
                      setCurrentView('project-boq');
                      setSelectedProjectId(null);
                      onClose?.();
                    }}
                    className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer ${
                      isProjectBoqActive
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                    }`}
                  >
                    <ClipboardList className={`w-3.5 h-3.5 ${isProjectBoqActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                    <span>Bill of Quantities</span>
                  </button> )}

                  {permissions?.viewProjectClients !== false && ( <button
                    id="nav-btn-project-clients"
                    onClick={() => {
                      setCurrentView('project-clients');
                      setSelectedProjectId(null);
                      onClose?.();
                    }}
                    className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer ${
                      currentView === 'project-clients'
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                    }`}
                  >
                    <Users className={`w-3.5 h-3.5 ${currentView === 'project-clients' ? 'text-indigo-600' : 'text-slate-400'}`} />
                    <span>Client Data</span>
                  </button> )}

                  {permissions?.viewProjectQuotations !== false && ( <button
                    id="nav-btn-project-quotations"
                    onClick={() => {
                      setCurrentView('project-quotations');
                      setSelectedProjectId(null);
                      onClose?.();
                    }}
                    className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer ${
                      currentView === 'project-quotations'
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                    }`}
                  >
                    <FileText className={`w-3.5 h-3.5 ${currentView === 'project-quotations' ? 'text-indigo-600' : 'text-slate-400'}`} />
                    <span>Quotations</span>
                  </button> )}

                  {permissions?.viewProjectPO !== false && ( <button
                    id="nav-btn-project-purchase-orders"
                    onClick={() => {
                      setCurrentView('project-purchase-orders');
                      setSelectedProjectId(null);
                      onClose?.();
                    }}
                    className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer ${
                      currentView === 'project-purchase-orders'
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                    }`}
                  >
                    <Layers className={`w-3.5 h-3.5 ${currentView === 'project-purchase-orders' ? 'text-indigo-600' : 'text-slate-400'}`} />
                    <span>Purchase Order</span>
                  </button> )}

                  {permissions?.viewProjectBudgets !== false && ( <button
                    id="nav-btn-project-budgets"
                    onClick={() => {
                      setCurrentView('project-budgets');
                      setSelectedProjectId(null);
                      onClose?.();
                    }}
                    className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer ${
                      currentView === 'project-budgets'
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                    }`}
                  >
                    <DollarSign className={`w-3.5 h-3.5 ${currentView === 'project-budgets' ? 'text-indigo-600' : 'text-slate-400'}`} />
                    <span>Budgets</span>
                  </button> )}

                  {permissions?.viewProjectMilestones !== false && ( <button
                    id="nav-btn-project-milestones"
                    onClick={() => {
                      setCurrentView('project-milestones');
                      setSelectedProjectId(null);
                      onClose?.();
                    }}
                    className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer ${
                      currentView === 'project-milestones'
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                    }`}
                  >
                    <Flag className={`w-3.5 h-3.5 ${currentView === 'project-milestones' ? 'text-indigo-600' : 'text-slate-400'}`} />
                    <span>Milestones</span>
                  </button> )}

                  {permissions?.viewProjectTasks !== false && ( <button
                    id="nav-btn-project-tasks"
                    onClick={() => {
                      setCurrentView('project-tasks');
                      setSelectedProjectId(null);
                      onClose?.();
                    }}
                    className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer ${
                      currentView === 'project-tasks'
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                    }`}
                  >
                    <CheckSquare className={`w-3.5 h-3.5 ${currentView === 'project-tasks' ? 'text-indigo-600' : 'text-slate-400'}`} />
                    <span>Tasks</span>
                  </button> )}

                  {permissions?.viewProjectIssues !== false && ( <button
                    id="nav-btn-project-issues"
                    onClick={() => {
                      setCurrentView('project-issues');
                      setSelectedProjectId(null);
                      onClose?.();
                    }}
                    className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer ${
                      currentView === 'project-issues'
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                    }`}
                  >
                    <AlertTriangle className={`w-3.5 h-3.5 ${currentView === 'project-issues' ? 'text-indigo-600' : 'text-slate-400'}`} />
                    <span>Site Issues</span>
                  </button> )}

                  {permissions?.viewProjectVariations !== false && ( <button
                    id="nav-btn-project-variations"
                    onClick={() => {
                      setCurrentView('project-variations');
                      setSelectedProjectId(null);
                      onClose?.();
                    }}
                    className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer ${
                      currentView === 'project-variations'
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                    }`}
                  >
                    <TrendingUp className={`w-3.5 h-3.5 ${currentView === 'project-variations' ? 'text-indigo-600' : 'text-slate-400'}`} />
                    <span>Variations</span>
                  </button> )}

                  {permissions?.viewProjectExpenses !== false && ( <button
                    id="nav-btn-project-expenses"
                    onClick={() => {
                      setCurrentView('project-expenses');
                      setSelectedProjectId(null);
                      onClose?.();
                    }}
                    className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer ${
                      currentView === 'project-expenses'
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                    }`}
                  >
                    <DollarSign className={`w-3.5 h-3.5 ${currentView === 'project-expenses' ? 'text-indigo-600' : 'text-slate-400'}`} />
                    <span>Expenses</span>
                  </button> )}

                  {permissions?.viewProjectInvoices !== false && ( <button
                    id="nav-btn-project-invoices"
                    onClick={() => {
                      setCurrentView('project-invoices');
                      setSelectedProjectId(null);
                      onClose?.();
                    }}
                    className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer ${
                      currentView === 'project-invoices'
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                    }`}
                  >
                    <FileText className={`w-3.5 h-3.5 ${currentView === 'project-invoices' ? 'text-indigo-600' : 'text-slate-400'}`} />
                    <span>Invoices</span>
                  </button> )}

                  {permissions?.viewProjectPayments !== false && ( <button
                    id="nav-btn-project-payments"
                    onClick={() => {
                      setCurrentView('project-payments');
                      setSelectedProjectId(null);
                      onClose?.();
                    }}
                    className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer ${
                      currentView === 'project-payments'
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                    }`}
                  >
                    <CreditCard className={`w-3.5 h-3.5 ${currentView === 'project-payments' ? 'text-indigo-600' : 'text-slate-400'}`} />
                    <span>Payment Received</span>
                  </button> )}

                  {permissions?.viewProjectDocuments !== false && ( <button
                    id="nav-btn-project-document-controller"
                    onClick={() => {
                      setCurrentView('project-document-controller');
                      setSelectedProjectId(null);
                      onClose?.();
                    }}
                    className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer ${
                      currentView === 'project-document-controller'
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                    }`}
                  >
                    <FileText className={`w-3.5 h-3.5 ${currentView === 'project-document-controller' ? 'text-indigo-600' : 'text-slate-400'}`} />
                    <span>Document Controller</span>
                  </button> )}
                </div>
              )}
            </div>
          );
        })}

        {/* Projects Submenu */}
        <div id="projects-submenu-section" className="mt-6 pt-6 border-t border-slate-200">
          <div id="projects-section-title" className="px-3 mb-2 flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-widest">
            <span>Quick Workspaces</span>
            <span className="bg-slate-100 text-slate-600 text-xs px-1.5 py-0.5 rounded font-mono font-medium">
              {projects.length}
            </span>
          </div>
          <div id="sidebar-projects-list" className="space-y-1">
            {projects.map((proj) => {
              const isSelected = currentView === 'projects' && selectedProjectId === proj.id;
              return (
                <button
                  key={proj.id}
                  id={`sidebar-proj-${proj.id}`}
                  onClick={() => {
                    setCurrentView('projects');
                    setSelectedProjectId(proj.id);
                    onClose?.();
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-all duration-150 cursor-pointer text-left ${
                    isSelected
                      ? 'bg-indigo-50/60 text-indigo-900 font-medium border-l-2 border-indigo-600 pl-2.5'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                  }`}
                >
                  <div className="flex items-center space-x-2 truncate">
                    <FolderGit2 className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-indigo-600' : 'text-slate-400'}`} />
                    <span className="truncate text-xs">{proj.name}</span>
                  </div>
                  <span className={`text-[11px] shrink-0 px-1.5 py-0.5 rounded font-mono font-bold ${
                    proj.status === 'active' 
                      ? 'bg-emerald-50 text-emerald-700' 
                      : proj.status === 'completed' 
                        ? 'bg-blue-50 text-blue-700' 
                        : 'bg-amber-50 text-amber-700'
                  }`}>
                    {proj.progress}%
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Project Health Widget from the Design Spec */}
        <div className="mt-8 mx-2 p-4 bg-slate-900 rounded-xl text-white">
          <p className="text-xs opacity-60 uppercase tracking-wider font-semibold mb-1">Project Health</p>
          <p className="text-xl font-bold">{avgProgress}%</p>
          <div className="w-full bg-white/20 h-1.5 rounded-full mt-2">
            <div className="bg-emerald-400 h-1.5 rounded-full transition-all duration-500" style={{ width: `${avgProgress}%` }}></div>
          </div>
          <p className="text-[11px] mt-2 opacity-75 leading-snug">Overall compliance across portfolio sites</p>
        </div>
      </nav>

      {/* Footer / Meta Status */}
      <div id="sidebar-footer" className="p-4 border-t border-slate-200 text-xs font-mono text-slate-500 space-y-1 bg-slate-50">
        <div className="flex justify-between items-center">
          <span>KSA Local Time</span>
          <span className="text-slate-600">10:13 AM (UTC+3)</span>
        </div>
        <div className="flex justify-between items-center">
          <span>Region</span>
          <span className="text-slate-600 font-medium">Riyadh HQ</span>
        </div>
        <div className="flex justify-between items-center">
          <span>ERP Engine</span>
          <span className="text-indigo-600 font-semibold">v12.0.4-PROD</span>
        </div>
      </div>
    </aside>
  );
}
