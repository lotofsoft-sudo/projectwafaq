/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Settings, 
  Paintbrush, 
  ShieldCheck, 
  DollarSign, 
  Mail, 
  Percent, 
  Save, 
  Plus, 
  Trash2, 
  Users, 
  Check, 
  Sparkles, 
  Info,
  Server,
  Bell,
  CheckSquare,
  Globe,
  RefreshCw,
  Building2,
  Lock,
  UserCheck,
  Upload
} from 'lucide-react';
import { Role, User, Permission, Tax } from '../types';

interface SettingsViewProps {
  roles: Role[];
  setRoles: React.Dispatch<React.SetStateAction<Role[]>>;
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  currentUser: User;
  onAddNotification: (message: string, type: 'info' | 'success' | 'warning' | 'alert') => void;
  onLogAudit: (action: string, module: string, oldValue?: string, newValue?: string) => void;
  theme: string;
  setTheme: (theme: string) => void;
  logoDark: string;
  setLogoDark: (logo: string) => void;
  logoLight: string;
  setLogoLight: (logo: string) => void;
  favicon: string;
  setFavicon: (favicon: string) => void;
  appName: string;
  setAppName: (name: string) => void;
  footerText: string;
  setFooterText: (text: string) => void;
  taxes: Tax[];
  setTaxes: React.Dispatch<React.SetStateAction<Tax[]>>;
}

