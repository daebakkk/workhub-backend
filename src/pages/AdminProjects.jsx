import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import API from '../api/api';

function AdminProjects() {
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [selected, setSelected] = useState({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError('');
      try {
        const [projectsRes, usersRes] = await Promise.all([
          API.get('admin/projects/'),
          API.get('admin/users/'),
        ]);
        setProjects(projectsRes.data || []);
        setUsers(usersRes.data || []);

        const initial = {};
        (projectsRes.data || []).forEach((project) => {
          initial[project.id] = (project.staff || []).map((u) => u.id);
        });
        setSelected(initial);
      } catch (err) {
        setError('Could not load admin data.');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  function toggleUser(projectId, userId) {
    setSelected((prev) => {
      const current = new Set(prev[projectId] || []);
      if (current.has(userId)) {
        current.delete(userId);
      } else {
        current.add(userId);
      }
      return { ...prev, [projectId]: Array.from(current) };
    });
  }

  async function saveAssignments(projectId) {
    setSavingId(projectId);
    setError('');
    try {
      await API.post(`admin/projects/${projectId}/assign/`, {
        user_ids: selected[projectId] || [],
      });
    } catch (err) {
      setError('Failed to save assignments.');
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="dashPage">
      <header className="topBar">
        <h1 className="dashTitle">Project Assignments</h1>
        <Navbar />
      </header>
      <div className="dashLayout">
        <aside className="dashSidebar">
          <p className="sidebarTitle">Workspace</p>
          <p className="sidebarSubtitle">WorkHub</p>
          <nav className="sidebarNav">
            <Link to="/dashboard" className="sidebarLink">
              Overview
            </Link>
            <Link to="/work-logs" className="sidebarLink">
              Work Logs
            </Link>
            <Link to="/projects" className="sidebarLink">
              Projects
            </Link>
            <Link to="/reports" className="sidebarLink">
              Reports
            </Link>
            <Link to="/admin/approvals" className="sidebarLink">
              Approvals
            </Link>
            <Link to="/admin/projects" className="sidebarLink isActive">
              Assign Projects
            </Link>
          </nav>
          <div className="sidebarNote">
            <p className="sidebarNoteTitle">Staff users</p>
            <p className="sidebarNoteValue">{users.length}</p>
          </div>
        </aside>

        <main className="dashMain dashContent">
          <p className="dashSubtitle">Assign staff members to projects</p>

          {loading && <p className="inlineStatus">Loading…</p>}
          {error && <p className="inlineError">{error}</p>}

          {!loading && !error && projects.length === 0 && (
            <div className="emptyState">
              <p className="emptyTitle">No projects available</p>
              <p className="emptySubtitle">Create a project first, then assign staff.</p>
            </div>
          )}

          {!loading && !error && projects.length > 0 && (
            <div className="projectBoard">
              {projects.map((project) => (
                <div className="projectTile" key={project.id}>
                  <div className="projectTileHeader">
                    <div>
                      <p className="projectTileName">{project.name}</p>
                      <p className="projectTileMeta">
                        {project.description || 'No description yet'}
                      </p>
                    </div>
                  </div>
                  <div className="assignList">
                    {users.map((user) => {
                      const checked = (selected[project.id] || []).includes(user.id);
                      return (
                        <label className="assignItem" key={`${project.id}-${user.id}`}>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleUser(project.id, user.id)}
                          />
                          <span>
                            {user.first_name || user.username} {user.last_name || ''}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                  <button
                    className="btn btnPrimary"
                    type="button"
                    onClick={() => saveAssignments(project.id)}
                    disabled={savingId === project.id}
                  >
                    {savingId === project.id ? 'Saving...' : 'Save Assignments'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default AdminProjects;
