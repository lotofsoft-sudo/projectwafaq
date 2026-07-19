const fs = require('fs');
const file = 'src/components/ProjectDocumentControllerView.tsx';
let code = fs.readFileSync(file, 'utf8');

const oldStr = `<button
                          onClick={() => setSelectedMilestoneId('all')}
                          className={\`w-full text-left py-1 px-2 rounded text-[11px] font-medium transition \${
                            selectedMilestoneId === 'all'
                              ? 'bg-indigo-50 text-indigo-700 font-bold'
                              : 'text-slate-500 hover:text-slate-800'
                          }\`}
                        >
                          ● All Milestones
                        </button>`;

const newStr = `<button
                          onClick={() => setSelectedMilestoneId('all')}
                          className={\`w-full text-left py-1 px-2 rounded text-[11px] font-medium transition \${
                            selectedMilestoneId === 'all'
                              ? 'bg-indigo-50 text-indigo-700 font-bold'
                              : 'text-slate-500 hover:text-slate-800'
                          }\`}
                        >
                          ● All Milestones
                        </button>
                        <button
                          onClick={() => setSelectedMilestoneId('none')}
                          className={\`w-full text-left py-1 px-2 rounded text-[11px] font-medium transition flex items-center justify-between \${
                            selectedMilestoneId === 'none'
                              ? 'bg-indigo-50/80 text-indigo-700 font-bold'
                              : 'text-slate-500 hover:text-slate-800'
                          }\`}
                        >
                          <span className="truncate pr-1">● No Milestone Association</span>
                        </button>`;

code = code.replace(oldStr, newStr);
fs.writeFileSync(file, code);
