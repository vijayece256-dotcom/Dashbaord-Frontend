import { MoreVertical } from 'lucide-react';
const initials = name => (name || '?').split(' ').map(x => x[0]).slice(0, 2).join('').toUpperCase();
export default function EmployeeTable({ employees, projects, onOpen, onEdit, onDelete }) {
  const projectName = e => projects.find(p => String(p.id) === String(e.projectId))?.name || e.project || '—';
  return <div className="team-table-wrap"><table className="team-table"><thead><tr><th>Employee</th><th>Emp ID</th><th>Role</th><th>Team</th><th>Current project</th><th>Status</th><th></th></tr></thead><tbody>
    {employees.map(e => <tr key={e.id} onClick={() => onOpen(e)} tabIndex={0} onKeyDown={ev => { if (ev.key === 'Enter') onOpen(e); }}>
      <td><div className="team-person"><span className="team-avatar">{initials(e.name)}</span><div><strong>{e.name}</strong><small>{e.email || 'No email provided'}</small></div></div></td>
      <td>{e.empId || e.id}</td><td><span className="team-role">{e.role || 'Employee'}</span></td><td>{e.team || '—'}</td><td>{projectName(e)}</td><td><span className={`team-status ${e.status === 'inactive' ? 'inactive' : ''}`}>{e.status === 'inactive' ? 'Inactive' : 'Active'}</span></td>
      <td><details className="team-actions" onClick={ev => ev.stopPropagation()}><summary aria-label={`Actions for ${e.name}`}><MoreVertical size={18}/></summary><div><button onClick={() => onEdit(e)}>Edit</button><button onClick={() => onDelete(e)}>Delete</button></div></details></td>
    </tr>)}
    {!employees.length && <tr><td colSpan={7} className="team-empty">No employees match your filters.</td></tr>}
  </tbody></table></div>;
}
