const fs = require('fs');
const file = 'src/components/ProjectDocumentControllerView.tsx';
let code = fs.readFileSync(file, 'utf8');

const regex = /\{\s*canManageDocs\s*&&\s*\(\s*<>\s*<button[\s\S]*?Issue Invoice for Document[\s\S]*?<\/button>\s*<button[\s\S]*?Log Payment for Document[\s\S]*?<\/button>\s*<\/>\s*\)\s*\}/g;

code = code.replace(regex, '');

fs.writeFileSync(file, code);
