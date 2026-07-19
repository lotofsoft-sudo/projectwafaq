/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState, useEffect } from 'react';
import { 
  Building2, 
  DollarSign, 
  TrendingUp, 
  Percent, 
  AlertTriangle, 
  Clock, 
  CloudSun, 
  Calendar,
  Layers,
  FileCheck,
  Receipt,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Plus,
  Loader2
} from 'lucide-react';
import { Project, BudgetCategory, Expense, Invoice, Payment, AuditLog, User, getVatAppliedAmount, getExpenseDisplayValues, getInvoiceDisplayValues } from '../types';

interface DashboardViewProps {
  projects: Project[];
  budgets: BudgetCategory[];
  expenses: Expense[];
  invoices: Invoice[];
  payments: Payment[];
  auditLogs: AuditLog[];
  currentUser: User;
  onNavigateToProject: (projectId: string) => void;
  onOpenCreateProject: () => void;
}

export default function DashboardView({
  projects,
  budgets,
  expenses,
  invoices,
  payments,
  auditLogs,
  currentUser,
  onNavigateToProject,
  onOpenCreateProject,
}: DashboardViewProps) {
  
  const [weather, setWeather] = useState<{
    temp: number;
    description: string;
    windSpeed: number;
    windDir: string;
    city: string;
    loading: boolean;
    error: string | null;
  }>({
    temp: 41,
    description: "Sunny / Clear Sky",
    windSpeed: 18,
    windDir: "NW",
    city: "Riyadh",
    loading: true,
    error: null,
  });

  useEffect(() => {
    let isMounted = true;
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          if (!isMounted) return;
          try {
            const { latitude, longitude } = position.coords;
            const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`);
            const data = await res.json();
            
            const geoRes = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`);
            const geoData = await geoRes.json();
            
            const current = data.current_weather;
            const wmoCodes: Record<number, string> = {
              0: "Clear sky",
              1: "Mainly clear",
              2: "Partly cloudy",
              3: "Overcast",
              45: "Fog",
              48: "Depositing rime fog",
              51: "Light drizzle",
              53: "Moderate drizzle",
              55: "Dense drizzle",
              61: "Slight rain",
              63: "Moderate rain",
              65: "Heavy rain",
              71: "Slight snow fall",
              73: "Moderate snow fall",
              75: "Heavy snow fall",
              95: "Thunderstorm"
            };

            const getWindDirection = (deg: number) => {
              if (deg > 337.5) return 'N';
              if (deg > 292.5) return 'NW';
              if (deg > 247.5) return 'W';
              if (deg > 202.5) return 'SW';
              if (deg > 157.5) return 'S';
              if (deg > 112.5) return 'SE';
              if (deg > 67.5) return 'E';
              if (deg > 22.5) return 'NE';
              return 'N';
            };

            if (isMounted) {
              setWeather({
                temp: Math.round(current.temperature),
                description: wmoCodes[current.weathercode] || "Clear",
                windSpeed: current.windspeed,
                windDir: getWindDirection(current.winddirection),
                city: geoData.city || geoData.locality || "Unknown Location",
                loading: false,
                error: null
              });
            }
          } catch (e) {
            if (isMounted) setWeather(w => ({ ...w, loading: false, error: "Failed to fetch weather" }));
          }
        },
        (error) => {
          if (isMounted) setWeather(w => ({ ...w, loading: false, error: "Location access denied" }));
        }
      );
    } else {
      setWeather(w => ({ ...w, loading: false, error: "Geolocation not supported" }));
    }
    return () => { isMounted = false; };
  }, []);

  // Dynamic calculation of ERP metrics
  const stats = useMemo(() => {
    const totalProjects = projects.length;
    const activeProjects = projects.filter(p => p.status === 'active').length;
    const completedProjects = projects.filter(p => p.status === 'completed').length;
    const pendingProjects = projects.filter(p => p.status === 'pending').length;

    // Total Contract / PO values
    const totalContractValue = projects.reduce((acc, p) => acc + p.value, 0);
    
    // Budget aggregates
    const totalBudget = budgets.reduce((acc, b) => acc + b.allocated, 0);
    const approvedExpenses = expenses.filter(e => e.approvalStatus === 'approved');
    const totalSpent = approvedExpenses.reduce((acc, e) => acc + getExpenseDisplayValues(e).totalAmount, 0);
    const remainingBudget = totalBudget - totalSpent;
    const budgetUsedPct = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;

    // Invoices and Payments
    const totalInvoiced = invoices.reduce((acc, inv) => acc + getInvoiceDisplayValues(inv).totalAmount, 0);
    const paymentsReceived = payments.reduce((acc, pay) => acc + pay.amount, 0);
    const outstandingInvoices = invoices
      .filter(inv => inv.status !== 'paid')
      .reduce((acc, inv) => acc + (getInvoiceDisplayValues(inv).totalAmount - (inv.receivedAmount || 0)), 0);
    const pendingPaymentsVal = totalInvoiced - paymentsReceived;

    // Financial performance
    const cashFlow = paymentsReceived - totalSpent; // Cash on hand from collections minus expenses
    const estimatedProfit = totalContractValue - totalBudget; // Contract price minus cost budget
    const profitMargin = totalContractValue > 0 ? Math.round((estimatedProfit / totalContractValue) * 100) : 0;

    // Delayed/Alerts
    const delayedProjects = projects.filter(p => p.status === 'active' && p.currentWorkflowStep < 15 && new Date(p.endDate) < new Date()).length;

    return {
      totalProjects,
      activeProjects,
      completedProjects,
      pendingProjects,
      totalContractValue,
      totalBudget,
      totalSpent,
      remainingBudget,
      budgetUsedPct,
      totalInvoiced,
      paymentsReceived,
      outstandingInvoices,
      pendingPaymentsVal,
      cashFlow,
      estimatedProfit,
      profitMargin,
      delayedProjects
    };
  }, [projects, budgets, expenses, invoices, payments]);

  // Formatter for SAR currency
  const formatSAR = (val: number) => {
    const applied = getVatAppliedAmount(val);
    if (applied >= 1000000) {
      return `${(applied / 1000000).toFixed(2)}M SAR`;
    } else if (applied >= 1000) {
      return `${(applied / 1000).toFixed(0)}K SAR`;
    }
    return `${applied.toLocaleString()} SAR`;
  };

  const formatRawSAR = (val: number) => {
    if (val >= 1000000) {
      return `${(val / 1000000).toFixed(2)}M SAR`;
    } else if (val >= 1000) {
      return `${(val / 1000).toFixed(0)}K SAR`;
    }
    return `${val.toLocaleString()} SAR`;
  };

  return (
    <div id="dashboard-view-wrapper" className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 pb-24 md:pb-6">
      
      {/* Welcome Banner / Riyadh Weather Widget */}
      <div id="welcome-banner" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <div id="welcome-message-card" className="lg:col-span-2 bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-950 p-6 rounded-2xl border border-indigo-900/50 text-white flex flex-col justify-between relative overflow-hidden shadow-lg">
          <div className="absolute right-0 top-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="space-y-2 relative z-10">
            <span className="text-xs font-mono uppercase tracking-widest text-indigo-300 font-semibold bg-indigo-500/25 px-2.5 py-1 rounded-full">
              Enterprise Dashboard
            </span>
            <h2 className="text-xl lg:text-2xl font-bold tracking-tight mt-2">
              Welcome Back, {currentUser.name}
            </h2>
            <p className="text-sm text-slate-300 max-w-lg leading-relaxed">
              Wafaq Contracting portal is online. You have <span className="text-indigo-300 font-semibold">{projects.filter(p => p.status === 'active').length} active projects</span> in execution. Monitoring civil foundations and structural steel milestones for Q3.
            </p>
          </div>
          
          <div className="mt-6 flex items-center space-x-3 relative z-10">
            {currentUser.role === 'General Manager' || currentUser.role === 'Project Manager' || currentUser.role === 'Admin' || currentUser.role === 'Super Admin' ? (
              <button
                id="dashboard-new-project-btn"
                onClick={onOpenCreateProject}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-lg shadow-indigo-500/20"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Initialize New Project</span>
              </button>
            ) : null}
            <span className="text-xs text-slate-400 font-mono">Server Status: <span className="text-emerald-500 font-bold">● Optimal</span></span>
          </div>
        </div>

        {/* Dynamic Weather Widget */}
        <div id="dashboard-weather-card" className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-mono text-gray-400 uppercase tracking-widest">{weather.city} Weather</span>
              <h3 className="text-sm font-bold text-gray-800 mt-0.5">Al-Malqa Site HQ</h3>
            </div>
            {weather.loading ? (
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            ) : (
              <CloudSun className="w-8 h-8 text-indigo-600 animate-pulse" />
            )}
          </div>
          
          <div className="my-3 flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-gray-900">{weather.temp}°C</span>
            <span className="text-xs text-gray-500">{weather.description}</span>
          </div>

          <div className="border-t border-gray-100 pt-3 grid grid-cols-2 gap-4 text-xs font-mono text-gray-500">
            <div>
              <span className="block text-gray-400">Wind Force</span>
              <span className="font-semibold text-gray-700">{weather.windSpeed} km/h {weather.windDir}</span>
            </div>
            <div>
              <span className="block text-gray-400">Concrete Window</span>
              <span className={`font-semibold ${weather.temp > 40 || weather.windSpeed > 30 ? 'text-rose-600' : 'text-emerald-600'}`}>
                {weather.temp > 40 || weather.windSpeed > 30 ? 'At Risk (Halt Pour)' : 'Safe (Pour PM)'}
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* KPI Stats Grid */}
      <div id="kpi-stats-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Portfolio Value */}
        <div className="bg-white p-5 rounded-xl border border-gray-200/80 shadow-sm flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="text-xs font-mono text-gray-400 uppercase tracking-widest font-semibold block">Total Contract Portfolio</span>
            <p className="text-xl font-extrabold text-gray-900">{formatSAR(stats.totalContractValue)}</p>
            <div className="flex items-center space-x-1 text-xs text-emerald-600 font-medium">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>{stats.totalProjects} Contracting Projects</span>
            </div>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Building2 className="w-5 h-5" />
          </div>
        </div>

        {/* Budget Aggregate Progress */}
        <div className="bg-white p-5 rounded-xl border border-gray-200/80 shadow-sm flex items-center justify-between">
          <div className="space-y-1.5 w-full mr-2">
            <span className="text-xs font-mono text-gray-400 uppercase tracking-widest font-semibold block">Budget Allocated vs Spent</span>
            <div className="flex items-baseline space-x-2">
              <p className="text-xl font-extrabold text-gray-900">{formatRawSAR(stats.totalSpent)}</p>
              <span className="text-xs text-gray-400">/ {formatRawSAR(stats.totalBudget)}</span>
            </div>
            
            <div className="space-y-1">
              <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    stats.budgetUsedPct > 90 ? 'bg-rose-500' : stats.budgetUsedPct > 75 ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(stats.budgetUsedPct, 100)}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-xs font-mono text-gray-500">
                <span>Remaining: {formatRawSAR(stats.remainingBudget)}</span>
                <span className="font-bold text-gray-800">{stats.budgetUsedPct}% Used</span>
              </div>
              <div className="text-[9px] font-bold text-indigo-600 bg-indigo-50/50 rounded px-1.5 py-0.5 inline-block font-mono mt-1">
                VAT Inclusive cost baseline active
              </div>
            </div>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl self-start">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        {/* Collections Cash Flow */}
        <div className="bg-white p-5 rounded-xl border border-gray-200/80 shadow-sm flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="text-xs font-mono text-gray-400 uppercase tracking-widest font-semibold block">SAR Cash Flow (Inflows)</span>
            <p className="text-xl font-extrabold text-gray-900">{formatSAR(stats.cashFlow)}</p>
            <div className="flex items-center space-x-1 text-xs">
              <span className="text-gray-400">Total Collected:</span>
              <span className="text-emerald-600 font-bold">{formatSAR(stats.paymentsReceived)}</span>
            </div>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Receipt className="w-5 h-5" />
          </div>
        </div>

        {/* Estimated Profitability */}
        <div className="bg-white p-5 rounded-xl border border-gray-200/80 shadow-sm flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="text-xs font-mono text-gray-400 uppercase tracking-widest font-semibold block">Projected Portfolio Profit</span>
            <p className="text-xl font-extrabold text-gray-900">{formatSAR(stats.estimatedProfit)}</p>
            <div className="flex items-center space-x-1 text-xs text-indigo-600 font-medium">
              <Percent className="w-3.5 h-3.5" />
              <span>Estimated {stats.profitMargin}% Profit Margin</span>
            </div>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* Charts Section (Bento Box Custom SVG Charts) */}
      <div id="charts-bento-grid" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Project Budget vs Expense Comparison Custom SVG Chart */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider font-mono">Project Budgets vs Real Expenses</h3>
              <p className="text-xs text-gray-400">Visual comparison of allocated baseline budgets vs actual approved expenses (SAR)</p>
            </div>
            <div className="flex items-center space-x-3 text-xs font-mono">
              <div className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 bg-indigo-500 rounded-sm"></span>
                <span className="text-gray-500">Allocated Budget</span>
              </div>
              <div className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 bg-rose-500 rounded-sm"></span>
                <span className="text-gray-500">Actual Spent</span>
              </div>
            </div>
          </div>

          {/* Render custom bar chart */}
          <div className="space-y-4 pt-2">
            {projects.map((proj) => {
              // Find matching budgets and expenses
              const projBudgets = budgets.filter(b => b.projectId === proj.id);
              const allocatedSum = projBudgets.reduce((acc, b) => acc + b.allocated, 0);
              const spentSum = expenses
                .filter(e => e.projectId === proj.id && e.approvalStatus === 'approved')
                .reduce((acc, e) => acc + e.totalAmount, 0);

              const maxAmount = Math.max(...projects.map(p => {
                const bSum = budgets.filter(b => b.projectId === p.id).reduce((acc, b) => acc + b.allocated, 0);
                return bSum;
              }), 1);

              const allocatedPct = (allocatedSum / maxAmount) * 100;
              const spentPct = (spentSum / maxAmount) * 100;

              return (
                <div key={proj.id} className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <button
                      onClick={() => onNavigateToProject(proj.id)}
                      className="font-medium text-gray-700 hover:text-amber-600 truncate max-w-xs text-left cursor-pointer"
                    >
                      {proj.name}
                    </button>
                    <div className="text-xs font-mono text-gray-500 space-x-2">
                      <span>Alloc: <span className="font-bold text-gray-700">{formatSAR(allocatedSum)}</span></span>
                      <span>Spent: <span className="font-bold text-rose-600">{formatSAR(spentSum)}</span></span>
                    </div>
                  </div>
                  
                  <div className="relative h-6 bg-gray-50 rounded-md overflow-hidden flex flex-col justify-center space-y-0.5 px-2">
                    {/* Budget bar */}
                    <div 
                      className="h-2 bg-indigo-500/80 rounded-sm transition-all duration-500" 
                      style={{ width: `${Math.max(allocatedPct, 2)}%` }}
                    ></div>
                    {/* Spent bar */}
                    <div 
                      className="h-2 bg-rose-500/90 rounded-sm transition-all duration-500" 
                      style={{ width: `${Math.max(spentPct, 1)}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Project Progress Circular Visualizers */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider font-mono">Portfolio Completion Track</h3>
            <p className="text-xs text-gray-400 mb-4">Milestone completion tracking for active contracts</p>
          </div>

          <div className="space-y-4">
            {projects.slice(0, 3).map((proj) => (
              <div key={proj.id} className="flex items-center justify-between border-b border-gray-50 pb-3 last:border-0 last:pb-0">
                <div className="space-y-1 max-w-[70%]">
                  <span className="text-xs font-mono text-indigo-600 uppercase font-semibold">{proj.code}</span>
                  <h4 className="text-xs font-bold text-gray-800 truncate">{proj.name}</h4>
                  <span className="text-xs text-gray-400 block truncate">Site: {proj.siteLocation.split(',')[0]}</span>
                </div>
                
                {/* SVG Progress Circle */}
                <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
                  <svg className="w-12 h-12 transform -rotate-90">
                    <circle cx="24" cy="24" r="20" stroke="#f1f5f9" strokeWidth="4" fill="transparent" />
                    <circle 
                      cx="24" cy="24" r="20" 
                      stroke={proj.status === 'completed' ? '#4f46e5' : '#818cf8'} 
                      strokeWidth="4" 
                      fill="transparent" 
                      strokeDasharray={`${2 * Math.PI * 20}`}
                      strokeDashoffset={`${2 * Math.PI * 20 * (1 - proj.progress / 100)}`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="absolute text-xs font-mono font-bold text-gray-800">{proj.progress}%</span>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-indigo-50/50 p-2.5 rounded-lg border border-indigo-500/10 flex items-start space-x-2 mt-4">
            <Clock className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <p className="text-xs text-indigo-950 leading-relaxed font-sans">
              <strong>Progress calculation policy:</strong> Active milestone completions automatically rollup to calculate overall project progress %. Direct compliance with consultant approval signatures.
            </p>
          </div>
        </div>

      </div>

      {/* Bottom Row - Activity Log & Deadlines */}
      <div id="bottom-bento-row" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Project Master Calendar / Deadlines */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider font-mono">Contract Milestones & Deadlines</h3>
            </div>
            <span className="text-xs text-gray-400">July - August 2026</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-100 text-xs font-mono text-gray-400 uppercase">
                  <th className="pb-2">Project Code</th>
                  <th className="pb-2">Milestone Description</th>
                  <th className="pb-2">Due Date</th>
                  <th className="pb-2">Weight</th>
                  <th className="pb-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-xs">
                <tr className="hover:bg-gray-50/40">
                  <td className="py-2.5 font-mono font-bold text-gray-600">WF-PRJ-2026-01</td>
                  <td className="py-2.5 font-medium text-gray-800">Superstructure Concrete Frame</td>
                  <td className="py-2.5 text-gray-500 font-mono">2026-09-30</td>
                  <td className="py-2.5 font-mono">20%</td>
                  <td className="py-2.5"><span className="bg-indigo-100 text-indigo-800 text-xs px-2 py-0.5 rounded-full font-semibold">In Progress</span></td>
                </tr>
                <tr className="hover:bg-gray-50/40">
                  <td className="py-2.5 font-mono font-bold text-gray-600">WF-PRJ-2026-02</td>
                  <td className="py-2.5 font-medium text-gray-800">Foundation Piling Excavations</td>
                  <td className="py-2.5 text-gray-500 font-mono">2026-08-30</td>
                  <td className="py-2.5 font-mono">20%</td>
                  <td className="py-2.5"><span className="bg-indigo-100 text-indigo-800 text-xs px-2 py-0.5 rounded-full font-semibold">In Progress</span></td>
                </tr>
                <tr className="hover:bg-gray-50/40">
                  <td className="py-2.5 font-mono font-bold text-gray-600">WF-PRJ-2026-02</td>
                  <td className="py-2.5 font-medium text-gray-800">Site Clearing & Survey Baseline</td>
                  <td className="py-2.5 text-gray-500 font-mono">2026-05-15</td>
                  <td className="py-2.5 font-mono">10%</td>
                  <td className="py-2.5"><span className="bg-emerald-100 text-emerald-800 text-xs px-2 py-0.5 rounded-full font-semibold">Completed</span></td>
                </tr>
                <tr className="hover:bg-gray-50/40">
                  <td className="py-2.5 font-mono font-bold text-gray-600">WF-PRJ-2026-01</td>
                  <td className="py-2.5 font-medium text-gray-800">Site Excavation & Foundation</td>
                  <td className="py-2.5 text-gray-500 font-mono">2026-06-15</td>
                  <td className="py-2.5 font-mono">25%</td>
                  <td className="py-2.5"><span className="bg-emerald-100 text-emerald-800 text-xs px-2 py-0.5 rounded-full font-semibold">Completed</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Audit / Action Activities Logs */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <Activity className="w-4 h-4 text-indigo-500" />
              <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider font-mono">Live Audit Activities</h3>
            </div>
            
            <div className="space-y-3.5 max-h-56 overflow-y-auto pr-1">
              {auditLogs.slice(0, 4).map((log) => (
                <div key={log.id} className="flex items-start space-x-2.5 text-sm">
                  <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-1.5 shrink-0"></div>
                  <div className="space-y-0.5">
                    <p className="text-gray-700 leading-snug">
                      <strong className="text-gray-900">{log.user}</strong> ({log.role.split(' ')[0]}): {log.action}
                    </p>
                    <div className="flex items-center space-x-2 text-xs font-mono text-gray-400">
                      <span>Module: {log.module}</span>
                      <span>•</span>
                      <span>{log.date}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-gray-100 pt-3 text-center">
            <span className="text-xs text-gray-400 font-mono block">All secure audits recorded automatically under OWASP policies</span>
          </div>
        </div>

      </div>

    </div>
  );
}
