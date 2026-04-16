import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import API from '../api/api';

function Projects() {
  const storedUser = localStorage.getItem('user');
  const user = storedUser ? JSON.parse(storedUser) : null;
  const isAdmin = user?.role === 'admin';
  const userId = user?.id;
  const userUsername = user?.username;

  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [selected, setSelected] = useState({});
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [createAssignees, setCreateAssignees] = useState([]);
  const [createTaskInput, setCreateTaskInput] = useState('');
  const [createTaskRequiredHours, setCreateTaskRequiredHours] = useState('');
  const [createTasks, setCreateTasks] = useState([]);
  const [tasksByProject, setTasksByProject] = useState({});
  const [taskTitleByProject, setTaskTitleByProject] = useState({});
  const [taskRequiredHoursByProject, setTaskRequiredHoursByProject] = useState({});
  const [taskAssigneeByProject, setTaskAssigneeByProject] = useState({});
  const [tasksLoading, setTasksLoading] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const [creatingMode, setCreatingMode] = useState('default');
  const [addingCreateTask, setAddingCreateTask] = useState(false);
  const [addingTaskByProject, setAddingTaskByProject] = useState({});
  const [showCreate, setShowCreate] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState(isAdmin ? 'my-projects' : 'all');

  useEffect(() => {
    async function fetchProjects() {
      try {
        if (isAdmin) {
          const [projectsRes, usersRes] = await Promise.all([
            API.get('admin/projects/'),
            API.get('admin/users/'),
          ]);
          const list = projectsRes.data || [];
          const sorted = [...list].sort((a, b) => {
            const aHasMe = (a.staff || []).some((member) => member.id === userId);
            const bHasMe = (b.staff || []).some((member) => member.id === userId);
            if (aHasMe === bHasMe) return 0;
            return aHasMe ? -1 : 1;
          });
          setProjects(sorted);
          setUsers(usersRes.data || []);

          const initial = {};
          list.forEach((project) => {
            initial[project.id] = (project.staff || []).map((u) => u.id);
          });
          setSelected(initial);
        } else {
          const [projectsRes, usersRes] = await Promise.all([
            API.get('projects/my/'),
            API.get('users/staff/'),
          ]);
          setProjects(projectsRes.data || []);
          setUsers(usersRes.data || []);
        }
      } catch (err) {
        setError('Could not load projects. Please try again.');
      } finally {
        setLoading(false);
      }
    }

    fetchProjects();
  }, [isAdmin]);

  useEffect(() => {
    if (!projects.length) return undefined;
    function refreshAllTasks() {
      projects.forEach((project) => {
        if (!tasksLoading[project.id]) {
          fetchTasks(project.id);
        }
      });
    }
    refreshAllTasks();
    const interval = setInterval(refreshAllTasks, 30000);
    return () => clearInterval(interval);
  }, [projects]);

  function toggleCreateAssignee(id) {
    setCreateAssignees((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      }
      return [...prev, id];
    });
  }

  async function addCreateTask() {
    const trimmed = createTaskInput.trim();
    if (!trimmed) return;
    setAddingCreateTask(true);
    await Promise.resolve();
    try {
      if (createTasks.some((task) => task.title === trimmed)) {
        setCreateTaskInput('');
        setCreateTaskRequiredHours('');
        return;
      }
      setCreateTasks((prev) => [...prev, { title: trimmed, assigned_to: '', required_hours: createTaskRequiredHours ? parseFloat(createTaskRequiredHours) : 0 }]);
      setCreateTaskInput('');
      setCreateTaskRequiredHours('');
    } finally {
      setAddingCreateTask(false);
    }
  }

  function removeCreateTask(taskTitle) {
    setCreateTasks((prev) => prev.filter((item) => item.title !== taskTitle));
  }

  async function createProject(e, assignSelfOverride = null) {
    e.preventDefault();
    if (!newName.trim()) {
      setError('Project name is required.');
      return;
    }
    const shouldAssignSelf = assignSelfOverride === true;
    const memberIds = isAdmin
      ? Array.from(new Set([...(shouldAssignSelf && userId ? [userId] : []), ...createAssignees]))
      : Array.from(new Set([userId, ...createAssignees].filter(Boolean)));
    const needsAssignment = memberIds.length > 1;
    if (needsAssignment && createTasks.some((task) => !task.assigned_to)) {
      setError('Please assign each task to a team member.');
      return;
    }
    if (needsAssignment && createTasks.some((task) => !memberIds.includes(task.assigned_to))) {
      setError('Each task must be assigned to a project member.');
      return;
    }
    setCreating(true);
    setCreatingMode(assignSelfOverride === true ? 'self' : 'default');
    setError('');
    try {
      const res = await API.post('admin/projects/create/', {
        name: newName.trim(),
        description: newDescription.trim(),
        assign_self: isAdmin ? shouldAssignSelf : true,
        user_ids: createAssignees,
        tasks: createTasks.map((task) => ({
          title: task.title,
          assigned_to: task.assigned_to || null,
          required_hours: task.required_hours || 0,
        })),
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
      setShowCreate(false);
    } catch (err) {
      setError('Failed to create project.');
    } finally {
      setCreating(false);
      setCreatingMode('default');
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
    const project = projects.find((item) => item.id === projectId);
    const members = project?.staff || [];
    const assignee = taskAssigneeByProject[projectId] || (members.length === 1 ? members[0].id : '');
    const requiredHours = taskRequiredHoursByProject[projectId] || 0;
    if (!title) return;
    if (!assignee) {
      setError('Please select a task assignee.');
      return;
    }
    setAddingTaskByProject((prev) => ({ ...prev, [projectId]: true }));
    try {
      const res = await API.post(`projects/${projectId}/tasks/`, { title, assigned_to: assignee, required_hours: requiredHours });
      setTasksByProject((prev) => ({
        ...prev,
        [projectId]: [res.data, ...(prev[projectId] || [])],
      }));
      setTaskTitleByProject((prev) => ({ ...prev, [projectId]: '' }));
      setTaskRequiredHoursByProject((prev) => ({ ...prev, [projectId]: '' }));
      setTaskAssigneeByProject((prev) => ({ ...prev, [projectId]: '' }));
    } catch (err) {
      setError('Failed to create task.');
    } finally {
      setAddingTaskByProject((prev) => ({ ...prev, [projectId]: false }));
    }
  }

  async function updateTaskProgress(taskId, projectId, newProgress) {
    try {
      const res = await API.patch(`tasks/${taskId}/`, { progress: newProgress });
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

  async function deleteTask(taskId, projectId) {
    try {
      await API.delete(`tasks/${taskId}/delete/`);
      setTasksByProject((prev) => ({
        ...prev,
        [projectId]: (prev[projectId] || []).filter((task) => task.id !== taskId),
      }));
    } catch (err) {
      setError('Failed to delete task.');
    }
  }

  async function deleteProject(projectId) {
    try {
      await API.delete(`projects/${projectId}/delete/`);
      setProjects((prev) => prev.filter((project) => project.id !== projectId));
      setTasksByProject((prev) => {
        const next = { ...prev };
        delete next[projectId];
        return next;
      });
    } catch (err) {
      setError('Failed to delete project.');
    }
  }

  function getStatus(percent, totalTasks) {
    if (totalTasks === 0) return 'No tasks';
    if (percent === 100) return 'Completed';
    if (percent >= 75) return 'Review';
    if (percent >= 30) return 'In progress';
    return 'Starting';
  }

  function formatNames(list) {
    if (!list.length) return '';
    if (list.length === 1) return list[0];
    if (list.length === 2) return `${list[0]} and ${list[1]}`;
    return `${list.slice(0, -1).join(', ')} and ${list[list.length - 1]}`;
  }

  function memberDisplayName(member) {
    if (!member) return 'Staff';
    if ((member.id && member.id === userId) || (member.username && member.username === userUsername)) {
      return 'me';
    }
    const fullName = `${member.first_name || ''} ${member.last_name || ''}`.trim();
    return fullName || member.username || 'Staff';
  }

  const staffUsers = users.filter((item) => item.role === 'staff');
  const staffOptions = staffUsers.filter((item) => item.id !== userId);
  const createMemberIds = isAdmin
    ? createAssignees
    : Array.from(new Set([userId, ...createAssignees].filter(Boolean)));
  const createMembers = createMemberIds
    .map((id) => users.find((member) => member.id === id) || (userId === id ? user : null))
    .filter(Boolean);
  const needsCreateAssignment = isAdmin ? createAssignees.length > 0 : createMembers.length > 1;
  const specializationGroups = [
    { key: 'frontend', label: 'Frontend Developer' },
    { key: 'backend', label: 'Backend Developer' },
    { key: 'full_stack', label: 'Full Stack Developer' },
    { key: 'mobile_ios', label: 'Mobile iOS Developer' },
    { key: 'mobile_android', label: 'Mobile Android Developer' },
    { key: 'mobile_cross', label: 'Cross-platform Mobile Developer' },
    { key: 'web_accessibility', label: 'Web Accessibility' },
    { key: 'ui_ux', label: 'UI/UX Designer' },
    { key: 'product_design', label: 'Product Designer' },
    { key: 'qa_manual', label: 'Manual QA' },
    { key: 'qa_automation', label: 'QA Automation' },
    { key: 'test_engineer', label: 'Test Engineer' },
    { key: 'devops', label: 'DevOps Engineer' },
    { key: 'sre', label: 'Site Reliability Engineer' },
    { key: 'cloud_engineer', label: 'Cloud Engineer' },
    { key: 'platform_engineer', label: 'Platform Engineer' },
    { key: 'systems_engineer', label: 'Systems Engineer' },
    { key: 'network_engineer', label: 'Network Engineer' },
    { key: 'security_engineer', label: 'Security Engineer' },
    { key: 'appsec', label: 'Application Security' },
    { key: 'netsec', label: 'Network Security' },
    { key: 'data_analyst', label: 'Data Analyst' },
    { key: 'data_engineer', label: 'Data Engineer' },
    { key: 'data_scientist', label: 'Data Scientist' },
    { key: 'ml_engineer', label: 'ML Engineer' },
    { key: 'ai_engineer', label: 'AI Engineer' },
    { key: 'mlops', label: 'MLOps Engineer' },
    { key: 'database_admin', label: 'Database Administrator' },
    { key: 'api_engineer', label: 'API Engineer' },
    { key: 'software_architect', label: 'Software Architect' },
    { key: 'embedded', label: 'Embedded Systems' },
    { key: 'iot', label: 'IoT Engineer' },
    { key: 'robotics', label: 'Robotics Engineer' },
    { key: 'game_dev', label: 'Game Developer' },
    { key: 'ar_vr', label: 'AR/VR Developer' },
    { key: 'blockchain', label: 'Blockchain Developer' },
    { key: 'devrel', label: 'Developer Advocate' },
    { key: 'tech_writer', label: 'Technical Writer' },
    { key: 'support_engineer', label: 'Support Engineer' },
    { key: 'build_release', label: 'Build/Release Engineer' },
    { key: 'infra_ops', label: 'Infrastructure Operations' },
    { key: 'sys_admin', label: 'System Administrator' },
    { key: 'it_support', label: 'IT Support' },
    { key: 'business_analyst', label: 'Business Analyst' },
    { key: 'product_manager', label: 'Product Manager' },
    { key: 'gis', label: 'GIS Specialist' },
  ];

  const tabOptions = [
    ...(isAdmin ? [{ key: 'my-projects', label: 'My projects' }] : [{ key: 'all', label: 'All' }]),
    { key: 'starting', label: 'Just starting' },
    { key: 'in-progress', label: 'In progress' },
    { key: 'completed', label: 'Completed' },
    ...(isAdmin ? [{ key: 'staff-projects', label: 'Staff projects' }] : []),
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
              <div className="projectTabs">
                {tabOptions.map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    className={`projectTab ${activeTab === tab.key ? 'isActive' : ''}`}
                    onClick={() => setActiveTab(tab.key)}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
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
                  <input
                    type="number"
                    step="0.5"
                    placeholder="Required hours (optional)"
                    value={createTaskRequiredHours}
                    onChange={(e) => setCreateTaskRequiredHours(e.target.value)}
                  />
                  <button
                    className="btn btnSecondary"
                    type="button"
                    onClick={addCreateTask}
                    disabled={addingCreateTask || !createTaskInput.trim()}
                  >
                    {addingCreateTask ? 'Adding...' : 'Add task'}
                  </button>
                </div>
                {createTasks.length > 0 && (
                  <div className="taskList">
                    {createTasks.map((task) => (
                      <div className="taskItem" key={task.title}>
                        <span>{task.title}</span>
                        {needsCreateAssignment && (
                          <select
                            className="taskAssignSelect"
                            value={task.assigned_to || ''}
                            onChange={(e) => {
                              const value = e.target.value ? Number(e.target.value) : '';
                              setCreateTasks((prev) =>
                                prev.map((item) =>
                                  item.title === task.title
                                    ? { ...item, assigned_to: value }
                                    : item
                                )
                              );
                            }}
                          >
                            <option value="">Assign to...</option>
                            {createMembers.map((member) => (
                            <option key={`create-assign-${member.id}`} value={member.id}>
                                {memberDisplayName(member)}
                              </option>
                            ))}
                          </select>
                        )}
                        <button
                          className="btn btnSecondary"
                          type="button"
                          onClick={() => removeCreateTask(task.title)}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {isAdmin && (
                  <div className="assignList">
                    <p className="assignListHint">Assign to:</p>
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
                                  {memberDisplayName(staff)}
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
                {!isAdmin && staffOptions.length > 0 && (
                  <div className="assignList">
                    {specializationGroups.map((group) => {
                      const members = staffOptions.filter(
                        (staff) => staff.specialization === group.key
                      );
                      if (members.length === 0) return null;
                      return (
                        <div className="assignGroup" key={`staff-${group.key}`}>
                          <p className="assignGroupTitle">{group.label} (with)</p>
                          {members.map((staff) => {
                            const checked = createAssignees.includes(staff.id);
                            return (
                              <label className="assignItem" key={`create-${staff.id}`}>
                                <span>
                                  {memberDisplayName(staff)}
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
                  <span />
                  <div className="reportActions">
                    <button className="btn btnPrimary" type="submit" disabled={creating}>
                      {creating && creatingMode === 'default' ? 'Creating...' : 'Create'}
                    </button>
                    {isAdmin && (
                      <button
                        className="btn btnSecondary"
                        type="button"
                        disabled={creating}
                        onClick={(e) => createProject(e, true)}
                      >
                        {creating && creatingMode === 'self' ? 'Creating...' : 'Create for myself'}
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
            <div className="projectSearch">
              <input
                type="text"
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
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
            {!loading && !error && projects
              .filter((project) => {
                const term = searchTerm.trim().toLowerCase();
                if (!term) return true;
                const name = project.name?.toLowerCase() || '';
                const desc = project.description?.toLowerCase() || '';
                return name.includes(term) || desc.includes(term);
              })
              .filter((project) => {
                if (!isAdmin && activeTab === 'all') return true;
                if (isAdmin && activeTab === 'my-projects') {
                  return (project.staff || []).some((member) => member.id === userId);
                }
                const tasks = tasksByProject[project.id] || [];
                const hasTasksLoaded = Object.prototype.hasOwnProperty.call(tasksByProject, project.id);
                const totalTasks = project.total_tasks || 0;
                const completedTasks = project.completed_tasks || 0;
                const derivedTotal = tasks.length;
                const derivedCompleted = tasks.filter((task) => task.progress === 100).length;
                const displayTotal = hasTasksLoaded ? derivedTotal : totalTasks;
                const displayCompleted = hasTasksLoaded ? derivedCompleted : completedTasks;
                const percent = displayTotal > 0
                  ? Math.round((displayCompleted / displayTotal) * 100)
                  : (project.completion_percent || 0);
                const status = getStatus(percent, displayTotal);

                if (isAdmin && activeTab !== 'staff-projects' && activeTab !== 'my-projects') {
                  return (project.staff || []).some((member) => member.id === userId) &&
                    (activeTab === 'completed' ? status === 'Completed' :
                    activeTab === 'starting' ? status === 'Starting' :
                    activeTab === 'in-progress' ? (status === 'In progress' || status === 'Review') :
                    true);
                }
                if (activeTab === 'completed') return status === 'Completed';
                if (activeTab === 'starting') return status === 'Starting';
                if (activeTab === 'in-progress') return status === 'In progress' || status === 'Review';
                if (activeTab === 'staff-projects') {
                  return !(project.staff || []).some((member) => member.id === userId);
                }
                return true;
              })
              .map((project) => {
                const tasks = tasksByProject[project.id] || [];
                const hasTasksLoaded = Object.prototype.hasOwnProperty.call(tasksByProject, project.id);
                const totalTasks = project.total_tasks || 0;
                const completedTasks = project.completed_tasks || 0;
                const derivedTotal = tasks.length;
                const derivedCompleted = tasks.filter((task) => task.progress === 100).length;
                const displayTotal = hasTasksLoaded ? derivedTotal : totalTasks;
                const displayCompleted = hasTasksLoaded ? derivedCompleted : completedTasks;
                const percent = displayTotal > 0 ? Math.round((displayCompleted / displayTotal) * 100) : (project.completion_percent || 0);
                const status = getStatus(percent, displayTotal);
                const badgeClass = status.toLowerCase().replace(' ', '-');
                const canEditTasks = !isAdmin || (selected[project.id] || []).includes(userId);
              return (
                <div className="projectTile" key={project.id}>
                  <div className="projectTileHeader">
                    <div>
                      <p className="projectTileName">{project.name}</p>
                      <p className="projectTileMeta">
                        ({project.description || 'No description yet'})
                      </p>
                      {project.staff && project.staff.length > 0 && (
                        <p className="projectTileMeta">
                          {isAdmin
                            ? formatNames(
                                project.staff.map((member) =>
                                  member.id === userId
                                    ? 'me'
                                    : member.first_name || member.username || 'Staff'
                                )
                              )
                            : (() => {
                                const others = project.staff
                                  .filter((member) => member.id !== userId)
                                  .map((member) => member.first_name || member.username || 'Staff');
                                return others.length > 0 ? `with ${formatNames(others)}` : '';
                              })()}
                        </p>
                      )}
                    </div>
                    <span className={`projectBadge ${badgeClass}`}>
                      {status}
                    </span>
                  </div>
                  {status !== 'Completed' && project.staff && project.staff.some((member) => member.id === userId) && (
                    <div className="projectActions">
                      <button
                        className="projectDelete"
                        type="button"
                        onClick={() => deleteProject(project.id)}
                      >
                        Delete project
                      </button>
                    </div>
                  )}
                  <div className="taskSection">
                    <div className="taskHeader">
                      <p className="taskTitle">Tasks</p>
                    </div>
                  {canEditTasks && (
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
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            createTask(project.id);
                          }
                        }}
                      />
                      <input
                        type="number"
                        step="0.5"
                        placeholder="Required hours"
                        value={taskRequiredHoursByProject[project.id] || ''}
                        onChange={(e) =>
                          setTaskRequiredHoursByProject((prev) => ({
                            ...prev,
                            [project.id]: e.target.value,
                          }))
                        }
                      />
                      {(project.staff || []).length > 1 && (
                        <select
                          value={taskAssigneeByProject[project.id] || ''}
                          onChange={(e) =>
                            setTaskAssigneeByProject((prev) => ({
                              ...prev,
                              [project.id]: e.target.value,
                            }))
                          }
                        >
                          <option value="">Assign to</option>
                          {(project.staff || []).map((member) => (
                            <option key={`assignee-${project.id}-${member.id}`} value={member.id}>
                              {memberDisplayName(member)}
                            </option>
                          ))}
                        </select>
                      )}
                      <button
                        className="btn btnPrimary"
                        type="button"
                        onClick={() => createTask(project.id)}
                        disabled={!!addingTaskByProject[project.id] || !(taskTitleByProject[project.id] || '').trim()}
                      >
                        {addingTaskByProject[project.id] ? 'Adding...' : 'Add Task'}
                      </button>
                    </div>
                  )}
                    {tasks.length === 0 && totalTasks === 0 && (
                      <p className="taskEmpty">No tasks yet.</p>
                    )}
                    {tasks.length > 0 && (
                      <div className="taskList">
                        {tasks.map((task) => {
                          const assignedId = task.assigned_to?.id;
                          const assignedUsername = task.assigned_to?.username;
                          const isSingleMemberProject = (project.staff || []).length <= 1;
                          const isAssignee =
                            (assignedId && assignedId === userId) ||
                            (assignedUsername &&
                              userUsername &&
                              assignedUsername === userUsername) ||
                            (!assignedId &&
                              !assignedUsername &&
                              isSingleMemberProject &&
                              canEditTasks);
                          return (
                            <div className="taskItem" key={task.id}>
                              <div className="taskHeader">
                                <div>
                                  <span className="taskTitle">{task.title}</span>
                                  {!isSingleMemberProject && task.assigned_to && (
                                    <span className="taskAssignee">
                                      - {memberDisplayName(task.assigned_to)}
                                    </span>
                                  )}
                                  {task.required_hours > 0 && (
                                    <span className="taskRequiredHours">
                                      {task.required_hours}h required
                                    </span>
                                  )}
                                </div>
                                {isAssignee && (
                                  <button
                                    className="taskDelete"
                                    type="button"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      deleteTask(task.id, project.id);
                                    }}
                                  >
                                    Delete
                                  </button>
                                )}
                              </div>
                              <div className="taskProgress">
                                <div className="taskProgressBar">
                                  <div
                                    className="taskProgressFill"
                                    style={{ width: `${task.progress || 0}%` }}
                                  />
                                </div>
                                <span className="taskProgressText">{task.progress || 0}%</span>
                              </div>
                              {isAssignee && (
                                <div className="taskProgressEdit">
                                  <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={task.progress || 0}
                                    onChange={(e) =>
                                      updateTaskProgress(task.id, project.id, parseInt(e.target.value))
                                    }
                                  />
                                </div>
                              )}
                            </div>
                          );
                        })}
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
                    {percent}% complete - {displayCompleted}/{displayTotal} tasks
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
