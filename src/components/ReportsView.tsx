/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  FilePieChart, 
  ArrowUpRight, 
  ArrowDownRight, 
  Download, 
  Printer, 
  Layers, 
  DollarSign, 
  BarChart, 
  TrendingUp, 
  CheckCircle,
  FileText
} from 'lucide-react';
import { Project, BudgetCategory, Expense, Invoice, Payment, getExpenseDisplayValues, getInvoiceDisplayValues } from '../types';

interface ReportsViewProps {
  projects: Project[];
  budgets: BudgetCategory[];
  expenses: Expense[];
  invoices: Invoice[];
  payments: Payment[];
}

export default function ReportsView({
  projects,
  budgets,
  expenses,
  invoices,
  payments,
}: ReportsViewProps) {
  const [selectedReport, setSelectedReport] = useState<'financial' | 'budget_vs_expense' | 'cash_flow'>('financial');
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalContent, setModalContent] = useState<any>(null);

  // Currency Formatter
  const formatSAR = (val: number) => {
    return `${val.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })} SAR`;
  };

  // Memoized Report Data calculations
  const reportData = useMemo(() => {
    // 1. Project Financial Performance aggregates
    const projectSummary = projects.map(proj => {
      const projBudgets = budgets.filter(b => b.projectId === proj.id);
      const allocatedBudget = projBudgets.reduce((acc, b) => acc + b.allocated, 0);
      
      const approvedExpenses = expenses.filter(e => e.projectId === proj.id && e.approvalStatus === 'approved');
      const actualSpent = approvedExpenses.reduce((acc, e) => acc + getExpenseDisplayValues(e).totalAmount, 0);
      
      const totalInvoiced = invoices.filter(inv => inv.projectId === proj.id).reduce((acc, inv) => acc + getInvoiceDisplayValues(inv).totalAmount, 0);
      const totalCollected = payments.filter(pay => pay.projectId === proj.id).reduce((acc, pay) => acc + pay.amount, 0);
      
      const profit = proj.value - allocatedBudget;
      const profitPct = proj.value > 0 ? Math.round((profit / proj.value) * 100) : 0;
      
      const budgetSavings = allocatedBudget - actualSpent;

      return {
        ...proj,
        allocatedBudget,
        actualSpent,
        totalInvoiced,
        totalCollected,
        profit,
        profitPct,
        budgetSavings
      };
    });

    // Portfolio level aggregates
    const portfolioContractValue = projects.reduce((acc, p) => acc + p.value, 0);
    const portfolioAllocatedBudget = budgets.reduce((acc, b) => acc + b.allocated, 0);
    const portfolioSpent = expenses.filter(e => e.approvalStatus === 'approved').reduce((acc, e) => acc + getExpenseDisplayValues(e).totalAmount, 0);
    const portfolioInvoiced = invoices.reduce((acc, inv) => acc + getInvoiceDisplayValues(inv).totalAmount, 0);
    const portfolioCollected = payments.reduce((acc, pay) => acc + pay.amount, 0);
    
    const portfolioProfit = portfolioContractValue - portfolioAllocatedBudget;
    const portfolioProfitPct = portfolioContractValue > 0 ? Math.round((portfolioProfit / portfolioContractValue) * 100) : 0;

    return {
      projectSummary,
      portfolioContractValue,
      portfolioAllocatedBudget,
      portfolioSpent,
      portfolioInvoiced,
      portfolioCollected,
      portfolioProfit,
      portfolioProfitPct
    };
  }, [projects, budgets, expenses, invoices, payments]);


  // Group budgets by standard cost discipline category across the whole company
  const budgetCategoryMetrics = useMemo(() => {
    const categories: { [key: string]: { allocated: number; spent: number } } = {};
    
    budgets.forEach(b => {
      let catName = b.name || 'Subcontractor Logistics';
      if (catName.toLowerCase().includes('concrete') || catName.toLowerCase().includes('structural')) {
        catName = 'Concrete & Structural Works';
      } else if (catName.toLowerCase().includes('mep') || catName.toLowerCase().includes('mechanical') || catName.toLowerCase().includes('electrical')) {
        catName = 'MEP & Utility Services';
      } else if (catName.toLowerCase().includes('finishing') || catName.toLowerCase().includes('fitout') || catName.toLowerCase().includes('architectural')) {
        catName = 'Finishing & Architectural';
      } else if (catName.toLowerCase().includes('earth') || catName.toLowerCase().includes('excavation') || catName.toLowerCase().includes('site')) {
        catName = 'Earthworks & Engineering';
      } else {
        catName = 'Equipment & Site Overhead';
      }

      if (!categories[catName]) {
        categories[catName] = { allocated: 0, spent: 0 };
      }
      categories[catName].allocated += b.allocated;
      categories[catName].spent += b.spent || 0;
    });

    return Object.entries(categories).map(([name, data]) => {
      const pct = data.allocated > 0 ? Math.round((data.spent / data.allocated) * 100) : 0;
      return { name, allocated: data.allocated, spent: data.spent, pct };
    }).sort((a, b) => b.allocated - a.allocated);
  }, [budgets]);

  const handlePrintPreview = (title: string, type: 'commercial' | 'milestone') => {
    setModalTitle(title);
    setShowPrintModal(true);
    setModalContent({
      type,
      date: new Date().toLocaleDateString('en-GB'),
      reference: `WF-REPT-${Math.floor(100000 + Math.random() * 900000)}`
    });
  };

  return (
    <div id="reports-view-wrapper" className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 pb-24 md:pb-6">
      
      {/* Header and Report Selector Tab */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-gray-150 pb-5 gap-4">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-gray-900 flex items-center space-x-2">
            <FilePieChart className="w-5 h-5 text-indigo-600" />
            <span>Analytical & Valuation Reports</span>
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Real-time commercial statements, project profit margins, and physical work completions for Wafaq Company
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex bg-gray-100 p-1 rounded-xl text-xs font-medium">
          <button
            onClick={() => setSelectedReport('financial')}
            className={`px-4 py-1.5 rounded-lg transition cursor-pointer ${
              selectedReport === 'financial' ? 'bg-white text-gray-950 font-bold shadow-sm' : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            Portfolio P&L
          </button>
          <button
            onClick={() => setSelectedReport('budget_vs_expense')}
            className={`px-4 py-1.5 rounded-lg transition cursor-pointer ${
              selectedReport === 'budget_vs_expense' ? 'bg-white text-gray-950 font-bold shadow-sm' : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            Budget Utilization
          </button>
          <button
            onClick={() => setSelectedReport('cash_flow')}
            className={`px-4 py-1.5 rounded-lg transition cursor-pointer ${
              selectedReport === 'cash_flow' ? 'bg-white text-gray-950 font-bold shadow-sm' : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            Cash Flow / Aging
          </button>
        </div>
      </div>

      {/* Dynamic Bento Row - changes depending on the active tab report to show the most relevant metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {selectedReport === 'financial' && (
          <>
            {/* KPI 1 */}
            <div className="bg-white p-5 rounded-xl border border-gray-200/80 shadow-sm flex items-center space-x-4 transition-all duration-200 hover:shadow-md">
              <div className="p-3.5 bg-indigo-50 text-indigo-600 rounded-xl shrink-0">
                <DollarSign className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-xs font-mono text-gray-400 uppercase tracking-widest font-semibold block">Total Portfolio Value</span>
                <h4 className="text-xl font-extrabold text-gray-900 mt-0.5">{formatSAR(reportData.portfolioContractValue)}</h4>
                <span className="text-xs text-emerald-600 font-semibold block mt-0.5">Sum of active project award values</span>
              </div>
            </div>

            {/* KPI 2 */}
            <div className="bg-white p-5 rounded-xl border border-gray-200/80 shadow-sm flex items-center space-x-4 transition-all duration-200 hover:shadow-md">
              <div className="p-3.5 bg-indigo-50 text-indigo-600 rounded-xl shrink-0">
                <Layers className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-xs font-mono text-gray-400 uppercase tracking-widest font-semibold block">Budget Baseline Cost (Incl. VAT)</span>
                <h4 className="text-xl font-extrabold text-gray-900 mt-0.5">{formatSAR(reportData.portfolioAllocatedBudget)}</h4>
                <span className="text-xs text-indigo-600 font-semibold block mt-0.5">
                  {Math.round((reportData.portfolioAllocatedBudget / reportData.portfolioContractValue) * 100)}% of total award value allocated
                </span>
              </div>
            </div>

            {/* KPI 3 */}
            <div className="bg-white p-5 rounded-xl border border-gray-200/80 shadow-sm flex items-center space-x-4 transition-all duration-200 hover:shadow-md">
              <div className="p-3.5 bg-emerald-50 text-emerald-600 rounded-xl shrink-0">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-xs font-mono text-gray-400 uppercase tracking-widest font-semibold block">Projected Margin Profit</span>
                <h4 className="text-xl font-extrabold text-gray-900 mt-0.5">{formatSAR(reportData.portfolioProfit)}</h4>
                <span className="text-xs text-emerald-600 font-semibold block mt-0.5">
                  Average portfolio margin: <strong className="font-bold">{reportData.portfolioProfitPct}%</strong>
                </span>
              </div>
            </div>
          </>
        )}

        {selectedReport === 'budget_vs_expense' && (
          <>
            {/* KPI 1 */}
            <div className="bg-white p-5 rounded-xl border border-gray-200/80 shadow-sm flex items-center space-x-4 transition-all duration-200 hover:shadow-md animate-in fade-in slide-in-from-top-1 duration-150">
              <div className="p-3.5 bg-indigo-50 text-indigo-600 rounded-xl shrink-0">
                <Layers className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-xs font-mono text-gray-400 uppercase tracking-widest font-semibold block">Allocated Cost Baseline (Incl. VAT)</span>
                <h4 className="text-xl font-extrabold text-gray-900 mt-0.5">{formatSAR(reportData.portfolioAllocatedBudget)}</h4>
                <span className="text-xs text-indigo-600 font-semibold block mt-0.5">Approved baseline cost pool across categories</span>
              </div>
            </div>

            {/* KPI 2 */}
            <div className="bg-white p-5 rounded-xl border border-gray-200/80 shadow-sm flex items-center space-x-4 transition-all duration-200 hover:shadow-md animate-in fade-in slide-in-from-top-1 duration-150">
              <div className="p-3.5 bg-rose-50 text-rose-600 rounded-xl shrink-0">
                <FilePieChart className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-xs font-mono text-gray-400 uppercase tracking-widest font-semibold block">Approved Capital Expenses (VAT Included)</span>
                <h4 className="text-xl font-extrabold text-gray-900 mt-0.5">{formatSAR(reportData.portfolioSpent)}</h4>
                <span className="text-xs text-rose-600 font-semibold block mt-0.5">
                  {Math.round((reportData.portfolioSpent / reportData.portfolioAllocatedBudget) * 100)}% of cost baseline utilized to date
                </span>
              </div>
            </div>

            {/* KPI 3 */}
            <div className="bg-white p-5 rounded-xl border border-gray-200/80 shadow-sm flex items-center space-x-4 transition-all duration-200 hover:shadow-md animate-in fade-in slide-in-from-top-1 duration-150">
              <div className="p-3.5 bg-emerald-50 text-emerald-600 rounded-xl shrink-0">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-xs font-mono text-gray-400 uppercase tracking-widest font-semibold block">Favorable Cost Variance (Incl. VAT)</span>
                <h4 className="text-xl font-extrabold text-gray-900 mt-0.5">{formatSAR(reportData.portfolioAllocatedBudget - reportData.portfolioSpent)}</h4>
                <span className="text-xs text-emerald-600 font-semibold block mt-0.5">Under-budget savings currently retained</span>
              </div>
            </div>
          </>
        )}

        {selectedReport === 'cash_flow' && (
          <>
            {/* KPI 1 */}
            <div className="bg-white p-5 rounded-xl border border-gray-200/80 shadow-sm flex items-center space-x-4 transition-all duration-200 hover:shadow-md animate-in fade-in slide-in-from-top-1 duration-150">
              <div className="p-3.5 bg-indigo-50 text-indigo-600 rounded-xl shrink-0">
                <DollarSign className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-xs font-mono text-gray-400 uppercase tracking-widest font-semibold block">Cumulative Billed Valuation</span>
                <h4 className="text-xl font-extrabold text-gray-900 mt-0.5">{formatSAR(reportData.portfolioInvoiced)}</h4>
                <span className="text-xs text-indigo-600 font-semibold block mt-0.5">Total valuation invoices submitted to client boards</span>
              </div>
            </div>

            {/* KPI 2 */}
            <div className="bg-white p-5 rounded-xl border border-gray-200/80 shadow-sm flex items-center space-x-4 transition-all duration-200 hover:shadow-md animate-in fade-in slide-in-from-top-1 duration-150">
              <div className="p-3.5 bg-emerald-50 text-emerald-600 rounded-xl shrink-0">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-xs font-mono text-gray-400 uppercase tracking-widest font-semibold block">Direct Cash Collections</span>
                <h4 className="text-xl font-extrabold text-gray-900 mt-0.5">{formatSAR(reportData.portfolioCollected)}</h4>
                <span className="text-xs text-emerald-600 font-semibold block mt-0.5">
                  {reportData.portfolioInvoiced > 0 ? Math.round((reportData.portfolioCollected / reportData.portfolioInvoiced) * 100) : 0}% actual collection efficiency
                </span>
              </div>
            </div>

            {/* KPI 3 */}
            <div className="bg-white p-5 rounded-xl border border-gray-200/80 shadow-sm flex items-center space-x-4 transition-all duration-200 hover:shadow-md animate-in fade-in slide-in-from-top-1 duration-150">
              <div className="p-3.5 bg-rose-50 text-rose-600 rounded-xl shrink-0">
                <ArrowDownRight className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-xs font-mono text-gray-400 uppercase tracking-widest font-semibold block">Outstanding Receivables</span>
                <h4 className="text-xl font-extrabold text-gray-900 mt-0.5">{formatSAR(reportData.portfolioInvoiced - reportData.portfolioCollected)}</h4>
                <span className="text-xs text-rose-600 font-semibold block mt-0.5">Billed cash balance pending bank wire transfer</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Main Report View Switcher */}
      {selectedReport === 'financial' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-200">
          
          {/* Side-by-side Portfolio Table and Margin Quality Analysis */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Table (Left 2 columns on desktop) */}
            <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col justify-between">
              <div>
                <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-55/40">
                  <div>
                    <h3 className="text-xs font-bold text-gray-800 uppercase font-mono">Portfolio Profit & Loss Statement</h3>
                    <p className="text-xs text-gray-400">Priced budgets vs structural contract values and margin analysis</p>
                  </div>
                  <button
                    onClick={() => handlePrintPreview('Portfolio P&L Commercial Statement', 'commercial')}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 p-2 py-1.5 rounded-lg text-xs font-semibold transition flex items-center space-x-1.5 cursor-pointer active-scale"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Print / PDF</span>
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-gray-600">
                    <thead className="bg-gray-50 text-xs font-mono text-gray-400 uppercase tracking-wider">
                      <tr>
                        <th className="p-3.5">Project Name</th>
                        <th className="p-3.5 text-right">Award Value</th>
                        <th className="p-3.5 text-right">Total Budget</th>
                        <th className="p-3.5 text-right">Actual Spent</th>
                        <th className="p-3.5 text-right">Projected Profit</th>
                        <th className="p-3.5 text-right">Gross Margin</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {reportData.projectSummary.map(item => (
                        <tr key={item.id} className="hover:bg-gray-50/40 font-medium">
                          <td className="p-3.5 text-gray-900 font-semibold">{item.name}</td>
                          <td className="p-3.5 text-right text-gray-800 font-mono">{formatSAR(item.value)}</td>
                          <td className="p-3.5 text-right text-indigo-600 font-mono">{formatSAR(item.allocatedBudget)}</td>
                          <td className="p-3.5 text-right text-rose-600 font-mono">{formatSAR(item.actualSpent)}</td>
                          <td className="p-3.5 text-right text-emerald-600 font-mono">{formatSAR(item.profit)}</td>
                          <td className="p-3.5 text-right">
                            <span className={`inline-block px-2 py-0.5 rounded font-bold font-mono text-xs ${
                              item.profitPct > 20 ? 'bg-emerald-100 text-emerald-800' : 'bg-indigo-100 text-indigo-800'
                            }`}>
                              {item.profitPct}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Totals Row as Table Footer */}
              <div className="bg-slate-900 text-white p-4 font-bold grid grid-cols-2 sm:grid-cols-6 gap-3 text-xs items-center select-none rounded-b-xl">
                <div className="col-span-2 sm:col-span-1">TOTAL PORTFOLIO</div>
                <div className="text-right font-mono text-gray-250 font-bold">{formatSAR(reportData.portfolioContractValue)}</div>
                <div className="text-right font-mono text-indigo-300">{formatSAR(reportData.portfolioAllocatedBudget)}</div>
                <div className="text-right font-mono text-rose-300">{formatSAR(reportData.portfolioSpent)}</div>
                <div className="text-right font-mono text-emerald-400">{formatSAR(reportData.portfolioProfit)}</div>
                <div className="text-right">
                  <span className="bg-indigo-600 text-white px-2.5 py-1 rounded text-xs font-mono font-extrabold uppercase">
                    {reportData.portfolioProfitPct}% Avg
                  </span>
                </div>
              </div>
            </div>

            {/* Gross Margin Quality Analysis (Right 1 column) */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 space-y-4 flex flex-col justify-between">
              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-bold text-gray-800 uppercase font-mono tracking-wider">Gross Margin Quality Analysis</h4>
                  <p className="text-xs text-gray-500 mt-1">
                    Wafaq Co. internal benchmarks classify gross construction project margins above <strong className="text-emerald-600">20%</strong> as high-performance.
                  </p>
                </div>
                
                <div className="space-y-4 pt-2">
                  {reportData.projectSummary.map(item => (
                    <div key={item.id} className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-gray-750 truncate max-w-[180px]">{item.name}</span>
                        <span className={`font-mono font-bold ${item.profitPct > 20 ? 'text-emerald-600' : 'text-indigo-600'}`}>
                          {item.profitPct}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${item.profitPct > 20 ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                          style={{ width: `${Math.max(3, Math.min(item.profitPct, 100))}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-gray-150 text-xs text-gray-500 space-y-2 select-none">
                <div className="flex justify-between">
                  <span>Standard Margin Target:</span>
                  <span className="font-mono font-bold text-gray-700">18.00%</span>
                </div>
                <div className="flex justify-between">
                  <span>Actual Portfolio Average:</span>
                  <span className="font-mono font-bold text-emerald-600">{reportData.portfolioProfitPct}.00%</span>
                </div>
                <div className="flex justify-between">
                  <span>Performance Status:</span>
                  <span className="font-mono font-bold text-emerald-600 uppercase">Favorable</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {selectedReport === 'budget_vs_expense' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-200">
          
          {/* Side-by-side Budget Table and Category Cost Utilization */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Table (Left 2 columns on desktop) */}
            <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-55/40">
                <div>
                  <h3 className="text-xs font-bold text-gray-800 uppercase font-mono">Internal Budget Baseline and Consumption</h3>
                  <p className="text-xs text-gray-400">Allocated corporate baseline budgets vs actual approved subcontractor and material expenses</p>
                </div>
                <button
                  onClick={() => handlePrintPreview('Budget Baseline Consumption Audit', 'commercial')}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 p-2 py-1.5 rounded-lg text-xs font-semibold transition flex items-center space-x-1.5 cursor-pointer active-scale"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Print / PDF</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-gray-600">
                  <thead className="bg-gray-50 text-xs font-mono text-gray-400 uppercase tracking-wider">
                    <tr>
                      <th className="p-3.5">Contract Name</th>
                      <th className="p-3.5 text-right">Internal Budget</th>
                      <th className="p-3.5 text-right">Approved Expenses</th>
                      <th className="p-3.5 text-right">Direct Savings</th>
                      <th className="p-3.5 text-right">Consumption Bar</th>
                      <th className="p-3.5 text-right">Health Indicator</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {reportData.projectSummary.map(item => {
                      const consumedPct = item.allocatedBudget > 0 ? Math.round((item.actualSpent / item.allocatedBudget) * 100) : 0;
                      return (
                        <tr key={item.id} className="hover:bg-gray-50/40 font-medium">
                          <td className="p-3.5 text-gray-900 font-semibold">{item.name}</td>
                          <td className="p-3.5 text-right text-gray-800 font-mono">{formatSAR(item.allocatedBudget)}</td>
                          <td className="p-3.5 text-right text-rose-600 font-mono">{formatSAR(item.actualSpent)}</td>
                          <td className="p-3.5 text-right text-emerald-600 font-mono">{formatSAR(item.budgetSavings)}</td>
                          <td className="p-3.5">
                            <div className="flex items-center space-x-2 justify-end">
                              <div className="w-24 bg-gray-100 rounded-full h-2 overflow-hidden">
                                <div 
                                  className={`h-full rounded-full ${
                                    consumedPct > 90 ? 'bg-rose-500' : consumedPct > 75 ? 'bg-indigo-500' : 'bg-emerald-500'
                                  }`}
                                  style={{ width: `${Math.min(consumedPct, 100)}%` }}
                                ></div>
                              </div>
                              <span className="text-xs font-mono font-semibold text-gray-700">{consumedPct}%</span>
                            </div>
                          </td>
                          <td className="p-3.5 text-right">
                            <span className={`inline-block px-1.5 py-0.5 rounded text-xs font-mono font-semibold uppercase ${
                              consumedPct > 90 
                                ? 'bg-rose-100 text-rose-800 border border-rose-200' 
                                : consumedPct > 70 
                                  ? 'bg-indigo-100 text-indigo-800 border border-indigo-200/50' 
                                  : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            }`}>
                              {consumedPct > 90 ? 'Critical Red' : consumedPct > 70 ? 'Warning' : 'Optimal'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Cost Code Baseline Category Breakdown (Right 1 column) */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 space-y-4 flex flex-col justify-between">
              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-bold text-gray-800 uppercase font-mono tracking-wider">Corporate Category Utilization</h4>
                  <p className="text-xs text-gray-500 mt-1">
                    Baseline allocation vs approved expenditures consolidated by prime construction cost discipline.
                  </p>
                </div>
                
                <div className="space-y-4 pt-2">
                  {budgetCategoryMetrics.map(item => (
                    <div key={item.name} className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-gray-750">{item.name}</span>
                        <span className="font-mono text-gray-400 font-medium">
                          <strong className="text-gray-900 font-bold">{formatSAR(item.spent)}</strong> / {formatSAR(item.allocated)}
                        </span>
                      </div>
                      <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden flex">
                        <div 
                          className={`h-full rounded-full ${item.pct > 90 ? 'bg-rose-500' : item.pct > 75 ? 'bg-indigo-500' : 'bg-emerald-500'}`}
                          style={{ width: `${Math.max(2, Math.min(item.pct, 100))}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] font-mono text-gray-450 font-semibold">
                        <span>Consumption Rate</span>
                        <span className={`font-bold ${item.pct > 90 ? 'text-rose-600' : 'text-gray-700'}`}>{item.pct}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-gray-150 text-xs text-gray-500 space-y-2 select-none">
                <div className="flex justify-between">
                  <span>Prime Subcontractors:</span>
                  <span className="font-mono font-bold text-gray-700">12 Active</span>
                </div>
                <div className="flex justify-between">
                  <span>Material Baselines:</span>
                  <span className="font-mono font-bold text-indigo-600">Locked</span>
                </div>
                <div className="flex justify-between">
                  <span>Average Cost Health:</span>
                  <span className="font-mono font-bold text-emerald-600 uppercase">Excellent</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {selectedReport === 'cash_flow' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-200">
          
          {/* Side-by-side Invoices and Collections Aging */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Real Invoices Listing Table (Left 2 columns on desktop) */}
            <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-55/40">
                <div>
                  <h3 className="text-xs font-bold text-gray-800 uppercase font-mono">Client Milestone Invoices Log</h3>
                  <p className="text-xs text-gray-400">Detailed records of submitted and paid progress claim valuations (SAR)</p>
                </div>
                <button
                  onClick={() => handlePrintPreview('Milestone Progress Valuation Claim Log', 'milestone')}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 p-2 py-1.5 rounded-lg text-xs font-semibold transition flex items-center space-x-1.5 cursor-pointer active-scale"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Print / PDF</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-gray-600">
                  <thead className="bg-gray-50 text-xs font-mono text-gray-400 uppercase tracking-wider">
                    <tr>
                      <th className="p-3.5">Invoice No.</th>
                      <th className="p-3.5">Project Workspace</th>
                      <th className="p-3.5">Milestone Claim</th>
                      <th className="p-3.5 text-right">Taxable</th>
                      <th className="p-3.5 text-right">VAT (15%)</th>
                      <th className="p-3.5 text-right">Retention</th>
                      <th className="p-3.5 text-right">Total Net</th>
                      <th className="p-3.5 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {invoices.map(inv => {
                      const projName = projects.find(p => p.id === inv.projectId)?.name || 'Wafaq Project';
                      const displayVals = getInvoiceDisplayValues(inv);
                      return (
                        <tr key={inv.id} className="hover:bg-gray-50/40 font-medium">
                          <td className="p-3.5 text-gray-900 font-mono font-bold">{inv.invoiceNumber}</td>
                          <td className="p-3.5 text-gray-700 font-semibold truncate max-w-[140px]">{projName}</td>
                          <td className="p-3.5 text-gray-500 truncate max-w-[140px]">{inv.milestoneName}</td>
                          <td className="p-3.5 text-right font-mono">{formatSAR(displayVals.amount)}</td>
                          <td className="p-3.5 text-right font-mono text-gray-400">{formatSAR(displayVals.vat)}</td>
                          <td className="p-3.5 text-right font-mono text-rose-500">-{formatSAR(inv.retention)}</td>
                          <td className="p-3.5 text-right font-mono text-indigo-600 font-bold">{formatSAR(displayVals.totalAmount)}</td>
                          <td className="p-3.5 text-center">
                            <span className={`inline-block px-2.5 py-0.5 rounded text-xs font-mono font-bold ${
                              inv.status === 'paid' 
                                ? 'bg-emerald-100 text-emerald-800' 
                                : inv.status === 'partially_paid'
                                  ? 'bg-amber-100 text-amber-800'
                                  : inv.status === 'submitted'
                                    ? 'bg-indigo-100 text-indigo-800'
                                    : 'bg-rose-100 text-rose-800'
                            }`}>
                              {inv.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Cash Aging Bracket Distribution Box (Right 1 column) */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 space-y-4 flex flex-col justify-between">
              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-bold text-gray-800 uppercase font-mono tracking-wider">Collections Aging Bracket</h4>
                  <p className="text-xs text-gray-500 mt-1">
                    Outstanding balance aged from milestone certification date to bank wire settlement.
                  </p>
                </div>
                
                <div className="space-y-4 pt-2">
                  {/* 0-30 Days */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-gray-750 flex items-center space-x-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                        <span>Current (0 - 30 days)</span>
                      </span>
                      <span className="font-mono font-bold text-gray-950">
                        {formatSAR((reportData.portfolioInvoiced - reportData.portfolioCollected) * 0.65)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-150 h-1.5 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: '65%' }}></div>
                    </div>
                    <div className="text-right text-[10px] font-mono text-gray-405 font-bold">65.00% of outstanding</div>
                  </div>

                  {/* 31-60 Days */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-gray-750 flex items-center space-x-1.5">
                        <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block"></span>
                        <span>Overdue (31 - 60 days)</span>
                      </span>
                      <span className="font-mono font-bold text-gray-950">
                        {formatSAR((reportData.portfolioInvoiced - reportData.portfolioCollected) * 0.22)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-150 h-1.5 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 rounded-full" style={{ width: '22%' }}></div>
                    </div>
                    <div className="text-right text-[10px] font-mono text-gray-450 font-bold">22.00% of outstanding</div>
                  </div>

                  {/* 61+ Days */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-gray-750 flex items-center space-x-1.5">
                        <span className="w-2 h-2 rounded-full bg-rose-500 inline-block"></span>
                        <span>Severe Risk (61+ days)</span>
                      </span>
                      <span className="font-mono font-bold text-gray-950">
                        {formatSAR((reportData.portfolioInvoiced - reportData.portfolioCollected) * 0.13)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-150 h-1.5 rounded-full overflow-hidden">
                      <div className="h-full bg-rose-500 rounded-full" style={{ width: '13%' }}></div>
                    </div>
                    <div className="text-right text-[10px] font-mono text-gray-450 font-bold">13.00% of outstanding</div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-150 text-xs text-gray-500 space-y-2 select-none">
                <div className="flex justify-between">
                  <span>SAB Settlement Target:</span>
                  <span className="font-mono font-bold text-gray-700">14 Days</span>
                </div>
                <div className="flex justify-between">
                  <span>Average Aging Period:</span>
                  <span className="font-mono font-bold text-indigo-600">26 Days</span>
                </div>
                <div className="flex justify-between">
                  <span>Liquidity Security Index:</span>
                  <span className="font-mono font-bold text-emerald-600 uppercase">Strong (0.87)</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}


      {/* Printable Report Modal Template */}
      {showPrintModal && modalContent && (
        <div className="fixed inset-0 bg-slate-950/70 z-50 flex items-center justify-center p-4 overflow-y-auto backdrop-blur-xs select-none">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            
            {/* Modal Actions Header */}
            <div className="bg-gray-100 p-4 border-b border-gray-200 flex items-center justify-between shrink-0">
              <span className="text-xs font-bold text-gray-700 font-mono flex items-center space-x-1.5">
                <FileText className="w-4 h-4 text-indigo-600" />
                <span>VALUATION CERTIFICATE PRINT PREVIEW</span>
              </span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => alert("Simulated print service trigger. Report exported to system printer stream.")}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-sm"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Send to Print</span>
                </button>
                <button
                  onClick={() => setShowPrintModal(false)}
                  className="bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer"
                >
                  Close Preview
                </button>
              </div>
            </div>

            {/* Simulated Document Sheet */}
            <div className="flex-1 overflow-y-auto bg-gray-50 p-4 md:p-8 flex justify-start md:justify-center">
              <div className="w-full max-w-[210mm] min-h-[297mm] bg-white border border-gray-200 shadow-lg p-4 md:p-10 font-sans text-gray-800 flex flex-col justify-between overflow-x-auto">
                
                {/* Letterhead */}
                <div>
                  <div className="flex justify-between items-start border-b-2 border-slate-900 pb-5">
                    <div>
                      <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Wafaq Contracting Company</h1>
                      <p className="text-[10px] text-gray-500 font-mono mt-0.5">Commercial Registration: 1010459201 | Riyadh Headquarters</p>
                      <p className="text-[10px] text-gray-500 font-mono">PO Box 8421, Riyadh 11564, Kingdom of Saudi Arabia</p>
                    </div>
                    <div className="text-right">
                      <div className="w-10 h-10 bg-indigo-600 text-white font-bold text-lg rounded-lg flex items-center justify-center ml-auto">W</div>
                      <span className="text-[10px] font-mono uppercase tracking-widest text-indigo-600 block mt-2 font-bold">Wafaq ERP</span>
                    </div>
                  </div>

                  {/* Document Title & Reference */}
                  <div className="my-6">
                    <h2 className="text-sm font-bold text-center text-slate-800 uppercase tracking-widest border-b border-gray-150 pb-2">
                      {modalTitle}
                    </h2>
                    
                    <div className="grid grid-cols-2 gap-4 text-xs font-mono text-gray-600 mt-4 bg-gray-50 p-3 rounded border border-gray-100">
                      <div>
                        <span>Document Ref: </span><span className="font-bold text-slate-900">{modalContent.reference}</span>
                      </div>
                      <div className="text-right">
                        <span>Date Generated: </span><span className="font-bold text-slate-900">{modalContent.date}</span>
                      </div>
                      <div>
                        <span>Company Division: </span><span className="font-bold text-slate-900">Commercial Operations</span>
                      </div>
                      <div className="text-right">
                        <span>Status: </span><span className="text-emerald-600 font-bold">CERTIFIED BASELINE</span>
                      </div>
                    </div>
                  </div>

                  {/* Document Statement Body */}
                  <div className="space-y-6 text-xs leading-relaxed text-gray-700 mt-8">
                    <p>
                      This commercial report constitutes a formal representation of the project financial standings of <strong>Wafaq Contracting Company</strong> as registered in the Corporate ERP system database on <strong>July 15, 2026</strong>.
                    </p>
                    
                    {/* Dynamic data table inside document based on chosen report tab */}
                    {selectedReport === 'financial' && (
                      <table className="w-full text-left text-[11px] border-collapse border border-gray-200 mt-4">
                        <thead>
                          <tr className="bg-gray-100 font-mono text-slate-900 border-b border-gray-200">
                            <th className="p-2 border border-gray-200">Project Description</th>
                            <th className="p-2 border border-gray-200 text-right">Award Value</th>
                            <th className="p-2 border border-gray-200 text-right">Cost Budget</th>
                            <th className="p-2 border border-gray-200 text-right">Actual Spent</th>
                            <th className="p-2 border border-gray-200 text-right">Gross Margin</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reportData.projectSummary.map(item => (
                            <tr key={item.id} className="border-b border-gray-200">
                              <td className="p-2 border border-gray-200 font-semibold">{item.name}</td>
                              <td className="p-2 border border-gray-200 text-right font-mono">{formatSAR(item.value)}</td>
                              <td className="p-2 border border-gray-200 text-right font-mono">{formatSAR(item.allocatedBudget)}</td>
                              <td className="p-2 border border-gray-200 text-right font-mono">{formatSAR(item.actualSpent)}</td>
                              <td className="p-2 border border-gray-200 text-right font-mono">{item.profitPct}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}

                    {selectedReport === 'budget_vs_expense' && (
                      <table className="w-full text-left text-[11px] border-collapse border border-gray-200 mt-4">
                        <thead>
                          <tr className="bg-gray-100 font-mono text-slate-900 border-b border-gray-200">
                            <th className="p-2 border border-gray-200">Contract Name</th>
                            <th className="p-2 border border-gray-200 text-right">Internal Budget</th>
                            <th className="p-2 border border-gray-200 text-right">Approved Expenses</th>
                            <th className="p-2 border border-gray-200 text-right">Direct Savings</th>
                            <th className="p-2 border border-gray-200 text-right">Consumption</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reportData.projectSummary.map(item => {
                            const consumedPct = item.allocatedBudget > 0 ? Math.round((item.actualSpent / item.allocatedBudget) * 100) : 0;
                            return (
                              <tr key={item.id} className="border-b border-gray-200">
                                <td className="p-2 border border-gray-200 font-semibold">{item.name}</td>
                                <td className="p-2 border border-gray-200 text-right font-mono">{formatSAR(item.allocatedBudget)}</td>
                                <td className="p-2 border border-gray-200 text-right font-mono text-rose-600">{formatSAR(item.actualSpent)}</td>
                                <td className="p-2 border border-gray-200 text-right font-mono text-emerald-600">{formatSAR(item.budgetSavings)}</td>
                                <td className="p-2 border border-gray-200 text-right font-mono font-bold">{consumedPct}%</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}

                    {selectedReport === 'cash_flow' && (
                      <table className="w-full text-left text-[11px] border-collapse border border-gray-200 mt-4">
                        <thead>
                          <tr className="bg-gray-100 font-mono text-slate-900 border-b border-gray-200">
                            <th className="p-2 border border-gray-200">Invoice No.</th>
                            <th className="p-2 border border-gray-200">Milestone Claim</th>
                            <th className="p-2 border border-gray-200 text-right">Taxable</th>
                            <th className="p-2 border border-gray-200 text-right">VAT (15%)</th>
                            <th className="p-2 border border-gray-200 text-right">Total Net</th>
                            <th className="p-2 border border-gray-200 text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {invoices.map(inv => {
                            const displayVals = getInvoiceDisplayValues(inv);
                            return (
                              <tr key={inv.id} className="border-b border-gray-200">
                                <td className="p-2 border border-gray-200 font-mono font-bold">{inv.invoiceNumber}</td>
                                <td className="p-2 border border-gray-200 font-semibold truncate max-w-[140px]">{inv.milestoneName}</td>
                                <td className="p-2 border border-gray-200 text-right font-mono">{formatSAR(displayVals.amount)}</td>
                                <td className="p-2 border border-gray-200 text-right font-mono text-gray-400">{formatSAR(displayVals.vat)}</td>
                                <td className="p-2 border border-gray-200 text-right font-mono text-indigo-650 font-bold">{formatSAR(displayVals.totalAmount)}</td>
                                <td className="p-2 border border-gray-200 text-center font-mono uppercase font-bold text-[10px]">{inv.status}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}

                    <p className="mt-6">
                      The valuations represent approved client invoices less KSA local tax retention withholdings. Internal expense balances deduct approved subcontractor receipts and concrete material supplies directly.
                    </p>
                  </div>
                </div>

                {/* Document Sign-off */}
                <div className="border-t border-slate-900 pt-8 mt-12 grid grid-cols-2 gap-6 text-[10px] font-mono">
                  <div>
                    <span className="block text-gray-400">PREPARED BY</span>
                    <span className="font-bold text-slate-800 block mt-4">Corporate Accounts Auditor</span>
                    <span className="text-gray-500">Wafaq Finance Board</span>
                  </div>
                  <div className="text-right">
                    <span className="block text-gray-400">AUTHORIZED STAMP / SIGNATURE</span>
                    <span className="font-bold text-slate-800 block mt-4">Eng. Tariq Al-Mansoor</span>
                    <span className="text-gray-500">General Manager, Wafaq Co.</span>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
