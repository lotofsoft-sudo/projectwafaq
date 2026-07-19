/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Circle, 
  ArrowRight, 
  Sparkles, 
  UserCheck, 
  ShieldAlert, 
  ChevronDown, 
  ChevronUp, 
  X, 
  Layers, 
  ExternalLink, 
  Clock,
  FileText,
  Paperclip
} from 'lucide-react';
import { Project, User } from '../types';
import { WORKFLOW_STEP_NAMES } from '../data/mockData';

// Router Map from Step to Workspace Tab
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

interface WorkflowTrackerProps {
  project: Project;
  currentUser: User;
  onUpdateWorkflowStepStatus: (projectId: string, stepNum: number, status: 'pending' | 'in_progress' | 'completed') => void;
  onNavigateToTab: (tabName: 'overview' | 'boq' | 'quotations' | 'po' | 'budget' | 'milestones' | 'tasks' | 'issues' | 'variations' | 'expenses' | 'invoices' | 'payments' | 'documents') => void;
  onAddStepAttachment: (projectId: string, stepNum: number, fileName: string, fileSize: string) => void;
}

export default function WorkflowTracker({
  project,
  currentUser,
  onUpdateWorkflowStepStatus,
  onNavigateToTab,
  onAddStepAttachment,
}: WorkflowTrackerProps) {
  
  const currentStep = project.currentWorkflowStep;
  
  // Authorization strictly limited to Project Manager, Admin, and Super Admin as per request
  const isAuthorized = 
    currentUser.role === 'Project Manager' || 
    currentUser.role === 'Admin' || 
    currentUser.role === 'Super Admin';

  const [isExpanded, setIsExpanded] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1024;
    }
    return false;
  });

  // Modal active step state
  const [selectedStepForModal, setSelectedStepForModal] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    if (selectedStepForModal === null) return;
    const file = e.target.files[0];
    
    setIsUploading(true);
    // Simulate brief elegant upload loader
    setTimeout(() => {
      const fileSizeStr = file.size > 1024 * 1024 
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` 
        : `${Math.round(file.size / 1024)} KB`;
      
      onAddStepAttachment(project.id, selectedStepForModal, file.name, fileSizeStr);
      setIsUploading(false);
    }, 800);
  };

  // Group steps into 4 logical phases
  const phases = [
    {
      name: '1. Initiation & Pre-Bid',
      steps: [1, 2, 3, 4, 5],
      color: 'bg-emerald-500',
      textColor: 'text-emerald-700'
    },
    {
      name: '2. Bidding & Commercials',
      steps: [6, 7, 8, 9, 10, 11],
      color: 'bg-blue-500',
      textColor: 'text-blue-700'
    },
    {
      name: '3. Mobilization & Engineering',
      steps: [12, 13, 14, 15, 16, 17, 18, 19],
      color: 'bg-amber-500',
      textColor: 'text-amber-700'
    },
    {
      name: '4. Execution & Closeout',
      steps: [20, 21, 22, 23, 24, 25, 26, 27, 28],
      color: 'bg-indigo-500',
      textColor: 'text-indigo-700'
    }
  ];

  const getStepStatus = (stepNum: number): 'pending' | 'in_progress' | 'completed' => {
    if (project.workflowStepsStatuses && project.workflowStepsStatuses[stepNum]) {
      return project.workflowStepsStatuses[stepNum];
    }
    // Backward compatibility: sequential default based on currentWorkflowStep
    if (stepNum < project.currentWorkflowStep) return 'completed';
    if (stepNum === project.currentWorkflowStep) return 'in_progress';
    return 'pending';
  };

  const handleStepClick = (stepNum: number) => {
    setSelectedStepForModal(stepNum);
  };

  return (
    <div id="workflow-tracker-container" className="bg-white p-5 rounded-xl border border-gray-200/80 shadow-sm space-y-6 text-slate-800">
      
      {/* Header and Permission Info */}
      <div className="flex items-center justify-between border-b border-gray-100 pb-4">
        <div>
          <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider font-mono">Contracting Workflow & Operations Tracker</h3>
          <p className="text-[10px] text-gray-400 mt-0.5">Wafaq Company project lifecycle steps from pre-bid invitation to final payment collection (28 standard checkpoints)</p>
        </div>
        
        {isAuthorized ? (
          <div className="flex items-center space-x-1.5 bg-emerald-50 text-emerald-800 text-[10px] px-2.5 py-1 rounded-md border border-emerald-500/10">
            <UserCheck className="w-3.5 h-3.5" />
            <span>Authorized Approval Role</span>
          </div>
        ) : (
          <div className="flex items-center space-x-1.5 bg-gray-50 text-gray-400 text-[10px] px-2.5 py-1 rounded-md border border-gray-100">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>View Only Permission</span>
          </div>
        )}
      </div>

      {/* Project Status Summary Banner */}
      <div className="bg-slate-900 text-white p-4 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center space-y-3 md:space-y-0 animate-fade-in">
        <div>
          <span className="text-[9px] font-mono text-indigo-400 uppercase tracking-wider font-bold">Current Operational Stage</span>
          <h4 className="text-sm font-bold text-slate-100 mt-0.5">
            Step {currentStep}/28: {WORKFLOW_STEP_NAMES[currentStep - 1]}
          </h4>
          <p className="text-[10px] text-slate-400 mt-1">
            {currentStep === 28 
              ? 'This contract has successfully closed and handed over to the client.' 
              : `Current active workflow checklist. Click on any step to verify or update.`}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2.5 shrink-0 self-stretch md:self-auto justify-end w-full md:w-auto">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="border border-slate-700 hover:bg-slate-800 text-slate-300 font-bold px-3 py-2 rounded-lg text-xs transition flex items-center justify-center space-x-1.5 cursor-pointer w-full sm:w-auto active-scale"
          >
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            <span>{isExpanded ? "Hide Steps Flow" : "Show All 28 Steps"}</span>
          </button>

          {isAuthorized && currentStep < 28 && (
            <button
              onClick={() => handleStepClick(currentStep + 1)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-lg text-xs transition flex items-center justify-center space-x-1.5 shrink-0 cursor-pointer shadow-lg shadow-indigo-500/15 w-full sm:w-auto active-scale"
            >
              <span>Verify Next Step #{currentStep + 1}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Grid of Phases */}
      {isExpanded && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {phases.map((phase, idx) => {
            // Check phase status
            const phaseSteps = phase.steps;
            const completedStepsInPhase = phaseSteps.filter(s => getStepStatus(s) === 'completed').length;
            const isPhaseCompleted = completedStepsInPhase === phaseSteps.length;
            const isPhaseActive = phaseSteps.some(s => getStepStatus(s) === 'in_progress');

            return (
              <div 
                key={idx} 
                className={`p-4 rounded-xl border transition ${
                  isPhaseActive 
                    ? 'bg-indigo-50/40 border-indigo-500/20 shadow-xs' 
                    : isPhaseCompleted 
                      ? 'bg-emerald-50/10 border-emerald-500/15' 
                      : 'bg-gray-50/50 border-gray-100'
                }`}
              >
                {/* Phase Header */}
                <div className="flex justify-between items-center mb-3">
                  <span className={`text-[11px] font-bold ${phase.textColor} tracking-tight`}>
                    {phase.name}
                  </span>
                  <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${
                    isPhaseCompleted 
                      ? 'bg-emerald-100 text-emerald-800' 
                      : isPhaseActive 
                        ? 'bg-indigo-100 text-indigo-800 animate-pulse' 
                        : 'bg-gray-100 text-gray-500'
                  }`}>
                    {isPhaseCompleted ? 'Done' : isPhaseActive ? 'Active' : 'Pending'}
                  </span>
                </div>

                {/* Steps List */}
                <div className="space-y-2">
                  {phaseSteps.map((stepNum) => {
                    const stepStatus = getStepStatus(stepNum);
                    
                    return (
                      <button
                        key={stepNum}
                        onClick={() => handleStepClick(stepNum)}
                        className={`w-full flex items-start space-x-2 text-left p-1.5 rounded transition ${
                          stepStatus === 'in_progress'
                            ? 'bg-indigo-50 text-indigo-900 border border-indigo-200/50 font-bold' 
                            : stepStatus === 'completed' 
                              ? 'text-emerald-700 hover:bg-emerald-50/40 font-semibold' 
                              : 'text-gray-405 hover:bg-gray-100/50'
                        } cursor-pointer`}
                      >
                        {stepStatus === 'completed' ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        ) : stepStatus === 'in_progress' ? (
                          <Sparkles className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5 animate-pulse" />
                        ) : (
                          <Circle className="w-4 h-4 text-gray-300 shrink-0 mt-0.5" />
                        )}
                        <div className="text-[11px] leading-tight">
                          <span className="font-mono text-[9px] text-gray-400 mr-1">#{stepNum}</span>
                          {WORKFLOW_STEP_NAMES[stepNum - 1]}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Step Details & Non-Linear Status Controls Modal */}
      {selectedStepForModal !== null && (
        <div className="fixed inset-0 bg-slate-950/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs select-none animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150 text-slate-800">
            
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-5 border-b border-slate-800 flex justify-between items-center">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 font-mono">
                  Operational Step Details
                </span>
                <h4 className="text-sm font-bold text-slate-100 mt-1">
                  Step #{selectedStepForModal}: {WORKFLOW_STEP_NAMES[selectedStepForModal - 1]}
                </h4>
              </div>
              <button 
                onClick={() => setSelectedStepForModal(null)}
                className="text-slate-400 hover:text-white transition p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              
              {/* Step Status Summary Box */}
              <div className="flex items-center space-x-4 p-4 rounded-xl border border-slate-100 bg-slate-50/50">
                <div className="shrink-0">
                  {getStepStatus(selectedStepForModal) === 'completed' ? (
                    <div className="w-10 h-10 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-600 font-bold text-lg">✓</div>
                  ) : getStepStatus(selectedStepForModal) === 'in_progress' ? (
                    <div className="w-10 h-10 rounded-full bg-indigo-100 border border-indigo-300 flex items-center justify-center text-indigo-600 animate-pulse">
                      <Clock className="w-5 h-5" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-300 flex items-center justify-center text-slate-400">
                      <Circle className="w-5 h-5" />
                    </div>
                  )}
                </div>
                <div>
                  <span className="text-[10px] font-bold font-mono uppercase text-slate-400 block">Current Status</span>
                  <span className="text-sm font-extrabold text-slate-800">
                    {getStepStatus(selectedStepForModal) === 'completed' && 'Approved / Completed'}
                    {getStepStatus(selectedStepForModal) === 'in_progress' && 'Under Active Execution'}
                    {getStepStatus(selectedStepForModal) === 'pending' && 'Pending Baseline'}
                  </span>
                </div>
              </div>

              {/* Related Workspace Section Routing Box */}
              <div className="p-4 rounded-xl bg-indigo-50/40 border border-indigo-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="space-y-1 text-center sm:text-left">
                  <span className="text-[9px] font-mono font-extrabold text-indigo-600 uppercase tracking-wider block">Related Workspace Module</span>
                  <span className="text-xs font-bold text-slate-700 block">
                    {getLabelForStepTab(selectedStepForModal)}
                  </span>
                </div>
                <button
                  onClick={() => {
                    onNavigateToTab(getTabForStep(selectedStepForModal));
                    setSelectedStepForModal(null);
                  }}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs px-4 py-2 rounded-xl transition flex items-center justify-center space-x-1.5 shadow-sm shrink-0 cursor-pointer active-scale"
                >
                  <span>Go to File</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Status Controls Block (Only for admins/managers) */}
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">Approval Authority Console</span>
                  {!isAuthorized && (
                    <span className="text-[9px] font-bold font-mono text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded uppercase">View Only</span>
                  )}
                </div>

                {isAuthorized ? (
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => {
                        onUpdateWorkflowStepStatus(project.id, selectedStepForModal, 'completed');
                        setSelectedStepForModal(null);
                      }}
                      className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-[11px] py-2 px-2.5 rounded-xl cursor-pointer transition text-center"
                    >
                      Approve (Done)
                    </button>
                    <button
                      onClick={() => {
                        onUpdateWorkflowStepStatus(project.id, selectedStepForModal, 'in_progress');
                        setSelectedStepForModal(null);
                      }}
                      className="bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 font-bold text-[11px] py-2 px-2.5 rounded-xl cursor-pointer transition text-center"
                    >
                      Set Active
                    </button>
                    <button
                      onClick={() => {
                        onUpdateWorkflowStepStatus(project.id, selectedStepForModal, 'pending');
                        setSelectedStepForModal(null);
                      }}
                      className="bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 font-bold text-[11px] py-2 px-2.5 rounded-xl cursor-pointer transition text-center"
                    >
                      Set Pending
                    </button>
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400 italic">
                    Your current role does not have authorization to approve contracting workflow steps. Permissions are limited to Admin, Super Admin, and Project Manager roles.
                  </p>
                )}
              </div>

              {/* Step Related Files Section */}
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                    Step Related Files ({project.workflowStepsAttachments?.[selectedStepForModal] ? project.workflowStepsAttachments[selectedStepForModal].length : 0})
                  </span>
                </div>

                {/* Upload Button */}
                <div className="flex items-center space-x-2">
                  <label className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-xl p-4 bg-slate-50/55 hover:bg-indigo-50/10 cursor-pointer transition relative group">
                    <input 
                      type="file" 
                      onChange={handleFileChange} 
                      disabled={isUploading}
                      className="hidden" 
                    />
                    <div className="flex flex-col items-center justify-center text-center">
                      {isUploading ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                          <span className="text-[11px] font-bold text-indigo-600">Uploading to server...</span>
                        </div>
                      ) : (
                        <>
                          <Paperclip className="w-5 h-5 text-slate-400 group-hover:text-indigo-500 mb-1" />
                          <span className="text-[11px] font-extrabold text-slate-600 group-hover:text-indigo-600">Click to upload step-specific document</span>
                          <span className="text-[9px] text-slate-400 mt-0.5">PDF, DOCX, XLSX, images (max 10MB)</span>
                        </>
                      )}
                    </div>
                  </label>
                </div>

                {/* Attachments List */}
                {project.workflowStepsAttachments?.[selectedStepForModal] && project.workflowStepsAttachments[selectedStepForModal].length > 0 ? (
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    {project.workflowStepsAttachments[selectedStepForModal].map((file, fileIdx) => (
                      <div key={fileIdx} className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 bg-slate-50/30 text-xs">
                        <div className="flex items-center space-x-2.5 overflow-hidden">
                          <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                          <div className="truncate min-w-0">
                            <p className="font-semibold text-slate-700 truncate">{file.name}</p>
                            <span className="text-[9px] text-slate-400 block font-mono">
                              {file.size} • by {file.uploadedBy} • {file.uploadedAt}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[10px] text-slate-400 italic text-center py-2 bg-slate-50/30 rounded-lg">
                    No related files uploaded for this operational checkpoint yet.
                  </p>
                )}
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
