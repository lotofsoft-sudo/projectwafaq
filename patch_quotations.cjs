const fs = require('fs');
const file = 'src/components/QuotationsManager.tsx';
let code = fs.readFileSync(file, 'utf8');

if (!code.includes('import { jsPDF }')) {
  // Insert import after the last import
  const lastImportIndex = code.lastIndexOf('import ');
  const endOfLastImport = code.indexOf('\n', lastImportIndex);
  code = code.slice(0, endOfLastImport + 1) + "import { jsPDF } from 'jspdf';\n" + code.slice(endOfLastImport + 1);
}

const replacement = `const pdfDoc = new jsPDF();
      pdfDoc.setFontSize(14);
      pdfDoc.text(\`Wafaq Contracting Co. Official Price Quotation\`, 15, 20);
      pdfDoc.setFontSize(10);
      pdfDoc.text(\`Filename: \${filename}\`, 15, 30);
      pdfDoc.save(filename);`;

const regex = /const\s+content\s*=\s*`%PDF-1\.4\\n%\[Wafaq Contracting Co\.\s*Official Price Quotation PDF: \$\{filename\}\] \.\.\.`;\s*const\s+blob\s*=\s*new\s+Blob\(\[content\],\s*\{\s*type:\s*'application\/pdf'\s*\}\);\s*const\s+url\s*=\s*URL\.createObjectURL\(blob\);\s*const\s+link\s*=\s*document\.createElement\('a'\);\s*link\.href\s*=\s*url;\s*link\.download\s*=\s*filename;\s*document\.body\.appendChild\(link\);\s*link\.click\(\);\s*document\.body\.removeChild\(link\);\s*URL\.revokeObjectURL\(url\);/g;

code = code.replace(regex, replacement);

fs.writeFileSync(file, code);
