/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { 
  Building2, 
  Layers, 
  FileText, 
  ShieldCheck, 
  History, 
  Sparkles,
  Search,
  Bell,
  X,
  FilePieChart,
  Plus,
  HelpCircle,
  FolderOpen,
  ChevronDown,
  LayoutDashboard,
  Briefcase,
  Scale,
  Printer,
  Settings,
  PanelLeftClose,
  PanelLeft
} from 'lucide-react';

import { 
  User, 
  Role, 
  Project, 
  BOQItem, 
  Quotation, 
  PurchaseOrder, 
  BudgetCategory, 
  Milestone, 
  Task, 
  Issue, 
  Variation, 
  Expense, 
  Invoice, 
  Payment, 
  Document, 
  AuditLog, 
  Notification,
  ProjectQuantity,
  Client,
  DocumentController,
  Tax
} from './types';

import { 
  INITIAL_USERS, 
  INITIAL_ROLES, 
  INITIAL_PROJECTS, 
  INITIAL_BOQS, 
  INITIAL_QUOTATIONS, 
  INITIAL_POS, 
  INITIAL_BUDGETS, 
  INITIAL_MILESTONES, 
  INITIAL_TASKS, 
  INITIAL_ISSUES, 
  INITIAL_VARIATIONS, 
  INITIAL_EXPENSES, 
  INITIAL_INVOICES, 
  INITIAL_PAYMENTS, 
  INITIAL_DOCUMENTS, 
  INITIAL_AUDIT_LOGS, 
  INITIAL_NOTIFICATIONS,
  INITIAL_PROJECT_QUANTITIES,
  WORKFLOW_STEP_NAMES,
  INITIAL_CLIENTS,
  INITIAL_DOCUMENT_CONTROLLERS
} from './data/mockData';

import Sidebar from './components/Sidebar';
import Header from './components/Header';
import DashboardView from './components/DashboardView';
import ProjectWorkspace from './components/ProjectWorkspace';
import WorkflowTracker from './components/WorkflowTracker';
import RoleManager from './components/RoleManager';
import ReportsView from './components/ReportsView';
import AuditLogsView from './components/AuditLogsView';
import ProjectsOverview from './components/ProjectsOverview';
import ProjectBOQView from './components/ProjectBOQView';
import ProjectClientsView from './components/ProjectClientsView';
import ProjectQuotationsView from './components/ProjectQuotationsView';
import ProjectPurchaseOrdersView from './components/ProjectPurchaseOrdersView';
import ProjectBudgetsView from './components/ProjectBudgetsView';
import ProjectMilestonesView from './components/ProjectMilestonesView';
import ProjectTasksView from './components/ProjectTasksView';
import ProjectSiteIssuesView from './components/ProjectSiteIssuesView';
import ProjectVariationsView from './components/ProjectVariationsView';
import ProjectExpensesView from './components/ProjectExpensesView';
import ProjectInvoicesView from './components/ProjectInvoicesView';
import ProjectPaymentsView from './components/ProjectPaymentsView';
import ProjectDocumentControllerView from './components/ProjectDocumentControllerView';
import SettingsView from './components/SettingsView';
import GlobalQuantitiesModal from './components/GlobalQuantitiesModal';
import LoginView from './components/LoginView';
import UserManager from './components/UserManager';

