const fs = require('fs');

const files = [
  'src/components/ProjectDocumentControllerView.tsx',
  'src/components/ProjectExpensesView.tsx',
  'src/components/ProjectInvoicesView.tsx',
  'src/components/ProjectPaymentsView.tsx',
  'src/components/ProjectVariationsView.tsx',
];

for (const file of files) {
  let code = fs.readFileSync(file, 'utf8');
  
  if (!code.includes('import { jsPDF }')) {
    // Insert import after the last import
    const lastImportIndex = code.lastIndexOf('import ');
    const endOfLastImport = code.indexOf('\n', lastImportIndex);
    code = code.slice(0, endOfLastImport + 1) + "import { jsPDF } from 'jspdf';\n" + code.slice(endOfLastImport + 1);
  }

  // Find the exact blob and download code.
  // Usually it looks like:
  /*
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Something.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  */
  
  // We can use a regex to match from `const blob = new Blob` to `URL.revokeObjectURL(url);`
  // We need to capture the filename from `link.download = \`Something.txt\`;`
  
  const regex = /const\s+blob\s*=\s*new\s+Blob\(\[content\],\s*\{\s*type:\s*'text\/plain'\s*\}\);\s*const\s+url\s*=\s*URL\.createObjectURL\(blob\);\s*const\s+link\s*=\s*document\.createElement\('a'\);\s*link\.href\s*=\s*url;\s*link\.download\s*=\s*`([^`]+)\.txt`;\s*document\.body\.appendChild\(link\);\s*link\.click\(\);\s*document\.body\.removeChild\(link\);\s*URL\.revokeObjectURL\(url\);/g;
  
  code = code.replace(regex, (match, filename) => {
    return `const pdfDoc = new jsPDF();
    pdfDoc.setFont("courier", "normal");
    pdfDoc.setFontSize(10);
    const lines = pdfDoc.splitTextToSize(content, 180);
    let y = 20;
    lines.forEach(line => {
      if (y > 280) {
        pdfDoc.addPage();
        y = 20;
      }
      pdfDoc.text(line, 15, y);
      y += 5;
    });
    pdfDoc.save(\`${filename}.pdf\`);`;
  });

  fs.writeFileSync(file, code);
}
