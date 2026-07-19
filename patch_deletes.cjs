const fs = require('fs');
const path = require('path');

const componentsDir = 'src/components';
const files = fs.readdirSync(componentsDir)
  .filter(f => f.endsWith('.tsx'))
  .map(f => path.join(componentsDir, f));

const checkSnippet = `
    const userRoleStr = currentUser?.role?.toLowerCase() || '';
    if (userRoleStr !== 'admin' && userRoleStr !== 'super admin' && userRoleStr !== 'superadmin') {
      alert("Unauthorized: Only Admin or Super Admin can delete records.");
      return;
    }
`;

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let modified = false;
  
  // Need to make sure we don't insert multiple times if run twice
  // and need to match correctly.
  
  content = content.replace(/(const handleDelete\w*\s*=\s*\([^)]*\)\s*=>\s*\{)/g, (match) => {
    modified = true;
    return match + checkSnippet;
  });
  
  if (modified) {
    fs.writeFileSync(file, content);
    console.log('Patched', file);
  }
}