export default function SettingsView({
  roles,
  setRoles,
  users,
  setUsers,
  currentUser,
  onAddNotification,
  onLogAudit,
  theme,
  setTheme,
  logoDark,
  setLogoDark,
  logoLight,
  setLogoLight,
  favicon,
  setFavicon,
  appName,
  setAppName,
  footerText,
  setFooterText,
  taxes,
  setTaxes,
}: SettingsViewProps) {
  const [activeTab, setActiveTab] = useState<'brand' | 'roles' | 'currency' | 'email' | 'tax'>('brand');

  // --- BRAND SETTINGS STATE ---

  const [isDraggingDark, setIsDraggingDark] = useState(false);
  const [isDraggingLight, setIsDraggingLight] = useState(false);
  const [isDraggingFavicon, setIsDraggingFavicon] = useState(false);

  // --- CURRENCY SETTINGS STATE ---
  const [defaultCurrency, setDefaultCurrency] = useState('SAR');
  const [decimalPlaces, setDecimalPlaces] = useState(2);
  const [symbolPosition, setSymbolPosition] = useState<'left' | 'right'>('right');
  const [decimalSeparator, setDecimalSeparator] = useState<'dot' | 'comma'>('dot');
  const [thousandsSeparator, setThousandsSeparator] = useState<'comma' | 'dot' | 'space'>('comma');
  const [showDecimals, setShowDecimals] = useState(true);
  const [addSpaceInCurrency, setAddSpaceInCurrency] = useState(true);

  // --- EMAIL SETTINGS STATE ---
  const [emailProvider, setEmailProvider] = useState('SMTP');
  const [mailDriver, setMailDriver] = useState('smtp');
  const [smtpHost, setSmtpHost] = useState('smtp.wafaq-erp.com');
  const [smtpPort, setSmtpPort] = useState('587');
  const [smtpUser, setSmtpUser] = useState('notifications@wafaq.com');
  const [smtpPassword, setSmtpPassword] = useState('•••••••••••••••••');
  const [mailEncryption, setMailEncryption] = useState('TLS');
  const [fromAddress, setFromAddress] = useState('noreply@wafaq.com');
  const [fromName, setFromName] = useState('Wafaq System Manager');
  const [testEmailTo, setTestEmailTo] = useState('');

  // --- EMAIL NOTIFICATIONS STATE ---
  const [notifSettings, setNotifSettings] = useState({
    workspaceInvitation: true,
    projectAssignment: true,
    taskAssignment: true,
    siteIssueAlert: true,
    expenseNotification: false,
    invoiceNotification: true,
    contractCreated: true,
    statusUpdated: true,
    commentsAdded: false,
  });

  const [newTaxName, setNewTaxName] = useState('');
  const [newTaxRate, setNewTaxRate] = useState(15);

  // --- PAYMENT SETTINGS STATE ---
  const [bankDetails, setBankDetails] = useState('Bank: Al Rajhi Bank\\nAccount: SA80 4000 0000 1234 5678 9012\\nRouting: ARJBRIXX');

  // --- ROLE MANAGER STATE ---
  const [selectedRoleId, setSelectedRoleId] = useState<string>(roles[0]?.id || '');
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDesc, setNewRoleDesc] = useState('');
  const [showAddRoleForm, setShowAddRoleForm] = useState(false);

  const selectedRole = roles.find(r => r.id === selectedRoleId);
  const isGM = currentUser.role.toLowerCase() === 'admin' || currentUser.role.toLowerCase() === 'super admin' || currentUser.role.toLowerCase() === 'superadmin';

  const themeTemplates = [
    { 
      id: 'wafaq-classic', 
      name: 'Wafaq Classic', 
      desc: 'Corporate slate with deep indigo accents & Inter font.',
      primaryColor: 'bg-indigo-600',
      textColor: 'text-indigo-600',
      ringColor: 'ring-indigo-600',
      bgColor: 'bg-indigo-50',
      font: 'Inter (Sans-Serif)',
      headerStyle: 'Flat Bordered White'
    },
    { 
      id: 'desert-emerald', 
      name: 'Desert Emerald', 
      desc: 'Earthy organic greens, warm sand surfaces & Outfit geometric typography.',
      primaryColor: 'bg-emerald-600',
      textColor: 'text-emerald-700',
      ringColor: 'ring-emerald-600',
      bgColor: 'bg-emerald-50',
      font: 'Outfit (Geometric Sans)',
      headerStyle: 'Glassmorphic Floating'
    },
    { 
      id: 'modern-cyber', 
      name: 'Modern Cyber', 
      desc: 'Futuristic high-contrast dark console with fuchsia accents & monospace code font.',
      primaryColor: 'bg-purple-600',
      textColor: 'text-purple-600',
      ringColor: 'ring-purple-600',
      bgColor: 'bg-purple-50',
      font: 'JetBrains Mono (Monospace)',
      headerStyle: 'Tech Dark Slate'
    },
    { 
      id: 'editorial-amber', 
      name: 'Editorial Amber', 
      desc: 'Classy bookish warmth with amber, crimson, and elegant serif headings.',
      primaryColor: 'bg-rose-700',
      textColor: 'text-rose-700',
      ringColor: 'ring-rose-700',
      bgColor: 'bg-rose-50',
      font: 'Playfair Display (Serif)',
      headerStyle: 'Warm Textured Linen'
    },
    { 
      id: 'nordic-minimalist', 
      name: 'Nordic Minimalist', 
      desc: 'Ultra-clean layout, cool steel slate tones & borderless negative space.',
      primaryColor: 'bg-slate-700',
      textColor: 'text-slate-800',
      ringColor: 'ring-slate-600',
      bgColor: 'bg-slate-50',
      font: 'Inter Light (Minimal Sans)',
      headerStyle: 'Borderless Ice'
    }
  ];

  // --- BRAND / APP STATE ACTIONS ---
  const processImageFile = (file: File, setter: (value: string) => void, fieldName: string) => {
    if (!file.type.startsWith('image/')) {
      onAddNotification("Invalid file type. Please upload an image file (PNG, JPG, SVG, WebP, GIF).", "warning");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      onAddNotification("File is too large. Please select an image under 2MB.", "warning");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setter(dataUrl);
        onLogAudit(`Uploaded new image for ${fieldName}`, 'Settings');
        onAddNotification(`New ${fieldName} uploaded successfully.`, 'success');
      }
    };
    reader.onerror = () => {
      onAddNotification("Failed to read image file.", "alert");
    };
    reader.readAsDataURL(file);
  };

  const handleSaveBrandSettings = () => {
    onLogAudit('Updated application branding settings', 'Settings');
    onAddNotification('Branding & identity configurations updated successfully.', 'success');
  };

  const handleApplyTheme = (themeId: string) => {
    setTheme(themeId);
    onLogAudit(`Changed system theme template to ${themeId}`, 'Settings');
    onAddNotification(`System theme switched to ${themeId.replace('-', ' ').toUpperCase()} template.`, 'success');
  };

  // --- CURRENCY SETTINGS ACTIONS ---
  const handleSaveCurrencySettings = () => {
    onLogAudit(`Updated currency settings: ${defaultCurrency}`, 'Settings');
    onAddNotification(`Currency format configurations saved successfully.`, 'success');
  };

  // --- EMAIL SETTINGS ACTIONS ---
  const handleSaveEmailSettings = () => {
    onLogAudit('Updated SMTP email configurations', 'Settings');
    onAddNotification('SMTP mail server settings successfully stored.', 'success');
  };

  const handleSendTestEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!testEmailTo) {
      onAddNotification('Please specify a destination email address.', 'warning');
      return;
    }
    onAddNotification(`SMTP Handshake Successful. Test message sent to ${testEmailTo}.`, 'success');
    setTestEmailTo('');
  };

  const handleToggleNotif = (key: keyof typeof notifSettings) => {
    setNotifSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSaveNotifSettings = () => {
    onLogAudit('Updated email notification toggles', 'Settings');
    onAddNotification('Email trigger configurations saved successfully.', 'success');
  };

  // --- TAX SETTINGS ACTIONS ---
  const handleAddTax = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaxName || newTaxRate <= 0) return;
    const newTax = {
      id: `tax_${Date.now()}`,
      name: newTaxName,
      rate: newTaxRate
    };
    setTaxes(prev => [...prev, newTax]);
    setNewTaxName('');
    setNewTaxRate(15);
    onLogAudit(`Created new workspace tax rate: ${newTax.name}`, 'Settings');
    onAddNotification(`New tax rate "${newTax.name}" added successfully.`, 'success');
  };

  const handleDeleteTax = (id: string) => {
    const userRoleStr = currentUser?.role?.toLowerCase() || '';
    if (userRoleStr !== 'admin' && userRoleStr !== 'super admin' && userRoleStr !== 'superadmin') {
      alert("Unauthorized: Only Admin or Super Admin can delete records.");
      return;
    }

    const taxToDelete = taxes.find(t => t.id === id);
    if (!taxToDelete) return;
    setTaxes(prev => prev.filter(t => t.id !== id));
    onLogAudit(`Deleted workspace tax rate: ${taxToDelete.name}`, 'Settings');
    onAddNotification(`Tax rate "${taxToDelete.name}" removed.`, 'info');
  };

  const handleSavePaymentSettings = () => {
    onLogAudit('Updated payment settings & bank details', 'Settings');
    onAddNotification('Workspace financial details updated successfully.', 'success');
  };

  // --- ROLE MANAGER ACTIONS ---
  const handleTogglePermission = (permissionKey: keyof Permission) => {
    if (!isGM) {
      onAddNotification("Unauthorized: Only a Admin or Super Admin can configure security permissions.", 'alert');
      return;
    }
    if (!selectedRole) return;

    setRoles(prev => prev.map(r => {
      if (r.id === selectedRoleId) {
        return {
          ...r,
          permissions: {
            ...r.permissions,
            [permissionKey]: r.permissions[permissionKey] === false ? true : false
          }
        };
      }
      return r;
    }));
    onLogAudit(`Toggled permission ${permissionKey} for role ${selectedRole.name}`, 'Security');
    onAddNotification(`Updated permissions for ${selectedRole.name}.`, 'info');
  };

  const handleCreateRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isGM) {
      onAddNotification("Unauthorized: Only a Admin or Super Admin can create custom roles.", 'alert');
      return;
    }
    if (!newRoleName) return;

    const newRole: Role = {
      id: `r_custom_${Date.now()}`,
      name: newRoleName,
      description: newRoleDesc || 'Custom corporate role.',
      permissions: {
        viewDashboard: true,
        manageProjects: false,
        manageQuotations: false,
        manageBudgets: false,
        approveExpenses: false,
        manageInvoices: false,
        manageUsers: false,
        viewAuditLogs: false,
      }
    };

    setRoles(prev => [...prev, newRole]);
    setSelectedRoleId(newRole.id);
    setNewRoleName('');
    setNewRoleDesc('');
    setShowAddRoleForm(false);
    onLogAudit(`Created custom corporate role: ${newRole.name}`, 'Security');
    onAddNotification(`Custom role "${newRole.name}" created.`, 'success');
  };

  const handleDeleteRole = (roleId: string) => {
    const userRoleStr = currentUser?.role?.toLowerCase() || '';
    if (userRoleStr !== 'admin' && userRoleStr !== 'super admin' && userRoleStr !== 'superadmin') {
      alert("Unauthorized: Only Admin or Super Admin can delete records.");
      return;
    }

    if (!isGM) {
      onAddNotification("Unauthorized: Only a Admin or Super Admin can delete custom roles.", 'alert');
      return;
    }
    const roleToDelete = roles.find(r => r.id === roleId);
    if (!roleToDelete) return;
    if (['r1', 'r2', 'r3', 'r4', 'r5', 'r_admin', 'r_super_admin'].includes(roleToDelete.id)) {
      onAddNotification("System standard roles cannot be deleted.", 'warning');
      return;
    }

    if (confirm(`Are you sure you want to delete custom role "${roleToDelete.name}"?`)) {
      setRoles(prev => prev.filter(r => r.id !== roleId));
      setSelectedRoleId(roles[0].id);
      onLogAudit(`Deleted corporate role: ${roleToDelete.name}`, 'Security');
      onAddNotification(`Role "${roleToDelete.name}" removed successfully.`, 'info');
    }
  };

  // --- USER ROLE ASSIGNMENT ACTIONS ---
  const handleAssignUserRole = (userId: string, newRoleName: string) => {
    if (!isGM) {
      onAddNotification("Unauthorized: Only a Admin or Super Admin can re-assign personnel roles.", 'alert');
      return;
    }
    const targetUser = users.find(u => u.id === userId);
    if (!targetUser) return;
    
    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        return { ...u, role: newRoleName };
      }
      return u;
    }));
    
    onLogAudit(`Reassigned user ${targetUser.name} to role: ${newRoleName}`, 'Security');
    onAddNotification(`Reassigned ${targetUser.name} to "${newRoleName}" role.`, 'success');
  };

  const permissionLabels: { key: keyof Permission; label: string; desc: string; category?: string }[] = [
    // Functional Permissions
    { category: 'Functional Permissions', key: 'manageProjects', label: 'Manage Projects & Milestones', desc: 'Allows drafting of budgets, milestone planning, and workflow advancements.' },
    { category: 'Functional Permissions', key: 'manageQuotations', label: 'Manage Bids & Revisions', desc: 'Allows editing and finalization of BOQs, tender costing, and quotation revisions.' },
    { category: 'Functional Permissions', key: 'manageBudgets', label: 'Configure Allocations & Baselines', desc: 'Allows modifying category allocations and setting direct spending budgets.' },
    { category: 'Functional Permissions', key: 'approveExpenses', label: 'Approve Site Expenditures', desc: 'Allows marking site material invoices and equipment bills as Approved.' },
    { category: 'Functional Permissions', key: 'manageInvoices', label: 'Issue Client Invoices', desc: 'Allows drafting and submitting progress valuations for client approval.' },
    { category: 'Functional Permissions', key: 'manageUsers', label: 'Manage Internal Staff List', desc: 'Allows creation of company users, staff assignments, and credential locks.' },
    
    // Page Visibility Permissions
    { category: 'Page Visibility', key: 'viewDashboard', label: 'View Executive Dashboard', desc: 'Allows viewing of aggregates, portfolio-level financials, and high-level bento cards.' },
    { category: 'Page Visibility', key: 'viewProjectsWorkspace', label: 'View Projects Workspace', desc: 'Allows accessing the overall projects and portfolios view.' },
    { category: 'Page Visibility', key: 'viewProjectDetails', label: 'View Project Details', desc: 'Allows accessing individual project boards and milestones.' },
    { category: 'Page Visibility', key: 'viewRolesAndPermissions', label: 'View Access & Permissions', desc: 'Allows accessing the Roles and Permissions configuration page.' },
    { category: 'Page Visibility', key: 'viewAnalyticalReports', label: 'View Analytical Reports', desc: 'Allows accessing financial and project reports.' },
    { category: 'Page Visibility', key: 'viewSystemSettings', label: 'View System Settings', desc: 'Allows accessing the application settings and configurations.' },
    { category: 'Page Visibility', key: 'viewAuditLogs', label: 'View System Audit Logs', desc: 'Allows reviewing of server-wide system events, IP records, and change histories.' },
    
    // Page Visibility Permissions
    { category: 'Page Visibility', key: 'viewProjectOverview', label: 'Overview', desc: 'Allows accessing the project Overview tab.' },
    { category: 'Page Visibility', key: 'viewProjectQuantities', label: 'Contract Quantities', desc: 'Allows accessing the project Contract Quantities tab.' },
    { category: 'Page Visibility', key: 'viewProjectBOQ', label: 'Bill of Quantities (BOQ)', desc: 'Allows accessing the project BOQ tab.' },
    { category: 'Page Visibility', key: 'viewProjectClients', label: 'Client Data', desc: 'Allows accessing the project Client Data tab.' },
    { category: 'Page Visibility', key: 'viewProjectQuotations', label: 'Quotations', desc: 'Allows accessing the project Quotations tab.' },
    { category: 'Page Visibility', key: 'viewProjectPO', label: 'Purchase Order', desc: 'Allows accessing the project Purchase Order tab.' },
    { category: 'Page Visibility', key: 'viewProjectBudgets', label: 'Budgets', desc: 'Allows accessing the project Budgets tab.' },
    { category: 'Page Visibility', key: 'viewProjectMilestones', label: 'Milestones', desc: 'Allows accessing the project Milestones tab.' },
    { category: 'Page Visibility', key: 'viewProjectTasks', label: 'Tasks', desc: 'Allows accessing the project Tasks tab.' },
    { category: 'Page Visibility', key: 'viewProjectIssues', label: 'Site Issues', desc: 'Allows accessing the project Site Issues tab.' },
    { category: 'Page Visibility', key: 'viewProjectVariations', label: 'Variations', desc: 'Allows accessing the project Variations tab.' },
    { category: 'Page Visibility', key: 'viewProjectExpenses', label: 'Expenses', desc: 'Allows accessing the project Expenses tab.' },
    { category: 'Page Visibility', key: 'viewProjectInvoices', label: 'Invoices', desc: 'Allows accessing the project Invoices tab.' },
    { category: 'Page Visibility', key: 'viewProjectPayments', label: 'Payment Received', desc: 'Allows accessing the project Payment Received tab.' },
    { category: 'Page Visibility', key: 'viewProjectDocuments', label: 'Document Controller', desc: 'Allows accessing the project Document Controller tab.' },
  ];

  return (
    <div id="settings-viewport" className="flex-1 flex flex-col overflow-hidden bg-slate-50">
      
      {/* Settings Header */}
      <div className="p-4 md:p-6 bg-white border-b border-slate-200 shrink-0">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-800 flex items-center space-x-2">
              <Settings className="w-5 h-5 text-indigo-600 animate-spin-slow" />
              <span>System Control Panel</span>
            </h1>
            <p className="text-xs text-slate-500 mt-1">Configure global parameters, brand themes, financial defaults, and role-based security access</p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="bg-emerald-50 text-emerald-700 text-xs font-mono font-bold px-2 py-1 rounded border border-emerald-200">
              Active Server: ONLINE
            </span>
          </div>
        </div>

        {/* Setting Tabs Row */}
        <div className="flex space-x-1 overflow-x-auto no-scrollbar mt-6 border-b border-slate-100">
          <button
            onClick={() => setActiveTab('brand')}
            className={`px-4 py-2 border-b-2 text-xs font-bold transition whitespace-nowrap flex items-center space-x-2 cursor-pointer ${
              activeTab === 'brand' 
                ? 'border-indigo-600 text-indigo-600 font-semibold' 
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
            }`}
          >
            <Paintbrush className="w-4 h-4" />
            <span>Brand & Themes</span>
          </button>
          
          <button
            onClick={() => setActiveTab('roles')}
            className={`px-4 py-2 border-b-2 text-xs font-bold transition whitespace-nowrap flex items-center space-x-2 cursor-pointer ${
              activeTab === 'roles' 
                ? 'border-indigo-600 text-indigo-600 font-semibold' 
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Roles & Permissions (RBAC)</span>
          </button>

          <button
            onClick={() => setActiveTab('currency')}
            className={`px-4 py-2 border-b-2 text-xs font-bold transition whitespace-nowrap flex items-center space-x-2 cursor-pointer ${
              activeTab === 'currency' 
                ? 'border-indigo-600 text-indigo-600 font-semibold' 
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>Currency Format</span>
          </button>

          <button
            onClick={() => setActiveTab('email')}
            className={`px-4 py-2 border-b-2 text-xs font-bold transition whitespace-nowrap flex items-center space-x-2 cursor-pointer ${
              activeTab === 'email' 
                ? 'border-indigo-600 text-indigo-600 font-semibold' 
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
            }`}
          >
            <Mail className="w-4 h-4" />
            <span>SMTP & Notifications</span>
          </button>

          <button
            onClick={() => setActiveTab('tax')}
            className={`px-4 py-2 border-b-2 text-xs font-bold transition whitespace-nowrap flex items-center space-x-2 cursor-pointer ${
              activeTab === 'tax' 
                ? 'border-indigo-600 text-indigo-600 font-semibold' 
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
            }`}
          >
            <Percent className="w-4 h-4" />
            <span>Tax Rates & Payments</span>
          </button>
        </div>
      </div>

      {/* Settings Viewport Core Content Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-24 md:pb-6 space-y-6">
        
        {/* ============================================================== */}
        {/* 1. BRAND & THEME TEMPLATES TAB */}
        {/* ============================================================== */}
        {activeTab === 'brand' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-200">
            
            {/* Logo Settings */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h2 className="text-xs font-bold uppercase tracking-wider font-mono text-slate-700">App Identity & Branding</h2>
                  <button
                    onClick={handleSaveBrandSettings}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center space-x-1.5 shadow-xs transition"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Brand Identity</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">App Display Name</label>
                    <input 
                      type="text" 
                      value={appName}
                      onChange={(e) => setAppName(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:border-indigo-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">System Footer Copyright</label>
                    <input 
                      type="text" 
                      value={footerText}
                      onChange={(e) => setFooterText(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:border-indigo-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="relative group">
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5 flex justify-between items-center">
                      <span>Logo (Dark Mode Header)</span>
                      <span className="text-[10px] text-slate-400 font-normal">Drag & Drop or Click</span>
                    </label>
                    <div 
                      className={`border-2 border-dashed rounded-lg p-3 flex flex-col items-center justify-center h-24 mb-2 transition-all relative cursor-pointer group/preview ${
                        isDraggingDark 
                          ? 'border-indigo-500 bg-indigo-50/50' 
                          : 'border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300'
                      }`}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDraggingDark(true);
                      }}
                      onDragLeave={() => setIsDraggingDark(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsDraggingDark(false);
                        const file = e.dataTransfer.files?.[0];
                        if (file) processImageFile(file, setLogoDark, "Dark Mode Header Logo");
                      }}
                      onClick={() => document.getElementById('file-upload-dark')?.click()}
                    >
                      {logoDark ? (
                        <img src={logoDark} className="max-h-12 object-contain transition group-hover/preview:opacity-40" alt="Dark logo preview" referrerPolicy="no-referrer" />
                      ) : (
                        <span className="text-slate-400 text-[11px]">No logo configured</span>
                      )}
                      
                      <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover/preview:opacity-100 bg-slate-900/10 rounded-lg transition-all duration-200">
                        <Upload className="w-5 h-5 text-slate-700 mb-1 drop-shadow-sm animate-bounce" />
                        <span className="text-[10px] font-bold text-slate-700">Upload Logo</span>
                      </div>
                    </div>
                    <input 
                      id="file-upload-dark"
                      type="file" 
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) processImageFile(file, setLogoDark, "Dark Mode Header Logo");
                      }}
                    />
                    <input 
                      type="text" 
                      value={logoDark}
                      onChange={(e) => setLogoDark(e.target.value)}
                      placeholder="Or enter image URL..."
                      className="w-full border border-slate-200 rounded-lg p-1.5 text-[11px] font-mono text-slate-500 focus:outline-none focus:border-indigo-600"
                    />
                  </div>

                  <div className="relative group">
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5 flex justify-between items-center">
                      <span>Logo (Light Mode Header)</span>
                      <span className="text-[10px] text-slate-400 font-normal">Drag & Drop or Click</span>
                    </label>
                    <div 
                      className={`border-2 border-dashed rounded-lg p-3 flex flex-col items-center justify-center h-24 mb-2 transition-all relative cursor-pointer group/preview ${
                        isDraggingLight 
                          ? 'border-indigo-400 bg-indigo-950/40' 
                          : 'border-slate-700 bg-slate-900 hover:bg-slate-950 hover:border-slate-500'
                      }`}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDraggingLight(true);
                      }}
                      onDragLeave={() => setIsDraggingLight(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsDraggingLight(false);
                        const file = e.dataTransfer.files?.[0];
                        if (file) processImageFile(file, setLogoLight, "Light Mode Header Logo");
                      }}
                      onClick={() => document.getElementById('file-upload-light')?.click()}
                    >
                      {logoLight ? (
                        <img src={logoLight} className="max-h-12 object-contain transition group-hover/preview:opacity-30" alt="Light logo preview" referrerPolicy="no-referrer" />
                      ) : (
                        <span className="text-slate-400 text-[11px]">No logo configured</span>
                      )}
                      
                      <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover/preview:opacity-100 bg-slate-950/20 rounded-lg transition-all duration-200">
                        <Upload className="w-5 h-5 text-white mb-1 drop-shadow-sm animate-bounce" />
                        <span className="text-[10px] font-bold text-white">Upload Logo</span>
                      </div>
                    </div>
                    <input 
                      id="file-upload-light"
                      type="file" 
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) processImageFile(file, setLogoLight, "Light Mode Header Logo");
                      }}
                    />
                    <input 
                      type="text" 
                      value={logoLight}
                      onChange={(e) => setLogoLight(e.target.value)}
                      placeholder="Or enter image URL..."
                      className="w-full border border-slate-200 rounded-lg p-1.5 text-[11px] font-mono text-slate-500 focus:outline-none focus:border-indigo-600"
                    />
                  </div>

                  <div className="relative group">
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5 flex justify-between items-center">
                      <span>Favicon Accent Icon</span>
                      <span className="text-[10px] text-slate-400 font-normal">Drag & Drop or Click</span>
                    </label>
                    <div 
                      className={`border-2 border-dashed rounded-lg p-3 flex flex-col items-center justify-center h-24 mb-2 transition-all relative cursor-pointer group/preview ${
                        isDraggingFavicon 
                          ? 'border-indigo-500 bg-indigo-50/50' 
                          : 'border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300'
                      }`}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDraggingFavicon(true);
                      }}
                      onDragLeave={() => setIsDraggingFavicon(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsDraggingFavicon(false);
                        const file = e.dataTransfer.files?.[0];
                        if (file) processImageFile(file, setFavicon, "Favicon Accent Icon");
                      }}
                      onClick={() => document.getElementById('file-upload-favicon')?.click()}
                    >
                      {favicon ? (
                        <img src={favicon} className="w-8 h-8 object-contain transition group-hover/preview:opacity-40" alt="Favicon preview" referrerPolicy="no-referrer" />
                      ) : (
                        <span className="text-slate-400 text-[11px]">No favicon configured</span>
                      )}
                      
                      <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover/preview:opacity-100 bg-slate-900/10 rounded-lg transition-all duration-200">
                        <Upload className="w-5 h-5 text-slate-700 mb-1 drop-shadow-sm animate-bounce" />
                        <span className="text-[10px] font-bold text-slate-700">Upload Favicon</span>
                      </div>
                    </div>
                    <input 
                      id="file-upload-favicon"
                      type="file" 
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) processImageFile(file, setFavicon, "Favicon Accent Icon");
                      }}
                    />
                    <input 
                      type="text" 
                      value={favicon}
                      onChange={(e) => setFavicon(e.target.value)}
                      placeholder="Or enter image URL..."
                      className="w-full border border-slate-200 rounded-lg p-1.5 text-[11px] font-mono text-slate-500 focus:outline-none focus:border-indigo-600"
                    />
                  </div>
                </div>
              </div>

              {/* 5 Beautiful Theme Templates */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
                  <Paintbrush className="w-4 h-4 text-indigo-600" />
                  <h2 className="text-xs font-bold uppercase tracking-wider font-mono text-slate-700">Select Global Theme Template (5 Presets)</h2>
                </div>

                <p className="text-xs text-slate-500 leading-normal mb-4">
                  Changing the theme template instantly overrides color palettes, border styling, font pairings, and heading hierarchies throughout the entire live environment:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {themeTemplates.map((t) => {
                    const isSelected = theme === t.id;
                    return (
                      <div 
                        key={t.id} 
                        onClick={() => handleApplyTheme(t.id)}
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 hover:shadow-md ${
                          isSelected 
                            ? 'border-indigo-600 bg-indigo-50/20 shadow-xs' 
                            : 'border-slate-150 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-xs font-bold text-slate-800">{t.name}</h3>
                          {isSelected ? (
                            <span className="bg-indigo-600 text-white p-0.5 rounded-full">
                              <Check className="w-3 h-3" />
                            </span>
                          ) : (
                            <span className="w-4 h-4 rounded-full border border-slate-300 block"></span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 mb-3 leading-snug">{t.desc}</p>
                        
                        {/* Theme Badges */}
                        <div className="flex flex-wrap gap-1">
                          <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                            Font: {t.font.split(' ')[0]}
                          </span>
                          <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                            Header: {t.headerStyle.split(' ')[0]}
                          </span>
                          <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded text-white ${t.primaryColor}`}>
                            Main Accent
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Live Branding Preview */}
            <div className="space-y-4">
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-slate-700 border-b border-slate-100 pb-3 mb-4">Live Applet Preview</h3>
                
                <div className="border border-slate-200 rounded-lg overflow-hidden bg-slate-50 p-4">
                  {/* Mock app window */}
                  <div className="bg-white rounded border border-slate-200 shadow-xs overflow-hidden">
                    {/* Header */}
                    <div className="bg-slate-900 text-white px-3 py-2 flex items-center justify-between text-[10px]">
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 bg-indigo-600 text-white font-bold rounded flex items-center justify-center text-[9px]">W</div>
                        <span className="font-bold tracking-tight">{appName}</span>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-ping"></span>
                        <span className="opacity-80">Tariq Al-Mansoor</span>
                      </div>
                    </div>

                    {/* App Content */}
                    <div className="p-4 space-y-3">
                      <div className="h-2 w-16 bg-slate-200 rounded"></div>
                      <div className="space-y-1.5">
                        <div className="h-3 w-full bg-slate-100 rounded"></div>
                        <div className="h-3 w-3/4 bg-slate-100 rounded"></div>
                      </div>
                      <div className="flex space-x-1">
                        <div className="h-5 w-12 bg-indigo-50 text-indigo-700 rounded text-[8px] font-bold flex items-center justify-center border border-indigo-200">Active</div>
                        <div className="h-5 w-12 bg-slate-100 text-slate-600 rounded text-[8px] font-bold flex items-center justify-center">Pending</div>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="bg-slate-50 border-t border-slate-150 p-2 text-center text-[8px] text-slate-400">
                      {footerText}
                    </div>
                  </div>
                </div>

                <div className="mt-4 bg-indigo-50/50 p-4 rounded-xl border border-indigo-500/10 text-xs">
                  <p className="text-indigo-900 leading-relaxed font-medium">
                    Branding modifications take effect in real-time. Feel free to copy your corporate branding asset URLs into the inputs to modify.
                  </p>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* ============================================================== */}
        {/* 2. ROLES, RBAC & USER ASSIGNMENTS TAB */}
        {/* ============================================================== */}
        {activeTab === 'roles' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-200">
            
            {/* Roles Sidebar */}
            <div className="space-y-4">
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h2 className="text-xs font-bold uppercase tracking-wider font-mono text-slate-700">Corporate Roles List</h2>
                  <span className="bg-indigo-50 text-indigo-700 text-[10px] font-mono px-2 py-0.5 rounded border border-indigo-200 font-bold">RBAC</span>
                </div>

                <div className="space-y-1.5">
                  {roles.map((role) => {
                    const isSelected = selectedRoleId === role.id;
                    const countUsers = users.filter(u => u.role === role.name).length;
                    return (
                      <button
                        key={role.id}
                        onClick={() => setSelectedRoleId(role.id)}
                        className={`w-full flex items-center justify-between p-2.5 rounded-lg text-left text-xs transition cursor-pointer font-semibold ${
                          isSelected 
                            ? 'bg-indigo-600 text-white shadow-xs' 
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-150'
                        }`}
                      >
                        <div className="truncate pr-2">
                          <p className="truncate">{role.name}</p>
                          <span className={`text-[9px] block font-mono mt-0.5 ${isSelected ? 'text-indigo-200' : 'text-slate-400'}`}>
                            {role.id.startsWith('r_custom_') ? 'Custom Role' : 'System Standard'}
                          </span>
                        </div>
                        <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded shrink-0 ${
                          isSelected ? 'bg-indigo-700 text-indigo-100' : 'bg-slate-200 text-slate-600'
                        }`}>
                          {countUsers} User{countUsers !== 1 ? 's' : ''}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {isGM && !showAddRoleForm && (
                  <button
                    onClick={() => setShowAddRoleForm(true)}
                    className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 px-3 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer border border-slate-200"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Define Custom Role</span>
                  </button>
                )}
              </div>

              {/* Define Custom Role Card */}
              {showAddRoleForm && (
                <form onSubmit={handleCreateRole} className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4 animate-in slide-in-from-top duration-200">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                    <h3 className="text-xs font-bold uppercase font-mono text-slate-700">Add Custom Role</h3>
                    <button 
                      type="button" 
                      onClick={() => setShowAddRoleForm(false)}
                      className="text-xs text-slate-400 hover:text-slate-600 font-bold"
                    >
                      Cancel
                    </button>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Role Name</label>
                    <input
                      type="text"
                      required
                      value={newRoleName}
                      onChange={(e) => setNewRoleName(e.target.value)}
                      placeholder="e.g. QS Manager"
                      className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Description</label>
                    <textarea
                      value={newRoleDesc}
                      onChange={(e) => setNewRoleDesc(e.target.value)}
                      placeholder="Brief description of the roles role and responsibilities."
                      className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:border-indigo-600 h-16 resize-none"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center space-x-1 cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Custom Role</span>
                  </button>
                </form>
              )}
            </div>

            {/* Permissions & User Assignments Panels */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Permission Config Grid */}
              {selectedRole ? (
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-6">
                  <div className="flex justify-between items-start border-b border-slate-150 pb-4">
                    <div>
                      <h3 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
                        <span>{selectedRole.name} Access Permissions</span>
                        <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                          ['r1', 'r2', 'r3', 'r4', 'r5', 'r_admin', 'r_super_admin'].includes(selectedRole.id) 
                            ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                            : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                        }`}>
                          {['r1', 'r2', 'r3', 'r4', 'r5', 'r_admin', 'r_super_admin'].includes(selectedRole.id) ? 'System Standard' : 'User Configured'}
                        </span>
                      </h3>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">{selectedRole.description}</p>
                    </div>

                    {!['r1', 'r2', 'r3', 'r4', 'r5', 'r_admin', 'r_super_admin'].includes(selectedRole.id) && (
                      <button
                        onClick={() => handleDeleteRole(selectedRole.id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition shrink-0 cursor-pointer border border-transparent hover:border-red-200"
                        title="Delete Custom Role"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="space-y-6">
                    {['Functional Permissions', 'Page Visibility'].map((category) => (
                      <div key={category} className="space-y-3">
                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider font-mono mb-2">{category}</h4>
                        {permissionLabels.filter(p => p.category === category).map((perm) => {
                          const isEnabled = selectedRole.permissions[perm.key] !== false;
                          return (
                            <div 
                              key={perm.key} 
                              className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition"
                            >
                              <div className="space-y-0.5 max-w-[80%]">
                                <p className="text-xs font-bold text-slate-700">{perm.label}</p>
                                <p className="text-[10px] text-slate-400 leading-normal">{perm.desc}</p>
                              </div>
                              
                              {/* Toggle Button */}
                              <button
                                onClick={() => handleTogglePermission(perm.key)}
                                disabled={!isGM}
                                className={`w-10 h-5.5 rounded-full p-0.5 transition-all duration-200 cursor-pointer shrink-0 ${
                                  isEnabled ? 'bg-indigo-600 flex justify-end' : 'bg-slate-200 flex justify-start'
                                } ${!isGM ? 'opacity-50 cursor-not-allowed' : ''}`}
                              >
                                <span className="w-4.5 h-4.5 bg-white rounded-full shadow-xs"></span>
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-xs text-center text-slate-400 text-xs">
                  Select a corporate role from the sidebar list to modify security policies.
                </div>
              )}

              {/* Personnel Assignment & User Roles Management */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
                  <Users className="w-4 h-4 text-indigo-600" />
                  <h2 className="text-xs font-bold uppercase tracking-wider font-mono text-slate-700">Staff Personnel Role Assignment</h2>
                </div>

                <p className="text-xs text-slate-500 leading-normal mb-4">
                  Assign company personnel to specified corporate roles. This dynamically updates their operational system clearance levels:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {users.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-150 bg-slate-50/30">
                      <div className="flex items-center space-x-3 truncate mr-2">
                        <img src={user.avatar} className="w-10 h-10 rounded-full object-cover shrink-0 border border-slate-200" alt={user.name} referrerPolicy="no-referrer" />
                        <div className="truncate">
                          <h4 className="text-xs font-bold text-slate-800 truncate">{user.name}</h4>
                          <span className="text-[10px] text-slate-400 font-mono truncate block">{user.email}</span>
                        </div>
                      </div>

                      {/* Role selection dropdown */}
                      <div className="shrink-0">
                        <select
                          value={user.role}
                          onChange={(e) => handleAssignUserRole(user.id, e.target.value)}
                          disabled={!isGM}
                          className="border border-slate-200 rounded-lg p-1.5 text-xs bg-white focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                        >
                          {roles.map(r => (
                            <option key={r.id} value={r.name}>{r.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>
        )}

        {/* ============================================================== */}
        {/* 3. CURRENCY SETTINGS TAB */}
        {/* ============================================================== */}
        {activeTab === 'currency' && (
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-6 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-150 pb-3">
              <div className="flex items-center space-x-2">
                <DollarSign className="w-5 h-5 text-indigo-600" />
                <h2 className="text-xs font-bold uppercase tracking-wider font-mono text-slate-700">Currency & Formatting Matrix</h2>
              </div>
              <button
                onClick={handleSaveCurrencySettings}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center space-x-1.5 shadow-xs transition cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Format Preferences</span>
              </button>
            </div>

            {/* Live formatting preview */}
            <div className="bg-indigo-50/40 p-4 rounded-xl border border-indigo-500/10 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="space-y-1 text-center md:text-left">
                <h3 className="text-xs font-bold text-indigo-900 font-mono">Live Formatting Sample</h3>
                <p className="text-slate-500 text-xs">Your currency values will render in tables and dashboards exactly as configured</p>
              </div>
              <div className="bg-white px-5 py-3 rounded-lg border border-indigo-100 shadow-xs font-mono font-bold text-indigo-700 text-lg">
                {symbolPosition === 'left' ? `${defaultCurrency} ` : ''}
                {thousandsSeparator === 'comma' ? '1,234' : thousandsSeparator === 'dot' ? '1.234' : '1 234'}
                {decimalSeparator === 'dot' ? '.' : ','}
                {showDecimals ? '56' : ''}
                {symbolPosition === 'right' ? `${addSpaceInCurrency ? ' ' : ''}${defaultCurrency}` : ''}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Base System Currency</label>
                  <select
                    value={defaultCurrency}
                    onChange={(e) => setDefaultCurrency(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 bg-white text-xs focus:outline-none focus:border-indigo-600"
                  >
                    <option value="SAR">SAR - Saudi Arabian Riyal (ريال)</option>
                    <option value="USD">USD - United States Dollar ($)</option>
                    <option value="AED">AED - UAE Dirham (د.إ)</option>
                    <option value="KWD">KWD - Kuwaiti Dinar (د.ك)</option>
                    <option value="QAR">QAR - Qatari Riyal (ر.ق)</option>
                    <option value="GBP">GBP - British Pound Sterling (£)</option>
                    <option value="EUR">EUR - Euro (€)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Decimal Precision</label>
                  <select
                    value={decimalPlaces}
                    onChange={(e) => setDecimalPlaces(Number(e.target.value))}
                    className="w-full border border-slate-200 rounded-lg p-2 bg-white text-xs focus:outline-none focus:border-indigo-600"
                  >
                    <option value="0">0 (e.g. 1,235)</option>
                    <option value="1">1 decimal place (e.g. 1,234.6)</option>
                    <option value="2">2 decimal places (e.g. 1,234.56)</option>
                    <option value="3">3 decimal places (e.g. 1,234.560)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Symbol Placement</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setSymbolPosition('left')}
                      className={`p-2 rounded-lg text-xs font-bold border cursor-pointer transition ${
                        symbolPosition === 'left' 
                          ? 'bg-indigo-50 border-indigo-500 text-indigo-700' 
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      Before Amount (e.g. $ 100)
                    </button>
                    <button
                      type="button"
                      onClick={() => setSymbolPosition('right')}
                      className={`p-2 rounded-lg text-xs font-bold border cursor-pointer transition ${
                        symbolPosition === 'right' 
                          ? 'bg-indigo-50 border-indigo-500 text-indigo-700' 
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      After Amount (e.g. 100 SAR)
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Decimal Delimiter</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setDecimalSeparator('dot')}
                      className={`p-2 rounded-lg text-xs font-bold border cursor-pointer transition ${
                        decimalSeparator === 'dot' 
                          ? 'bg-indigo-50 border-indigo-500 text-indigo-700' 
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      Dot (.) e.g. 123.45
                    </button>
                    <button
                      type="button"
                      onClick={() => setDecimalSeparator('comma')}
                      className={`p-2 rounded-lg text-xs font-bold border cursor-pointer transition ${
                        decimalSeparator === 'comma' 
                          ? 'bg-indigo-50 border-indigo-500 text-indigo-700' 
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      Comma (,) e.g. 123,45
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Thousands Segment Separator</label>
                  <select
                    value={thousandsSeparator}
                    onChange={(e) => setThousandsSeparator(e.target.value as any)}
                    className="w-full border border-slate-200 rounded-lg p-2 bg-white text-xs focus:outline-none focus:border-indigo-600"
                  >
                    <option value="comma">Comma (1,234,567)</option>
                    <option value="dot">Dot (1.234.567)</option>
                    <option value="space">Space (1 234 567)</option>
                  </select>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-700">Display Floating Decimals</p>
                      <p className="text-[10px] text-slate-400">Renders fractional coins in tables</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowDecimals(!showDecimals)}
                      className={`w-10 h-5.5 rounded-full p-0.5 transition-all duration-200 cursor-pointer shrink-0 ${
                        showDecimals ? 'bg-indigo-600 flex justify-end' : 'bg-slate-200 flex justify-start'
                      }`}
                    >
                      <span className="w-4.5 h-4.5 bg-white rounded-full shadow-xs"></span>
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-700">Append Padding Space</p>
                      <p className="text-[10px] text-slate-400">Inserts empty slot between numeric digit and code</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAddSpaceInCurrency(!addSpaceInCurrency)}
                      className={`w-10 h-5.5 rounded-full p-0.5 transition-all duration-200 cursor-pointer shrink-0 ${
                        addSpaceInCurrency ? 'bg-indigo-600 flex justify-end' : 'bg-slate-200 flex justify-start'
                      }`}
                    >
                      <span className="w-4.5 h-4.5 bg-white rounded-full shadow-xs"></span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* 4. SMTP MAIL SERVER & TRIGGERS TAB */}
        {/* ============================================================== */}
        {activeTab === 'email' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-200">
            
            {/* SMTP config form */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-150 pb-3">
                  <div className="flex items-center space-x-2">
                    <Server className="w-4.5 h-4.5 text-indigo-600" />
                    <h2 className="text-xs font-bold uppercase tracking-wider font-mono text-slate-700">SMTP Email Gateway</h2>
                  </div>
                  <button
                    type="button"
                    onClick={handleSaveEmailSettings}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center space-x-1.5 shadow-xs transition cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save SMTP Config</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Mail Provider</label>
                    <select
                      value={emailProvider}
                      onChange={(e) => setEmailProvider(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg p-2 bg-white text-xs focus:outline-none focus:border-indigo-600"
                    >
                      <option value="SMTP">SMTP (Dedicated IP Gateway)</option>
                      <option value="Mailgun">Mailgun HTTP API</option>
                      <option value="Postmark">Postmark Secure API</option>
                      <option value="SES">Amazon SES (Simple Email Service)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Mail Driver Type</label>
                    <input 
                      type="text" 
                      value={mailDriver}
                      onChange={(e) => setMailDriver(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:border-indigo-600 font-mono text-slate-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">SMTP Server Host</label>
                    <input 
                      type="text" 
                      value={smtpHost}
                      onChange={(e) => setSmtpHost(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:border-indigo-600 font-mono text-slate-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Port Number</label>
                    <input 
                      type="text" 
                      value={smtpPort}
                      onChange={(e) => setSmtpPort(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:border-indigo-600 font-mono text-slate-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">SMTP Username Credentials</label>
                    <input 
                      type="text" 
                      value={smtpUser}
                      onChange={(e) => setSmtpUser(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:border-indigo-600 font-mono text-slate-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">SMTP Secret Password</label>
                    <input 
                      type="password" 
                      value={smtpPassword}
                      onChange={(e) => setSmtpPassword(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:border-indigo-600 font-mono text-slate-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">TLS / SSL Encryption</label>
                    <select
                      value={mailEncryption}
                      onChange={(e) => setMailEncryption(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg p-2 bg-white text-xs focus:outline-none focus:border-indigo-600"
                    >
                      <option value="TLS">TLS Security (Secure Handshake)</option>
                      <option value="SSL">SSL Security (Legacy Tunnel)</option>
                      <option value="None">No Encryption (Plain Unsecured)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Sender From Address</label>
                    <input 
                      type="email" 
                      value={fromAddress}
                      onChange={(e) => setFromAddress(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:border-indigo-600"
                    />
                  </div>
                </div>
              </div>

              {/* Notification Toggles */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
                  <Bell className="w-4.5 h-4.5 text-indigo-600" />
                  <h2 className="text-xs font-bold uppercase tracking-wider font-mono text-slate-700">Automatic Email Notification triggers</h2>
                </div>

                <p className="text-xs text-slate-500 leading-normal mb-4">
                  Select which workflow movements and user milestones should dispatch automatic corporate emails:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {Object.keys(notifSettings).map((key) => {
                    const typedKey = key as keyof typeof notifSettings;
                    const isEnabled = notifSettings[typedKey];
                    // Formatted key labels
                    const labelsMap: Record<string, string> = {
                      workspaceInvitation: 'Workspace Invitation',
                      projectAssignment: 'Project Assignment',
                      taskAssignment: 'Task Assignment',
                      siteIssueAlert: 'Site Issue Alert',
                      expenseNotification: 'Expense Filed Alert',
                      invoiceNotification: 'Client Invoice Issued',
                      contractCreated: 'Contract Created',
                      statusUpdated: 'Workflow Advanced',
                      commentsAdded: 'Thread Comment Added',
                    };

                    return (
                      <div key={key} className="p-3 border border-slate-150 bg-slate-50/50 rounded-xl flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-700 truncate mr-2">{labelsMap[key] || key}</span>
                        <button
                          type="button"
                          onClick={() => handleToggleNotif(typedKey)}
                          className={`w-9 h-5 rounded-full p-0.5 transition-all duration-200 cursor-pointer shrink-0 ${
                            isEnabled ? 'bg-indigo-600 flex justify-end' : 'bg-slate-200 flex justify-start'
                          }`}
                        >
                          <span className="w-4 h-4 bg-white rounded-full shadow-xs"></span>
                        </button>
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-end pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={handleSaveNotifSettings}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg flex items-center space-x-1.5 shadow-xs transition cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Trigger Preferences</span>
                  </button>
                </div>
              </div>
            </div>

            {/* SMTP Test Connection Panel */}
            <div className="space-y-4">
              <form onSubmit={handleSendTestEmail} className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-slate-700 border-b border-slate-100 pb-3">Test Email Dispatch</h3>
                
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Send Test Message To</label>
                  <input
                    type="email"
                    required
                    placeholder="engineer@company.com"
                    value={testEmailTo}
                    onChange={(e) => setTestEmailTo(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:border-indigo-600"
                  />
                  <p className="text-[10px] text-slate-400 mt-1 leading-snug">Dispatches a live handshake test sequence using the configured port and TLS certificate.</p>
                </div>

                <button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2 rounded-lg flex items-center justify-center space-x-1.5 shadow-xs transition cursor-pointer"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Send Test Email</span>
                </button>
              </form>

              <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-500/10 text-xs">
                <h4 className="font-bold text-indigo-900 mb-1 flex items-center space-x-1.5">
                  <Info className="w-4 h-4 text-indigo-600" />
                  <span>SMTP Security</span>
                </h4>
                <p className="text-indigo-950 leading-relaxed">
                  All SMTP connections run via end-to-end TLS. Wafaq ERP keeps API secret credentials masked from the public DOM layer.
                </p>
              </div>
            </div>

          </div>
        )}

        {/* ============================================================== */}
        {/* 5. TAX RATES & PAYMENTS TAB */}
        {/* ============================================================== */}
        {activeTab === 'tax' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-200">
            
            {/* Tax Rates List */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-150 pb-3">
                  <div className="flex items-center space-x-2">
                    <Percent className="w-4.5 h-4.5 text-indigo-600" />
                    <h2 className="text-xs font-bold uppercase tracking-wider font-mono text-slate-700">Workspace Tax Codes</h2>
                  </div>
                </div>

                <p className="text-xs text-slate-500 leading-normal">
                  Configure the corporate VAT and withholding taxes that apply to your submittals, progress bills, and invoices:
                </p>

                <div className="border border-slate-150 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-150 text-slate-600 uppercase font-mono">
                        <th className="p-3">Tax Label</th>
                        <th className="p-3">Applicable Rate</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {taxes.map((t) => (
                        <tr key={t.id} className="hover:bg-slate-50/50 transition">
                          <td className="p-3 font-semibold text-slate-800">{t.name}</td>
                          <td className="p-3">
                            <span className="bg-blue-50 text-blue-700 font-mono font-bold px-2 py-0.5 rounded border border-blue-100">
                              {t.rate}%
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <button
                              type="button"
                              onClick={() => handleDeleteTax(t.id)}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 rounded transition cursor-pointer"
                              title="Delete tax code"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Payment Settings & Bank details */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center space-x-2">
                    <Building2 className="w-4.5 h-4.5 text-indigo-600" />
                    <h2 className="text-xs font-bold uppercase tracking-wider font-mono text-slate-700">Corporate Banking Details</h2>
                  </div>
                  <button
                    type="button"
                    onClick={handleSavePaymentSettings}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center space-x-1.5 shadow-xs transition cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Bank Details</span>
                  </button>
                </div>

                <p className="text-xs text-slate-500 leading-normal mb-2">
                  Specify bank account guidelines printed automatically on draft client progress invoices for swift bank wires:
                </p>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Payment Wire Instructions</label>
                  <textarea
                    value={bankDetails}
                    onChange={(e) => setBankDetails(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-xs font-mono text-slate-500 focus:outline-none focus:border-indigo-600 h-24 resize-y"
                  />
                </div>
              </div>
            </div>

            {/* Add Tax Code Panel */}
            <div className="space-y-4">
              <form onSubmit={handleAddTax} className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-slate-700 border-b border-slate-100 pb-3">Create Tax Code</h3>
                
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Tax Code Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Municipal Duty"
                    value={newTaxName}
                    onChange={(e) => setNewTaxName(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:border-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Percentage Rate (%)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    max="100"
                    step="0.1"
                    placeholder="15"
                    value={newTaxRate}
                    onChange={(e) => setNewTaxRate(Number(e.target.value))}
                    className="w-full border border-slate-200 rounded-lg p-2 text-xs font-mono focus:outline-none focus:border-indigo-600"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2 rounded-lg flex items-center justify-center space-x-1.5 shadow-xs transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Tax Code</span>
                </button>
              </form>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
