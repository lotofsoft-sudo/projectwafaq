/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  X, 
  Plus, 
  Edit3, 
  Trash2, 
  FileText, 
  Scale, 
  Layers, 
  Calendar, 
  User as UserIcon,
  CheckCircle,
  HelpCircle,
  Printer
} from 'lucide-react';
import { Project, ProjectQuantity, User } from '../types';

interface GlobalQuantitiesModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeProject: Project;
  projects: Project[];
  onSelectProject: (projectId: string) => void;
  quantities: ProjectQuantity[];
  setQuantities: React.Dispatch<React.SetStateAction<ProjectQuantity[]>>;
  currentUser: User;
  onLogAudit: (action: string, module: string, oldValue?: string, newValue?: string) => void;
  onAddNotification: (text: string, type: 'info' | 'success' | 'warning' | 'alert') => void;
}

export default function GlobalQuantitiesModal({
  isOpen,
  onClose,
  activeProject,
  projects,
  onSelectProject,
  quantities,
  setQuantities,
  currentUser,
  onLogAudit,
  onAddNotification
}: GlobalQuantitiesModalProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Add state
  const [newName, setNewName] = useState('');
  const [newValue, setNewValue] = useState<number | ''>('');
  const [newUnit, setNewUnit] = useState('m3');

  // Edit state
  const [editName, setEditName] = useState('');
  const [editValue, setEditValue] = useState<number | ''>('');
  const [editUnit, setEditUnit] = useState('');

  if (!isOpen) return null;

  const projectQuantities = quantities.filter(q => q.projectId === activeProject.id);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || newValue === '') return;

    const newQuantity: ProjectQuantity = {
      id: `q_${Date.now()}`,
      projectId: activeProject.id,
      name: newName,
      value: Number(newValue),
      unit: newUnit,
      lastUpdated: new Date().toISOString().slice(0, 10),
      updatedBy: currentUser.name
    };

    setQuantities(prev => [...prev, newQuantity]);
    onLogAudit(
      `Added Project Quantity "${newName}"`,
      'Project Quantities',
      undefined,
      `${newValue} ${newUnit} for project ${activeProject.code}`
    );
    onAddNotification(`Successfully added quantity "${newName}" to ${activeProject.code}`, 'success');

    // Reset Form
    setNewName('');
    setNewValue('');
    setNewUnit('m3');
  };

  const handleStartEdit = (q: ProjectQuantity) => {
    setEditingId(q.id);
    setEditName(q.name);
    setEditValue(q.value);
    setEditUnit(q.unit);
  };

  const handleSaveEdit = (id: string) => {
    if (!editName || editValue === '') return;

    const oldQ = quantities.find(q => q.id === id);
    const oldValStr = oldQ ? `${oldQ.value} ${oldQ.unit}` : '';

    setQuantities(prev => prev.map(q => {
      if (q.id === id) {
        return {
          ...q,
          name: editName,
          value: Number(editValue),
          unit: editUnit,
          lastUpdated: new Date().toISOString().slice(0, 10),
          updatedBy: currentUser.name
        };
      }
      return q;
    }));

    onLogAudit(
      `Updated Project Quantity "${editName}"`,
      'Project Quantities',
      oldValStr,
      `${editValue} ${editUnit}`
    );
    onAddNotification(`Updated quantity "${editName}" successfully`, 'success');

    setEditingId(null);
  };

  const handleDelete = (id: string, name: string) => {
    const userRoleStr = currentUser?.role?.toLowerCase() || '';
    if (userRoleStr !== 'admin' && userRoleStr !== 'super admin' && userRoleStr !== 'superadmin') {
      alert("Unauthorized: Only Admin or Super Admin can delete records.");
      return;
    }

    if (confirm(`Are you sure you want to remove quantity "${name}"?`)) {
      setQuantities(prev => prev.filter(q => q.id !== id));
      onLogAudit(
        `Deleted Project Quantity "${name}"`,
        'Project Quantities',
        name,
        undefined
      );
      onAddNotification(`Removed quantity "${name}"`, 'warning');
    }
  };

  // PDF Export Generation
  const handleExportPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Could not open print window. Please allow popups for this site.');
      return;
    }

    const todayStr = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const rowsHTML = projectQuantities.map((q, idx) => `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 12px 8px; font-weight: bold; text-align: center; color: #4a5568;">${idx + 1}</td>
        <td style="padding: 12px 8px; font-weight: 600; color: #1a202c;">${q.name}</td>
        <td style="padding: 12px 8px; font-family: monospace; font-weight: bold; text-align: right; color: #2b6cb0;">${q.value.toLocaleString()}</td>
        <td style="padding: 12px 8px; font-family: monospace; text-align: left; color: #4a5568;">${q.unit}</td>
        <td style="padding: 12px 8px; text-align: center; color: #718096; font-size: 11px;">${q.lastUpdated}</td>
        <td style="padding: 12px 8px; color: #4a5568; font-size: 11px;">${q.updatedBy}</td>
      </tr>
    `).join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Project Quantities Ledger - ${activeProject.code}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
          body {
            font-family: 'Inter', sans-serif;
            margin: 0;
            padding: 40px;
            color: #2d3748;
            background-color: #fff;
          }
          .header-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
          }
          .logo-cell {
            font-size: 24px;
            font-weight: 800;
            letter-spacing: -0.5px;
            color: #4f46e5;
          }
          .logo-sub {
            font-size: 10px;
            font-weight: 700;
            color: #718096;
            letter-spacing: 1.5px;
            text-transform: uppercase;
            margin-top: 2px;
          }
          .gov-cell {
            text-align: right;
            font-size: 11px;
            font-family: monospace;
            color: #718096;
            line-height: 1.4;
          }
          .title-section {
            border-top: 3px solid #4f46e5;
            padding-top: 15px;
            margin-bottom: 25px;
          }
          .report-title {
            font-size: 20px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #1a202c;
            margin: 0;
          }
          .meta-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 16px;
            margin-bottom: 30px;
            font-size: 12px;
          }
          .meta-item span {
            font-weight: 500;
            color: #718096;
            display: block;
            text-transform: uppercase;
            font-size: 9px;
            letter-spacing: 0.5px;
            margin-bottom: 4px;
          }
          .meta-item p {
            margin: 0;
            font-weight: 700;
            color: #2d3748;
            font-size: 13px;
          }
          .ledger-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 12px;
            margin-bottom: 40px;
          }
          .ledger-table th {
            background-color: #f1f5f9;
            color: #475569;
            font-weight: 700;
            text-transform: uppercase;
            font-size: 10px;
            letter-spacing: 0.5px;
            padding: 10px 8px;
            border-bottom: 2px solid #cbd5e1;
          }
          .footer-section {
            margin-top: 60px;
            border-top: 1px dashed #cbd5e1;
            padding-top: 20px;
            font-size: 10px;
            color: #94a3b8;
            display: flex;
            justify-content: space-between;
          }
          .signature-box {
            display: flex;
            justify-content: space-between;
            margin-top: 50px;
          }
          .sig-line {
            width: 200px;
            border-top: 1px solid #a0aec0;
            text-align: center;
            padding-top: 8px;
            font-size: 11px;
            color: #4a5568;
            font-weight: 600;
          }
          @media print {
            body { padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <table class="header-table">
          <tr>
            <td>
              <div class="logo-cell">WAFAQ CONTRACTING</div>
              <div class="logo-sub">Enterprise Resource Planning</div>
            </td>
            <td class="gov-cell">
              KINGDOM OF SAUDI ARABIA<br>
              QUANTITY SURVEY & PORTFOLIO LOG<br>
              Date: ${todayStr}
            </td>
          </tr>
        </table>

        <div class="title-section">
          <h1 class="report-title">Project Quantities Certificate</h1>
        </div>

        <div class="meta-grid">
          <div class="meta-item">
            <span>Project Code & Name</span>
            <p>${activeProject.code} - ${activeProject.name}</p>
          </div>
          <div class="meta-item">
            <span>Client Developer</span>
            <p>${activeProject.clientName}</p>
          </div>
          <div class="meta-item">
            <span>Site Location</span>
            <p>${activeProject.siteLocation}</p>
          </div>
          <div class="meta-item">
            <span>Site Manager / PM</span>
            <p>${activeProject.siteManager}</p>
          </div>
        </div>

        <table class="ledger-table">
          <thead>
            <tr>
              <th style="width: 50px; text-align: center;">#</th>
              <th style="text-align: left;">Quantity Name / Scope Item</th>
              <th style="text-align: right; width: 120px;">Certified Value</th>
              <th style="text-align: left; width: 80px;">Unit</th>
              <th style="text-align: center; width: 100px;">Last Update</th>
              <th style="text-align: left;">Verified By</th>
            </tr>
          </thead>
          <tbody>
            ${projectQuantities.length > 0 ? rowsHTML : `
              <tr>
                <td colspan="6" style="padding: 30px; text-align: center; color: #a0aec0; font-style: italic;">
                  No quantities logged for this contract project.
                </td>
              </tr>
            `}
          </tbody>
        </table>

        <div class="signature-box">
          <div>
            <br><br>
            <div class="sig-line">Prepared By (PM / Surveyor)</div>
          </div>
          <div>
            <br><br>
            <div class="sig-line">Approved By (General Manager)</div>
          </div>
        </div>

        <div class="footer-section">
          <span>© ${new Date().getFullYear()} Wafaq Contracting Co. All rights reserved.</span>
          <span>Security Class: Commercial-in-Confidence</span>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          }
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/65 backdrop-blur-xs z-50 flex items-center justify-center p-4 select-none">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="bg-indigo-600/10 p-2 rounded-lg text-indigo-400 border border-indigo-500/20">
              <Scale className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight">Manage Project Quantities</h3>
              <p className="text-[11px] text-slate-400">Directly post and edit commercial billable quantities across the app</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Project Selector inside Modal */}
        <div className="bg-slate-50 border-b border-slate-150 p-4 shrink-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider block">Target Contract Workspace</span>
            <div className="flex items-center space-x-2 mt-0.5">
              <span className="font-mono text-xs font-extrabold text-indigo-600">{activeProject.code}</span>
              <span className="text-slate-300">|</span>
              <span className="text-xs font-bold text-slate-800 truncate max-w-xs">{activeProject.name}</span>
            </div>
          </div>

          <div className="relative shrink-0 w-full sm:w-64">
            <select
              value={activeProject.id}
              onChange={(e) => onSelectProject(e.target.value)}
              className="w-full bg-white text-slate-800 text-xs font-bold rounded-lg px-3 py-1.5 pr-8 border border-slate-250 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.code} - {p.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Content body - scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Quick Stats & Action Bar */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="text-xs font-bold text-slate-700">
              Active Quantities ({projectQuantities.length})
            </div>
            {projectQuantities.length > 0 && (
              <button
                onClick={handleExportPDF}
                className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold px-3 py-1.5 rounded-lg transition flex items-center space-x-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Export Quantity Ledger to PDF</span>
              </button>
            )}
          </div>

          {/* Current Quantities List */}
          <div className="space-y-3">
            {projectQuantities.length === 0 ? (
              <div className="p-8 text-center text-slate-400 border border-dashed border-slate-200 rounded-xl">
                <HelpCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-medium">No quantities currently posted for this project.</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Use the quick draft form below to publish your first quantity element.</p>
              </div>
            ) : (
              <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-150">
                {projectQuantities.map((q) => {
                  const isEditing = editingId === q.id;
                  return (
                    <div key={q.id} className="p-4 bg-white flex flex-col md:flex-row md:items-center justify-between gap-4">
                      {isEditing ? (
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-2.5">
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="border border-slate-300 rounded px-2.5 py-1 text-xs"
                            placeholder="Quantity Name"
                          />
                          <div className="flex space-x-2">
                            <input
                              type="number"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value === '' ? '' : Number(e.target.value))}
                              className="border border-slate-300 rounded px-2.5 py-1 text-xs w-full font-mono font-bold"
                              placeholder="Value"
                            />
                            <input
                              type="text"
                              value={editUnit}
                              onChange={(e) => setEditUnit(e.target.value)}
                              className="border border-slate-300 rounded px-2.5 py-1 text-xs w-20 font-mono"
                              placeholder="Unit"
                            />
                          </div>
                          <div className="flex items-center space-x-2 justify-end">
                            <button
                              onClick={() => setEditingId(null)}
                              className="text-xs text-slate-500 hover:text-slate-700 font-bold px-2 py-1 cursor-pointer"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleSaveEdit(q.id)}
                              className="bg-indigo-600 hover:bg-indigo-700 text-white rounded px-3 py-1 text-xs font-bold cursor-pointer"
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          {/* Display info */}
                          <div className="flex items-start space-x-3 flex-1 min-w-0">
                            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg shrink-0">
                              <Layers className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-xs font-bold text-slate-800 truncate">{q.name}</h4>
                              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 mt-1 text-[10px] text-slate-400 font-medium">
                                <span className="flex items-center">
                                  <Calendar className="w-3 h-3 mr-1 shrink-0" /> {q.lastUpdated}
                                </span>
                                <span>•</span>
                                <span className="flex items-center">
                                  <UserIcon className="w-3 h-3 mr-1 shrink-0" /> Verified: {q.updatedBy}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Metric + Actions */}
                          <div className="flex items-center space-x-4 shrink-0 justify-between md:justify-end w-full md:w-auto">
                            <div className="text-right">
                              <span className="font-mono text-xs font-extrabold text-slate-950 bg-slate-100 px-2 py-1 rounded-md border border-slate-200">
                                {q.value.toLocaleString()} <span className="text-slate-500 font-medium text-[11px]">{q.unit}</span>
                              </span>
                            </div>

                            <div className="flex items-center space-x-1.5">
                              <button
                                onClick={() => handleStartEdit(q)}
                                className="p-1.5 hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-500 hover:text-indigo-600 transition cursor-pointer"
                                title="Edit Quantity"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDelete(q.id, q.name)}
                                className="p-1.5 hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-500 hover:text-rose-600 transition cursor-pointer"
                                title="Delete Quantity"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Add Form */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono mb-3">
              Draft & Post New Quantity Element
            </h4>
            <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-1">
                <label className="block text-[10px] font-mono text-slate-400 uppercase font-bold mb-1">
                  Quantity Name / Scope Item
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Masonry Brickwork"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-white border border-slate-250 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-slate-400 uppercase font-bold mb-1">
                  Quantity Value
                </label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 12500"
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full bg-white border border-slate-250 rounded-lg px-3 py-1.5 text-xs text-slate-800 font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-slate-400 uppercase font-bold mb-1">
                  Unit
                </label>
                <select
                  value={newUnit}
                  onChange={(e) => setNewUnit(e.target.value)}
                  className="w-full bg-white border border-slate-250 rounded-lg px-3 py-1.5 text-xs text-slate-800 font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="m3">m³ (Cubic Meters)</option>
                  <option value="m2">m² (Square Meters)</option>
                  <option value="tons">Tons (Metric Steel)</option>
                  <option value="LS">Lump Sum (LS)</option>
                  <option value="m">m (Linear Meters)</option>
                  <option value="units">Units</option>
                </select>
              </div>

              <div className="md:col-span-3 flex justify-end pt-2">
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition flex items-center space-x-1.5 shadow-xs cursor-pointer active-scale"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Post Quantity Globally</span>
                </button>
              </div>
            </form>
          </div>

        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-150 p-4 shrink-0 flex justify-end">
          <button
            onClick={onClose}
            className="border border-slate-300 text-slate-700 font-bold hover:bg-slate-100 transition px-4 py-1.5 rounded-xl text-xs cursor-pointer"
          >
            Close Window
          </button>
        </div>

      </div>
    </div>
  );
}
