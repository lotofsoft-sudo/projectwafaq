const fs = require('fs');

const files = [
  'src/components/ProjectClientsView.tsx',
  'src/components/ProjectTasksView.tsx',
  'src/components/PurchaseOrdersManager.tsx',
  'src/components/ProjectBudgetsView.tsx',
  'src/components/ProjectMilestonesView.tsx',
  'src/components/GlobalQuantitiesModal.tsx',
  'src/components/ProjectWorkspace.tsx',
  'src/components/QuotationsManager.tsx',
  'src/components/ProjectBOQView.tsx',
  'src/components/ProjectSiteIssuesView.tsx',
  'src/components/ProjectVariationsView.tsx',
  'src/components/ProjectExpensesView.tsx',
  'src/components/ProjectInvoicesView.tsx',
  'src/components/ProjectPaymentsView.tsx',
  'src/components/ProjectDocumentControllerView.tsx',
  'src/components/UserManager.tsx',
  'src/components/RoleManager.tsx',
  'src/components/SettingsView.tsx'
];

files.forEach(f => {
  const code = fs.readFileSync(f, 'utf8');
  console.log(f + ': ' + (code.includes('admin') ? 'Has check' : 'Missing check'));
});
