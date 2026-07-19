/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  FileText, 
  Search, 
  ChevronLeft,
  Briefcase
} from 'lucide-react';
import { Project, Quotation, User, Document } from '../types';
import QuotationsManager from './QuotationsManager';

interface ProjectQuotationsViewProps {
  projects: Project[];
  quotations: Quotation[];
  setQuotations: React.Dispatch<React.SetStateAction<Quotation[]>>;
  currentUser: User;
  onLogAudit: (action: string, module: string, oldValue?: string, newValue?: string) => void;
  onAddNotification: (text: string, type: 'info' | 'success' | 'warning' | 'alert') => void;
  documents?: Document[];
  setDocuments?: React.Dispatch<React.SetStateAction<Document[]>>;
}

export default function ProjectQuotationsView({
  projects,
  quotations,
  setQuotations,
  currentUser,
  onLogAudit,
  onAddNotification,
  documents,
  setDocuments,
}: ProjectQuotationsViewProps) {
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [projectSearchQuery, setProjectSearchQuery] = useState('');
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);

  // Filter projects list for the sidebar
  const filteredProjects = useMemo(() => {
    return projects.filter(p => 
      p.name.toLowerCase().includes(projectSearchQuery.toLowerCase()) || 
      p.code.toLowerCase().includes(projectSearchQuery.toLowerCase())
    );
  }, [projects, projectSearchQuery]);

  // Active project title/info
  const activeProject = useMemo(() => {
    if (selectedProjectId === 'all') return null;
    return projects.find(p => p.id === selectedProjectId) || null;
  }, [projects, selectedProjectId]);

  return (
    <div id="quotations-view-root" className="flex-1 flex flex-col h-full bg-slate-50 overflow-hidden">
      
      {/* Top Banner Context Section */}
      <div className="bg-white border-b border-slate-200 p-5 md:px-8 flex flex-col md:flex-row md:items-center md:justify-between shrink-0 gap-4">
        <div>
          <span className="text-xs font-mono font-bold text-indigo-600 uppercase tracking-widest block mb-1">Tendering & Estimating</span>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Contract Quotations Directory</h2>
          <p className="text-xs text-slate-500 mt-1">Manage, review, and archive project quotations, tender submissions, and active vendor estimates.</p>
        </div>
      </div>

      {/* Main Split Screen Area */}
      <div className="flex-1 flex overflow-hidden min-h-0 w-full">
      
        {/* 1. LEFT PANEL: Project Selection List */}
        <div 
          id="quotations-project-sidebar" 
          className={`w-72 border-r border-slate-200 bg-white flex flex-col h-full shrink-0 transition-transform lg:translate-x-0 lg:relative lg:pointer-events-auto lg:z-10 ${
            mobileDetailOpen ? '-translate-x-full absolute pointer-events-none' : 'relative z-10'
          }`}
        >
        <div className="p-4 border-b border-slate-100 bg-slate-50/60">
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-widest font-mono">Projects Directory</h2>
          <p className="text-[10px] text-slate-400 mt-1">Select a project to filter quotations</p>
          <div className="relative mt-3">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search code, name..."
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
              <h4 className="text-xs font-bold text-slate-800">All Project Quotations</h4>
              <p className="text-[10px] text-slate-400 mt-0.5">Show quotations across all folders</p>
            </div>
          </button>

          {filteredProjects.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs italic">No projects found.</div>
          ) : (
            filteredProjects.map(p => {
              const isActive = selectedProjectId === p.id;
              const projectQuotationsCount = quotations.filter(q => q.projectId === p.id).length;
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
                      {projectQuotationsCount} {projectQuotationsCount === 1 ? 'quote' : 'quotes'}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-800 mt-2 truncate">{p.name}</h4>
                  <p className="text-[10px] text-slate-400 mt-1 truncate">Client: {p.clientName}</p>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* 2. RIGHT PANEL: Quotations management viewport */}
      <div 
        id="quotations-data-viewport" 
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
              <FileText className="w-5 h-5" />
            </div>
            <div className="overflow-hidden">
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-mono font-extrabold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded uppercase">
                  {activeProject ? activeProject.code : 'GLOBAL'}
                </span>
                <h3 className="text-sm font-bold text-slate-900 truncate">
                  {activeProject ? `${activeProject.name} - Quotations` : 'Central Quotations Directory'}
                </h3>
              </div>
              <p className="text-[10px] text-slate-400 truncate mt-0.5">
                {activeProject 
                  ? `Viewing quotation baselines and pricing sheet updates for ${activeProject.name}`
                  : 'Manage drafts, revisions, approved proposals, and readymade files globally across all projects'
                }
              </p>
            </div>
          </div>
        </div>

        {/* Core management workspace containing reusable manager */}
        <div className="p-6 bg-slate-50 flex-1 overflow-y-auto">
          <QuotationsManager
            projectId={selectedProjectId === 'all' ? undefined : selectedProjectId}
            projects={projects}
            quotations={quotations}
            setQuotations={setQuotations}
            currentUser={currentUser}
            onLogAudit={onLogAudit}
            onAddNotification={onAddNotification}
            documents={documents}
            setDocuments={setDocuments}
          />
        </div>

      </div>
      </div>
    </div>
  );
}
