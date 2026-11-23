import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useBoards } from './BoardsContext.jsx';
import { generateDummyEmployees } from '../data/dummyEmployees.js';

const Context = createContext(null);
const KEY = 'baluns_employees_v1';
const read = () => { try { const v = JSON.parse(localStorage.getItem(KEY)); return Array.isArray(v) ? v : []; } catch { return []; } };
export function EmployeesProvider({ children }) {
  const { boards = [] } = useBoards();
  const [saved, setSaved] = useState(read);
  const employees = useMemo(() => {
    const generated = generateDummyEmployees(boards);
    const byId = new Map(generated.map(e => [String(e.id), { ...e, status: 'active' }]));
    saved.forEach(e => byId.set(String(e.id), { ...(byId.get(String(e.id)) || {}), ...e }));
    return [...byId.values()].filter(e => !e.deleted);
  }, [boards, saved]);
  useEffect(() => { localStorage.setItem(KEY, JSON.stringify(saved)); }, [saved]);
  const saveEmployee = (data) => {
    const id = data.id || `BAL-${Date.now()}`;
    setSaved(prev => [...prev.filter(e => String(e.id) !== String(id)), { ...data, id }]);
  };
  const removeEmployee = (id) => {
    const existing = employees.find(e => String(e.id) === String(id));
    if (existing) saveEmployee({ ...existing, deleted: true });
  };
  return <Context.Provider value={{ employees, saveEmployee, removeEmployee }}>{children}</Context.Provider>;
}
export const useEmployees = () => {
  const value = useContext(Context);
  if (!value) throw new Error('Wrap the app with EmployeesProvider');
  return value;
};
