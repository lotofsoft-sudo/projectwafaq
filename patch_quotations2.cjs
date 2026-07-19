const fs = require('fs');
const file = 'src/components/QuotationsManager.tsx';
let code = fs.readFileSync(file, 'utf8');

const replacement = `const pdfDoc = new jsPDF();
      pdfDoc.setFontSize(14);
      pdfDoc.text('Wafaq Contracting Co. Official Price Quotation', 15, 20);
      pdfDoc.setFontSize(10);
      pdfDoc.text('Filename: ' + filename, 15, 30);
      pdfDoc.save(filename);`;

const startStr = "const content = `%PDF-1.4";
const endStr = "URL.revokeObjectURL(url);";

if (code.includes(startStr)) {
  const startIndex = code.indexOf(startStr);
  const endIndex = code.indexOf(endStr, startIndex) + endStr.length;
  code = code.slice(0, startIndex) + replacement + code.slice(endIndex);
  fs.writeFileSync(file, code);
}
