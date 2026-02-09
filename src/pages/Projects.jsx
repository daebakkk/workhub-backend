import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import API from '../api/api';

function Projects() {
  const storedUser = localStorage.getItem('user');
  const user = storedUser ? JSON.parse(storedUser) : null;
  const isAdmin = user?.role === 'admin';
  const userId = user?.id;

  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [selected, setSelected] = useState({});
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [createAssignees, setCreateAssignees] = useState([]);
  const [createTaskInput, setCreateTaskInput] = useState('');
  const [createTasks, setCreateTasks] = useState([]);
  const [tasksByProject, setTasksByProject] = useState({});
  const [taskTitleByProject, setTaskTitleByProject] = useState({});
  const [tasksLoading, setTasksLoading] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

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

  function toggleCreateAssignee(id) {
    setCreateAssignees((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      }
      return [...prev, id];
    });
  }

  function addCreateTask() {
    const trimmed = createTaskInput.trim();
    if (!trimmed) return;
    if (createTasks.includes(trimmed)) {
      setCreateTaskInput('');
      return;
    }
    setCreateTasks((prev) => [...prev, trimmed]);
    setCreateTaskInput('');
  }

  function removeCreateTask(task) {
    setCreateTasks((prev) => prev.filter((item) => item !== task));
  }

  async function createProject(e, assignSelfOverride = null) {
    e.preventDefault();
    if (!newName.trim()) {
      setError('Project name is required.');
      return;
    }
    setCreating(true);
    setError('');
    try {
      const shouldAssignSelf = assignSelfOverride === true;
      const res = await API.post('admin/projects/create/', {
        name: newName.trim(),
        description: newDescription.trim(),
        assign_self: isAdmin ? shouldAssignSelf : true,
        user_ids: isAdmin ? createAssignees : [],
        tasks: createTasks,
      });
      const created = res.data;
      setProjects((prev) => [created, ...prev]);
      const staffIds = (created.staff || []).map((staff) => staff.id);
      const fallbackIds = isAdmin
        ? Array.from(new Set([
            ...(shouldAssignSelf && userId ? [userId] : []),
            ...createAssignees,
          ]))
        : [];
      setSelected((prev) => ({
        ...prev,
        [created.id]: staffIds.length ? staffIds : fallbackIds,
      }));
      setNewName('');
      setNewDescription('');
      setCreateAssignees([]);
      setCreateTasks([]);
      setCreateTaskInput('');
    } catch (err) {
      setError('Failed to create project.');
    } finally {
      setCreating(false);
    }
  }

  async function fetchTasks(projectId) {
    setTasksLoading((prev) => ({ ...prev, [projectId]: true }));
    try {
      const res = await API.get(`projects/${projectId}/tasks/`);
      setTasksByProject((prev) => ({ ...prev, [projectId]: res.data || [] }));
    } catch (err) {
      setError('Failed to load tasks.');
    } finally {
      setTasksLoading((prev) => ({ ...prev, [projectId]: false }));
    }
  }

  async function createTask(projectId) {
    const title = (taskTitleByProject[projectId] || '').trim();
    if (!title) return;
    try {
      const res = await API.post(`projects/${projectId}/tasks/`, { title });
      setTasksByProject((prev) => ({
        ...prev,
        [projectId]: [res.data, ...(prev[projectId] || [])],
      }));
      setTaskTitleByProject((prev) => ({ ...prev, [projectId]: '' }));
    } catch (err) {
      setError('Failed to create task.');
    }
  }

  async function toggleTask(taskId, projectId, isCompleted) {
    try {
      const res = await API.patch(`tasks/${taskId}/`, { is_completed: isCompleted });
      setTasksByProject((prev) => ({
        ...prev,
        [projectId]: (prev[projectId] || []).map((task) =>
          task.id === taskId ? res.data : task
        ),
      }));
    } catch (err) {
      setError('Failed to update task.');
    }
  }

  function getStatus(percent, totalTasks) {
    if (totalTasks === 0) return 'No tasks';
    if (percent === 100) return 'Completed';
    if (percent >= 75) return 'Review';
    if (percent >= 30) return 'In progress';
    return 'Not started';
  }

  const staffUsers = users.filter((item) => item.role === 'staff');
  const specializationGroups = [
    { key: 'frontend', label: 'Frontend' },
    { key: 'backend', label: 'Backend' },
    { key: 'full_stack', label: 'Full Stack' },
    { key: 'data_science', label: 'Data Science' },
    { key: 'analyst', label: 'Analyst' },
  ];

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
            {isAdmin && (
              <Link to="/admin/approvals" className="sidebarLink">
                Approvals
              </Link>
            )}
            <Link to="/settings" className="sidebarLink">
              Settings
            </Link>
          </nav>
          <div className="sidebarNote">
            <p className="sidebarNoteTitle">Next review</p>
            <p className="sidebarNoteValue">Fri, 10:00 AM</p>
          </div>
        </aside>

        <main className="dashMain dashContent">
          <>
            <p className="dashSubtitle">
              {isAdmin ? 'Create projects and manage assignments' : 'Create projects and track tasks'}
            </p>
            {error && <p className="inlineError">{error}</p>}
                <div className="projectCreateBar">
                  <button
                    className="btn btnPrimary"
                    type="button"
                    onClick={() => setShowCreate((prev) => !prev)}
                  >
                {showCreate ? 'Close' : 'Create a project'}
                  </button>
                </div>
            {showCreate && (
              <form className="assignCreate" onSubmit={(e) => createProject(e)}>
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
                <div className="taskCreate">
                  <input
                    type="text"
                    placeholder="Add task (optional)"
                    value={createTaskInput}
                    onChange={(e) => setCreateTaskInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addCreateTask();
                      }
                    }}
                  />
                  <button className="btn btnSecondary" type="button" onClick={addCreateTask}>
                    Add task
                  </button>
                </div>
                {createTasks.length > 0 && (
                  <div className="taskList">
                    {createTasks.map((task) => (
                      <div className="taskItem" key={task}>
                        <span>{task}</span>
                        <button
                          className="btn btnSecondary"
                          type="button"
                          onClick={() => removeCreateTask(task)}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {isAdmin && (
                  <div className="assignList">
                    {specializationGroups.map((group) => {
                      const members = staffUsers.filter(
                        (staff) => staff.specialization === group.key
                      );
                      if (members.length === 0) return null;
                      return (
                        <div className="assignGroup" key={group.key}>
                          <p className="assignGroupTitle">{group.label}</p>
                          {members.map((staff) => {
                            const checked = createAssignees.includes(staff.id);
                            return (
                              <label className="assignItem" key={`create-${staff.id}`}>
                                <span>
                                  {staff.first_name || staff.username} {staff.last_name || ''}
                                </span>
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => toggleCreateAssignee(staff.id)}
                                />
                              </label>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                )}
                <div className="settingsRow">
                  <span>Create project</span>
                  <div className="reportActions">
                    <button className="btn btnPrimary" type="submit" disabled={creating}>
                      {creating ? 'Creating...' : 'Create'}
                    </button>
                    {isAdmin && (
                      <button
                        className="btn btnSecondary"
                        type="button"
                        disabled={creating}
                        onClick={(e) => createProject(e, true)}
                      >
                        Create for myself
                      </button>
                    )}
                    <button
                      className="btn btnSecondary"
                      type="button"
                      onClick={() => setShowCreate(false)}
                      disabled={creating}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </form>
            )}
          </>
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
              const tasks = tasksByProject[project.id] || [];
              const canEditTasks = !isAdmin || (selected[project.id] || []).includes(userId);
              return (
                <div className="projectTile" key={project.id}>
                  <div className="projectTileHeader">
                    <div>
                      <p className="projectTileName">{project.name}</p>
                      <p className="projectTileMeta">
                        ({project.description || 'No description yet'})
                      </p>
                    </div>
                    <span className={`projectBadge ${badgeClass}`}>
                      {status}
                    </span>
                  </div>
                  <div className="taskSection">
                    <div className="taskHeader">
                      <p className="taskTitle">Tasks</p>
                      <button
                        className="btn btnSecondary"
                        type="button"
                        onClick={() => fetchTasks(project.id)}
                        disabled={tasksLoading[project.id]}
                      >
                        {tasksLoading[project.id] ? 'Loading...' : 'Refresh tasks'}
                      </button>
                    </div>
                  {!isAdmin && canEditTasks && (
                    <div className="taskCreate">
                      <input
                        type="text"
                        placeholder="New task"
                        value={taskTitleByProject[project.id] || ''}
                        onChange={(e) =>
                          setTaskTitleByProject((prev) => ({
                            ...prev,
                            [project.id]: e.target.value,
                          }))
                        }
                      />
                      <button
                        className="btn btnPrimary"
                        type="button"
                        onClick={() => createTask(project.id)}
                      >
                        Add Task
                      </button>
                    </div>
                  )}
                    {tasks.length === 0 && totalTasks === 0 && (
                      <p className="taskEmpty">No tasks yet.</p>
                    )}
                    {tasks.length > 0 && (
                      <div className="taskList">
                        {tasks.map((task) => (
                          <label className="taskItem" key={task.id}>
                            <input
                              type="checkbox"
                              checked={task.is_completed}
                              disabled={!canEditTasks}
                              onChange={(e) =>
                                toggleTask(task.id, project.id, e.target.checked)
                              }
                            />
                            <span className={task.is_completed ? 'taskDone' : ''}>
                              {task.title}
                            </span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
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
