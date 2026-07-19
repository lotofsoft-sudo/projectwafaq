const fs = require('fs');
let code = fs.readFileSync('src/components/QuotationsManager.tsx', 'utf8');
code = code.replace("import { \nimport { jsPDF } from 'jspdf';", "import { jsPDF } from 'jspdf';\nimport { ");
fs.writeFileSync('src/components/QuotationsManager.tsx', code);
