import Navbar from '../components/Navbar';
import { Link } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import API from '../api/api';

function Dashboard() {
  const storedUser = localStorage.getItem('user');
  const user = storedUser ? JSON.parse(storedUser) : null;
  const isAdmin = user?.role === 'admin';
  const displayName = user?.first_name || user?.username || 'there';
  const [projects, setProjects] = useState([]);
  const [logs, setLogs] = useState([]);
  const [pendingLogs, setPendingLogs] = useState(0);
  const [weeklyGoal, setWeeklyGoal] = useState(0);
  const [goalDraft, setGoalDraft] = useState('');
  const [editingGoal, setEditingGoal] = useState(true);
  const [savingGoal, setSavingGoal] = useState(false);
  const [goalMessage, setGoalMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError('');
      try {
        const [projectsRes, logsRes, pendingRes, settingsRes] = await Promise.all([
          API.get('projects/my/'),
          API.get('logs/my/'),
          isAdmin ? API.get('logs/pending/') : Promise.resolve({ data: [] }),
          API.get('settings/'),
        ]);
        setProjects(projectsRes.data || []);
        setLogs(logsRes.data || []);
        setPendingLogs((pendingRes.data || []).length);
        const goalValue = Number(settingsRes.data?.weekly_goal_hours || 0);
        setWeeklyGoal(goalValue);
        setGoalDraft(goalValue ? String(goalValue) : '');
        setEditingGoal(goalValue === 0);
      } catch (err) {
        setError('Could not load dashboard data. Please try again.');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [isAdmin]);

  const stats = useMemo(() => {
    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(now.getDate() - 7);

    const hoursThisWeek = logs.reduce((sum, log) => {
      const logDate = new Date(log.date);
      if (logDate >= weekAgo && logDate <= now) {
        const hours = typeof log.hours === 'number' ? log.hours : parseFloat(log.hours || '0');
        return sum + (Number.isFinite(hours) ? hours : 0);
      }
      return sum;
    }, 0);

    const totalLogs = logs.length;
    const approvedLogs = logs.filter((log) => log.status === 'approved').length;
    const approvalRate = totalLogs ? Math.round((approvedLogs / totalLogs) * 100) : 0;

    return {
      hoursThisWeek: hoursThisWeek.toFixed(1),
      activeProjects: projects.length,
      approvalRate,
    };
  }, [logs, projects]);

  const goalProgress = useMemo(() => {
    const goal = Number(weeklyGoal || 0);
    const hours = Number(stats.hoursThisWeek || 0);
    if (!goal) return 0;
    return Math.min(100, Math.round((hours / goal) * 100));
  }, [weeklyGoal, stats.hoursThisWeek]);

  async function saveWeeklyGoal() {
    setSavingGoal(true);
    setGoalMessage('');
    try {
      const res = await API.patch('settings/', {
        weekly_goal_hours: goalDraft,
      });
      localStorage.setItem('user', JSON.stringify(res.data));
      window.dispatchEvent(new Event('user:updated'));
      const savedGoal = Number(res.data.weekly_goal_hours || 0);
      setWeeklyGoal(savedGoal);
      setGoalDraft(savedGoal ? String(savedGoal) : '');
      setEditingGoal(false);
      setGoalMessage('Goal saved.');
    } catch (err) {
      setGoalMessage('Could not save goal.');
    } finally {
      setSavingGoal(false);
    }
  }

  function getStatus(percent, totalTasks) {
    if (totalTasks === 0) return 'No tasks';
    if (percent === 100) return 'Completed';
    if (percent >= 75) return 'Review';
    if (percent >= 30) return 'In progress';
    return 'Not started';
  }

  return (
    <div className="dashPage">
      <header className="topBar">
        <div className="dashHeaderText">
          <h1 className="dashTitle">Dashboard</h1>
          <p className="dashWelcome">Welcome, {displayName}</p>
        </div>
        <Navbar />
      </header>
      <div className="dashLayout">
        <aside className="dashSidebar">
          <p className="sidebarTitle">Workspace</p>
          <p className="sidebarSubtitle">WorkHub</p>
          <nav className="sidebarNav">
            <Link to="/dashboard" className="sidebarLink isActive">
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
            {isAdmin && (
              <Link to="/admin/approvals" className="sidebarLink">
                Approvals
              </Link>
            )}
            <Link to="/settings" className="sidebarLink">
              Settings
            </Link>
          </nav>
          {isAdmin && (
            <div className="sidebarNote">
              <p className="sidebarNoteTitle">Pending logs</p>
              <p className="sidebarNoteValue">{pendingLogs}</p>
            </div>
          )}
        </aside>

        <main className="dashMain dashContent">
          <p className="dashSubtitle">
            Log your work and track your progress
          </p>

          <section className="statGrid">
            <div className="statCard">
              <p className="statLabel">Hours logged</p>
              <p className="statValue">{stats.hoursThisWeek}</p>
              <p className="statMeta">This week</p>
            </div>
            <div className="statCard">
              <p className="statLabel">Active projects</p>
              <p className="statValue">{stats.activeProjects}</p>
              <p className="statMeta">In progress</p>
            </div>
            <div className="statCard">
              <p className="statLabel">Approval rate</p>
              <p className="statValue">{stats.approvalRate}%</p>
              <p className="statMeta">Last 30 days</p>
            </div>
          </section>

          <section className="card">
            <div className="cardHeader">
              <h2 className="cardTitle">Weekly goal</h2>
              <p className="cardSubtitle">{stats.hoursThisWeek} hrs logged</p>
            </div>
            {!editingGoal && weeklyGoal > 0 && (
              <p className="goalValue">{weeklyGoal} hours</p>
            )}
            {editingGoal && (
              <div className="settingsRow">
                <span>Target hours</span>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={goalDraft}
                  onChange={(e) => setGoalDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      saveWeeklyGoal();
                    }
                  }}
                />
              </div>
            )}
            <div className="progressBar">
              <div
                className="progressFill"
                style={{ width: `${goalProgress}%` }}
              />
            </div>
            <div className="settingsRow">
              <span>{goalProgress}% of goal</span>
              {editingGoal ? (
                <button
                  className="btn btnPrimary"
                  type="button"
                  onClick={saveWeeklyGoal}
                  disabled={savingGoal}
                >
                  {savingGoal ? 'Saving...' : 'Save goal'}
                </button>
              ) : (
                <button
                  className="btn btnSecondary"
                  type="button"
                  onClick={() => setEditingGoal(true)}
                >
                  Change goal
                </button>
              )}
            </div>
            {goalMessage && <p className="inlineStatus">{goalMessage}</p>}
          </section>

          <section className="card projectCard">
            <div className="cardHeader">
              <h2 className="cardTitle">Recent Projects</h2>
              <Link to="/projects" className="btn btnSecondary">
                View all
              </Link>
            </div>
            {loading && <p className="inlineStatus">Loading projects…</p>}
            {error && <p className="inlineError">{error}</p>}
            {!loading && !error && projects.length === 0 && (
              <div className="emptyState">
                <p className="emptyTitle">No projects yet</p>
                <p className="emptySubtitle">
                  Projects assigned to you will appear here.
                </p>
              </div>
            )}
            {!loading && !error && projects.length > 0 && (
              <div className="projectList">
                {projects.slice(0, 3).map((project) => {
                  const percent = project.completion_percent || 0;
                  const totalTasks = project.total_tasks || 0;
                  const status = getStatus(percent, totalTasks);
                  const badgeClass = status.toLowerCase().replace(' ', '-');
                  return (
                    <div className="projectItem" key={project.id}>
                      <div>
                        <p className="projectTitle">{project.name}</p>
                        <p className="projectMeta">
                          {project.description || 'No description yet'}
                        </p>
                      </div>
                      <span className={`projectStatus ${badgeClass}`}>
                        {status}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </main>
      </div>

    </div>
  );
}

export default Dashboard;
