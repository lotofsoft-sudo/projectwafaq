/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Project, User, Role, BOQItem, Quotation, PurchaseOrder, BudgetCategory, Milestone, Task, Issue, Variation, Expense, Invoice, Payment, Document, AuditLog, Notification, ProjectQuantity, Client, DocumentController } from '../types';

export const INITIAL_USERS: User[] = [
  { id: 'u1', name: 'Eng. Tariq Al-Mansoor', email: 'tariq@wafaq.com', role: 'General Manager', avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150', status: 'active' },
  { id: 'u2', name: 'Eng. Ahmed Al-Shehri', email: 'ahmed@wafaq.com', role: 'Project Manager', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150', status: 'active' },
  { id: 'u3', name: 'Sarah Al-Harbi', email: 'sarah.h@wafaq.com', role: 'Accountant', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150', status: 'active' },
  { id: 'u4', name: 'Khalid Al-Otaibi', email: 'khalid@wafaq.com', role: 'Site Engineer', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', status: 'active' },
  { id: 'u5', name: 'Youssef Al-Waleed', email: 'youssef@client.com', role: 'Client', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150', status: 'active' },
  { id: 'u6', name: 'Dr. Nabil Ghamdi', email: 'nabil@consultant.com', role: 'Consultant', avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150', status: 'active' },
  { id: 'u_admin', name: 'Eng. Khaled Al-Sabah', email: 'khaled.sabah@wafaq.com', role: 'Admin', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150', status: 'active' },
  { id: 'u_super_admin', name: 'Eng. Faisal Al-Saud', email: 'faisal.saud@wafaq.com', role: 'Super Admin', avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150', status: 'active' },
];

export const INITIAL_ROLES: Role[] = [
  {
    id: 'r_admin',
    name: 'Admin',
    description: 'System Admin with full privileges across all functional modules, budgets, contract actions, and audit trail logs.',
    permissions: {
      viewDashboard: true,
      manageProjects: true,
      manageQuotations: true,
      manageBudgets: true,
      approveExpenses: true,
      manageInvoices: true,
      manageUsers: true,
      viewAuditLogs: true,
    }
  },
  {
    id: 'r_super_admin',
    name: 'Super Admin',
    description: 'Root system access with unconditional administrative overrides, master controls, configuration edits, and audit logs.',
    permissions: {
      viewDashboard: true,
      manageProjects: true,
      manageQuotations: true,
      manageBudgets: true,
      approveExpenses: true,
      manageInvoices: true,
      manageUsers: true,
      viewAuditLogs: true,
    }
  },
  {
    id: 'r1',
    name: 'General Manager',
    description: 'Full administrative access to all modules, financial metrics, and company-wide configurations.',
    permissions: {
      viewDashboard: true,
      manageProjects: true,
      manageQuotations: true,
      manageBudgets: true,
      approveExpenses: true,
      manageInvoices: true,
      manageUsers: true,
      viewAuditLogs: true,
    }
  },
  {
    id: 'r2',
    name: 'Project Manager',
    description: 'Manages specific assigned projects, creates tasks, schedules, uploads BOQs, and drafts variations.',
    permissions: {
      viewDashboard: true,
      manageProjects: true,
      manageQuotations: true,
      manageBudgets: true,
      approveExpenses: false,
      manageInvoices: true,
      manageUsers: false,
      viewAuditLogs: false,
    }
  },
  {
    id: 'r3',
    name: 'Accountant',
    description: 'Manages billing, records receipts, processes expenses, processes payments, and generates financial summaries.',
    permissions: {
      viewDashboard: true,
      manageProjects: false,
      manageQuotations: false,
      manageBudgets: true,
      approveExpenses: true,
      manageInvoices: true,
      manageUsers: false,
      viewAuditLogs: true,
    }
  },
  {
    id: 'r4',
    name: 'Site Engineer',
    description: 'Manages day-to-day on-site activities, files daily progress, logs issues, and drafts extra work requests.',
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
  },
  {
    id: 'r5',
    name: 'Client',
    description: 'External view access to project milestones, tasks, approved drawings, submitted invoices, and variation status.',
    permissions: {
      viewDashboard: false,
      manageProjects: false,
      manageQuotations: false,
      manageBudgets: false,
      approveExpenses: false,
      manageInvoices: false,
      manageUsers: false,
      viewAuditLogs: false,
    }
  }
];

export const WORKFLOW_STEP_NAMES: string[] = [
  'Invitation Received', // 1
  'Opportunity Created', // 2
  'Site Visit Completed', // 3
  'Technical Meeting Done', // 4
  'Information Collected', // 5
  'BOQ Uploaded', // 6
  'Cost Estimation Ready', // 7
  'Initial Quotation Formed', // 8
  'Quotation Revision Active', // 9
  'Final Quotation Prepared', // 10
  'Client Negotiation Ongoing', // 11
  'Award Letter Received', // 12
  'Purchase Order Issued', // 13
  'Contract Executed & Uploaded', // 14
  'Internal Budget Baseline Created', // 15
  'Resource Plan Drafted', // 16
  'Project Kickoff Executed', // 17
  'Milestone Master Plan Configured', // 18
  'Task Work Breakdown Formed', // 19
  'Execution Phase Activated', // 20
  'Daily Progress Logged', // 21
  'Active Issues Identified', // 22
  'Variations Logged', // 23
  'Extra Work Authorizations Drafted', // 24
  'Client Approvals Secured', // 25
  'Invoices Issued', // 26
  'Payment Collection Complete', // 27
  'Project Closing & Handover Finished' // 28
];

export const INITIAL_PROJECTS: Project[] = [
  {
    id: 'p1',
    name: 'Al-Malqa Luxury Residential Complex',
    code: 'WF-PRJ-2026-01',
    clientName: 'Al-Ajlan Real Estate Development',
    value: 12500000, // 12.5M SAR
    budget: 9800000, // 9.8M SAR
    spent: 4200000,
    status: 'active',
    siteLocation: 'Al-Malqa District, Riyadh, KSA',
    siteManager: 'Eng. Ahmed Al-Shehri',
    startDate: '2026-01-10',
    endDate: '2027-02-28',
    description: 'Construction of an premium residential cluster consisting of 12 luxury smart villas, centralized pool, security cabins, and integrated landscaping.',
    currentWorkflowStep: 20, // Execution
    progress: 42
  },
  {
    id: 'p2',
    name: 'King Salman Park Civic Pavilion',
    code: 'WF-PRJ-2026-02',
    clientName: 'King Salman Park Foundation',
    value: 28400000, // 28.4M SAR
    budget: 22100000, // 22.1M SAR
    spent: 1200000,
    status: 'active',
    siteLocation: 'King Salman Park (Old Airport), Riyadh, KSA',
    siteManager: 'Eng. Hisham Al-Ghamdi',
    startDate: '2026-04-01',
    endDate: '2027-11-15',
    description: 'Bespoke structural glass pavilion featuring water fountains, high-span steel trusses, internal exhibition chambers, and state-of-the-art climate control systems.',
    currentWorkflowStep: 18, // Milestone Planning
    progress: 10
  },
  {
    id: 'p3',
    name: 'Wafaq Corporate HQ Fit-out',
    code: 'WF-PRJ-2025-09',
    clientName: 'Wafaq Contracting Company',
    value: 3500000, // 3.5M SAR
    budget: 2900000, // 2.9M SAR
    spent: 2880000,
    status: 'completed',
    siteLocation: 'King Abdullah Financial District (KAFD), Riyadh, KSA',
    siteManager: 'Eng. Tariq Al-Mansoor',
    startDate: '2025-05-01',
    endDate: '2026-02-15',
    description: 'Premium internal corporate fit-out including custom wood wall paneling, modular open desks, boardrooms with acoustic optimization, and full smart office automation.',
    currentWorkflowStep: 28, // Project Closing
    progress: 100
  },
  {
    id: 'p4',
    name: 'Qiddiya Water Theme Park Utilities',
    code: 'WF-PRJ-2026-04',
    clientName: 'Qiddiya Investment Company',
    value: 18900000, // 18.9M SAR
    budget: 14500000, // 14.5M SAR
    spent: 0,
    status: 'pending',
    siteLocation: 'Qiddiya Entertainment City, Riyadh, KSA',
    siteManager: 'Eng. Majid Al-Mutairi',
    startDate: '2026-09-01',
    endDate: '2028-01-30',
    description: 'Mechanical piping, high-voltage substations, and main fiber connectivity ducts connecting the water park mechanical rooms to the master city utility network.',
    currentWorkflowStep: 9, // Quotation Revision
    progress: 0
  }
];

export const INITIAL_BOQS: BOQItem[] = [
  { id: 'b1', projectId: 'p1', itemNo: '1.01', description: 'Excavation and clearing of land to structural baseline levels', unit: 'm3', qty: 4500, rate: 45, total: 202500, category: 'Civil' },
  { id: 'b2', projectId: 'p1', itemNo: '1.02', description: 'Reinforced concrete foundation casting using C40/50 ready-mix', unit: 'm3', qty: 1800, rate: 380, total: 684000, category: 'Civil' },
  { id: 'b3', projectId: 'p1', itemNo: '2.01', description: 'Premium grade masonry block work including heavy wire joint reinforcing', unit: 'm2', qty: 12500, rate: 75, total: 937500, category: 'Civil' },
  { id: 'b4', projectId: 'p1', itemNo: '3.01', description: 'Smart electrical distribution panels and master cabling routes', unit: 'LS', qty: 1, rate: 850000, total: 850000, category: 'Electrical' },
  { id: 'b5', projectId: 'p1', itemNo: '4.01', description: 'Centralized VRF HVAC heating/cooling systems - Carrier premium spec', unit: 'Unit', qty: 12, rate: 110000, total: 1320000, category: 'HVAC' },
  { id: 'b6', projectId: 'p1', itemNo: '5.01', description: 'Custom double-glazed glass curtain walls for villa fronts', unit: 'm2', qty: 2400, rate: 1200, total: 2880000, category: 'Mechanical' },
];

export const INITIAL_QUOTATIONS: Quotation[] = [
  {
    id: 'q1_v1',
    projectId: 'p1',
    version: 'V1',
    date: '2025-11-05',
    preparedBy: 'Eng. Ahmed Al-Shehri',
    totalAmount: 13200000,
    clientComments: 'Requesting 10% cost reduction on high curtain wall items.',
    status: 'rejected',
    items: [
      { id: 'qi1', description: 'Site setup, mobilizations, safety signs and temporary offices', qty: 1, unit: 'LS', rate: 400000, total: 400000 },
      { id: 'qi2', description: 'Structural, civil block work and premium masonry foundation', qty: 1, unit: 'LS', rate: 6500000, total: 6500000 },
      { id: 'qi3', description: 'Electrical and mechanical rough-ins with low current control lines', qty: 1, unit: 'LS', rate: 2300000, total: 2300000 },
      { id: 'qi4', description: 'Custom structural double-glazed glass curtain wall and smart frames', qty: 1, unit: 'LS', rate: 4000000, total: 4000000 },
    ]
  },
  {
    id: 'q1_v2',
    projectId: 'p1',
    version: 'V2',
    date: '2025-11-20',
    preparedBy: 'Eng. Ahmed Al-Shehri',
    totalAmount: 12500000,
    clientComments: 'Perfect. Pricing aligned with budget constraints. Proceed with Contract draft.',
    status: 'approved',
    items: [
      { id: 'qi5', description: 'Site setup, mobilizations, safety signs and temporary offices', qty: 1, unit: 'LS', rate: 350000, total: 350000 },
      { id: 'qi6', description: 'Structural, civil block work and premium masonry foundation', qty: 1, unit: 'LS', rate: 6200000, total: 6200000 },
      { id: 'qi7', description: 'Electrical and mechanical rough-ins with low current control lines', qty: 1, unit: 'LS', rate: 2150000, total: 2150000 },
      { id: 'qi8', description: 'Custom structural double-glazed glass curtain wall and smart frames (Value Engineered)', qty: 1, unit: 'LS', rate: 3800000, total: 3800000 },
    ]
  },
  {
    id: 'q4_v1',
    projectId: 'p4',
    version: 'V1',
    date: '2026-06-12',
    preparedBy: 'Eng. Majid Al-Mutairi',
    totalAmount: 19500000,
    clientComments: 'Substation pricing is slightly higher than market estimates.',
    status: 'under_review',
    items: [
      { id: 'qi9', description: 'High voltage electrical substation connection lines', qty: 2, unit: 'Sub', rate: 7000000, total: 14000000 },
      { id: 'qi10', description: 'Mechanical piping network and water theme flow conduits', qty: 1, unit: 'LS', rate: 5500000, total: 5500000 },
    ]
  },
  {
    id: 'q4_v2',
    projectId: 'p4',
    version: 'V2',
    date: '2026-07-02',
    preparedBy: 'Eng. Majid Al-Mutairi',
    totalAmount: 18900000,
    clientComments: 'Awaiting formal review from Qiddiya mechanical consultants.',
    status: 'draft',
    items: [
      { id: 'qi11', description: 'High voltage electrical substation connection lines (re-negotiated with sub-vendor)', qty: 2, unit: 'Sub', rate: 6600000, total: 13200000 },
      { id: 'qi12', description: 'Mechanical piping network and water theme flow conduits', qty: 1, unit: 'LS', rate: 5700000, total: 5700000 },
    ]
  }
];

export const INITIAL_POS: PurchaseOrder[] = [
  {
    id: 'po1',
    projectId: 'p1',
    poNumber: 'PO-AL-AJLAN-2025-881',
    date: '2025-12-05',
    value: 12500000,
    scopeOfWork: 'Complete civil, masonry, MEP installation, and facade works for 12 luxury villas as per approved blueprints and material submittals list.',
    paymentTerms: '10% advance payment against bank guarantee, monthly progress valuations with 5% retention deduction.',
    warranty: '2-year comprehensive operational warranty and 10-year structural warranty on all foundation elements.',
    completionDate: '2027-02-28',
    fileName: 'PO-Ajlan-Signed.pdf',
    withVat: true,
    vatAmount: 1875000
  },
  {
    id: 'po2',
    projectId: 'p2',
    poNumber: 'PO-KSPF-2026-042',
    date: '2026-03-15',
    value: 28400000,
    scopeOfWork: 'Structural glass fabrication, custom column structural steel casting, automated mechanical louvers, and interior finishes of the central pavilion.',
    paymentTerms: '15% advance payment, 80% split into milestone-based invoices, 5% on final closeout certificates.',
    warranty: '5-year functional glass seal warranty, 10-year structural warranty.',
    completionDate: '2027-11-15',
    fileName: 'PO-CivicPavilion-KSPF.pdf',
    withVat: true,
    vatAmount: 4260000
  },
  {
    id: 'po3',
    projectId: 'p3',
    poNumber: 'PO-WF-INTERNAL-009',
    date: '2025-04-20',
    value: 3500000,
    scopeOfWork: 'KAFD office floor structural fit-out, acoustic ceiling panels, custom walnut dividers, glass partitions, server room backup UPS, and executive desk assembly.',
    paymentTerms: 'Internal billing - quarterly budget reviews and milestone clearances.',
    warranty: '1-year interior contractor warranty.',
    completionDate: '2026-02-15',
    fileName: 'PO-KAFD-Fitout-Signed.pdf',
    withVat: true,
    vatAmount: 525000
  }
];

export const INITIAL_BUDGETS: BudgetCategory[] = [
  // For Al-Malqa (p1)
  { id: 'bc1', projectId: 'p1', name: 'Civil & Structural', allocated: 3800000, spent: 1850000, color: 'emerald' },
  { id: 'bc2', projectId: 'p1', name: 'Electrical & Cabling', allocated: 1500000, spent: 650000, color: 'blue' },
  { id: 'bc3', projectId: 'p1', name: 'HVAC & Plumbing', allocated: 1800000, spent: 900000, color: 'cyan' },
  { id: 'bc4', projectId: 'p1', name: 'Facade & Masonry', allocated: 1600000, spent: 480000, color: 'amber' },
  { id: 'bc5', projectId: 'p1', name: 'Equipment & Rental', allocated: 500000, spent: 180000, color: 'indigo' },
  { id: 'bc6', projectId: 'p1', name: 'Salaries & Site Office', allocated: 600000, spent: 140000, color: 'rose' },

  // For King Salman Park Civic Pavilion (p2)
  { id: 'bc7', projectId: 'p2', name: 'Specialty Steel Casting', allocated: 9000000, spent: 400000, color: 'emerald' },
  { id: 'bc8', projectId: 'p2', name: 'Structural Smart Glass', allocated: 8000000, spent: 500000, color: 'blue' },
  { id: 'bc9', projectId: 'p2', name: 'MEP Integration', allocated: 3500000, spent: 100000, color: 'cyan' },
  { id: 'bc10', projectId: 'p2', name: 'Site Mobilization & Safety', allocated: 1600000, spent: 200000, color: 'amber' },

  // For Internal Fit-out (p3)
  { id: 'bc11', projectId: 'p3', name: 'Carpentry & Panel Finishes', allocated: 1500000, spent: 1500000, color: 'emerald' },
  { id: 'bc12', projectId: 'p3', name: 'Smart Office & AV Setup', allocated: 800000, spent: 780000, color: 'blue' },
  { id: 'bc13', projectId: 'p3', name: 'HVAC Duct Modifications', allocated: 400000, spent: 400000, color: 'cyan' },
  { id: 'bc14', projectId: 'p3', name: 'Office Logistics & Fees', allocated: 200000, spent: 200000, color: 'amber' },
];

export const INITIAL_MILESTONES: Milestone[] = [
  // For Al-Malqa (p1)
  { id: 'm1', projectId: 'p1', name: 'Engineering Drawings & Approvals', weight: 15, progress: 100, status: 'completed', dueDate: '2026-03-01' },
  { id: 'm2', projectId: 'p1', name: 'Site Excavation & Foundation Works', weight: 25, progress: 100, status: 'completed', dueDate: '2026-06-15' },
  { id: 'm3', projectId: 'p1', name: 'Superstructure Concrete Frame', weight: 20, progress: 50, status: 'in_progress', dueDate: '2026-09-30' },
  { id: 'm4', projectId: 'p1', name: 'MEP Rough-Ins & Facade Glass', weight: 25, progress: 0, status: 'pending', dueDate: '2026-12-15' },
  { id: 'm5', projectId: 'p1', name: 'Testing, Landscaping & Handover', weight: 15, progress: 0, status: 'pending', dueDate: '2027-02-28' },

  // For King Salman Park (p2)
  { id: 'm6', projectId: 'p2', name: 'Site Clearing & Survey Baseline', weight: 10, progress: 100, status: 'completed', dueDate: '2026-05-15' },
  { id: 'm7', projectId: 'p2', name: 'Foundation Piling Excavations', weight: 20, progress: 0, status: 'in_progress', dueDate: '2026-08-30' },
  { id: 'm8', projectId: 'p2', name: 'Steel Core Structure Erection', weight: 30, progress: 0, status: 'pending', dueDate: '2027-01-15' },
  { id: 'm9', projectId: 'p2', name: 'Glass Panel Assembly & Facade', weight: 25, progress: 0, status: 'pending', dueDate: '2027-06-30' },
  { id: 'm10', projectId: 'p2', name: 'Interior Finishing & MEP Commissioning', weight: 15, progress: 0, status: 'pending', dueDate: '2027-11-15' },

  // For Internal HQ (p3)
  { id: 'm11', projectId: 'p3', name: 'Planning & Interior Design Renderings', weight: 15, progress: 100, status: 'completed', dueDate: '2025-06-01' },
  { id: 'm12', projectId: 'p3', name: 'Wall Studs & Acoustic Framing', weight: 25, progress: 100, status: 'completed', dueDate: '2025-09-15' },
  { id: 'm13', projectId: 'p3', name: 'Electrical/Data cabling & Glass Paneling', weight: 30, progress: 100, status: 'completed', dueDate: '2025-12-01' },
  { id: 'm14', projectId: 'p3', name: 'Premium Carpentry & Boardroom AV Tech', weight: 30, progress: 100, status: 'completed', dueDate: '2026-02-15' },
];

export const INITIAL_TASKS: Task[] = [
  // Under milestone m3 (Superstructure Concrete Frame)
  {
    id: 't1',
    milestoneId: 'm3',
    projectId: 'p1',
    name: 'Cast Column Joint blocks for Villas 1 to 4',
    progress: 100,
    status: 'completed',
    priority: 'high',
    startDate: '2026-06-20',
    dueDate: '2026-07-10',
    assigneeId: 'u4',
    assigneeName: 'Khalid Al-Otaibi',
    description: 'Ensure formwork alignment is perfectly vertical and column reinforcing steel matches drawings prior to casting. Cylinder pressure tests should be verified.',
    comments: [
      { id: 'tc1', user: 'Khalid Al-Otaibi', role: 'Site Engineer', text: 'Mix concrete batch was certified C45 and poured cleanly. Core cylinder pressure tests passed.', date: '2026-07-09 17:30' }
    ],
    attachments: [{ name: 'Cylinder_Strength_Report.pdf', size: '1.2 MB', uploadedAt: '2026-07-09' }],
    checklist: [
      { id: 'c1', text: 'Define color palette and concrete grade', completed: true, assigneeName: 'Khalid Al-Otaibi', dueDate: '2026-06-21' },
      { id: 'c2', text: 'Verify rebar diameter and spacing', completed: true, assigneeName: 'Ahmed Al-Shehri', dueDate: '2026-06-25' },
      { id: 'c3', text: 'Verify shuttering tightness and form release agent application', completed: true, assigneeName: 'Khalid Al-Otaibi', dueDate: '2026-06-28' },
      { id: 'c4', text: 'Execute casting and vibrate concrete to eliminate voids', completed: true, assigneeName: 'Khalid Al-Otaibi', dueDate: '2026-07-05' }
    ],
    statusHistory: [
      { user: 'Khalid Al-Otaibi', role: 'Site Engineer', previousStatus: 'in_progress', newStatus: 'completed', date: '2026-07-09 17:30' }
    ]
  },
  {
    id: 't2',
    milestoneId: 'm3',
    projectId: 'p1',
    name: 'Assemble Rebar framing for Villa 5 & 6 roof slabs',
    progress: 40,
    status: 'in_progress',
    priority: 'medium',
    startDate: '2026-07-01',
    dueDate: '2026-07-25',
    assigneeId: 'u4',
    assigneeName: 'Khalid Al-Otaibi',
    description: 'Rebar spacing and anchoring links must adhere to structural guidelines for high deflection slabs. Double check top reinforcement over supports.',
    comments: [
      { id: 'tc2', user: 'Ahmed Al-Shehri', role: 'Project Manager', text: 'Please expedite. Steel delivery was delayed but we must catch up this weekend.', date: '2026-07-12 09:15' }
    ],
    attachments: [],
    checklist: [
      { id: 'c5', text: 'Procure high-yield steel bars from supplier', completed: true, assigneeName: 'Sarah Johnson', dueDate: '2026-07-05' },
      { id: 'c6', text: 'Cut and bend rebars as per bending schedules', completed: true, assigneeName: 'Khalid Al-Otaibi', dueDate: '2026-07-10' },
      { id: 'c7', text: 'Bind main bars with secondary shear links', completed: false, assigneeName: 'Khalid Al-Otaibi', dueDate: '2026-07-18' },
      { id: 'c8', text: 'Inspector review and cover block checking', completed: false, assigneeName: 'Dr. Nabil Ghamdi', dueDate: '2026-07-23' }
    ],
    statusHistory: [
      { user: 'Ahmed Al-Shehri', role: 'Project Manager', previousStatus: 'to_do', newStatus: 'in_progress', date: '2026-07-01 08:30' }
    ]
  },
  {
    id: 't3',
    milestoneId: 'm3',
    projectId: 'p1',
    name: 'Erect scaffold formwork for central recreational canopy',
    progress: 10,
    status: 'in_progress',
    priority: 'high',
    startDate: '2026-07-10',
    dueDate: '2026-08-05',
    assigneeId: 'u2',
    assigneeName: 'Eng. Ahmed Al-Shehri',
    description: 'Special high-clearance system scaffolding is required for the canopy slab. Check ground compaction and load distribution pads.',
    comments: [
      { id: 'tc3', user: 'Dr. Nabil Ghamdi', role: 'Consultant', text: 'Safety bracing must be certified by structural inspector before pouring concrete.', date: '2026-07-14 14:22' }
    ],
    attachments: [],
    checklist: [
      { id: 'c9', text: 'Compact base sand and install concrete sleepers', completed: true, assigneeName: 'Eng. Ahmed Al-Shehri', dueDate: '2026-07-12' },
      { id: 'c10', text: 'Erect vertical standards with ledger beams', completed: false, assigneeName: 'Eng. Ahmed Al-Shehri', dueDate: '2026-07-20' },
      { id: 'c11', text: 'Install double handrails and safety toe boards', completed: false, assigneeName: 'Eng. Ahmed Al-Shehri', dueDate: '2026-07-28' },
      { id: 'c12', text: 'Consultant certification checkoff', completed: false, assigneeName: 'Dr. Nabil Ghamdi', dueDate: '2026-08-03' }
    ],
    statusHistory: [
      { user: 'Eng. Ahmed Al-Shehri', role: 'Project Manager', previousStatus: 'to_do', newStatus: 'in_progress', date: '2026-07-10 10:00' }
    ]
  },
  // Under milestone m7 (Foundation Piling Excavations) for p2
  {
    id: 't4',
    milestoneId: 'm7',
    projectId: 'p2',
    name: 'Piling excavation drill holes 1 to 24',
    progress: 30,
    status: 'in_progress',
    priority: 'high',
    startDate: '2026-06-01',
    dueDate: '2026-07-30',
    assigneeId: 'u4',
    assigneeName: 'Khalid Al-Otaibi',
    description: 'Drilling down to solid bedrock depth of 14 meters. Keep logs of mud thickness and soil consistency profiles.',
    comments: [],
    attachments: [],
    checklist: [
      { id: 'c13', text: 'Mobilize heavy drilling rigs to sectors A & B', completed: true, assigneeName: 'Khalid Al-Otaibi', dueDate: '2026-06-05' },
      { id: 'c14', text: 'Drill pile holes 1 to 12', completed: true, assigneeName: 'Khalid Al-Otaibi', dueDate: '2026-06-18' },
      { id: 'c15', text: 'Drill pile holes 13 to 24', completed: false, assigneeName: 'Khalid Al-Otaibi', dueDate: '2026-07-10' },
      { id: 'c16', text: 'Slurry cleaning and steel cage insertion', completed: false, assigneeName: 'Khalid Al-Otaibi', dueDate: '2026-07-22' }
    ],
    statusHistory: [
      { user: 'Khalid Al-Otaibi', role: 'Site Engineer', previousStatus: 'to_do', newStatus: 'in_progress', date: '2026-06-01 09:00' }
    ]
  }
];

export const INITIAL_ISSUES: Issue[] = [
  {
    id: 'i1',
    projectId: 'p1',
    title: 'Groundwater Seepage near Villa 3 Boundary',
    type: 'site',
    priority: 'high',
    severity: 'high',
    status: 'in_progress',
    assigneeId: 'u4',
    assigneeName: 'Khalid Al-Otaibi',
    dateCreated: '2026-07-02',
    comments: [
      { id: 'ic1', user: 'Khalid Al-Otaibi', role: 'Site Engineer', text: 'Pumping rigs are deployed. Need waterproofing subcontractor to review the retaining wall baseline ASAP.', date: '2026-07-03' }
    ]
  },
  {
    id: 'i2',
    projectId: 'p1',
    title: 'Delayed Delivery of VRF Copper HVAC Piping',
    type: 'delay',
    priority: 'medium',
    severity: 'medium',
    status: 'open',
    assigneeId: 'u2',
    assigneeName: 'Eng. Ahmed Al-Shehri',
    dateCreated: '2026-07-10',
    comments: []
  },
  {
    id: 'i3',
    projectId: 'p2',
    title: 'Consultant Drawing Revision on Base Support Steel Core',
    type: 'technical',
    priority: 'high',
    severity: 'critical',
    status: 'open',
    assigneeId: 'u6',
    assigneeName: 'Dr. Nabil Ghamdi',
    dateCreated: '2026-07-13',
    comments: [
      { id: 'ic2', user: 'Dr. Nabil Ghamdi', role: 'Consultant', text: 'Wind load calculations for high-span trusses in Riyadh sandstorms necessitate increasing thickness of column plate nodes by 4mm.', date: '2026-07-13' }
    ]
  }
];

export const INITIAL_VARIATIONS: Variation[] = [
  {
    id: 'v1',
    projectId: 'p1',
    title: 'Upgrade Swimming Pool to Heated Olympic Sizing',
    costImpact: 450000,
    timeImpactDays: 15,
    approvalStatus: 'approved',
    dateCreated: '2026-02-18',
    description: 'Enlarge pool dimension to 25m, integrate heating pump elements, high-pressure sand filter systems and luxury mosaic tile layout requested directly by client.',
    fileName: 'VO-PoolUpgrade-Approved.pdf'
  },
  {
    id: 'v2',
    projectId: 'p1',
    title: 'Additional Boundary Security Fencing & Smart Intercom Gate',
    costImpact: 180000,
    timeImpactDays: 8,
    approvalStatus: 'pending',
    dateCreated: '2026-07-05',
    description: 'Installation of high-grade perimeter anti-climb fencing, automated vehicular sliding gate with ANPR camera integration, and internal video intercom for all 12 villas.',
    fileName: 'VO-Fencing-Pending.pdf'
  },
  {
    id: 'v3',
    projectId: 'p2',
    title: 'Reinforcement Steel Base Thickness Increase',
    costImpact: 950000,
    timeImpactDays: 20,
    approvalStatus: 'pending',
    dateCreated: '2026-07-14',
    description: 'Increasing steel core node thickness by 4mm to withstand extreme wind force shear pressures as per consultant updated engineering layouts.',
    fileName: 'VO_Steel_Thickness_VO3.pdf'
  }
];

export const INITIAL_EXPENSES: Expense[] = [
  // Under Civil bc1 for p1
  { id: 'e1', projectId: 'p1', budgetCategoryId: 'bc1', vendor: 'Saudi Ready-Mix Concrete Co.', date: '2026-04-12', amount: 350000, vat: 52500, totalAmount: 402500, approvalStatus: 'approved', description: 'Batch #23A concrete mix pour for Villa foundation structural beam.', fileName: 'SRM-Inv-2026_921.pdf' },
  { id: 'e2', projectId: 'p1', budgetCategoryId: 'bc1', vendor: 'Riyadh Heavy Steel Industry', date: '2026-05-18', amount: 500000, vat: 75000, totalAmount: 575000, approvalStatus: 'approved', description: 'Rebar reinforcement bundles Grade 60 (12mm, 16mm, 20mm).', fileName: 'RHS-RebarReceipt.pdf' },
  { id: 'e3', projectId: 'p1', budgetCategoryId: 'bc1', vendor: 'Jeddah Block & Cement Factory', date: '2026-07-01', amount: 150000, vat: 22500, totalAmount: 172500, approvalStatus: 'approved', description: '20,000 hollow cement blocks 20x20x40 cm delivered to block A.', fileName: 'JBCF_Invoice_3021.pdf' },
  // Under HVAC bc3
  { id: 'e4', projectId: 'p1', budgetCategoryId: 'bc3', vendor: 'Al-Essa Carrier Air Conditioning', date: '2026-06-25', amount: 800000, vat: 120000, totalAmount: 920000, approvalStatus: 'approved', description: 'Carrier VRF outdoor condenser systems pre-order (50% deposit).', fileName: 'Carrier_Preorder_Receipt.pdf' },
  // Under Equipment Rental bc5
  { id: 'e5', projectId: 'p1', budgetCategoryId: 'bc5', vendor: 'Zahid Tractor Crane Rentals', date: '2026-07-08', amount: 80000, vat: 12000, totalAmount: 92000, approvalStatus: 'pending', description: 'Monthly rental for CAT Liebherr 50T mobile tower crane.', fileName: 'Zahid_TowerCrane_July_Invoice.pdf' },
];

export const INITIAL_INVOICES: Invoice[] = [
  // For p1
  {
    id: 'inv1',
    projectId: 'p1',
    invoiceNumber: 'WF-INV-MALQA-001',
    milestoneId: 'm1',
    milestoneName: 'Engineering Drawings & Approvals',
    amount: 1875000, // 15% of 12.5M
    vat: 281250, // 15% VAT KSA
    retention: 93750, // 5% retention
    totalAmount: 2062500, // amount + VAT - retention
    status: 'paid',
    dateCreated: '2026-03-05',
    dueDate: '2026-04-05',
    receivedAmount: 2062500
  },
  {
    id: 'inv2',
    projectId: 'p1',
    invoiceNumber: 'WF-INV-MALQA-002',
    milestoneId: 'm2',
    milestoneName: 'Site Excavation & Foundation Works',
    amount: 3125000, // 25% of 12.5M
    vat: 468750,
    retention: 156250,
    totalAmount: 3437500,
    status: 'paid',
    dateCreated: '2026-06-20',
    dueDate: '2026-07-20',
    receivedAmount: 3437500
  },
  {
    id: 'inv3',
    projectId: 'p1',
    invoiceNumber: 'WF-INV-MALQA-003',
    milestoneId: 'm3',
    milestoneName: 'Superstructure Concrete Frame (Draft Valuation)',
    amount: 1250000, // Part billing (10% of 12.5M)
    vat: 187500,
    retention: 62500,
    totalAmount: 1375000,
    status: 'submitted',
    dateCreated: '2026-07-12',
    dueDate: '2026-08-12',
    receivedAmount: 0
  }
];

export const INITIAL_PAYMENTS: Payment[] = [
  { id: 'pay1', projectId: 'p1', invoiceId: 'inv1', invoiceNumber: 'WF-INV-MALQA-001', amount: 2062500, date: '2026-03-22', bankRef: 'ANB-TX-90184201', paymentMethod: 'SADAD Bank Transfer' },
  { id: 'pay2', projectId: 'p1', invoiceId: 'inv2', invoiceNumber: 'WF-INV-MALQA-002', amount: 3437500, date: '2026-07-05', bankRef: 'SAB-TX-09412155', paymentMethod: 'SADAD Bank Transfer' },
];

export const INITIAL_DOCUMENTS: Document[] = [
  { id: 'd1', projectId: 'p1', name: 'Approved_Master_SiteLayout_RevC.dwg', category: 'Drawing', version: 'v3.0', uploadedBy: 'Eng. Ahmed Al-Shehri', uploadedAt: '2026-02-10', size: '22.4 MB', tags: ['Site Plan', 'DWG', 'Approved'] },
  { id: 'd2', projectId: 'p1', name: 'Contract_Wafaq_AlAjlan_Signed.pdf', category: 'Contract', version: 'v1.0', uploadedBy: 'Eng. Tariq Al-Mansoor', uploadedAt: '2025-12-12', size: '8.4 MB', tags: ['Contract', 'Signed', 'Official'] },
  { id: 'd3', projectId: 'p1', name: 'Main_Villa_BOQ_Final_Priced.xlsx', category: 'BOQ', version: 'v2.1', uploadedBy: 'Eng. Ahmed Al-Shehri', uploadedAt: '2025-11-25', size: '1.4 MB', tags: ['BOQ', 'Excel', 'Priced'] },
  { id: 'd4', projectId: 'p1', name: 'Soil_Bearing_Test_Report.pdf', category: 'Report', version: 'v1.0', uploadedBy: 'Khalid Al-Otaibi', uploadedAt: '2026-01-18', size: '4.2 MB', tags: ['Soil Test', 'Geotechnical'] },
];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  { id: 'al1', user: 'Eng. Tariq Al-Mansoor', role: 'General Manager', action: 'Approved Contract & Milestone Plan', module: 'Contract Management', oldValue: 'Contract Draft', newValue: 'Executed Contract', ip: '192.168.1.45', device: 'MacBook Pro - Safari', date: '2025-12-12 11:42' },
  { id: 'al2', user: 'Eng. Ahmed Al-Shehri', role: 'Project Manager', action: 'Uploaded Final Priced BOQ', module: 'BOQ Module', oldValue: 'Empty', newValue: 'BOQ Priced Excel File v2.1', ip: '192.168.1.112', device: 'Dell Precision - Chrome', date: '2025-11-25 14:02' },
  { id: 'al3', user: 'Sarah Al-Harbi', role: 'Accountant', action: 'Approved Material Invoice for Cement Block delivery', module: 'Expense Module', oldValue: 'Pending Approval', newValue: 'Approved for Payment', ip: '192.168.1.72', device: 'iPad Pro - Safari', date: '2026-07-02 09:30' },
  { id: 'al4', user: 'Khalid Al-Otaibi', role: 'Site Engineer', action: 'Logged Groundwater Seepage Issue', module: 'Issue Tracking', oldValue: 'None', newValue: 'Issue #i1 Ground Water near Villa 3', ip: '10.0.4.15', device: 'iPhone 15 Pro - Chrome Mobile', date: '2026-07-02 11:15' },
];

export const INITIAL_NOTIFICATIONS: Notification[] = [
  { id: 'n1', text: 'Dr. Nabil Ghamdi logged a Technical Issue on Steel Column Thickness for King Salman Park project.', type: 'alert', read: false, timestamp: '2026-07-13 14:22' },
  { id: 'n2', text: 'Invoice WF-INV-MALQA-003 has been submitted for Al-Malqa Project.', type: 'info', read: false, timestamp: '2026-07-12 10:15' },
  { id: 'n3', text: 'Sarah Al-Harbi approved Saudi Ready-Mix concrete expense of 402,500 SAR.', type: 'success', read: true, timestamp: '2026-07-02 09:30' },
  { id: 'n4', text: 'Task "Assemble Rebar framing for Villa 5 & 6 roof slabs" was set to In Progress by Khalid Al-Otaibi.', type: 'info', read: true, timestamp: '2026-07-01 11:00' },
];

export const INITIAL_PROJECT_QUANTITIES: ProjectQuantity[] = [
  { id: 'q_p1_1', projectId: 'p1', name: 'Excavation & Earthwork', value: 4500, unit: 'm3', lastUpdated: '2026-07-10', updatedBy: 'Eng. Ahmed Al-Shehri' },
  { id: 'q_p1_2', projectId: 'p1', name: 'Concrete Foundations', value: 1800, unit: 'm3', lastUpdated: '2026-07-12', updatedBy: 'Eng. Ahmed Al-Shehri' },
  { id: 'q_p1_3', projectId: 'p1', name: 'Structural Rebar Steel', value: 145, unit: 'tons', lastUpdated: '2026-07-14', updatedBy: 'Khalid Al-Otaibi' },
  { id: 'q_p2_1', projectId: 'p2', name: 'High-Span Truss Structural Steel', value: 340, unit: 'tons', lastUpdated: '2026-07-08', updatedBy: 'Eng. Hisham Al-Ghamdi' },
  { id: 'q_p2_2', projectId: 'p2', name: 'Double Glazed Façade Glass', value: 2400, unit: 'm2', lastUpdated: '2026-07-15', updatedBy: 'Eng. Hisham Al-Ghamdi' },
];

export const INITIAL_CLIENTS: Client[] = [
  {
    id: 'cl1',
    projectId: 'p1',
    companyName: 'Al-Ajlan Real Estate Development',
    contactPerson: 'Eng. Abdulrahman Al-Ajlan',
    email: 'a.ajlan@alajlan-re.com',
    phone: '+966 50 123 4567',
    address: 'King Fahd Road, Al-Aqeeq District, Riyadh, KSA',
    vatNumber: '310249582100003',
    commercialReg: '1010293847',
    contractValue: 12500000,
    notes: 'Primary developer client for the Al-Malqa Luxury Residential Complex.',
    lastUpdated: '2026-07-10',
    updatedBy: 'Eng. Ahmed Al-Shehri'
  },
  {
    id: 'cl2',
    projectId: 'p1',
    companyName: 'Bawan Consulting Engineers',
    contactPerson: 'Dr. Faisal Al-Qahtani',
    email: 'faisal.q@bawan-consult.sa',
    phone: '+966 11 483 9200',
    address: 'Takhassusi Street, Riyadh, KSA',
    vatNumber: '300184920400003',
    commercialReg: '1010384756',
    contractValue: 350000,
    notes: 'Third-party client-appointed consultant representative overseeing structural works.',
    lastUpdated: '2026-07-12',
    updatedBy: 'Eng. Ahmed Al-Shehri'
  },
  {
    id: 'cl3',
    projectId: 'p2',
    companyName: 'King Salman Park Foundation',
    contactPerson: 'Eng. Mansour Al-Saeed',
    email: 'm.saeed@kspf.gov.sa',
    phone: '+966 55 987 6543',
    address: 'Salah Al-Din Al-Ayoubi Road, Riyadh, KSA',
    vatNumber: '320098471200003',
    commercialReg: '1010998877',
    contractValue: 28400000,
    notes: 'Government master-development entity for King Salman Park Civic Pavilion.',
    lastUpdated: '2026-07-14',
    updatedBy: 'Eng. Hisham Al-Ghamdi'
  },
  {
    id: 'cl4',
    projectId: 'p3',
    companyName: 'Wafaq Contracting Company (Internal)',
    contactPerson: 'Eng. Tariq Al-Mansoor',
    email: 'tariq@wafaq.com',
    phone: '+966 53 111 2222',
    address: 'KAFD, Block 4.10, Riyadh, KSA',
    vatNumber: '310485938200003',
    commercialReg: '1010153829',
    contractValue: 3500000,
    notes: 'Internal project for corporate headquarters fit-out in KAFD.',
    lastUpdated: '2025-05-01',
    updatedBy: 'Eng. Tariq Al-Mansoor'
  },
  {
    id: 'cl5',
    projectId: 'p4',
    companyName: 'Qiddiya Investment Company',
    contactPerson: 'Eng. Fahad Al-Harbi',
    email: 'fahad.h@qiddiya.com',
    phone: '+966 56 444 8899',
    address: 'Qiddiya Site Office, Highway 40, KSA',
    vatNumber: '330495817200003',
    commercialReg: '1010582910',
    contractValue: 18900000,
    notes: 'Primary master developer client for Qiddiya Water Theme Park Utilities.',
    lastUpdated: '2026-07-15',
    updatedBy: 'Eng. Majid Al-Mutairi'
  }
];

export const INITIAL_DOCUMENT_CONTROLLERS: DocumentController[] = [
  {
    id: 'dc1',
    projectId: 'p1',
    milestoneId: 'm1',
    milestoneName: 'Engineering Drawings & Approvals',
    documentTitle: 'Approved Architectural Shop Drawings - Ground Floor Plan',
    documentNumber: 'WF-DC-MALQA-ARC-001',
    revision: 'Rev 0',
    category: 'Shop Drawing',
    status: 'approved',
    assignedControllerId: 'u2',
    assignedControllerName: 'Eng. Ahmed Al-Shehri',
    receivedDate: '2026-02-05',
    actionDate: '2026-02-10',
    description: 'Initial ground floor architectural layouts showing structural column placements, clearance grids, and core dimensions.',
    comments: [
      { id: 'dc_c1', user: 'Eng. Tariq Al-Mansoor', role: 'General Manager', text: 'Excellent details. Matches client requirements with precision.', date: '2026-02-08 10:00' }
    ],
    attachments: [
      { name: 'Ground_Floor_Plan_Rev0.pdf', size: '12.4 MB', uploadedAt: '2026-02-05' }
    ],
    updates: [
      { id: 'dc_up1', user: 'Eng. Ahmed Al-Shehri', role: 'Project Manager', text: 'Document registered and dispatched to client consultant.', date: '2026-02-05 09:00' },
      { id: 'dc_up2', user: 'Eng. Tariq Al-Mansoor', role: 'General Manager', text: 'Approved by consultant with zero remarks.', date: '2026-02-10 14:00' }
    ]
  },
  {
    id: 'dc2',
    projectId: 'p1',
    milestoneId: 'm2',
    milestoneName: 'Site Excavation & Foundation Works',
    documentTitle: 'Concrete Structural Mix Design & Soil Test Approval',
    documentNumber: 'WF-DC-MALQA-STR-002',
    revision: 'Rev A',
    category: 'Material Submittal',
    status: 'approved_with_comments',
    assignedControllerId: 'u2',
    assignedControllerName: 'Eng. Ahmed Al-Shehri',
    receivedDate: '2026-04-12',
    actionDate: '2026-04-18',
    description: 'Soil test bearing capacity verification report (4.5 kg/cm2) paired with C40 structural concrete mix design submittal for footings.',
    comments: [
      { id: 'dc_c2', user: 'Khalid Al-Otaibi', role: 'Site Engineer', text: 'Make sure to check slump on delivery trucks.', date: '2026-04-15 11:30' }
    ],
    attachments: [
      { name: 'C40_Mix_Design_Report.pdf', size: '3.1 MB', uploadedAt: '2026-04-12' }
    ],
    updates: [
      { id: 'dc_up3', user: 'Eng. Ahmed Al-Shehri', role: 'Project Manager', text: 'Mix design submitted for laboratory test reviews.', date: '2026-04-12 10:00' }
    ]
  },
  {
    id: 'dc3',
    projectId: 'p1',
    milestoneId: 'm3',
    milestoneName: 'Superstructure Concrete Frame',
    documentTitle: 'Method Statement for First Floor Slab Concrete Pouring',
    documentNumber: 'WF-DC-MALQA-MS-003',
    revision: 'Rev B',
    category: 'Method Statement',
    status: 'under_review',
    assignedControllerId: 'u2',
    assignedControllerName: 'Eng. Ahmed Al-Shehri',
    receivedDate: '2026-07-10',
    description: 'Detailed logistics, pouring sequence, and safety mitigation plan for placing concrete on the elevated slab at +4.50m level.',
    comments: [],
    attachments: [
      { name: 'Method_Statement_Pouring_Slab_RevB.docx', size: '1.8 MB', uploadedAt: '2026-07-10' }
    ],
    updates: [
      { id: 'dc_up4', user: 'Eng. Ahmed Al-Shehri', role: 'Project Manager', text: 'Registered submittal in system and forwarded to consultant Eng. Ghamdi.', date: '2026-07-10 15:30' }
    ]
  }
];
