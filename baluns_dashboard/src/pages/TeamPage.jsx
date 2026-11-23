import { useMemo, useState } from 'react';
import { Plus, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { useEmployees } from '../context/EmployeesContext.jsx';
import { useProjects } from '../context/ProjectsContext.jsx';
import { useBoards } from '../context/BoardsContext.jsx';
import Dropdown from '../components/common/Dropdown.jsx';
import EmployeeTable from '../components/team/EmployeeTable.jsx';
import EmployeeDetailModal from '../components/team/EmployeeDetailModal.jsx';
import EmployeeFormModal from '../components/team/EmployeeFormModal.jsx';
import './TeamPage.css';

const PAGE_SIZE = 8;

export default function TeamPage() {
  const { employees, saveEmployee, removeEmployee } = useEmployees();
  const { projects = [] } = useProjects();
  const { boards = [] } = useBoards();

  const [query, setQuery] = useState('');
  const [team, setTeam] = useState('');
  const [role, setRole] = useState('');
  const [project, setProject] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(undefined);
  const [deleting, setDeleting] = useState(null);

  const opts = (title, values) => [
    { id: '', title },
    ...values.map((v) => ({ id: String(v), title: String(v) })),
  ];

  const teamOptions = opts(
    'All Departments',
    [...new Set(employees.map((e) => e.team).filter(Boolean))].sort()
  );

  const roleOptions = opts(
    'All Roles',
    [...new Set(employees.map((e) => e.role).filter(Boolean))].sort()
  );

  const projectOptions = [
    { id: '', title: 'All Projects' },
    ...projects.map((p) => ({ id: String(p.id), title: p.name })),
  ];

  const filtered = useMemo(() => {
    const selectedProject = projects.find(
      (p) => String(p.id) === String(project)
    );

    // Collect tasks from all boards
    const allTasks = boards.flatMap((board) =>
      (board.tasks || []).map((task) => ({
        ...task,
        boardId: board.id,
      }))
    );

    return employees.filter((employee) => {
      // SEARCH
      const searchText = [
        employee.name,
        employee.empId || employee.id,
        employee.email,
        employee.role,
        employee.team,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      const matchesSearch = searchText.includes(query.trim().toLowerCase());

      // DEPARTMENT
      const matchesTeam = !team || employee.team === team;

      // ROLE
      const matchesRole = !role || employee.role === role;

      // PROJECT
      let matchesProject = !project;

      if (project && selectedProject) {
        // Employee directly belongs to project
        const directMatch =
          String(employee.projectId || '') === String(selectedProject.id) ||
          employee.project === selectedProject.name;

        // Employee assigned to any task in project
        const taskMatch = allTasks.some((task) => {
          const sameProject =
            String(task.projectId || '') === String(selectedProject.id) ||
            (!task.projectId && task.project === selectedProject.name);

          const assignee = task.assignee;

          const sameEmployee =
            typeof assignee === 'string'
              ? assignee.trim().toLowerCase() ===
                employee.name.trim().toLowerCase()
              : assignee &&
                (String(assignee.id || assignee.empId) ===
                  String(employee.id || employee.empId) ||
                  assignee.name?.trim().toLowerCase() ===
                    employee.name.trim().toLowerCase());

          return sameProject && sameEmployee;
        });

        matchesProject = directMatch || taskMatch;
      }

      return matchesSearch && matchesTeam && matchesRole && matchesProject;
    });
  }, [employees, projects, boards, query, team, role, project]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pages);
  const visible = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const change = (setter) => (value) => {
    setter(value);
    setPage(1);
  };

  const edit = (e) => {
    setSelected(null);
    setEditing(e);
  };

  return (
    <div className="team-page">
      {/* PAGE HEADER */}
      <div className="team-heading">
        <div>
          <h1>Team</h1>
          <p>
            View all employees, roles, departments, and project assignments.
          </p>
        </div>

        <button
          className="team-btn primary"
          onClick={() => setEditing(null)}
        >
          <Plus size={17} />
          Add Employee
        </button>
      </div>

      {/* MAIN WHITE CARD */}
      <div className="team-content-card">
        {/* FILTERS - STAY FIXED */}
        <div className="team-toolbar">
          <div className="team-search">
            <Search size={17} />
            <input
              placeholder="Search employees"
              value={query}
              onChange={(ev) => change(setQuery)(ev.target.value)}
            />
          </div>

          <Dropdown
            value={team}
            options={teamOptions}
            onChange={change(setTeam)}
          />

          <Dropdown
            value={role}
            options={roleOptions}
            onChange={change(setRole)}
          />

          <Dropdown
            value={project}
            options={projectOptions}
            onChange={change(setProject)}
          />
        </div>

        {/* ONLY TABLE SCROLLS */}
        <div className="team-table-scroll">
          <EmployeeTable
            employees={visible}
            projects={projects}
            onOpen={setSelected}
            onEdit={edit}
            onDelete={setDeleting}
          />
        </div>

        {/* PAGINATION - STAYS FIXED */}
        <div className="team-footer">
          <span>
            Showing{' '}
            {filtered.length ? (currentPage - 1) * PAGE_SIZE + 1 : 0}–
            {Math.min(currentPage * PAGE_SIZE, filtered.length)} of{' '}
            {filtered.length} employees
          </span>

          <div className="team-pagination">
            <button
              disabled={currentPage === 1}
              onClick={() => setPage(currentPage - 1)}
            >
              <ChevronLeft size={16} />
            </button>

            {Array.from({ length: pages }, (_, i) => (
              <button
                key={i}
                className={currentPage === i + 1 ? 'active' : ''}
                onClick={() => setPage(i + 1)}
              >
                {i + 1}
              </button>
            ))}

            <button
              disabled={currentPage === pages}
              onClick={() => setPage(currentPage + 1)}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* EMPLOYEE DETAILS */}
      {selected && (
        <EmployeeDetailModal
          employee={
            employees.find((e) => e.id === selected.id) || selected
          }
          projects={projects}
          boards={boards}
          onClose={() => setSelected(null)}
          onEdit={edit}
        />
      )}

      {/* ADD / EDIT EMPLOYEE */}
      {editing !== undefined && (
        <EmployeeFormModal
          employee={editing}
          boards={boards}
          projects={projects}
          onClose={() => setEditing(undefined)}
          onSave={(data) => {
            saveEmployee(data);
            setEditing(undefined);
          }}
        />
      )}

      {/* DELETE CONFIRMATION */}
      {deleting && (
        <div
          className="team-overlay"
          onMouseDown={() => setDeleting(null)}
        >
          <div
            className="team-dialog team-confirm"
            onMouseDown={(ev) => ev.stopPropagation()}
            role="alertdialog"
            aria-modal="true"
          >
            <h2>Delete employee?</h2>

            <p>
              Remove <strong>{deleting.name}</strong> from the employee
              directory? Existing tasks will remain unchanged.
            </p>

            <div className="team-dialog-actions">
              <button
                className="team-btn secondary"
                onClick={() => setDeleting(null)}
              >
                Cancel
              </button>

              <button
                className="team-btn danger"
                onClick={() => {
                  removeEmployee(deleting.id);
                  setDeleting(null);
                }}
              >
                Delete employee
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}