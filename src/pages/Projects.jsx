import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import API from '../api/api';

function Projects() {
  const storedUser = localStorage.getItem('user');
  const user = storedUser ? JSON.parse(storedUser) : null;
  const isAdmin = user?.role === 'admin';

  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [selected, setSelected] = useState({});
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savingId, setSavingId] = useState(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    async function fetchProjects() {
      try {
        if (isAdmin) {
          const [projectsRes, usersRes] = await Promise.all([
            API.get('admin/projects/'),
            API.get('admin/users/'),
          ]);
          const list = projectsRes.data || [];
          setProjects(list);
          setUsers(usersRes.data || []);

          const initial = {};
          list.forEach((project) => {
            initial[project.id] = (project.staff || []).map((u) => u.id);
          });
          setSelected(initial);
        } else {
          const res = await API.get('projects/my/');
          setProjects(res.data || []);
        }
      } catch (err) {
        setError('Could not load projects. Please try again.');
      } finally {
        setLoading(false);
      }
    }

    fetchProjects();
  }, [isAdmin]);

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

  async function createProject(e) {
    e.preventDefault();
    if (!newName.trim()) {
      setError('Project name is required.');
      return;
    }
    setCreating(true);
    setError('');
    try {
      const res = await API.post('admin/projects/create/', {
        name: newName.trim(),
        description: newDescription.trim(),
      });
      const created = res.data;
      setProjects((prev) => [created, ...prev]);
      setSelected((prev) => ({ ...prev, [created.id]: [] }));
      setNewName('');
      setNewDescription('');
    } catch (err) {
      setError('Failed to create project.');
    } finally {
      setCreating(false);
    }
  }

  function getStatus(percent, totalTasks) {
    if (totalTasks === 0) return 'No tasks';
    if (percent === 100) return 'Completed';
    if (percent >= 75) return 'Review';
    if (percent >= 30) return 'In progress';
    return 'Blocked';
  }

  return (
    <div className="dashPage">
      <header className="topBar">
        <div className="dashHeaderText">
          <h1 className="dashTitle">Projects</h1>
          <p className="dashWelcome">Ongoing delivery and milestones</p>
        </div>
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
            <Link to="/projects" className="sidebarLink isActive">
              Projects
            </Link>
            <Link to="/reports" className="sidebarLink">
              Reports
            </Link>
            <button type="button" className="sidebarLink" disabled>
              Settings
            </button>
          </nav>
          <div className="sidebarNote">
            <p className="sidebarNoteTitle">Next review</p>
            <p className="sidebarNoteValue">Fri, 10:00 AM</p>
          </div>
        </aside>

        <main className="dashMain dashContent">
          {isAdmin && (
            <>
              <p className="dashSubtitle">Create and assign projects</p>
              {error && <p className="inlineError">{error}</p>}
              <form className="assignCreate" onSubmit={createProject}>
                <div className="assignCreateFields">
                  <input
                    type="text"
                    placeholder="Project name"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    required
                  />
                  <input
                    type="text"
                    placeholder="Short description"
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                  />
                </div>
                <button className="btn btnPrimary" type="submit" disabled={creating}>
                  {creating ? 'Creating...' : 'Create Project'}
                </button>
              </form>
            </>
          )}
          <section className="projectBoard">
            {loading && <p className="inlineStatus">Loading projects...</p>}
            {error && <p className="inlineError">{error}</p>}
            {!loading && !error && projects.length === 0 && (
              <div className="emptyState">
                <p className="emptyTitle">No projects yet</p>
                <p className="emptySubtitle">
                  Projects assigned to you will appear here.
                </p>
              </div>
            )}
            {!loading && !error && projects.map((project) => {
              const percent = project.completion_percent || 0;
              const totalTasks = project.total_tasks || 0;
              const status = getStatus(percent, totalTasks);
              const badgeClass = status.toLowerCase().replace(' ', '-');
              return (
                <div className="projectTile" key={project.id}>
                  <div className="projectTileHeader">
                    <div>
                      <p className="projectTileName">{project.name}</p>
                      <p className="projectTileMeta">
                        {project.description || 'No description yet'}
                      </p>
                    </div>
                    <span className={`projectBadge ${badgeClass}`}>
                      {status}
                    </span>
                  </div>
                  {isAdmin && (
                    <div className="assignList">
                      {users.map((staff) => {
                        const checked = (selected[project.id] || []).includes(staff.id);
                        return (
                          <label className="assignItem" key={`${project.id}-${staff.id}`}>
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleUser(project.id, staff.id)}
                            />
                            <span>
                              {staff.first_name || staff.username} {staff.last_name || ''}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                  {isAdmin && (
                    <button
                      className="btn btnPrimary"
                      type="button"
                      onClick={() => saveAssignments(project.id)}
                      disabled={savingId === project.id}
                    >
                      {savingId === project.id ? 'Saving...' : 'Save Assignments'}
                    </button>
                  )}
                  <div className="projectProgress">
                    <div
                      className="projectProgressFill"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <p className="projectProgressText">
                    {percent}% complete - {project.completed_tasks || 0}/{totalTasks} tasks
                  </p>
                </div>
              );
            })}
          </section>
        </main>
      </div>
    </div>
  );
}

export default Projects;
