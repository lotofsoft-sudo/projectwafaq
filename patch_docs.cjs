const fs = require('fs');
const file = 'src/components/ProjectDocumentControllerView.tsx';
let code = fs.readFileSync(file, 'utf8');

const oldStr1 = `    const projectMilestones = milestones.filter(m => m.projectId === pId);
    const mId = selectedMilestoneId === 'all' ? (projectMilestones[0]?.id || '') : selectedMilestoneId;
    setFormMilestoneId(mId);`;

const newStr1 = `    const mId = selectedMilestoneId === 'all' ? 'none' : (selectedMilestoneId || 'none');
    setFormMilestoneId(mId);`;

code = code.replace(oldStr1, newStr1);

const oldStr2 = `    const matchedMilestone = milestones.find(m => m.id === formMilestoneId);
    const mName = matchedMilestone ? matchedMilestone.name : 'Unspecified Milestone Segment';`;

const newStr2 = `    const matchedMilestone = milestones.find(m => m.id === formMilestoneId);
    const mName = formMilestoneId === 'none' ? 'No Milestone Association' : (matchedMilestone ? matchedMilestone.name : 'Unspecified Milestone Segment');`;

code = code.replace(oldStr2, newStr2);

const oldStr3 = `<select
                    required
                    value={formMilestoneId}
                    onChange={e => setFormMilestoneId(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-xs mt-1 bg-white focus:ring-1 focus:ring-indigo-500 outline-none font-semibold text-slate-700"
                  >
                    {milestones.filter(m => m.projectId === formProjectId).map(m => (
                      <option key={m.id} value={m.id}>{m.name} ({m.progress}% done)</option>
                    ))}
                    {milestones.filter(m => m.projectId === formProjectId).length === 0 && (
                      <option value="">No milestones registered</option>
                    )}
                  </select>`;

const newStr3 = `<select
                    value={formMilestoneId}
                    onChange={e => setFormMilestoneId(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2.5 text-xs mt-1 bg-white focus:ring-1 focus:ring-indigo-500 outline-none font-semibold text-slate-700"
                  >
                    <option value="none">No Milestone Association</option>
                    {milestones.filter(m => m.projectId === formProjectId).map(m => (
                      <option key={m.id} value={m.id}>{m.name} ({m.progress}% done)</option>
                    ))}
                    {milestones.filter(m => m.projectId === formProjectId).length === 0 && (
                      <option disabled value="">No milestones registered</option>
                    )}
                  </select>`;

code = code.replace(oldStr3, newStr3);

fs.writeFileSync(file, code);