export default function App() {
  
  // Persistence via localStorage (fallback to Mock seed data if empty)
  const [projects, setProjects] = useState<Project[]>(() => {
    const saved = localStorage.getItem('wafaq_projects');
    return saved ? JSON.parse(saved) : INITIAL_PROJECTS;
  });

  const [currentUser, setCurrentUser] = useState<User>(() => {
    const saved = localStorage.getItem('wafaq_current_user');
    return saved ? JSON.parse(saved) : INITIAL_USERS[0]; // Tariq Al-Mansoor as GM
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('wafaq_is_authenticated') === 'true';
  });

  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('wafaq_users');
    return saved ? JSON.parse(saved) : INITIAL_USERS;
  });

  const [roles, setRoles] = useState<Role[]>(() => {
    const saved = localStorage.getItem('wafaq_roles');
    if (saved) {
      const parsed: Role[] = JSON.parse(saved);
      const missingRoles = INITIAL_ROLES.filter(ir => !parsed.some(r => r.id === ir.id));
      if (missingRoles.length > 0) {
        return [...parsed, ...missingRoles];
      }
      return parsed;
    }
    return INITIAL_ROLES;
  });

  const [taxes, setTaxes] = useState<Tax[]>(() => {
    const saved = localStorage.getItem('wafaq_taxes');
    return saved ? JSON.parse(saved) : [
      { id: 't1', name: 'ZATCA VAT', rate: 15 },
      { id: 't2', name: 'CGST', rate: 10 },
      { id: 't3', name: 'Sales Tax', rate: 5 },
      { id: 't4', name: 'Withholding Tax', rate: 2 },
    ];
  });

  const [activeTaxId, setActiveTaxId] = useState<string>(() => {
    return localStorage.getItem('wafaq_selected_tax_id') || 't1';
  });

  const [includeVat, setIncludeVat] = useState<boolean>(() => {
    return localStorage.getItem('wafaq_include_vat') === 'true';
  });

  const [excludeVat, setExcludeVat] = useState<boolean>(() => {
    return localStorage.getItem('wafaq_exclude_vat') === 'true';
  });

  const handleToggleIncludeVat = (val: boolean) => {
    setIncludeVat(val);
    localStorage.setItem('wafaq_include_vat', val ? 'true' : 'false');
    if (val) {
      setExcludeVat(false);
      localStorage.setItem('wafaq_exclude_vat', 'false');
    }
  };

  const handleToggleExcludeVat = (val: boolean) => {
    setExcludeVat(val);
    localStorage.setItem('wafaq_exclude_vat', val ? 'true' : 'false');
    if (val) {
      setIncludeVat(false);
      localStorage.setItem('wafaq_include_vat', 'false');
    }
  };

  const [boqList, setBoqList] = useState<BOQItem[]>(() => {
    const saved = localStorage.getItem('wafaq_boq');
    return saved ? JSON.parse(saved) : INITIAL_BOQS;
  });

  const [quotations, setQuotations] = useState<Quotation[]>(() => {
    const saved = localStorage.getItem('wafaq_quotations');
    return saved ? JSON.parse(saved) : INITIAL_QUOTATIONS;
  });

  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(() => {
    const saved = localStorage.getItem('wafaq_pos');
    return saved ? JSON.parse(saved) : INITIAL_POS;
  });

  const [budgets, setBudgets] = useState<BudgetCategory[]>(() => {
    const saved = localStorage.getItem('wafaq_budgets');
    return saved ? JSON.parse(saved) : INITIAL_BUDGETS;
  });

  const [milestones, setMilestones] = useState<Milestone[]>(() => {
    const saved = localStorage.getItem('wafaq_milestones');
    return saved ? JSON.parse(saved) : INITIAL_MILESTONES;
  });

  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('wafaq_tasks');
    return saved ? JSON.parse(saved) : INITIAL_TASKS;
  });

  const [issues, setIssues] = useState<Issue[]>(() => {
    const saved = localStorage.getItem('wafaq_issues');
    return saved ? JSON.parse(saved) : INITIAL_ISSUES;
  });

  const [variations, setVariations] = useState<Variation[]>(() => {
    const saved = localStorage.getItem('wafaq_variations');
    return saved ? JSON.parse(saved) : INITIAL_VARIATIONS;
  });

  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const saved = localStorage.getItem('wafaq_expenses');
    return saved ? JSON.parse(saved) : INITIAL_EXPENSES;
  });

  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    const saved = localStorage.getItem('wafaq_invoices');
    return saved ? JSON.parse(saved) : INITIAL_INVOICES;
  });

  const [payments, setPayments] = useState<Payment[]>(() => {
    const saved = localStorage.getItem('wafaq_payments');
    return saved ? JSON.parse(saved) : INITIAL_PAYMENTS;
  });

  const [documents, setDocuments] = useState<Document[]>(() => {
    const saved = localStorage.getItem('wafaq_documents');
    return saved ? JSON.parse(saved) : INITIAL_DOCUMENTS;
  });

  const [documentControllers, setDocumentControllers] = useState<DocumentController[]>(() => {
    const saved = localStorage.getItem('wafaq_document_controllers');
    return saved ? JSON.parse(saved) : INITIAL_DOCUMENT_CONTROLLERS;
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const saved = localStorage.getItem('wafaq_audit_logs');
    return saved ? JSON.parse(saved) : INITIAL_AUDIT_LOGS;
  });

  const [notifications, setNotifications] = useState<Notification[]>(() => {
    const saved = localStorage.getItem('wafaq_notifications');
    return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
  });

  const [projectQuantities, setProjectQuantities] = useState<ProjectQuantity[]>(() => {
    const saved = localStorage.getItem('wafaq_project_quantities');
    return saved ? JSON.parse(saved) : INITIAL_PROJECT_QUANTITIES;
  });

  const [clients, setClients] = useState<Client[]>(() => {
    const saved = localStorage.getItem('wafaq_clients');
    return saved ? JSON.parse(saved) : INITIAL_CLIENTS;
  });

  const [theme, setTheme] = useState<string>(() => {
    return localStorage.getItem('wafaq_theme') || 'wafaq-classic';
  });

  const [logoDark, setLogoDark] = useState<string>(() => {
    return localStorage.getItem('wafaq_logo_dark') || 'https://demo.workdo.io/taskly-saas/images/logos/logo-dark.png';
  });
  const [logoLight, setLogoLight] = useState<string>(() => {
    return localStorage.getItem('wafaq_logo_light') || 'https://demo.workdo.io/taskly-saas/images/logos/logo-light.png';
  });
  const [favicon, setFavicon] = useState<string>(() => {
    return localStorage.getItem('wafaq_favicon') || 'https://demo.workdo.io/taskly-saas/images/logos/favicon.png';
  });
  const [appName, setAppName] = useState<string>(() => {
    return localStorage.getItem('wafaq_app_name') || 'Wafaq ERP';
  });
  const [footerText, setFooterText] = useState<string>(() => {
    return localStorage.getItem('wafaq_footer_text') || '© 2026 Wafaq. All rights reserved.';
  });

  // Dynamic Favicon sync
  useEffect(() => {
    let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = favicon;
    localStorage.setItem('wafaq_favicon', favicon);
  }, [favicon]);

  useEffect(() => {
    localStorage.setItem('wafaq_logo_dark', logoDark);
  }, [logoDark]);

  useEffect(() => {
    localStorage.setItem('wafaq_logo_light', logoLight);
  }, [logoLight]);

  useEffect(() => {
    localStorage.setItem('wafaq_app_name', appName);
    document.title = appName;
  }, [appName]);

  useEffect(() => {
    localStorage.setItem('wafaq_footer_text', footerText);
  }, [footerText]);

  // Inject Custom Dynamic Theme Styles
  useEffect(() => {
    let styleEl = document.getElementById('wafaq-dynamic-theme') as HTMLStyleElement | null;
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'wafaq-dynamic-theme';
      document.head.appendChild(styleEl);
    }

    let css = '';
    if (theme === 'desert-emerald') {
      css = `
        :root, body, button, input, select, textarea {
          font-family: 'Outfit', 'Inter', sans-serif !important;
        }
        .bg-indigo-600 { background-color: #059669 !important; }
        .text-indigo-600 { color: #047857 !important; }
        .text-indigo-700 { color: #065f46 !important; }
        .bg-indigo-50 { background-color: #ecfdf5 !important; }
        .text-indigo-50 { color: #f0fdf4 !important; }
        .border-indigo-200 { border-color: #a7f3d0 !important; }
        .border-indigo-600 { border-color: #059669 !important; }
        .hover\\:bg-indigo-700:hover { background-color: #047857 !important; }
        .hover\\:text-indigo-700:hover { color: #065f46 !important; }
        .ring-indigo-600:focus { --tw-ring-color: #059669 !important; }
        #brand-icon { background-color: #059669 !important; }
        .text-indigo-900 { color: #064e3b !important; }
        .shadow-indigo-500\\/10 { shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.1), 0 2px 4px -1px rgba(16, 185, 129, 0.06) !important; }
      `;
    } else if (theme === 'modern-cyber') {
      css = `
        :root, body, button, input, select, textarea {
          font-family: 'JetBrains Mono', monospace !important;
        }
        .bg-indigo-600 { background-color: #8b5cf6 !important; }
        .text-indigo-600 { color: #8b5cf6 !important; }
        .text-indigo-700 { color: #7c3aed !important; }
        .bg-indigo-50 { background-color: #f5f3ff !important; }
        .text-indigo-50 { color: #f5f3ff !important; }
        .border-indigo-200 { border-color: #ddd6fe !important; }
        .border-indigo-600 { border-color: #8b5cf6 !important; }
        .hover\\:bg-indigo-700:hover { background-color: #7c3aed !important; }
        .hover\\:text-indigo-700:hover { color: #6d28d9 !important; }
        .ring-indigo-600:focus { --tw-ring-color: #8b5cf6 !important; }
        #brand-icon { background-color: #8b5cf6 !important; }
        .text-indigo-900 { color: #4c1d95 !important; }
      `;
    } else if (theme === 'editorial-amber') {
      css = `
        :root, body, button, input, select, textarea {
          font-family: 'Playfair Display', 'Georgia', serif !important;
        }
        .bg-indigo-600 { background-color: #be123c !important; }
        .text-indigo-600 { color: #be123c !important; }
        .text-indigo-700 { color: #9f1239 !important; }
        .bg-indigo-50 { background-color: #fff1f2 !important; }
        .text-indigo-50 { color: #fff1f2 !important; }
        .border-indigo-200 { border-color: #fecdd3 !important; }
        .border-indigo-600 { border-color: #be123c !important; }
        .hover\\:bg-indigo-700:hover { background-color: #9f1239 !important; }
        .hover\\:text-indigo-700:hover { color: #881337 !important; }
        .ring-indigo-600:focus { --tw-ring-color: #be123c !important; }
        #brand-icon { background-color: #be123c !important; }
        .text-indigo-900 { color: #4c0519 !important; }
      `;
    } else if (theme === 'nordic-minimalist') {
      css = `
        :root, body, button, input, select, textarea {
          font-family: 'Inter', sans-serif !important;
          font-weight: 300 !important;
        }
        .bg-indigo-600 { background-color: #475569 !important; }
        .text-indigo-600 { color: #334155 !important; }
        .text-indigo-700 { color: #1e293b !important; }
        .bg-indigo-50 { background-color: #f8fafc !important; }
        .text-indigo-50 { color: #f8fafc !important; }
        .border-indigo-200 { border-color: #e2e8f0 !important; }
        .border-indigo-600 { border-color: #475569 !important; }
        .hover\\:bg-indigo-700:hover { background-color: #334155 !important; }
        .hover\\:text-indigo-700:hover { color: #1e293b !important; }
        .ring-indigo-600:focus { --tw-ring-color: #475569 !important; }
        #brand-icon { background-color: #475569 !important; }
        .text-indigo-900 { color: #0f172a !important; }
      `;
    }

    styleEl.innerHTML = css;
    localStorage.setItem('wafaq_theme', theme);
  }, [theme]);

  // State for Navigation / Routing
  const [currentView, setCurrentView] = useState<string>('dashboard');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<'overview' | 'boq' | 'quotations' | 'po' | 'budget' | 'milestones' | 'tasks' | 'issues' | 'variations' | 'expenses' | 'invoices' | 'payments' | 'documents' | 'quantities' | 'clients'>('overview');
  const [projectWorkspaceSearchQuery, setProjectWorkspaceSearchQuery] = useState('');
  const [isProjectDirectoryOpen, setIsProjectDirectoryOpen] = useState(true);

  const currentPermissions = React.useMemo(() => {
    return roles.find(r => r.name === currentUser.role)?.permissions;
  }, [roles, currentUser]);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchOverlay, setShowSearchOverlay] = useState(false);

  // Global Quantities Modal state
  const [isQuantitiesModalOpen, setIsQuantitiesModalOpen] = useState(false);

  // New Project Modal State
  const [showCreateProjectModal, setShowCreateProjectModal] = useState(false);
  const [newProjName, setNewProjName] = useState('');
  const [newProjClient, setNewProjClient] = useState('');
  const [newProjVal, setNewProjVal] = useState(0);
  const [newProjBudget, setNewProjBudget] = useState(0);
  const [newProjLocation, setNewProjLocation] = useState('');
  const [newProjDesc, setNewProjDesc] = useState('');

  // Automated progress cascade (milestones from tasks, projects from milestones)
  useEffect(() => {
    let milestonesChanged = false;
    const nextMilestones = milestones.map(m => {
      const milestoneTasks = tasks.filter(t => t.milestoneId === m.id);
      if (milestoneTasks.length === 0) return m;

      let calculatedProgress = 0;
      const totalTaskWeight = milestoneTasks.reduce((acc, t) => acc + (t.weight ?? 0), 0);
      if (totalTaskWeight > 0) {
        const weightedSum = milestoneTasks.reduce((acc, t) => acc + (t.progress * (t.weight ?? 0)), 0);
        calculatedProgress = Math.min(100, Math.round(weightedSum / totalTaskWeight));
      } else {
        const sumProgress = milestoneTasks.reduce((acc, t) => acc + t.progress, 0);
        calculatedProgress = Math.round(sumProgress / milestoneTasks.length);
      }

      const nextStatus = calculatedProgress === 100 ? 'completed' : calculatedProgress > 0 ? 'in_progress' : 'pending';

      if (m.progress !== calculatedProgress || m.status !== nextStatus) {
        milestonesChanged = true;
        return {
          ...m,
          progress: calculatedProgress,
          status: nextStatus
        };
      }
      return m;
    });

    if (milestonesChanged) {
      setMilestones(nextMilestones);
    }

    // Now projects progress based on updated milestones
    let projectsChanged = false;
    const nextProjects = projects.map(p => {
      const projectMilestones = nextMilestones.filter(m => m.projectId === p.id);
      if (projectMilestones.length === 0) return p;

      let calculatedProgress = 0;
      const totalMilestoneWeight = projectMilestones.reduce((acc, m) => acc + (m.weight ?? 0), 0);
      if (totalMilestoneWeight > 0) {
        const weightedSum = projectMilestones.reduce((acc, m) => acc + (m.progress * (m.weight ?? 0)), 0);
        calculatedProgress = Math.min(100, Math.round(weightedSum / totalMilestoneWeight));
      } else {
        const sumProgress = projectMilestones.reduce((acc, m) => acc + m.progress, 0);
        calculatedProgress = Math.round(sumProgress / projectMilestones.length);
      }

      if (p.progress !== calculatedProgress) {
        projectsChanged = true;
        return {
          ...p,
          progress: calculatedProgress
        };
      }
      return p;
    });

    if (projectsChanged) {
      setProjects(nextProjects);
    }
  }, [tasks, milestones, projects]);

  // Sync state to LocalStorage
  useEffect(() => {
    localStorage.setItem('wafaq_projects', JSON.stringify(projects));
    localStorage.setItem('wafaq_current_user', JSON.stringify(currentUser));
    localStorage.setItem('wafaq_users', JSON.stringify(users));
    localStorage.setItem('wafaq_roles', JSON.stringify(roles));
    localStorage.setItem('wafaq_boq', JSON.stringify(boqList));
    localStorage.setItem('wafaq_quotations', JSON.stringify(quotations));
    localStorage.setItem('wafaq_pos', JSON.stringify(purchaseOrders));
    localStorage.setItem('wafaq_budgets', JSON.stringify(budgets));
    localStorage.setItem('wafaq_milestones', JSON.stringify(milestones));
    localStorage.setItem('wafaq_tasks', JSON.stringify(tasks));
    localStorage.setItem('wafaq_issues', JSON.stringify(issues));
    localStorage.setItem('wafaq_variations', JSON.stringify(variations));
    localStorage.setItem('wafaq_expenses', JSON.stringify(expenses));
    localStorage.setItem('wafaq_invoices', JSON.stringify(invoices));
    localStorage.setItem('wafaq_payments', JSON.stringify(payments));
    localStorage.setItem('wafaq_documents', JSON.stringify(documents));
    localStorage.setItem('wafaq_document_controllers', JSON.stringify(documentControllers));
    localStorage.setItem('wafaq_audit_logs', JSON.stringify(auditLogs));
    localStorage.setItem('wafaq_notifications', JSON.stringify(notifications));
    localStorage.setItem('wafaq_project_quantities', JSON.stringify(projectQuantities));
    localStorage.setItem('wafaq_clients', JSON.stringify(clients));
    localStorage.setItem('wafaq_taxes', JSON.stringify(taxes));
    localStorage.setItem('wafaq_selected_tax_id', activeTaxId);
    localStorage.setItem('wafaq_include_vat', includeVat ? 'true' : 'false');
    localStorage.setItem('wafaq_exclude_vat', excludeVat ? 'true' : 'false');
  }, [
    projects, currentUser, users, roles, boqList, quotations, purchaseOrders, 
    budgets, milestones, tasks, issues, variations, expenses, invoices, 
    payments, documents, documentControllers, auditLogs, notifications, projectQuantities, clients, taxes, activeTaxId, includeVat, excludeVat
  ]);

  const handleLogout = () => {
    // Log audit
    const newLog: AuditLog = {
      id: `al_${Date.now()}`,
      user: currentUser.name,
      role: currentUser.role,
      action: 'Employee signed out of portal',
      module: 'Security',
      ip: '192.168.1.101',
      device: 'Enterprise Web Portal Client',
      date: new Date().toISOString().slice(0, 10) + ' ' + new Date().toTimeString().slice(0, 5)
    };
    setAuditLogs(prev => [newLog, ...prev]);

    setIsAuthenticated(false);
    localStorage.removeItem('wafaq_is_authenticated');
  };

  // Global log audit helper
  const handleLogAudit = (action: string, module: string, oldValue?: string, newValue?: string) => {
    const newLog: AuditLog = {
      id: `al_${Date.now()}`,
      user: currentUser.name,
      role: currentUser.role,
      action,
      module,
      oldValue,
      newValue,
      ip: '192.168.1.101',
      device: 'Enterprise Web Portal Client',
      date: new Date().toISOString().slice(0, 10) + ' ' + new Date().toTimeString().slice(0, 5)
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  // Notification helper
  const handleAddNotification = (text: string, type: 'info' | 'success' | 'warning' | 'alert') => {
    const newNotif: Notification = {
      id: `n_${Date.now()}`,
      text,
      type,
      read: false,
      timestamp: new Date().toISOString().slice(0, 10) + ' ' + new Date().toTimeString().slice(0, 5)
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  // Update workflow steps in a non-linear way (any step at any time, pending/in_progress/completed)
  const handleUpdateWorkflowStepStatus = (projectId: string, stepNum: number, status: 'pending' | 'in_progress' | 'completed') => {
    const updatedProjects = projects.map(p => {
      if (p.id === projectId) {
        const currentStatuses: Record<number, 'pending' | 'in_progress' | 'completed'> = {};
        for (let i = 1; i <= 28; i++) {
          currentStatuses[i] = p.workflowStepsStatuses?.[i] || (i < p.currentWorkflowStep ? 'completed' : i === p.currentWorkflowStep ? 'in_progress' : 'pending');
        }
        const oldStatus = currentStatuses[stepNum] || 'pending';
        currentStatuses[stepNum] = status;

        let nextCurrentStep = p.currentWorkflowStep;
        if (status === 'in_progress') {
          nextCurrentStep = stepNum;
        }

        const stepName = WORKFLOW_STEP_NAMES[stepNum - 1];
        handleLogAudit(
          `Updated workflow step #${stepNum} ("${stepName}") status to ${status}`,
          'Contract Workflow',
          `Old status: ${oldStatus}`,
          `New status: ${status}`
        );

        handleAddNotification(
          `Step #${stepNum} for "${p.name}" updated to ${status}`,
          status === 'completed' ? 'success' : status === 'in_progress' ? 'info' : 'warning'
        );

        const completedCount = Object.values(currentStatuses).filter(s => s === 'completed').length;
        const nextProgress = Math.min(100, Math.round((completedCount / 28) * 100));

        return {
          ...p,
          workflowStepsStatuses: currentStatuses,
          currentWorkflowStep: nextCurrentStep,
          progress: nextProgress
        };
      }
      return p;
    });

    setProjects(updatedProjects);
  };

  // Add file attachment to a specific operational step
  const handleAddStepAttachment = (projectId: string, stepNum: number, fileName: string, fileSize: string, fileUrl?: string) => {
    const stepName = WORKFLOW_STEP_NAMES[stepNum - 1];
    const timestamp = new Date().toISOString().slice(0, 10) + ' ' + new Date().toTimeString().slice(0, 5);

    const updatedProjects = projects.map(p => {
      if (p.id === projectId) {
        const attachments = p.workflowStepsAttachments ? { ...p.workflowStepsAttachments } : {};
        const stepAttachments = attachments[stepNum] ? [...attachments[stepNum]] : [];
        
        stepAttachments.push({
          name: fileName,
          size: fileSize,
          uploadedAt: timestamp,
          uploadedBy: currentUser.name,
          url: fileUrl
        });

        attachments[stepNum] = stepAttachments;

        handleLogAudit(
          `Uploaded file "${fileName}" to Step #${stepNum}`,
          'Contract Workflow',
          undefined,
          `Step #${stepNum}: ${stepName}`
        );

        handleAddNotification(
          `File "${fileName}" uploaded for step #${stepNum} in "${p.name}"`,
          'success'
        );

        return {
          ...p,
          workflowStepsAttachments: attachments
        };
      }
      return p;
    });

    setProjects(updatedProjects);

    // Also register this under the main project documents collection
    const newDoc: Document = {
      id: `doc_wf_${Date.now()}`,
      projectId,
      name: fileName,
      category: 'Other',
      version: '1.0',
      uploadedBy: currentUser.name,
      uploadedAt: timestamp,
      size: fileSize,
      tags: ['Workflow Attachment', `Step ${stepNum}`, stepName],
      description: `Attached to Operational Step #${stepNum}: ${stepName}`,
      url: fileUrl
    };

    setDocuments(prev => [newDoc, ...prev]);
  };

  // Direct Project Creation (both from ProjectsOverview and form)
  const handleCreateProjectDirect = (newProj: Omit<Project, 'id' | 'code' | 'spent' | 'currentWorkflowStep' | 'progress'>) => {
    const projectId = `p_${Date.now()}`;
    const codeNum = projects.length + 1;
    const projectCode = `WF-PRJ-2026-0${codeNum}`;

    const created: Project = {
      ...newProj,
      id: projectId,
      code: projectCode,
      spent: 0,
      currentWorkflowStep: 1,
      progress: 0
    };

    // Seed default budgets categories for this new project
    const defaultBudgets: BudgetCategory[] = [
      { id: `bc_${Date.now()}_1`, projectId, name: 'Civil & Structural Base', allocated: newProj.budget * 0.4, spent: 0, color: 'emerald' },
      { id: `bc_${Date.now()}_2`, projectId, name: 'MEP Services', allocated: newProj.budget * 0.3, spent: 0, color: 'blue' },
      { id: `bc_${Date.now()}_3`, projectId, name: 'Finishes & Fitouts', allocated: newProj.budget * 0.2, spent: 0, color: 'indigo' },
      { id: `bc_${Date.now()}_4`, projectId, name: 'Logistics & Safety', allocated: newProj.budget * 0.1, spent: 0, color: 'amber' },
    ];

    // Seed default milestones for this new project
    const defaultMilestones: Milestone[] = [
      { id: `m_${Date.now()}_1`, projectId, name: 'Engineering Drawings & Sign-offs', weight: 20, progress: 0, status: 'pending', dueDate: '2026-10-30' },
      { id: `m_${Date.now()}_2`, projectId, name: 'Foundation Piling Excavation', weight: 30, progress: 0, status: 'pending', dueDate: '2027-01-15' },
      { id: `m_${Date.now()}_3`, projectId, name: 'Superstructure Framework Concrete', weight: 30, progress: 0, status: 'pending', dueDate: '2027-04-30' },
      { id: `m_${Date.now()}_4`, projectId, name: 'Facade Handover & Commissioning', weight: 20, progress: 0, status: 'pending', dueDate: '2027-08-30' },
    ];

    setProjects(prev => [...prev, created]);
    setBudgets(prev => [...prev, ...defaultBudgets]);
    setMilestones(prev => [...prev, ...defaultMilestones]);

    handleLogAudit(`Initialized new project contract "${created.name}"`, 'Projects Workspace', undefined, projectCode);
    handleAddNotification(`New contract award initialized: ${created.name} (${projectCode})`, 'success');

    // Switch to Workspace
    setCurrentView('projects');
    setSelectedProjectId(projectId);
  };

  const handleUpdateProjectDirect = (updatedProj: Project) => {
    setProjects(prev => prev.map(p => p.id === updatedProj.id ? updatedProj : p));
    handleLogAudit(`Updated project contract "${updatedProj.name}"`, 'Projects Workspace', undefined, updatedProj.code);
    handleAddNotification(`Contract "${updatedProj.name}" details updated successfully`, 'success');
  };

  // Create Project Callback from modal
  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjName || !newProjClient) return;

    handleCreateProjectDirect({
      name: newProjName,
      clientName: newProjClient,
      value: newProjVal,
      budget: newProjBudget,
      siteLocation: newProjLocation || 'Riyadh, Saudi Arabia',
      siteManager: currentUser.name,
      startDate: new Date().toISOString().slice(0, 10),
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      description: newProjDesc || 'Newly initialized commercial construction contract.',
      status: 'pending'
    });

    // Reset Form & Close
    setNewProjName('');
    setNewProjClient('');
    setNewProjVal(0);
    setNewProjBudget(0);
    setNewProjLocation('');
    setNewProjDesc('');
    setShowCreateProjectModal(false);
  };

  // Search Results filtering
  const searchResults = useMemo(() => {
    if (!searchQuery) return [];
    const query = searchQuery.toLowerCase();

    const results: { category: string; title: string; subtitle: string; action: () => void }[] = [];

    // Projects search
    projects.forEach(p => {
      if (p.name.toLowerCase().includes(query) || p.code.toLowerCase().includes(query)) {
        results.push({
          category: 'Project Workspaces',
          title: p.name,
          subtitle: `Project Code: ${p.code} | Client: ${p.clientName}`,
          action: () => {
            setCurrentView('projects');
            setSelectedProjectId(p.id);
            setShowSearchOverlay(false);
          }
        });
      }
    });

    // Invoices search
    invoices.forEach(i => {
      if (i.invoiceNumber.toLowerCase().includes(query) || i.milestoneName.toLowerCase().includes(query)) {
        results.push({
          category: 'Client Valuation Invoices',
          title: i.invoiceNumber,
          subtitle: `Milestone: ${i.milestoneName} | Net Net: ${i.totalAmount.toLocaleString()} SAR`,
          action: () => {
            const matchProj = projects.find(p => p.id === i.projectId);
            if (matchProj) {
              setCurrentView('projects');
              setSelectedProjectId(matchProj.id);
            }
            setShowSearchOverlay(false);
          }
        });
      }
    });

    // Tasks search
    tasks.forEach(t => {
      if (t.name.toLowerCase().includes(query)) {
        results.push({
          category: 'Site Checklist Tasks',
          title: t.name,
          subtitle: `Assignee: ${t.assigneeName} | Progress: ${t.progress}%`,
          action: () => {
            const matchProj = projects.find(p => p.id === t.projectId);
            if (matchProj) {
              setCurrentView('projects');
              setSelectedProjectId(matchProj.id);
            }
            setShowSearchOverlay(false);
          }
        });
      }
    });

    // Expenses search
    expenses.forEach(e => {
      if (e.vendor.toLowerCase().includes(query) || e.description.toLowerCase().includes(query)) {
        results.push({
          category: 'Supplier Expenditures',
          title: e.vendor,
          subtitle: `Receipt details: ${e.description} | Net Amount: ${e.totalAmount.toLocaleString()} SAR`,
          action: () => {
            const matchProj = projects.find(p => p.id === e.projectId);
            if (matchProj) {
              setCurrentView('projects');
              setSelectedProjectId(matchProj.id);
            }
            setShowSearchOverlay(false);
          }
        });
      }
    });

    return results;
  }, [searchQuery, projects, invoices, tasks, expenses]);

  const activeProject = useMemo(() => {
    return projects.find(p => p.id === selectedProjectId) || null;
  }, [projects, selectedProjectId]);

  if (!isAuthenticated) {
    return (
      <LoginView
        appName={appName}
        logoLight={logoLight}
        logoDark={logoDark}
        footerText={footerText}
        availableUsers={users}
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          setIsAuthenticated(true);
          localStorage.setItem('wafaq_is_authenticated', 'true');
          localStorage.setItem('wafaq_current_user', JSON.stringify(user));
          
          // Log audit directly since state update is async
          const newLog: AuditLog = {
            id: `al_${Date.now()}`,
            user: user.name,
            role: user.role,
            action: 'Employee signed in to portal',
            module: 'Security',
            ip: '192.168.1.101',
            device: 'Enterprise Web Portal Client',
            date: new Date().toISOString().slice(0, 10) + ' ' + new Date().toTimeString().slice(0, 5)
          };
          setAuditLogs(prev => [newLog, ...prev]);
        }}
      />
    );
  }

  return (
    <div id="wafaq-erp-app-shell" className="flex h-screen bg-gray-50/50 overflow-hidden font-sans relative">
      
      {/* Mobile Sidebar Backdrop overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <Sidebar
        currentView={currentView}
        setCurrentView={setCurrentView}
        projects={projects}
        selectedProjectId={selectedProjectId}
        setSelectedProjectId={setSelectedProjectId}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        appName={appName}
        logoDark={logoDark}
        currentUser={currentUser}
        roles={roles}
      />

      {/* Main Content Workspace viewport */}
      <div id="main-viewport-wrapper" className="flex-1 flex flex-col h-full overflow-hidden w-full">
        
        {/* Universal Top Header */}
        <Header
          currentUser={currentUser}
          setCurrentUser={setCurrentUser}
          availableUsers={users}
          availableRoles={roles}
          notifications={notifications}
          setNotifications={setNotifications}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onOpenSearch={() => setShowSearchOverlay(true)}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          onLogout={handleLogout}
          taxes={taxes}
          activeTaxId={activeTaxId}
          setActiveTaxId={setActiveTaxId}
          includeVat={includeVat}
          onToggleIncludeVat={handleToggleIncludeVat}
          excludeVat={excludeVat}
          onToggleExcludeVat={handleToggleExcludeVat}
        />

        {/* Dynamic Route views */}
        <main id="view-viewport" className="flex-1 overflow-hidden flex flex-col relative pb-16 lg:pb-0">
          
          {currentView === 'dashboard' && currentPermissions?.viewDashboard !== false && (
            <DashboardView
              projects={projects}
              budgets={budgets}
              expenses={expenses}
              invoices={invoices}
              payments={payments}
              auditLogs={auditLogs}
              currentUser={currentUser}
              onNavigateToProject={(id) => {
                setCurrentView('projects');
                setSelectedProjectId(id);
              }}
              onOpenCreateProject={() => setShowCreateProjectModal(true)}
            />
          )}

          {currentView === 'projects' && activeProject && currentPermissions?.viewProjectsWorkspace !== false && (
            <div className="flex-1 flex overflow-hidden min-h-0 w-full bg-slate-50">
              
              {/* LEFT SIDEBAR: Project Selector */}
              <div 
                className={`hidden lg:flex border-r border-slate-200 bg-white flex-col h-full shrink-0 relative z-10 transition-all duration-300 ${isProjectDirectoryOpen ? 'w-72' : 'w-14'}`}
              >
                <div className="p-3 border-b border-slate-100 shrink-0 flex items-center justify-between">
                  {isProjectDirectoryOpen && (
                    <h3 className="text-xs font-mono font-bold text-slate-800 uppercase tracking-widest px-1">Projects Directory</h3>
                  )}
                  <button 
                    onClick={() => setIsProjectDirectoryOpen(!isProjectDirectoryOpen)}
                    className="p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors mx-auto"
                    title={isProjectDirectoryOpen ? "Collapse Directory" : "Expand Directory"}
                  >
                    {isProjectDirectoryOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeft className="w-4 h-4" />}
                  </button>
                </div>
                
                {isProjectDirectoryOpen ? (
                  <>
                    <div className="p-4 border-b border-slate-100 shrink-0">
                      <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Search projects..."
                          value={projectWorkspaceSearchQuery}
                          onChange={(e) => setProjectWorkspaceSearchQuery(e.target.value)}
                          className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-indigo-500 outline-none transition-shadow"
                        />
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-3 space-y-1">
                      {projects.filter(p => 
                        p.name.toLowerCase().includes(projectWorkspaceSearchQuery.toLowerCase()) || 
                        p.code.toLowerCase().includes(projectWorkspaceSearchQuery.toLowerCase()) ||
                        (p.clientName && p.clientName.toLowerCase().includes(projectWorkspaceSearchQuery.toLowerCase()))
                      ).map((p) => {
                        const isActive = selectedProjectId === p.id;
                        return (
                          <button
                            key={p.id}
                            onClick={() => setSelectedProjectId(p.id)}
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
                                {p.progress}%
                              </span>
                            </div>
                            <h4 className="font-bold text-[11px] text-slate-800 mt-1.5 line-clamp-1">{p.name}</h4>
                            <p className="text-[9px] text-slate-500 mt-0.5 truncate">
                              Client: <span className="font-medium text-slate-600">{p.clientName}</span>
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <div className="flex-1 overflow-y-auto py-3 space-y-2 flex flex-col items-center">
                    {projects.map((p) => {
                      const isActive = selectedProjectId === p.id;
                      return (
                        <button
                          key={p.id}
                          onClick={() => {
                            setSelectedProjectId(p.id);
                            setIsProjectDirectoryOpen(true);
                          }}
                          className={`w-10 h-10 rounded-xl transition-all cursor-pointer border flex flex-col items-center justify-center relative group ${
                            isActive 
                              ? 'bg-indigo-50 border-indigo-200 shadow-sm' 
                              : 'bg-transparent border-transparent hover:bg-slate-100 hover:border-slate-200'
                          }`}
                          title={`${p.code} - ${p.name}`}
                        >
                          <span className={`text-[10px] font-mono font-extrabold ${isActive ? 'text-indigo-600' : 'text-slate-500 group-hover:text-slate-700'}`}>
                            {p.code.split('-').pop()}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Main Workspace Content */}
              <div id="project-workspace-split-container" className="flex-1 flex flex-col h-full overflow-y-auto">
                {/* Step Tracking Pipeline Header inside Projects view */}
                <div className="px-4 md:px-6 pt-4 bg-white shrink-0 space-y-3 pb-2 border-b border-gray-100/60">
                  
                  {/* Mobile Active Project Dropdown Switcher */}
                  <div className="block lg:hidden w-full px-1">
                    <label className="block text-[9px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-1.5">Select Project Workspace</label>
                    <div className="relative active-scale">
                      <select
                        value={selectedProjectId || ''}
                        onChange={(e) => {
                          setSelectedProjectId(e.target.value);
                        }}
                        className="w-full bg-slate-100/80 text-slate-800 text-sm font-semibold rounded-xl p-2.5 pr-8 appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500 border border-slate-200 cursor-pointer"
                      >
                        {projects.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.code} - {p.name} ({p.progress}%)
                          </option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <ChevronDown className="w-4 h-4 text-slate-500" />
                      </div>
                    </div>
                  </div>

                  <WorkflowTracker
                    project={activeProject}
                    currentUser={currentUser}
                    onUpdateWorkflowStepStatus={handleUpdateWorkflowStepStatus}
                    onNavigateToTab={(tabName) => setActiveWorkspaceTab(tabName)}
                    onAddStepAttachment={handleAddStepAttachment}
                  />
                </div>

                <div className="flex-1 flex flex-col overflow-visible">
                  <ProjectWorkspace
                  roles={roles}
                  project={activeProject}
                  currentUser={currentUser}
                  availableUsers={users}
                  boqList={boqList}
                  setBoqList={setBoqList}
                  quotations={quotations}
                  setQuotations={setQuotations}
                  purchaseOrders={purchaseOrders}
                  setPurchaseOrders={setPurchaseOrders}
                  budgets={budgets}
                  setBudgets={setBudgets}
                  milestones={milestones}
                  setMilestones={setMilestones}
                  tasks={tasks}
                  setTasks={setTasks}
                  issues={issues}
                  setIssues={setIssues}
                  variations={variations}
                  setVariations={setVariations}
                  expenses={expenses}
                  setExpenses={setExpenses}
                  invoices={invoices}
                  setInvoices={setInvoices}
                  payments={payments}
                  setPayments={setPayments}
                  documents={documents}
                  setDocuments={setDocuments}
                  projectQuantities={projectQuantities}
                  setProjectQuantities={setProjectQuantities}
                  clients={clients}
                  setClients={setClients}
                  onLogAudit={handleLogAudit}
                  onAddNotification={handleAddNotification}
                  activeTab={activeWorkspaceTab}
                  setActiveTab={setActiveWorkspaceTab}
                  includeVat={includeVat}
                  excludeVat={excludeVat}
                />
              </div>
            </div>
          </div>
          )}

          {currentView === 'project' && currentPermissions?.viewProjectDetails !== false && (
            <ProjectsOverview
              projects={projects}
              onAddProject={handleCreateProjectDirect}
              onUpdateProject={handleUpdateProjectDirect}
              onViewWorkspace={(id) => {
                setCurrentView('projects');
                setSelectedProjectId(id);
              }}
              currentUser={currentUser}
            />
          )}

          {currentView === 'project-boq' && (
            <ProjectBOQView
              projects={projects}
              boqList={boqList}
              setBoqList={setBoqList}
              currentUser={currentUser}
              onLogAudit={handleLogAudit}
              onAddNotification={handleAddNotification}
              onViewWorkspace={(id, tab) => {
                setCurrentView('projects');
                setSelectedProjectId(id);
                if (tab) {
                  setActiveWorkspaceTab(tab as any);
                }
              }}
            />
          )}

          {currentView === 'project-clients' && (
            <ProjectClientsView
              projects={projects}
              clients={clients}
              setClients={setClients}
              currentUser={currentUser}
              onLogAudit={handleLogAudit}
              onAddNotification={handleAddNotification}
              onViewWorkspace={(id, tab) => {
                setCurrentView('projects');
                setSelectedProjectId(id);
                if (tab) {
                  setActiveWorkspaceTab(tab as any);
                }
              }}
            />
          )}

          {currentView === 'project-quotations' && (
            <ProjectQuotationsView
              projects={projects}
              quotations={quotations}
              setQuotations={setQuotations}
              currentUser={currentUser}
              onLogAudit={handleLogAudit}
              onAddNotification={handleAddNotification}
              documents={documents}
              setDocuments={setDocuments}
            />
          )}

          {currentView === 'project-purchase-orders' && (
            <ProjectPurchaseOrdersView
              projects={projects}
              purchaseOrders={purchaseOrders}
              setPurchaseOrders={setPurchaseOrders}
              currentUser={currentUser}
              onLogAudit={handleLogAudit}
              onAddNotification={handleAddNotification}
              documents={documents}
              setDocuments={setDocuments}
            />
          )}

           {currentView === 'project-budgets' && (
            <ProjectBudgetsView
              projects={projects}
              budgets={budgets}
              setBudgets={setBudgets}
              currentUser={currentUser}
              onLogAudit={handleLogAudit}
              onAddNotification={handleAddNotification}
            />
          )}

          {currentView === 'project-milestones' && (
            <ProjectMilestonesView
              projects={projects}
              milestones={milestones}
              setMilestones={setMilestones}
              currentUser={currentUser}
              onLogAudit={handleLogAudit}
              onAddNotification={handleAddNotification}
            />
          )}

          {currentView === 'project-tasks' && (
            <ProjectTasksView
              projects={projects}
              milestones={milestones}
              tasks={tasks}
              setTasks={setTasks}
              currentUser={currentUser}
              availableUsers={users}
              onLogAudit={handleLogAudit}
              onAddNotification={handleAddNotification}
            />
          )}

          {currentView === 'project-issues' && (
            <ProjectSiteIssuesView
              projects={projects}
              milestones={milestones}
              issues={issues}
              setIssues={setIssues}
              currentUser={currentUser}
              availableUsers={users}
              onLogAudit={handleLogAudit}
              onAddNotification={handleAddNotification}
            />
          )}

          {currentView === 'project-variations' && (
            <ProjectVariationsView
              projects={projects}
              variations={variations}
              setVariations={setVariations}
              currentUser={currentUser}
              availableUsers={users}
              onLogAudit={handleLogAudit}
              onAddNotification={handleAddNotification}
            />
          )}

          {currentView === 'project-expenses' && (
            <ProjectExpensesView
              projects={projects}
              budgets={budgets}
              expenses={expenses}
              setExpenses={setExpenses}
              currentUser={currentUser}
              availableUsers={users}
              onLogAudit={handleLogAudit}
              onAddNotification={handleAddNotification}
              includeVat={includeVat}
              excludeVat={excludeVat}
            />
          )}

          {currentView === 'project-invoices' && (
            <ProjectInvoicesView
              projects={projects}
              milestones={milestones}
              invoices={invoices}
              setInvoices={setInvoices}
              payments={payments}
              setPayments={setPayments}
              currentUser={currentUser}
              availableUsers={users}
              onLogAudit={handleLogAudit}
              onAddNotification={handleAddNotification}
            />
          )}

          {currentView === 'project-payments' && (
            <ProjectPaymentsView
              projects={projects}
              milestones={milestones}
              invoices={invoices}
              setInvoices={setInvoices}
              payments={payments}
              setPayments={setPayments}
              currentUser={currentUser}
              availableUsers={users}
              onLogAudit={handleLogAudit}
              onAddNotification={handleAddNotification}
            />
          )}

          {currentView === 'project-document-controller' && (
            <ProjectDocumentControllerView
              projects={projects}
              milestones={milestones}
              invoices={invoices}
              setInvoices={setInvoices}
              payments={payments}
              setPayments={setPayments}
              documentControllers={documentControllers}
              setDocumentControllers={setDocumentControllers}
              currentUser={currentUser}
              availableUsers={users}
              onLogAudit={handleLogAudit}
              onAddNotification={handleAddNotification}
            />
          )}

          {currentView === 'roles' && currentPermissions?.viewRolesAndPermissions !== false && (
            <RoleManager
              roles={roles}
              setRoles={setRoles}
              availableUsers={users}
              currentUser={currentUser}
            />
          )}

          {currentView === 'settings' && currentPermissions?.viewSystemSettings !== false && (
            <SettingsView
              roles={roles}
              setRoles={setRoles}
              users={users}
              setUsers={setUsers}
              currentUser={currentUser}
              onAddNotification={handleAddNotification}
              onLogAudit={handleLogAudit}
              theme={theme}
              setTheme={setTheme}
              logoDark={logoDark}
              setLogoDark={setLogoDark}
              logoLight={logoLight}
              setLogoLight={setLogoLight}
              favicon={favicon}
              setFavicon={setFavicon}
              appName={appName}
              setAppName={setAppName}
              footerText={footerText}
              setFooterText={setFooterText}
              taxes={taxes}
              setTaxes={setTaxes}
            />
          )}

          {currentView === 'reports' && currentPermissions?.viewAnalyticalReports !== false && (
            <ReportsView
              projects={projects}
              budgets={budgets}
              expenses={expenses}
              invoices={invoices}
              payments={payments}
            />
          )}

          {currentView === 'audit' && currentPermissions?.viewAuditLogs !== false && (
            <AuditLogsView
              logs={auditLogs}
            />
          )}

          {currentView === 'users' && currentPermissions?.manageUsers !== false && (
            <UserManager
              users={users}
              setUsers={setUsers}
              roles={roles}
              currentUser={currentUser}
              onLogAudit={handleLogAudit}
              auditLogs={auditLogs}
            />
          )}

          {/* Global Developer Footer */}
          <div className="bg-white border-t border-slate-200 py-1.5 px-4 shrink-0 z-20 text-center w-full mt-auto shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] relative">
            <div className="text-[9px] text-slate-500 font-mono flex flex-col sm:flex-row items-center justify-center sm:space-x-4 space-y-0.5 sm:space-y-0">
              <span className="font-bold text-slate-700">Developed and Designed by: Mohammad iftekhairul alam</span>
              <div className="flex items-center space-x-3">
                <span>FB: fb.com/fyslbd</span>
                <span>Whatsapp: @fyslbd</span>
                <span>Mobile: +966557916317</span>
              </div>
            </div>
          </div>
        </main>

        {/* Beautiful Mobile Sticky Bottom Navigation Bar */}
        <div id="mobile-bottom-nav" className="lg:hidden fixed bottom-0 inset-x-0 bg-white border-t border-slate-200 z-40 flex items-center justify-around h-16 shadow-2xl px-1 select-none">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { id: 'project', label: 'Project', icon: FolderOpen },
            { id: 'projects', label: 'Workspace', icon: Briefcase },
            { id: 'roles', label: 'Permissions', icon: ShieldCheck },
            { id: 'reports', label: 'Reports', icon: FilePieChart },
            { id: 'settings', label: 'Settings', icon: Settings }
          ].map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                id={`mobile-nav-btn-${item.id}`}
                onClick={() => {
                  setCurrentView(item.id);
                  if (item.id === 'projects' && projects.length > 0 && !selectedProjectId) {
                    setSelectedProjectId(projects[0].id);
                  }
                }}
                className={`flex flex-col items-center justify-center flex-1 h-full py-1.5 transition cursor-pointer active-scale ${
                  isActive 
                    ? 'text-indigo-600 font-bold' 
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <Icon className={`w-5 h-5 mb-1 transition-transform duration-150 ${isActive ? 'scale-110 text-indigo-600' : 'text-slate-400'}`} />
                <span className="text-[9px] tracking-tight leading-none uppercase font-mono">{item.label}</span>
              </button>
            );
          })}
        </div>

      </div>

      {/* Global Interactive Search Overlay Modal */}
      {showSearchOverlay && (
        <div id="search-overlay" className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-50 flex justify-center sm:pt-24 pt-4 px-4 select-none">
          <div className="bg-white rounded-xl shadow-2xl border border-gray-150 w-full max-w-2xl max-h-[85vh] sm:max-h-[60vh] flex flex-col overflow-hidden animate-in fade-in duration-150">
            <div className="p-4 border-b border-gray-100 flex items-center space-x-3 bg-gray-50/50">
              <Search className="w-4 h-4 text-gray-400" />
              <input
                type="text"
                autoFocus
                placeholder="Type keywords to search portfolio..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-sm focus:outline-none text-gray-800"
              />
              <button 
                onClick={() => {
                  setShowSearchOverlay(false);
                  setSearchQuery('');
                }}
                className="p-1 text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {searchResults.length > 0 ? (
                <div className="space-y-3">
                  <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-gray-400 block px-1">
                    System Records Found ({searchResults.length})
                  </span>
                  <div className="space-y-1.5">
                    {searchResults.map((res, idx) => (
                      <button
                        key={idx}
                        onClick={res.action}
                        className="w-full text-left p-2.5 rounded-lg border border-gray-100 hover:bg-amber-50/30 hover:border-amber-500/20 transition flex justify-between items-center cursor-pointer"
                      >
                        <div>
                          <p className="text-xs font-bold text-gray-800 leading-tight">{res.title}</p>
                          <span className="text-[10px] text-gray-400 font-medium block mt-0.5">{res.subtitle}</span>
                        </div>
                        <span className="text-[9px] font-mono bg-gray-100 text-gray-600 px-2 py-0.5 rounded uppercase shrink-0 ml-2">
                          {res.category}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : searchQuery ? (
                <div className="p-12 text-center text-gray-400 text-xs italic">
                  No matching database entries located for "{searchQuery}"
                </div>
              ) : (
                <div className="p-12 text-center text-gray-400 text-xs">
                  Begin typing to instantly query active contracts, progress billings, site issues, and structural milestones.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Slide-over/Dialog Modal for Creating New Projects */}
      {showCreateProjectModal && (
        <div id="new-project-modal" className="fixed inset-0 bg-slate-950/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs select-none">
          <div className="bg-white rounded-2xl border border-gray-150 shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="bg-slate-900 text-white p-5 border-b border-slate-800 flex justify-between items-center">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-amber-500 font-mono">Initialize Contract Project</h3>
                <h4 className="text-sm font-bold text-slate-100 mt-1">New Construction Scope Award</h4>
              </div>
              <button 
                onClick={() => setShowCreateProjectModal(false)}
                className="text-slate-400 hover:text-white transition p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-mono text-gray-400 uppercase">Project Name / Description</label>
                <input
                  type="text"
                  required
                  value={newProjName}
                  onChange={e => setNewProjName(e.target.value)}
                  placeholder="e.g. Al-Fursan Villa Housing Block C"
                  className="w-full border border-gray-200 rounded p-2 text-xs mt-1 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-gray-400 uppercase">Client Developer</label>
                <input
                  type="text"
                  required
                  value={newProjClient}
                  onChange={e => setNewProjClient(e.target.value)}
                  placeholder="e.g. ROSHN Real Estate Development"
                  className="w-full border border-gray-200 rounded p-2 text-xs mt-1 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-mono text-gray-400 uppercase">Total Contract Value (SAR)</label>
                  <input
                    type="number"
                    required
                    value={newProjVal || ''}
                    onChange={e => setNewProjVal(Number(e.target.value))}
                    className="w-full border border-gray-200 rounded p-2 text-xs mt-1 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-gray-400 uppercase">Internal Cost Budget (SAR)</label>
                  <input
                    type="number"
                    required
                    value={newProjBudget || ''}
                    onChange={e => setNewProjBudget(Number(e.target.value))}
                    className="w-full border border-gray-200 rounded p-2 text-xs mt-1 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono text-gray-400 uppercase">Site Location HQ</label>
                <input
                  type="text"
                  value={newProjLocation}
                  onChange={e => setNewProjLocation(e.target.value)}
                  placeholder="e.g. Al-Narjis District, Riyadh, KSA"
                  className="w-full border border-gray-200 rounded p-2 text-xs mt-1 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-gray-400 uppercase">Scope Summary</label>
                <textarea
                  value={newProjDesc}
                  onChange={e => setNewProjDesc(e.target.value)}
                  placeholder="Specify brief engineering and material scope of works."
                  className="w-full border border-gray-200 rounded p-2 text-xs mt-1 focus:outline-none focus:border-amber-500 h-20 resize-none"
                />
              </div>

              <div className="flex justify-end space-x-2 border-t border-gray-100 pt-4">
                <button 
                  type="button" 
                  onClick={() => setShowCreateProjectModal(false)}
                  className="text-xs text-gray-500 font-bold px-3 py-1.5"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="bg-amber-500 hover:bg-amber-600 text-slate-950 px-4 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer shadow-lg shadow-amber-500/10"
                >
                  Initialize Contract
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <GlobalQuantitiesModal
        isOpen={isQuantitiesModalOpen}
        onClose={() => setIsQuantitiesModalOpen(false)}
        activeProject={activeProject || projects[0]}
        projects={projects}
        onSelectProject={(projectId) => setSelectedProjectId(projectId)}
        quantities={projectQuantities}
        setQuantities={setProjectQuantities}
        currentUser={currentUser}
        onLogAudit={handleLogAudit}
        onAddNotification={handleAddNotification}
      />

    </div>
  );
}
