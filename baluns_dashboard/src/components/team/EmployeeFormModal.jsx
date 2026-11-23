import { useState } from 'react';
import { X } from 'lucide-react';
export default function EmployeeFormModal({ employee, boards, projects, onSave, onClose }) {
  const [form, setForm] = useState(() => ({ name: '', empId: '', email: '', role: 'Employee', teamId: '', projectId: '', manager: '', status: 'active', ...employee }));
  const [error, setError] = useState('');
  const set = (key, value) => setForm(prev => ({ ...prev, [key]: value }));
  const submit = ev => {
    ev.preventDefault();
    if (!form.name.trim()) return setError('Employee name is required.');
    const board = boards.find(b => String(b.id) === String(form.teamId)) || boards.find(b => b.name === form.team);
    const project = projects.find(p => String(p.id) === String(form.projectId));
    onSave({ ...form, name: form.name.trim(), empId: form.empId || form.id || `BAL-${Date.now()}`, teamId: board?.id || form.teamId, team: board?.name || form.team || '', project: project?.name || '' });
  };
  return <div className="team-overlay" onMouseDown={onClose}><form className="team-dialog team-form" onMouseDown={ev => ev.stopPropagation()} onSubmit={submit} role="dialog" aria-modal="true" aria-label={employee ? 'Edit employee' : 'Add employee'}>
    <button type="button" className="team-close" onClick={onClose}><X size={19}/></button><h2>{employee ? 'Edit employee' : 'Add employee'}</h2>
    <div className="team-form-grid">
      {[['name','Full name'],['empId','Employee ID'],['email','Email'],['role','Role'],['manager','Reporting manager']].map(([key,label]) => <label key={key}>{label}<input value={form[key] || ''} onChange={ev => set(key, ev.target.value)} placeholder={label} /></label>)}
      <label>Department / Team<select value={form.teamId || boards.find(b => b.name === form.team)?.id || ''} onChange={ev => { setForm(prev => ({ ...prev, teamId: ev.target.value, projectId: '' })); }}><option value="">Select team</option>{boards.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select></label>
      <label>Current project<select value={form.projectId || ''} onChange={ev => set('projectId', ev.target.value)}><option value="">No project</option>{projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
      <label>Account status<select value={form.status} onChange={ev => set('status', ev.target.value)}><option value="active">Active</option><option value="inactive">Inactive</option></select></label>
    </div>{error && <p className="team-error">{error}</p>}
    <div className="team-dialog-actions"><button type="button" className="team-btn secondary" onClick={onClose}>Cancel</button><button type="submit" className="team-btn primary">{employee ? 'Save changes' : 'Add employee'}</button></div>
  </form></div>;
}
