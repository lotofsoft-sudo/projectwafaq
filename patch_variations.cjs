const fs = require('fs');
const file = 'src/components/ProjectVariationsView.tsx';
let code = fs.readFileSync(file, 'utf8');

const replacement = `const pdfDoc = new jsPDF();
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
    pdfDoc.save(\`\${v.refNumber || \`VO-\${v.id}\`}_formal_order.pdf\`);`;

const regex = /const\s+blob\s*=\s*new\s+Blob\(\[content\],\s*\{\s*type:\s*'text\/plain'\s*\}\);[\s\S]*?URL\.revokeObjectURL\(url\);/g;

code = code.replace(regex, replacement);

fs.writeFileSync(file, code);
