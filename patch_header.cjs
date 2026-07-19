const fs = require('fs');
const file = 'src/components/ProjectDocumentControllerView.tsx';
let code = fs.readFileSync(file, 'utf8');

const oldStr = `{milestones.find(m => m.id === selectedMilestoneId)?.name}`;
const newStr = `{selectedMilestoneId === 'none' ? 'No Milestone Association' : milestones.find(m => m.id === selectedMilestoneId)?.name}`;

code = code.replace(oldStr, newStr);
fs.writeFileSync(file, code);
