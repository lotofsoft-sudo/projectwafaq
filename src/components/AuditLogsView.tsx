/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { History, Shield, Server, Filter, RefreshCw, Download, FileSpreadsheet } from 'lucide-react';
import { AuditLog } from '../types';

interface AuditLogsViewProps {
  logs: AuditLog[];
}

export default function AuditLogsView({ logs }: AuditLogsViewProps) {
  const [filterModule, setFilterModule] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Get unique modules for filtering
  const modules = ['All', ...Array.from(new Set(logs.map(l => l.module)))];

  const filteredLogs = logs.filter(log => {
    const matchesModule = filterModule === 'All' || log.module === filterModule;
    const matchesSearch = 
      log.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.module.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.oldValue && log.oldValue.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (log.newValue && log.newValue.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesModule && matchesSearch;
  });

  const exportCSV = () => {
    const headers = ['Timestamp', 'User', 'Role', 'Module', 'Action', 'Old Value', 'New Value', 'IP Address', 'Device'];
    const rows = filteredLogs.map(log => [
      log.date,
      log.user,
      log.role,
      log.module,
      log.action,
      log.oldValue || 'N/A',
      log.newValue || 'N/A',
      log.ip,
      log.device
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val.replace(/"/g, '""')}"`).join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Wafaq_AuditLogs_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div id="audit-logs-view-wrapper" className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 pb-24 md:pb-6">
      
      {/* Header card with security standards */}
      <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0 shadow-lg">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <Shield className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-mono uppercase tracking-widest text-indigo-400 font-semibold">Security Compliance Board</span>
          </div>
          <h2 className="text-lg font-bold tracking-tight text-white mt-1">Immutable System Audit Trail</h2>
          <p className="text-xs text-slate-400 max-w-lg">
            Real-time verification logs tracking logins, workflow approvals, budget allocations, PO modifications, and invoice issuances. Formulated according to OWASP Top 10 guidelines.
          </p>
        </div>
        
        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={exportCSV}
            className="bg-white/10 hover:bg-white/20 border border-white/10 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center space-x-1.5 cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <div className="text-xs font-mono text-slate-500 bg-slate-950/50 p-2 rounded border border-slate-850">
            Audit Mode: <span className="text-emerald-500 font-bold">SECURE</span>
          </div>
        </div>
      </div>

      {/* Filter and search toolbar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        
        {/* Search */}
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search action, user, or values..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-3 pr-4 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
          />
        </div>

        {/* Module Filter */}
        <div className="flex items-center space-x-2 shrink-0">
          <Filter className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-xs text-gray-500 font-medium">Module:</span>
          <select
            value={filterModule}
            onChange={(e) => setFilterModule(e.target.value)}
            className="border border-gray-200 rounded-lg p-1 px-2 text-xs focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
          >
            {modules.map((mod) => (
              <option key={mod} value={mod}>{mod}</option>
            ))}
          </select>
        </div>

      </div>

      {/* Audit Logs Table */}
      <div className="bg-white rounded-xl border border-gray-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-600">
            <thead className="bg-gray-50/55 border-b border-gray-100 text-xs font-mono text-gray-400 uppercase tracking-wider">
              <tr>
                <th className="p-3.5">Timestamp</th>
                <th className="p-3.5">User Profile</th>
                <th className="p-3.5">Module</th>
                <th className="p-3.5">Action Code</th>
                <th className="p-3.5">Changes (Old → New)</th>
                <th className="p-3.5 text-right">IP & Terminal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 font-sans">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50/40 text-xs">
                  
                  {/* Timestamp */}
                  <td className="p-3.5 whitespace-nowrap text-gray-500 font-mono text-xs">
                    {log.date}
                  </td>

                  {/* User Profile */}
                  <td className="p-3.5 whitespace-nowrap">
                    <div>
                      <span className="font-semibold text-gray-900 block">{log.user}</span>
                      <span className="text-xs font-mono text-indigo-600 uppercase font-semibold block mt-0.5">{log.role}</span>
                    </div>
                  </td>

                  {/* Module */}
                  <td className="p-3.5 whitespace-nowrap">
                    <span className="bg-gray-100 text-gray-700 text-xs px-2 py-0.5 rounded-full font-medium">
                      {log.module}
                    </span>
                  </td>

                  {/* Action */}
                  <td className="p-3.5">
                    <span className="font-semibold text-gray-800">{log.action}</span>
                  </td>

                  {/* Changes value box */}
                  <td className="p-3.5 max-w-xs">
                    {log.oldValue || log.newValue ? (
                      <div className="p-1.5 bg-gray-50 rounded border border-gray-100 space-y-1 font-mono text-xs text-gray-500">
                        {log.oldValue && (
                          <div className="truncate">
                            <span className="text-rose-500 font-bold">[-]</span> {log.oldValue}
                          </div>
                        )}
                        {log.newValue && (
                          <div className="truncate font-semibold text-gray-700">
                            <span className="text-emerald-500 font-bold">[+]</span> {log.newValue}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400 italic text-xs">No value changes</span>
                    )}
                  </td>

                  {/* IP and device */}
                  <td className="p-3.5 text-right whitespace-nowrap">
                    <span className="font-mono text-gray-700 text-xs block">{log.ip}</span>
                    <span className="text-xs text-gray-400 block mt-0.5 truncate max-w-[150px]" title={log.device}>
                      {log.device}
                    </span>
                  </td>

                </tr>
              ))}

              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-gray-400 text-xs italic">
                    No security log entries match your search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
