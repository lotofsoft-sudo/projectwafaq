/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  UserPlus, 
  Search, 
  Edit3, 
  Lock, 
  Shield, 
  Phone, 
  Building, 
  Calendar, 
  FileText, 
  IdCard, 
  CheckCircle, 
  XCircle, 
  Save, 
  KeyRound, 
  Plus, 
  Trash2, 
  X,
  UserCheck,
  History,
  Eye,
  EyeOff,
  AlertCircle
} from 'lucide-react';
import { User, Role, AuditLog } from '../types';

interface UserManagerProps {
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  roles: Role[];
  currentUser: User;
  onLogAudit: (action: string, module: string, oldValue?: string, newValue?: string) => void;
  auditLogs: AuditLog[];
}

const AVATAR_OPTIONS = [
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
  'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
  'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150',
];

export default function UserManager({
  users,
  setUsers,
  roles,
  currentUser,
  onLogAudit,
  auditLogs,
}: UserManagerProps) {
  // Navigation & filtering states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');

  // Selected User state - default to first user or current user
  const [selectedUserId, setSelectedUserId] = useState<string>(users[0]?.id || '');
  const selectedUser = useMemo(() => {
    return users.find(u => u.id === selectedUserId) || users[0] || null;
  }, [users, selectedUserId]);

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  // Edit State (direct fields for the selected user profile editing)
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editDept, setEditDept] = useState('');
  const [editEmpId, setEditEmpId] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  const [editStatus, setEditStatus] = useState<'active' | 'inactive'>('active');
  const [editRole, setEditRole] = useState('');

  // Start Editing handler
  const handleStartEditing = () => {
    if (!selectedUser) return;
    setEditName(selectedUser.name);
    setEditEmail(selectedUser.email);
    setEditPhone(selectedUser.phone || '');
    setEditDept(selectedUser.department || 'Operations');
    setEditEmpId(selectedUser.employeeId || `EMP-${selectedUser.id.toUpperCase()}`);
    setEditNotes(selectedUser.notes || '');
    setEditAvatar(selectedUser.avatar);
    setEditStatus(selectedUser.status);
    setEditRole(selectedUser.role);
    setIsEditing(true);
  };

  // Save Edit Handler
  const handleSaveProfile = () => {
    if (!selectedUser) return;
    if (!editName.trim() || !editEmail.trim()) {
      alert("Please fill in Name and Email address.");
      return;
    }

    setUsers(prev => prev.map(u => {
      if (u.id === selectedUser.id) {
        return {
          ...u,
          name: editName,
          email: editEmail,
          phone: editPhone,
          department: editDept,
          employeeId: editEmpId,
          notes: editNotes,
          avatar: editAvatar,
          status: editStatus,
          role: editRole,
        };
      }
      return u;
    }));

    // Log Audit
    onLogAudit(
      `Updated user profile details for ${editName} (ID: ${selectedUser.id})`,
      'Security',
      JSON.stringify({ name: selectedUser.name, role: selectedUser.role, status: selectedUser.status }),
      JSON.stringify({ name: editName, role: editRole, status: editStatus })
    );

    setIsEditing(false);
  };

  // Password Reset State
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassValue, setShowPassValue] = useState(false);

  const handlePasswordReset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    if (newPassword.length < 4) {
      alert("Password must be at least 4 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    // Save password
    setUsers(prev => prev.map(u => {
      if (u.id === selectedUser.id) {
        return { ...u, password: newPassword };
      }
      return u;
    }));

    // Log audit
    onLogAudit(
      `Reset credential password for user: ${selectedUser.name}`,
      'Security'
    );

    alert(`Password for ${selectedUser.name} updated successfully!`);
    setShowPasswordModal(false);
    setNewPassword('');
    setConfirmPassword('');
  };

  // New User Form State
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState(roles[0]?.name || 'Site Engineer');
  const [newUserPhone, setNewUserPhone] = useState('');
  const [newUserDept, setNewUserDept] = useState('Operations');
  const [newUserEmpId, setNewUserEmpId] = useState('');
  const [newUserNotes, setNewUserNotes] = useState('');
  const [newUserAvatar, setNewUserAvatar] = useState(AVATAR_OPTIONS[0]);

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim() || !newUserPassword.trim()) {
      alert("Please complete Name, Email, and Password fields.");
      return;
    }

    // Check duplicate email
    if (users.some(u => u.email.toLowerCase() === newUserEmail.trim().toLowerCase())) {
      alert("A user with this corporate email already exists.");
      return;
    }

    const uniqueId = `u_${Date.now()}`;
    const generatedEmpId = newUserEmpId.trim() || `EMP-${Date.now().toString().slice(-6)}`;

    const newUserObj: User = {
      id: uniqueId,
      name: newUserName,
      email: newUserEmail,
      role: newUserRole,
      avatar: newUserAvatar,
      status: 'active',
      password: newUserPassword,
      phone: newUserPhone,
      department: newUserDept,
      employeeId: generatedEmpId,
      notes: newUserNotes,
      joinedDate: new Date().toISOString().slice(0, 10),
    };

    setUsers(prev => [...prev, newUserObj]);
    setSelectedUserId(uniqueId);

    // Audit Log
    onLogAudit(
      `Created new enterprise user account: ${newUserName} (${newUserRole})`,
      'Security',
      undefined,
      JSON.stringify({ id: uniqueId, name: newUserName, role: newUserRole, email: newUserEmail })
    );

    // Clear form & close modal
    setNewUserName('');
    setNewUserEmail('');
    setNewUserPassword('');
    setNewUserRole(roles[0]?.name || 'Site Engineer');
    setNewUserPhone('');
    setNewUserDept('Operations');
    setNewUserEmpId('');
    setNewUserNotes('');
    setNewUserAvatar(AVATAR_OPTIONS[Math.floor(Math.random() * AVATAR_OPTIONS.length)]);
    setShowAddModal(false);
  };

  // Delete User Account
  const handleDeleteUser = (u: User) => {
    const userRoleStr = currentUser?.role?.toLowerCase() || '';
    if (userRoleStr !== 'admin' && userRoleStr !== 'super admin' && userRoleStr !== 'superadmin') {
      alert("Unauthorized: Only Admin or Super Admin can delete records.");
      return;
    }

    if (u.id === currentUser.id) {
      alert("You cannot terminate your own active administrator session!");
      return;
    }

    if (window.confirm(`Are you absolutely sure you want to permanently delete the profile of ${u.name}? All corporate system workspace accesses will be revoked.`)) {
      setUsers(prev => prev.filter(item => item.id !== u.id));
      onLogAudit(
        `Permanently terminated and deleted corporate user profile: ${u.name}`,
        'Security',
        JSON.stringify(u)
      );
      if (selectedUserId === u.id) {
        setSelectedUserId(users.find(item => item.id !== u.id)?.id || '');
      }
    }
  };

  // Filtered Users List
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchesSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (u.employeeId && u.employeeId.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesRole = filterRole === 'All' || u.role === filterRole;
      const matchesStatus = filterStatus === 'All' || u.status === filterStatus;
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchQuery, filterRole, filterStatus]);

  // Specific user audit activities
  const userActivities = useMemo(() => {
    if (!selectedUser) return [];
    return auditLogs.filter(log => log.user === selectedUser.name);
  }, [auditLogs, selectedUser]);

  return (
    <div id="user-management-viewport" className="flex-1 overflow-y-auto p-4 md:p-6 pb-24 md:pb-6 space-y-6">
      
      {/* Header Panel */}
      <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0 shadow-lg select-none">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <Shield className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-mono uppercase tracking-widest text-indigo-400 font-semibold">Security Governance Suite</span>
          </div>
          <h2 className="text-lg font-bold tracking-tight text-white mt-1">Enterprise Directory & Identity Access (IAM)</h2>
          <p className="text-xs text-slate-400 max-w-xl">
            Audit, register, and update authorized Wafaq Contracting corporate profiles. Establish direct role permissions, manage cryptographic passkeys, and analyze individual employee logs.
          </p>
        </div>
        
        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 shadow-md shadow-indigo-650 cursor-pointer active:scale-95"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add New User</span>
          </button>
          <div className="text-xs font-mono text-slate-400 bg-slate-950/50 px-2.5 py-1.5 rounded border border-slate-850">
            Total Seeded: <span className="text-indigo-400 font-bold">{users.length}</span>
          </div>
        </div>
      </div>

      {/* Main Split Layout: Left Directory / Right User 360 Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Side: Directory Search & List */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col overflow-hidden">
          
          {/* Header & Controls */}
          <div className="p-4 border-b border-slate-100 space-y-3 bg-slate-50/50">
            <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-slate-700 flex items-center space-x-2">
              <Users className="w-4 h-4 text-indigo-600" />
              <span>Corporate Directory</span>
            </h3>

            {/* Search Input */}
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                <Search className="w-3.5 h-3.5" />
              </span>
              <input
                type="text"
                placeholder="Search by employee name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 font-medium"
              />
            </div>

            {/* Micro Filters */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Filter Role</label>
                <select
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-1.5 text-xs focus:outline-none bg-white font-medium"
                >
                  <option value="All">All Roles</option>
                  {roles.map(r => (
                    <option key={r.id} value={r.name}>{r.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Filter Status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-1.5 text-xs focus:outline-none bg-white font-medium"
                >
                  <option value="All">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>

          {/* Directory Listings */}
          <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto scrollbar-thin">
            {filteredUsers.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                No corporate profiles matched your criteria.
              </div>
            ) : (
              filteredUsers.map((user) => {
                const isSelected = selectedUserId === user.id;
                return (
                  <div
                    key={user.id}
                    onClick={() => {
                      setSelectedUserId(user.id);
                      setIsEditing(false);
                    }}
                    className={`p-3.5 flex items-center justify-between transition-all cursor-pointer text-left relative ${
                      isSelected 
                        ? 'bg-indigo-50/60 border-l-4 border-indigo-600' 
                        : 'hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0"
                        referrerPolicy="no-referrer"
                      />
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-slate-800 flex items-center space-x-1.5 truncate">
                          <span>{user.name}</span>
                          {user.id === currentUser.id && (
                            <span className="bg-amber-100 text-amber-800 text-[9px] font-mono font-bold px-1 py-0.2 rounded shrink-0">Self</span>
                          )}
                        </h4>
                        <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
                        
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="bg-slate-100 text-slate-600 text-[9px] font-bold font-mono px-1.5 py-0.2 rounded">
                            {user.role}
                          </span>
                          <span className={`text-[9px] font-semibold flex items-center space-x-0.5 ${
                            user.status === 'active' ? 'text-emerald-600' : 'text-red-500'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full mr-0.5 ${user.status === 'active' ? 'bg-emerald-500' : 'bg-red-400'}`}></span>
                            {user.status === 'active' ? 'Active' : 'Suspended'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1 shrink-0 ml-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => {
                          setSelectedUserId(user.id);
                          handleStartEditing();
                        }}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                        title="Edit profile information"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user)}
                        disabled={user.id === currentUser.id}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                        title="Terminate profile access"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Profile Bento Workspace */}
        <div className="lg:col-span-7 space-y-6">
          {selectedUser ? (
            <div className="space-y-6 animate-in fade-in duration-200">
              
              {/* Profile Main 360 Header Card */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs relative">
                <div className="absolute top-4 right-4 flex items-center space-x-2">
                  {isEditing ? (
                    <>
                      <button
                        onClick={handleSaveProfile}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg flex items-center space-x-1 shadow-xs transition cursor-pointer"
                      >
                        <Save className="w-3 h-3" />
                        <span>Save Workspace</span>
                      </button>
                      <button
                        onClick={() => setIsEditing(false)}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold px-3 py-1.5 rounded-lg transition cursor-pointer"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={handleStartEditing}
                        className="bg-indigo-650 hover:bg-indigo-700 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg flex items-center space-x-1 shadow-xs transition cursor-pointer"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Edit Complete Profile</span>
                      </button>
                      <button
                        onClick={() => setShowPasswordModal(true)}
                        className="bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg flex items-center space-x-1 shadow-xs transition cursor-pointer"
                      >
                        <KeyRound className="w-3 h-3 text-amber-400" />
                        <span>Reset Password</span>
                      </button>
                    </>
                  )}
                </div>

                {/* Profile Overview */}
                <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
                  <div className="relative group/avatar">
                    <img
                      src={isEditing ? editAvatar : selectedUser.avatar}
                      alt={selectedUser.name}
                      className="w-16 h-16 rounded-full object-cover border-2 border-indigo-600/20 shadow-md"
                      referrerPolicy="no-referrer"
                    />
                    {isEditing && (
                      <div className="absolute inset-0 bg-slate-950/40 rounded-full flex flex-col items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition duration-150">
                        <select
                          value={editAvatar}
                          onChange={(e) => setEditAvatar(e.target.value)}
                          className="text-[9px] bg-slate-900 border-none text-white focus:outline-none max-w-full rounded"
                        >
                          {AVATAR_OPTIONS.map((av, idx) => (
                            <option key={av} value={av}>Pic {idx + 1}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="border border-slate-200 rounded px-2 py-0.5 text-sm font-bold focus:outline-none focus:border-indigo-600 text-slate-800"
                        />
                      ) : (
                        <h3 className="text-base font-extrabold text-slate-900">{selectedUser.name}</h3>
                      )}
                      
                      <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
                        selectedUser.status === 'active' 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                          : 'bg-red-50 text-red-700 border border-red-200'
                      }`}>
                        {selectedUser.status === 'active' ? 'ACTIVE ACCESS' : 'SUSPENDED'}
                      </span>
                    </div>

                    <div className="text-xs text-slate-500 font-mono">
                      {isEditing ? (
                        <input
                          type="email"
                          value={editEmail}
                          onChange={(e) => setEditEmail(e.target.value)}
                          className="border border-slate-200 rounded px-2 py-0.5 text-xs focus:outline-none focus:border-indigo-600 text-slate-700 w-48"
                        />
                      ) : (
                        <span>{selectedUser.email}</span>
                      )}
                    </div>

                    <div className="flex items-center space-x-2 text-[11px] text-slate-400 mt-1">
                      <span className="font-semibold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">
                        {selectedUser.role}
                      </span>
                      <span>•</span>
                      <span>ID: {selectedUser.employeeId || `EMP-${selectedUser.id.toUpperCase()}`}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Profile Details Bento Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Info Card 1: Directory Profile Metadata */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider font-mono text-slate-700 border-b border-slate-100 pb-2 flex items-center space-x-1.5">
                    <IdCard className="w-4 h-4 text-indigo-600" />
                    <span>Identity details</span>
                  </h4>

                  <div className="space-y-3 text-xs">
                    <div>
                      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">Corporate Department</span>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editDept}
                          onChange={(e) => setEditDept(e.target.value)}
                          className="w-full mt-1 border border-slate-200 rounded px-2.5 py-1 text-xs focus:outline-none focus:border-indigo-600 text-slate-700 font-medium"
                        />
                      ) : (
                        <p className="font-semibold text-slate-800 flex items-center space-x-1.5 mt-0.5">
                          <Building className="w-3.5 h-3.5 text-slate-400" />
                          <span>{selectedUser.department || 'Operations Control'}</span>
                        </p>
                      )}
                    </div>

                    <div>
                      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">Official Contact Phone</span>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editPhone}
                          onChange={(e) => setEditPhone(e.target.value)}
                          placeholder="+966 5x xxx xxxx"
                          className="w-full mt-1 border border-slate-200 rounded px-2.5 py-1 text-xs focus:outline-none focus:border-indigo-600 text-slate-700 font-medium"
                        />
                      ) : (
                        <p className="font-mono text-slate-700 flex items-center space-x-1.5 mt-0.5">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span>{selectedUser.phone || '+966 50 123 4567'}</span>
                        </p>
                      )}
                    </div>

                    <div>
                      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">System Joining Date</span>
                      <p className="font-mono text-slate-600 flex items-center space-x-1.5 mt-0.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{selectedUser.joinedDate || '2025-11-15'}</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Info Card 2: Security & Roles Access Control */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider font-mono text-slate-700 border-b border-slate-100 pb-2 flex items-center space-x-1.5">
                    <Shield className="w-4 h-4 text-indigo-600" />
                    <span>Role & Access Privileges</span>
                  </h4>

                  <div className="space-y-3 text-xs">
                    <div>
                      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Corporate System Role</span>
                      {isEditing ? (
                        <select
                          value={editRole}
                          onChange={(e) => setEditRole(e.target.value)}
                          className="w-full border border-slate-200 rounded px-2.5 py-1 text-xs focus:outline-none focus:border-indigo-600 text-slate-700 font-medium bg-white"
                        >
                          {roles.map(r => (
                            <option key={r.id} value={r.name}>{r.name}</option>
                          ))}
                        </select>
                      ) : (
                        <div className="flex items-center space-x-2 mt-0.5">
                          <span className="bg-indigo-50 text-indigo-800 font-bold px-2 py-0.5 rounded border border-indigo-100 font-mono uppercase tracking-wider">
                            {selectedUser.role}
                          </span>
                        </div>
                      )}
                    </div>

                    <div>
                      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">Authorized Core Capabilities</span>
                      <p className="text-[11px] text-slate-500 leading-normal mt-1">
                        {selectedUser.role === 'Admin' || selectedUser.role === 'Super Admin' || selectedUser.role === 'General Manager' ? (
                          <span className="text-emerald-600 font-semibold flex items-center">
                            <CheckCircle className="w-3.5 h-3.5 mr-1" />
                            Full write-permissions for all projects, budgets, and corporate submittals.
                          </span>
                        ) : selectedUser.role === 'Accountant' ? (
                          <span className="text-slate-600 flex items-center">
                            <CheckCircle className="w-3.5 h-3.5 text-blue-500 mr-1" />
                            Write-access restricted to commercial invoicing, ledger balance sheets, and payments.
                          </span>
                        ) : (
                          <span className="text-slate-500 flex items-center">
                            <CheckCircle className="w-3.5 h-3.5 text-amber-500 mr-1" />
                            Localized viewing/adding logs of submittals, schedules, and site issues.
                          </span>
                        )}
                      </p>
                    </div>

                    <div>
                      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">Account Status Control</span>
                      {isEditing ? (
                        <div className="flex items-center space-x-4 mt-1">
                          <label className="flex items-center space-x-1.5 cursor-pointer text-xs font-semibold text-slate-700">
                            <input
                              type="radio"
                              name="editStatus"
                              checked={editStatus === 'active'}
                              onChange={() => setEditStatus('active')}
                              className="accent-indigo-600 w-3.5 h-3.5"
                            />
                            <span>Active Access</span>
                          </label>
                          <label className="flex items-center space-x-1.5 cursor-pointer text-xs font-semibold text-slate-700">
                            <input
                              type="radio"
                              name="editStatus"
                              checked={editStatus === 'inactive'}
                              onChange={() => setEditStatus('inactive')}
                              className="accent-red-600 w-3.5 h-3.5"
                            />
                            <span>Suspended</span>
                          </label>
                        </div>
                      ) : (
                        <p className="mt-0.5 text-slate-500 flex items-center">
                          {selectedUser.status === 'active' ? (
                            <span className="text-emerald-600 font-semibold flex items-center">
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-500 mr-1 animate-pulse" />
                              Portal Access Authorized
                            </span>
                          ) : (
                            <span className="text-red-500 font-semibold flex items-center">
                              <XCircle className="w-3.5 h-3.5 text-red-500 mr-1" />
                              Suspended - Account Blocked
                            </span>
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Info Card 3: Notes & Additional profile information */}
                <div className="md:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider font-mono text-slate-700 border-b border-slate-100 pb-2 flex items-center space-x-1.5">
                    <FileText className="w-4 h-4 text-indigo-600" />
                    <span>Authorized Notes & Memo Details</span>
                  </h4>

                  {isEditing ? (
                    <textarea
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      placeholder="Add corporate bio, professional background, or special authorization guidelines for this contracting officer..."
                      rows={3}
                      className="w-full border border-slate-200 rounded px-2.5 py-2 text-xs focus:outline-none focus:border-indigo-600 text-slate-700"
                    />
                  ) : (
                    <p className="text-xs text-slate-500 leading-relaxed italic bg-slate-50 p-3 rounded-lg border border-slate-100">
                      {selectedUser.notes || "No special administrative memo notes recorded for this employee profile."}
                    </p>
                  )}
                </div>

                {/* Info Card 4: Audit History specifically for this user */}
                <div className="md:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider font-mono text-slate-700 border-b border-slate-100 pb-2 flex items-center justify-between">
                    <span className="flex items-center space-x-1.5">
                      <History className="w-4 h-4 text-indigo-600" />
                      <span>Security & Action Log History ({userActivities.length})</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">Compliance Tracker</span>
                  </h4>

                  <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                    {userActivities.length === 0 ? (
                      <p className="text-xs text-slate-400 text-center py-4">No logged actions recorded for this employee profile yet.</p>
                    ) : (
                      userActivities.slice(0, 10).map((log) => (
                        <div key={log.id} className="text-[11px] p-2 bg-slate-50 border border-slate-150/60 rounded flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 hover:bg-slate-100/50 transition">
                          <div className="space-y-0.5">
                            <span className="font-bold text-slate-800">{log.action}</span>
                            <div className="text-[10px] text-slate-400 flex items-center space-x-1.5 font-mono">
                              <span className="bg-indigo-50/60 text-indigo-600 px-1 py-0.1 rounded font-sans uppercase tracking-wider font-bold">{log.module}</span>
                              <span>•</span>
                              <span>IP: {log.ip}</span>
                              <span>•</span>
                              <span>Device: {log.device}</span>
                            </div>
                          </div>
                          <span className="text-[10px] text-slate-500 font-mono shrink-0 whitespace-nowrap bg-white px-2 py-0.5 rounded border border-slate-200 self-start sm:self-center">{log.date}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>

            </div>
          ) : (
            <div className="bg-white p-12 text-center text-slate-400 border border-slate-200 rounded-xl">
              Select an employee profile from the left corporate directory to manage metadata, permissions, and security parameters.
            </div>
          )}
        </div>

      </div>

      {/* MODAL 1: ADD NEW USER MODAL */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 select-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg flex flex-col overflow-hidden max-h-[90vh]"
            >
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div className="flex items-center space-x-2">
                  <UserPlus className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-tight font-mono">Register New Contracting Officer</h3>
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-slate-400 hover:text-slate-600 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateUser} className="p-5 overflow-y-auto space-y-4">
                
                {/* Visual Avatar Picker */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-2">Select User Profile Avatar</label>
                  <div className="flex items-center space-x-2.5 overflow-x-auto py-1 scrollbar-thin">
                    {AVATAR_OPTIONS.map((av) => (
                      <button
                        type="button"
                        key={av}
                        onClick={() => setNewUserAvatar(av)}
                        className={`w-11 h-11 rounded-full overflow-hidden border-2 transition relative shrink-0 ${
                          newUserAvatar === av ? 'border-indigo-600 scale-105' : 'border-transparent opacity-60 hover:opacity-100'
                        }`}
                      >
                        <img src={av} className="w-full h-full object-cover" alt="avatar option" referrerPolicy="no-referrer" />
                        {newUserAvatar === av && (
                          <div className="absolute inset-0 bg-indigo-600/10 flex items-center justify-center">
                            <CheckCircle className="w-4 h-4 text-indigo-600 bg-white rounded-full p-0.5" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Full Employee Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Eng. Majed Al-Ghamdi"
                      value={newUserName}
                      onChange={(e) => setNewUserName(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:border-indigo-600 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Corporate Email Address *</label>
                    <input
                      type="email"
                      required
                      placeholder="majed@wafaq.com"
                      value={newUserEmail}
                      onChange={(e) => setNewUserEmail(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:border-indigo-600 font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Initial Cryptographic Passkey *</label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={newUserPassword}
                      onChange={(e) => setNewUserPassword(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:border-indigo-600 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">System Access Role *</label>
                    <select
                      value={newUserRole}
                      onChange={(e) => setNewUserRole(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:border-indigo-600 font-semibold bg-white"
                    >
                      {roles.map(r => (
                        <option key={r.id} value={r.name}>{r.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Contact phone Number</label>
                    <input
                      type="text"
                      placeholder="+966 5x xxx xxxx"
                      value={newUserPhone}
                      onChange={(e) => setNewUserPhone(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:border-indigo-600 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Corporate ID</label>
                    <input
                      type="text"
                      placeholder="EMP-8025"
                      value={newUserEmpId}
                      onChange={(e) => setNewUserEmpId(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:border-indigo-600 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Assigned Department</label>
                    <input
                      type="text"
                      placeholder="Operations / Procurement / etc"
                      value={newUserDept}
                      onChange={(e) => setNewUserDept(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:border-indigo-600 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Site Location Authorization</label>
                    <select className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:border-indigo-600 font-medium bg-white">
                      <option>Riyadh HQ Offices</option>
                      <option>Al-Ajlan Site foundation project</option>
                      <option>Wafaq Fit-out civil project</option>
                      <option>All Projects Hub</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Authorization Notes & Bios</label>
                  <textarea
                    placeholder="Provide professional notes, special responsibilities or clear parameters of site control..."
                    rows={2}
                    value={newUserNotes}
                    onChange={(e) => setNewUserNotes(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:border-indigo-600"
                  />
                </div>

                <div className="flex items-center space-x-2 bg-indigo-50 p-3 rounded-lg border border-indigo-100 text-[11px] text-indigo-950 font-medium leading-relaxed">
                  <AlertCircle className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>The new Contracting Officer will be pre-registered with status Active and can sign in instantly using their email and the provided security passkey.</span>
                </div>

                <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 rounded-lg transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2 rounded-lg transition shadow-md cursor-pointer"
                  >
                    Register Employee Account
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: PASSWORD CHANGE MODAL */}
      <AnimatePresence>
        {showPasswordModal && selectedUser && (
          <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 select-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-sm flex flex-col overflow-hidden"
            >
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div className="flex items-center space-x-2">
                  <Lock className="w-4 h-4 text-amber-500" />
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">Reset Passkey: {selectedUser.name}</h3>
                </div>
                <button
                  onClick={() => setShowPasswordModal(false)}
                  className="text-slate-400 hover:text-slate-600 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handlePasswordReset} className="p-5 space-y-4">
                
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">New Password Key</label>
                  <div className="relative">
                    <input
                      type={showPassValue ? 'text' : 'password'}
                      required
                      placeholder="Enter new strong password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:border-indigo-600 font-mono pr-9"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassValue(!showPassValue)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showPassValue ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">Minimum 4 characters, including alpha and numerical digits.</p>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Confirm Password Key</label>
                  <input
                    type="password"
                    required
                    placeholder="Verify new strong password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:border-indigo-600 font-mono"
                  />
                </div>

                <div className="flex items-center space-x-2 bg-amber-50 p-3 rounded-lg border border-amber-100 text-[10px] text-amber-900 font-medium leading-relaxed">
                  <KeyRound className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>The corporate workspace will record this update in system logs and apply security validation protocols to verify active logins.</span>
                </div>

                <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPasswordModal(false);
                      setNewPassword('');
                      setConfirmPassword('');
                    }}
                    className="px-3.5 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-100 rounded-lg transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-3.5 py-1.5 rounded-lg transition shadow-xs cursor-pointer"
                  >
                    Confirm Reset
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
