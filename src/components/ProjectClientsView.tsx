/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Search, 
  Building2, 
  FolderGit2, 
  ChevronRight, 
  ChevronLeft,
  Plus, 
  DollarSign, 
  ArrowRight,
  ExternalLink,
  Printer,
  Mail,
  Phone,
  MapPin,
  FileText,
  Bookmark
} from 'lucide-react';
import { Project, Client, User } from '../types';

interface ProjectClientsViewProps {
  projects: Project[];
  clients: Client[];
  setClients: React.Dispatch<React.SetStateAction<Client[]>>;
  currentUser: User;
  onLogAudit: (action: string, module: string, oldValue?: string, newValue?: string) => void;
  onAddNotification: (text: string, type: 'info' | 'success' | 'warning' | 'alert') => void;
  onViewWorkspace: (projectId: string, tab?: string) => void;
}

export default function ProjectClientsView({
  projects,
  clients,
  setClients,
  currentUser,
  onLogAudit,
  onAddNotification,
  onViewWorkspace
}: ProjectClientsViewProps) {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [projectSearchQuery, setProjectSearchQuery] = useState('');
  const [clientSearchQuery, setClientSearchQuery] = useState('');
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);

  // Form states for adding/editing client
  const [showForm, setShowForm] = useState(false);
  const [editingClientId, setEditingClientId] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [vatNumber, setVatNumber] = useState('');
  const [commercialReg, setCommercialReg] = useState('');
  const [contractValue, setContractValue] = useState<number | ''>('');
  const [notes, setNotes] = useState('');

  const canWrite = currentUser.role === 'General Manager' || currentUser.role === 'Project Manager' || currentUser.role === 'Admin' || currentUser.role === 'Super Admin';

  // Filter projects list
  const filteredProjects = useMemo(() => {
    return projects.filter(p => 
      p.name.toLowerCase().includes(projectSearchQuery.toLowerCase()) || 
      p.code.toLowerCase().includes(projectSearchQuery.toLowerCase()) ||
      p.clientName.toLowerCase().includes(projectSearchQuery.toLowerCase())
    );
  }, [projects, projectSearchQuery]);

  // Dynamically choose active project
  const activeProject = useMemo(() => {
    if (selectedProjectId) {
      return projects.find(p => p.id === selectedProjectId) || projects[0] || null;
    }
    return projects[0] || null;
  }, [projects, selectedProjectId]);

  // Set initial selected project on mount if not set
  React.useEffect(() => {
    if (projects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects, selectedProjectId]);

  // Filter Clients for active project
  const activeProjClients = useMemo(() => {
    if (!activeProject) return [];
    return clients.filter(c => c.projectId === activeProject.id);
  }, [clients, activeProject]);

  // Filter clients based on search query
  const filteredClients = useMemo(() => {
    return activeProjClients.filter(c => {
      const query = clientSearchQuery.toLowerCase();
      return (
        c.companyName.toLowerCase().includes(query) ||
        c.contactPerson.toLowerCase().includes(query) ||
        c.email.toLowerCase().includes(query) ||
        c.phone.toLowerCase().includes(query) ||
        (c.address && c.address.toLowerCase().includes(query)) ||
        (c.vatNumber && c.vatNumber.toLowerCase().includes(query)) ||
        (c.commercialReg && c.commercialReg.toLowerCase().includes(query))
      );
    });
  }, [activeProjClients, clientSearchQuery]);

  // Metrics for active project's clients
  const clientMetrics = useMemo(() => {
    const totalClients = activeProjClients.length;
    const totalContractValue = activeProjClients.reduce((sum, c) => sum + (c.contractValue || 0), 0);
    return { totalClients, totalContractValue };
  }, [activeProjClients]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProject) return;
    if (!companyName || !contactPerson || !email || !phone) {
      onAddNotification('Please fill in all required fields (Company, Contact Person, Email, and Phone).', 'warning');
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];

    if (editingClientId) {
      // Edit Client
      setClients(prev => prev.map(c => {
        if (c.id === editingClientId) {
          const updated = {
            ...c,
            companyName,
            contactPerson,
            email,
            phone,
            address,
            vatNumber: vatNumber || undefined,
            commercialReg: commercialReg || undefined,
            contractValue: contractValue !== '' ? Number(contractValue) : undefined,
            notes: notes || undefined,
            lastUpdated: todayStr,
            updatedBy: currentUser.name
          };
          onLogAudit(`Updated client record ${companyName}`, 'Client Central Directory', c.companyName, companyName);
          return updated;
        }
        return c;
      }));
      onAddNotification(`Client ${companyName} successfully updated.`, 'success');
    } else {
      // Register New Client
      const newClient: Client = {
        id: `cl_${Date.now()}`,
        projectId: activeProject.id,
        companyName,
        contactPerson,
        email,
        phone,
        address,
        vatNumber: vatNumber || undefined,
        commercialReg: commercialReg || undefined,
        contractValue: contractValue !== '' ? Number(contractValue) : undefined,
        notes: notes || undefined,
        lastUpdated: todayStr,
        updatedBy: currentUser.name
      };
      setClients(prev => [...prev, newClient]);
      onLogAudit(`Added new client ${companyName} to project ${activeProject.code}`, 'Client Central Directory', undefined, companyName);
      onAddNotification(`New client ${companyName} registered under ${activeProject.code}.`, 'success');
    }

    handleClearForm();
  };

  const handleEditClick = (c: Client) => {
    setEditingClientId(c.id);
    setCompanyName(c.companyName);
    setContactPerson(c.contactPerson);
    setEmail(c.email);
    setPhone(c.phone);
    setAddress(c.address || '');
    setVatNumber(c.vatNumber || '');
    setCommercialReg(c.commercialReg || '');
    setContractValue(c.contractValue !== undefined ? c.contractValue : '');
    setNotes(c.notes || '');
    setShowForm(true);
  };

  const handleDeleteClick = (id: string, name: string) => {
    const userRoleStr = currentUser?.role?.toLowerCase() || '';
    if (userRoleStr !== 'admin' && userRoleStr !== 'super admin' && userRoleStr !== 'superadmin') {
      alert("Unauthorized: Only Admin or Super Admin can delete records.");
      return;
    }

    if (window.confirm(`Are you sure you want to delete the client record for "${name}"?`)) {
      setClients(prev => prev.filter(c => c.id !== id));
      onLogAudit(`Deleted client record ${name}`, 'Client Central Directory', name, undefined);
      onAddNotification(`Client "${name}" has been removed from the registry.`, 'info');
      if (editingClientId === id) {
        handleClearForm();
      }
    }
  };

  const handleClearForm = () => {
    setEditingClientId(null);
    setCompanyName('');
    setContactPerson('');
    setEmail('');
    setPhone('');
    setAddress('');
    setVatNumber('');
    setCommercialReg('');
    setContractValue('');
    setNotes('');
    setShowForm(false);
  };

  return (
    <div id="clients-view-root" className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50">
      
      {/* Top Banner Context Section */}
      <div className="bg-white border-b border-slate-200 p-5 md:px-8 flex flex-col md:flex-row md:items-center md:justify-between shrink-0 gap-4">
        <div>
          <span className="text-xs font-mono font-bold text-indigo-600 uppercase tracking-widest block mb-1">Client Relationship Management</span>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Contract Client Registry</h2>
          <p className="text-xs text-slate-500 mt-1">Manage active enterprise clients, commercial registration documents, and contract contact details.</p>
        </div>
      </div>

      {/* Main Split Screen Area */}
      <div className="flex-1 flex overflow-hidden min-h-0 w-full">
      
        {/* 1. LEFT PANEL: Project Selection List */}
        <div 
          id="clients-project-sidebar" 
          className={`w-72 border-r border-slate-200 bg-white flex flex-col h-full shrink-0 transition-transform lg:translate-x-0 lg:relative lg:pointer-events-auto lg:z-10 ${
            mobileDetailOpen ? '-translate-x-full absolute pointer-events-none' : 'relative z-10'
          }`}
        >
        <div className="p-4 border-b border-slate-100 bg-slate-50/60">
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-widest font-mono">Projects Directory</h2>
          <p className="text-[10px] text-slate-400 mt-1">Select a contract project to manage its client roster</p>
          <div className="relative mt-3">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search code, name, client..."
              value={projectSearchQuery}
              onChange={e => setProjectSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2.5 space-y-1 bg-slate-50/30">
          {filteredProjects.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs italic">No projects found.</div>
          ) : (
            filteredProjects.map(p => {
              const isActive = activeProject?.id === p.id;
              const projectClientsCount = clients.filter(c => c.projectId === p.id).length;
              return (
                <button
                  key={p.id}
                  onClick={() => {
                    setSelectedProjectId(p.id);
                    setMobileDetailOpen(true);
                    handleClearForm();
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
                      {projectClientsCount} {projectClientsCount === 1 ? 'client' : 'clients'}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-800 mt-2 truncate">{p.name}</h4>
                  <p className="text-[10px] text-slate-400 mt-1 truncate">Owner: {p.clientName}</p>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* 2. RIGHT PANEL: Clients management viewport */}
      <div 
        id="clients-data-viewport" 
        className={`flex-1 flex flex-col h-full overflow-hidden transition-transform lg:translate-x-0 lg:relative lg:pointer-events-auto lg:z-10 ${
          mobileDetailOpen ? 'translate-x-0 relative z-20 bg-white' : 'translate-x-full absolute pointer-events-none'
        }`}
      >
        {activeProject ? (
          <>
            {/* Header section with active project description */}
            <div className="p-4 bg-white border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shrink-0">
              <div className="flex items-center space-x-3 overflow-hidden">
                <button 
                  onClick={() => setMobileDetailOpen(false)}
                  className="lg:hidden p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 shrink-0"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="bg-indigo-600/5 p-2 rounded-xl text-indigo-600 border border-indigo-100/30 shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div className="overflow-hidden">
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-mono font-extrabold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded uppercase">
                      {activeProject.code}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 truncate">{activeProject.name}</h3>
                  </div>
                  <p className="text-[10px] text-slate-400 truncate mt-0.5">Location: {activeProject.location} • Client Name: {activeProject.clientName}</p>
                </div>
              </div>

              <div className="flex items-center space-x-2 shrink-0 self-end sm:self-auto">
                <button
                  onClick={() => onViewWorkspace(activeProject.id, 'overview')}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1 cursor-pointer"
                  title="View workspace dashboard"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Workspace</span>
                </button>

                {canWrite && !showForm && (
                  <button
                    onClick={() => {
                      handleClearForm();
                      setShowForm(true);
                    }}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Client</span>
                  </button>
                )}
              </div>
            </div>

            {/* Metrics cards & Subheader search bar */}
            <div className="p-4 bg-slate-50/50 border-b border-slate-200 flex-1 overflow-y-auto space-y-4">
              
              {/* Central metrics summary cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block">Associated Clients</span>
                    <span className="text-xl font-extrabold text-slate-800 mt-1 block">
                      {clientMetrics.totalClients} <span className="text-xs text-slate-400 font-medium">Record(s)</span>
                    </span>
                  </div>
                  <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                    <Users className="w-5 h-5" />
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block">Aggregate Contract Share</span>
                    <span className="text-xl font-extrabold text-indigo-600 mt-1 block font-mono">
                      {clientMetrics.totalContractValue.toLocaleString()} <span className="text-xs text-slate-400 font-medium uppercase font-sans">SAR</span>
                    </span>
                  </div>
                  <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                    <DollarSign className="w-5 h-5" />
                  </div>
                </div>
              </div>

              {/* Add / Edit Client Form Panel */}
              {showForm && (
                <form onSubmit={handleFormSubmit} className="bg-white p-5 rounded-xl border border-indigo-150/60 shadow-md space-y-4 relative">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider font-mono flex items-center">
                      <Bookmark className="w-4 h-4 text-indigo-600 mr-1.5 shrink-0" />
                      {editingClientId ? 'Modify Client Particulars' : 'Register New Project Client'}
                    </h4>
                    <button 
                      type="button" 
                      onClick={handleClearForm}
                      className="text-slate-400 hover:text-slate-600 text-xs font-bold"
                    >
                      Close Form
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 uppercase font-bold">Company / Entity Name *</label>
                      <input 
                        type="text" 
                        required 
                        value={companyName} 
                        onChange={e => setCompanyName(e.target.value)} 
                        placeholder="e.g. Saudi Aramco Co." 
                        className="w-full border border-slate-200 rounded p-1.5 text-xs mt-1 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none" 
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 uppercase font-bold">Contact Person *</label>
                      <input 
                        type="text" 
                        required 
                        value={contactPerson} 
                        onChange={e => setContactPerson(e.target.value)} 
                        placeholder="e.g. Eng. Tariq Al-Amri" 
                        className="w-full border border-slate-200 rounded p-1.5 text-xs mt-1 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none" 
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 uppercase font-bold">Contract Allocation (SAR)</label>
                      <input 
                        type="number" 
                        value={contractValue} 
                        onChange={e => setContractValue(e.target.value !== '' ? Number(e.target.value) : '')} 
                        placeholder="e.g. 15000000" 
                        className="w-full border border-slate-200 rounded p-1.5 text-xs mt-1 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 font-mono outline-none" 
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 uppercase font-bold">Email Address *</label>
                      <input 
                        type="email" 
                        required 
                        value={email} 
                        onChange={e => setEmail(e.target.value)} 
                        placeholder="tariq@domain.sa" 
                        className="w-full border border-slate-200 rounded p-1.5 text-xs mt-1 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none" 
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 uppercase font-bold">Phone Number *</label>
                      <input 
                        type="text" 
                        required 
                        value={phone} 
                        onChange={e => setPhone(e.target.value)} 
                        placeholder="+966 5X XXX XXXX" 
                        className="w-full border border-slate-200 rounded p-1.5 text-xs mt-1 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none" 
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 uppercase font-bold">Commercial Registration (CR)</label>
                      <input 
                        type="text" 
                        value={commercialReg} 
                        onChange={e => setCommercialReg(e.target.value)} 
                        placeholder="1010XXXXXX" 
                        className="w-full border border-slate-200 rounded p-1.5 text-xs mt-1 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 font-mono outline-none" 
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 uppercase font-bold">VAT / Tax Certificate ID</label>
                      <input 
                        type="text" 
                        value={vatNumber} 
                        onChange={e => setVatNumber(e.target.value)} 
                        placeholder="3000XXXXXXXXXX" 
                        className="w-full border border-slate-200 rounded p-1.5 text-xs mt-1 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 font-mono outline-none" 
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-mono text-slate-400 uppercase font-bold">Physical Address</label>
                      <input 
                        type="text" 
                        value={address} 
                        onChange={e => setAddress(e.target.value)} 
                        placeholder="Olaya District, Riyadh, KSA" 
                        className="w-full border border-slate-200 rounded p-1.5 text-xs mt-1 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none" 
                      />
                    </div>

                    <div className="md:col-span-3">
                      <label className="block text-[10px] font-mono text-slate-400 uppercase font-bold">Memo / Contract Scope Details</label>
                      <textarea 
                        value={notes} 
                        onChange={e => setNotes(e.target.value)} 
                        rows={2}
                        placeholder="Key billing instructions, milestone deadlines, communication guidelines, etc." 
                        className="w-full border border-slate-200 rounded p-1.5 text-xs mt-1 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none" 
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                    <button 
                      type="button" 
                      onClick={handleClearForm} 
                      className="text-xs text-slate-500 hover:text-slate-700 font-bold px-3 py-1.5"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition shadow-sm"
                    >
                      {editingClientId ? 'Save Changes' : 'Register Client'}
                    </button>
                  </div>
                </form>
              )}

              {/* Filtering / Search panel */}
              <div className="bg-white p-3 rounded-xl border border-slate-200/60 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input 
                    type="text" 
                    placeholder="Search client directory (by name, VAT, CR, rep, email)..."
                    value={clientSearchQuery}
                    onChange={e => setClientSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                  />
                </div>
              </div>

              {/* Clients Cards Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {filteredClients.length === 0 ? (
                  <div className="lg:col-span-2 bg-white p-12 text-center rounded-xl border border-slate-200 shadow-xs">
                    <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                    <p className="text-xs text-slate-400 italic">No client records found matching search queries.</p>
                    {canWrite && !showForm && (
                      <button 
                        onClick={() => setShowForm(true)} 
                        className="mt-3 text-xs font-bold text-indigo-600 hover:text-indigo-800"
                      >
                        + Add first client for {activeProject.code}
                      </button>
                    )}
                  </div>
                ) : (
                  filteredClients.map(c => (
                    <div key={c.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs hover:shadow-md transition duration-150 flex flex-col justify-between">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="text-[9px] font-mono bg-indigo-50 text-indigo-700 border border-indigo-100 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                              CR Ref: {c.id}
                            </span>
                            <h4 className="text-sm font-extrabold text-slate-800 mt-2">{c.companyName}</h4>
                            <p className="text-xs text-slate-500 font-medium flex items-center mt-1.5">
                              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-1.5 shrink-0"></span>
                              Authorized Rep: <strong className="text-slate-700 ml-1">{c.contactPerson}</strong>
                            </p>
                          </div>
                          
                          {canWrite && (
                            <div className="flex items-center space-x-1 shrink-0">
                              <button
                                onClick={() => handleEditClick(c)}
                                className="text-xs text-indigo-600 hover:bg-indigo-50 font-bold px-2 py-1 rounded transition cursor-pointer"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteClick(c.id, c.companyName)}
                                className="text-xs text-rose-600 hover:bg-rose-50 font-bold px-2 py-1 rounded transition cursor-pointer"
                              >
                                Delete
                              </button>
                            </div>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2.5 pt-3 border-t border-slate-100 text-xs">
                          <div className="flex items-center space-x-2">
                            <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <a href={`mailto:${c.email}`} className="text-indigo-600 hover:underline font-medium truncate">{c.email}</a>
                          </div>
                          <div className="flex items-center space-x-2 font-medium text-slate-600">
                            <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{c.phone}</span>
                          </div>
                          
                          <div className="p-2 bg-slate-50 rounded-lg">
                            <span className="text-[9px] font-mono text-slate-400 uppercase block leading-none mb-1">Commercial Reg. (CR)</span>
                            <span className="text-slate-700 font-mono font-bold leading-none">{c.commercialReg || 'N/A'}</span>
                          </div>
                          <div className="p-2 bg-slate-50 rounded-lg">
                            <span className="text-[9px] font-mono text-slate-400 uppercase block leading-none mb-1">VAT Register ID</span>
                            <span className="text-slate-700 font-mono font-bold leading-none">{c.vatNumber || 'N/A'}</span>
                          </div>

                          {c.contractValue !== undefined && (
                            <div className="col-span-1 sm:col-span-2 p-2 bg-indigo-50/50 rounded-lg border border-indigo-100/30">
                              <span className="text-[9px] font-mono text-indigo-700 uppercase block leading-none mb-1">Contract Allocation Value</span>
                              <span className="text-indigo-600 font-mono font-extrabold text-sm leading-none">{c.contractValue.toLocaleString()} SAR</span>
                            </div>
                          )}

                          {c.address && (
                            <div className="col-span-1 sm:col-span-2 flex items-start space-x-2 text-slate-500">
                              <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                              <span className="leading-tight">{c.address}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {c.notes && (
                        <div className="mt-3.5 p-3 bg-slate-50 border border-slate-150 rounded-xl text-xs text-slate-500 italic leading-relaxed">
                          {c.notes}
                        </div>
                      )}

                      <div className="mt-4 pt-2.5 border-t border-slate-100 flex justify-between items-center text-[10px] text-slate-400 font-mono">
                        <span>Updated: {c.lastUpdated}</span>
                        <span>By: {c.updatedBy}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>

            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center bg-slate-50">
            <Users className="w-12 h-12 text-slate-300 mb-2" />
            <p className="text-sm">Please register or select a contract project to view and manage client data records.</p>
          </div>
        )}
      </div>

      </div>
    </div>
  );
}
