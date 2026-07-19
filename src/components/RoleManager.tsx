/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ShieldCheck, ShieldAlert, Check, Plus, Trash2, Users, Save, HelpCircle } from 'lucide-react';
import { Role, User, Permission } from '../types';

interface RoleManagerProps {
  roles: Role[];
  setRoles: React.Dispatch<React.SetStateAction<Role[]>>;
  availableUsers: User[];
  currentUser: User;
}

export default function RoleManager({
  roles,
  setRoles,
  availableUsers,
  currentUser,
}: RoleManagerProps) {
  const [selectedRoleId, setSelectedRoleId] = useState<string>(roles[0]?.id || '');
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDesc, setNewRoleDesc] = useState('');
  const [showAddRoleForm, setShowAddRoleForm] = useState(false);

  const selectedRole = roles.find(r => r.id === selectedRoleId);

  const isGM = currentUser.role.toLowerCase() === 'admin' || currentUser.role.toLowerCase() === 'super admin' || currentUser.role.toLowerCase() === 'superadmin';

  const handleTogglePermission = (permissionKey: keyof Permission) => {
    if (!isGM) {
      alert("Unauthorized: Only a Admin or Super Admin can configure roles and security permissions.");
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
  };

  const handleCreateRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isGM) {
      alert("Unauthorized: Only a Admin or Super Admin can create custom roles.");
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
  };

  const handleDeleteRole = (roleId: string) => {
    const userRoleStr = currentUser?.role?.toLowerCase() || '';
    if (userRoleStr !== 'admin' && userRoleStr !== 'super admin' && userRoleStr !== 'superadmin') {
      alert("Unauthorized: Only Admin or Super Admin can delete records.");
      return;
    }

    if (!isGM) {
      alert("Unauthorized: Only a Admin or Super Admin can delete custom roles.");
      return;
    }
    const roleToDelete = roles.find(r => r.id === roleId);
    if (!roleToDelete) return;
    if (['r1', 'r2', 'r3', 'r4', 'r5', 'r_admin', 'r_super_admin'].includes(roleToDelete.id)) {
      alert("Error: System system-critical roles (Admin, Super Admin, General Manager, Accountant, Site Engineer, Client, etc.) cannot be deleted.");
      return;
    }

    if (confirm(`Are you sure you want to delete the custom role "${roleToDelete.name}"?`)) {
      setRoles(prev => prev.filter(r => r.id !== roleId));
      setSelectedRoleId(roles[0].id);
    }
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
    <div id="role-manager-wrapper" className="flex-1 overflow-y-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 pb-24 md:pb-6">
      
      {/* Role Selection Sidebar */}
      <div className="space-y-4">
        
        <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-gray-800 uppercase tracking-wider font-mono">Corporate Roles</span>
            <span className="bg-amber-100 text-amber-800 text-xs font-mono px-1.5 py-0.5 rounded font-bold">RBAC</span>
          </div>
          
          <div className="space-y-1">
            {roles.map((role) => {
              const isSelected = selectedRoleId === role.id;
              const belongsCount = availableUsers.filter(u => u.role === role.name).length;
              return (
                <button
                  key={role.id}
                  onClick={() => setSelectedRoleId(role.id)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-lg text-left text-xs transition cursor-pointer font-semibold ${
                    isSelected 
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/10' 
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                  }`}
                >
                  <div className="truncate pr-2">
                    <p className="truncate">{role.name}</p>
                    <span className={`text-[10px] block font-mono ${isSelected ? 'text-indigo-200' : 'text-amber-600'}`}>
                      {role.id.startsWith('r_custom_') ? 'Custom Role' : 'System Default'}
                    </span>
                  </div>
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded shrink-0 ${
                    isSelected ? 'bg-indigo-700 text-indigo-100' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {belongsCount} Staff
                  </span>
                </button>
              );
            })}
          </div>

          {isGM && !showAddRoleForm && (
            <button
              onClick={() => setShowAddRoleForm(true)}
              className="mt-4 w-full bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Define Custom Role</span>
            </button>
          )}
        </div>

        {/* Add Role Form Overlay/Container */}
        {showAddRoleForm && (
          <form onSubmit={handleCreateRole} className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-sm space-y-3">
            <div className="flex justify-between items-center">
              <h4 className="text-xs font-bold text-gray-800 uppercase font-mono">Add Custom Role</h4>
              <button 
                type="button" 
                onClick={() => setShowAddRoleForm(false)}
                className="text-xs text-gray-400 hover:text-gray-600 font-bold"
              >
                Cancel
              </button>
            </div>
            <div>
              <label className="block text-xs font-mono text-gray-400 uppercase">Role Name</label>
              <input
                type="text"
                required
                value={newRoleName}
                onChange={(e) => setNewRoleName(e.target.value)}
                placeholder="e.g. Chief Surveyor"
                className="w-full border border-gray-200 rounded p-1.5 text-xs mt-1 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-gray-400 uppercase">Description</label>
              <textarea
                value={newRoleDesc}
                onChange={(e) => setNewRoleDesc(e.target.value)}
                placeholder="Describe role scope and operational assignments."
                className="w-full border border-gray-200 rounded p-1.5 text-xs mt-1 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 h-16 resize-none"
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

        <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-500/10">
          <h4 className="text-xs font-bold text-indigo-900 flex items-center space-x-1.5">
            <HelpCircle className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>Configurable Permissions</span>
          </h4>
          <p className="text-xs text-indigo-950 leading-relaxed mt-2">
            No code changes are needed to add permissions. Change permissions on any role dynamically using the interactive grid. Note that only users assigned to <strong>General Manager</strong> hold baseline admin rights to modify this grid.
          </p>
        </div>

      </div>

      {/* Permissions Config Grid */}
      <div className="lg:col-span-2 space-y-4">
        {selectedRole ? (
          <div className="bg-white p-5 rounded-xl border border-gray-200/80 shadow-sm space-y-6">
            
            {/* Selected Role Meta */}
            <div className="flex justify-between items-start border-b border-gray-100 pb-4">
              <div>
                <h3 className="text-sm font-bold text-gray-900 flex items-center space-x-2">
                  <span>{selectedRole.name} Permissions</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded font-mono ${
                    ['r1', 'r2', 'r3', 'r4', 'r5', 'r_admin', 'r_super_admin'].includes(selectedRole.id) 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-indigo-100 text-indigo-800'
                  }`}>
                    {['r1', 'r2', 'r3', 'r4', 'r5', 'r_admin', 'r_super_admin'].includes(selectedRole.id) ? 'System Standard' : 'User Configured'}
                  </span>
                </h3>
                <p className="text-xs text-gray-500 mt-1">{selectedRole.description}</p>
              </div>

              {!['r1', 'r2', 'r3', 'r4', 'r5', 'r_admin', 'r_super_admin'].includes(selectedRole.id) && (
                <button
                  onClick={() => handleDeleteRole(selectedRole.id)}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition shrink-0 cursor-pointer"
                  title="Delete Custom Role"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Permissions Toggles List */}
            <div className="space-y-6">
              {['Functional Permissions', 'Page Visibility'].map((category) => (
                <div key={category} className="space-y-3">
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider font-mono mb-2">{category}</h4>
                  {permissionLabels.filter(p => p.category === category).map((perm) => {
                    const isEnabled = selectedRole.permissions[perm.key] !== false;
                    return (
                      <div 
                        key={perm.key} 
                        className="flex items-center justify-between p-3 rounded-lg border border-gray-100 bg-gray-50/30 hover:bg-gray-50 transition"
                      >
                        <div className="space-y-0.5 max-w-[80%]">
                          <p className="text-xs font-bold text-gray-800">{perm.label}</p>
                          <p className="text-xs text-gray-400 leading-normal">{perm.desc}</p>
                        </div>
                        
                        {/* Toggle Switch */}
                        <button
                          onClick={() => handleTogglePermission(perm.key)}
                          disabled={!isGM}
                          className={`w-11 h-6 rounded-full p-1 transition-all duration-200 cursor-pointer shrink-0 ${
                            isEnabled ? 'bg-indigo-600 flex justify-end' : 'bg-gray-200 flex justify-start'
                          } ${!isGM ? 'opacity-60 cursor-not-allowed' : ''}`}
                        >
                          <span className="w-4 h-4 bg-white rounded-full shadow-md"></span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* List of Users Assigned to this Role */}
            <div className="border-t border-gray-100 pt-5">
              <div className="flex items-center space-x-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider font-mono mb-3">
                <Users className="w-4 h-4 text-gray-400" />
                <span>Assigned Company Personnel ({availableUsers.filter(u => u.role === selectedRole.name).length})</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {availableUsers.filter(u => u.role === selectedRole.name).map((user) => (
                  <div key={user.id} className="flex items-center space-x-2.5 p-2 rounded-lg border border-gray-100">
                    <img src={user.avatar} className="w-8 h-8 rounded-full object-cover" alt="" referrerPolicy="no-referrer" />
                    <div>
                      <p className="text-xs font-bold text-gray-800">{user.name}</p>
                      <span className="text-[9px] text-gray-400 font-mono block mt-0.5">{user.email}</span>
                    </div>
                  </div>
                ))}
                {availableUsers.filter(u => u.role === selectedRole.name).length === 0 && (
                  <span className="text-xs text-gray-400 italic">No corporate staff currently assigned to this role.</span>
                )}
              </div>
            </div>

          </div>
        ) : (
          <div className="bg-white p-12 text-center text-gray-400 text-xs">
            Select a role to view permissions.
          </div>
        )}
      </div>

    </div>
  );
}
