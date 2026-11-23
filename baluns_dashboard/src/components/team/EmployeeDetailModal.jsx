import { X, Pencil } from 'lucide-react';
export default function EmployeeDetailModal({ employee: e, projects, boards, onClose, onEdit }) {
  if (!e) return null;
  const initials = e.name.split(' ').map(x => x[0]).slice(0,2).join('').toUpperCase();
  const current = projects.find(p => String(p.id) === String(e.projectId)) || projects.find(p => p.name === e.project);
  const assigned = projects.filter(p => (p.assignedEmployees || p.employeeIds || []).some?.(id => String(typeof id === 'object' ? id.id : id) === String(e.id)) || (current && String(p.id) === String(current.id)));
  const taskCount = boards.flatMap(b => b.tasks || []).filter(t => t.assignee === e.name).length;
  return <div className="team-overlay" onMouseDown={onClose}><section className="team-dialog team-detail" role="dialog" aria-modal="true" aria-label="Employee details" onMouseDown={ev => ev.stopPropagation()}>
    <button className="team-close" onClick={onClose}><X size={19}/></button>
    <div className="team-detail-head"><span className="team-avatar large">{initials}</span><div><h2>{e.name}</h2><p>{e.empId || e.id} · {e.role}</p><small>{e.team || 'Unassigned team'}</small></div><span className={`team-status ${e.status === 'inactive' ? 'inactive' : ''}`}>{e.status === 'inactive' ? 'Inactive' : 'Active'}</span></div>
    <div className="team-panel"><h3>Employee information</h3><div className="team-facts"><div><span>Employee ID</span><strong>{e.empId || e.id}</strong></div><div><span>Team</span><strong>{e.team || '—'}</strong></div><div><span>Full name</span><strong>{e.name}</strong></div><div><span>Reporting manager</span><strong>{e.manager || '—'}</strong></div><div><span>Role</span><strong>{e.role || '—'}</strong></div><div><span>Email</span><strong>{e.email || '—'}</strong></div></div></div>
    <div className="team-panel"><h3>Current project</h3>{current ? <div className="team-project-line"><strong>{current.name}</strong><span>{current.status || '—'}</span></div> : <p className="team-muted">No current project assigned.</p>}</div>
    <div className="team-detail-grid"><div className="team-panel"><h3>Projects worked on</h3><p className="team-muted">Project history is not recorded yet.</p></div><div className="team-panel"><h3>Projects currently working on</h3>{assigned.length ? assigned.map(p => <div className="team-project-line" key={p.id}><strong>{p.name}</strong><span>{p.status || '—'}</span></div>) : <p className="team-muted">No linked projects.</p>}</div></div>
    <div className="team-panel"><h3>Assigned tasks</h3><p>{taskCount} task{taskCount === 1 ? '' : 's'}</p></div>
    <div className="team-dialog-actions"><button className="team-btn secondary" onClick={() => onEdit(e)}><Pencil size={15}/> Edit employee</button><button className="team-btn primary" onClick={onClose}>Close</button></div>
  </section></div>;
}
