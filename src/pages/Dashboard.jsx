import Navbar from '../components/Navbar';
import { Link } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import API from '../api/api';

function Dashboard() {
  const storedUser = localStorage.getItem('user');
  const user = storedUser ? JSON.parse(storedUser) : null;
  const isAdmin = user?.role === 'admin';
  const displayName = user?.first_name || user?.username || 'there';
  const [summary, setSummary] = useState({
    hours_this_week: 0,
    active_projects: 0,
    approval_rate: 0,
    pending_logs: 0,
    weekly_goal_hours: 0,
    recent_projects: [],
  });
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
        const res = await API.get('dashboard/summary/');
        const payload = res.data || {};
        setSummary({
          hours_this_week: Number(payload.hours_this_week || 0),
          active_projects: Number(payload.active_projects || 0),
          approval_rate: Number(payload.approval_rate || 0),
          pending_logs: Number(payload.pending_logs || 0),
          weekly_goal_hours: Number(payload.weekly_goal_hours || 0),
          recent_projects: payload.recent_projects || [],
        });
        const goalValue = Number(payload.weekly_goal_hours || 0);
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

  const stats = useMemo(
    () => ({
      hoursThisWeek: Number(summary.hours_this_week || 0).toFixed(1),
      activeProjects: Number(summary.active_projects || 0),
      approvalRate: Number(summary.approval_rate || 0),
    }),
    [summary]
  );

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
      setSummary((prev) => ({ ...prev, weekly_goal_hours: savedGoal }));
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
    return 'Starting';
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
            <Link to="/leaderboard" className="sidebarLink">
              Leaderboard
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
              <p className="sidebarNoteTitle">Logs to review</p>
              <p className="sidebarNoteValue">{summary.pending_logs}</p>
            </div>
          )}
        </aside>

        <main className="dashMain dashContent">
          <p className="dashSubtitle">
            Log your work and track your progress
          </p>

          <section className="statGrid">
            <div className="statCard">
              <div className="statIcon">📊</div>
              <p className="statLabel">Hours logged</p>
              <p className="statValue">{stats.hoursThisWeek}</p>
              <p className="statMeta">This week</p>
            </div>
            <div className="statCard">
              <div className="statIcon">📁</div>
              <p className="statLabel">Active projects</p>
              <p className="statValue">{stats.activeProjects}</p>
              <p className="statMeta">In progress</p>
            </div>
            {isAdmin ? (
              <div className="statCard">
                <div className="statIcon">✓</div>
                <p className="statLabel">Logs to review</p>
                <p className="statValue">{summary.pending_logs}</p>
                <p className="statMeta">Awaiting review</p>
              </div>
            ) : (
              <div className="statCard">
                <div className="statIcon">⭐</div>
                <p className="statLabel">Approval rate</p>
                <p className="statValue">{stats.approvalRate}%</p>
                <p className="statMeta">Last 30 days</p>
              </div>
            )}
          </section>

          <section className="card dashGoalCard">
            <div className="cardHeader">
              <div>
                <h2 className="cardTitle">Weekly goal</h2>
                <p className="cardSubtitle">{stats.hoursThisWeek} of {weeklyGoal || '—'} hours</p>
              </div>
              {!editingGoal && (
                <button
                  className="btn btnSecondary"
                  type="button"
                  onClick={() => setEditingGoal(true)}
                >
                  Change
                </button>
              )}
            </div>
            {editingGoal && (
              <div className="dashGoalEdit">
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  className="dashGoalInput"
                  placeholder="Target hours"
                  value={goalDraft}
                  onChange={(e) => setGoalDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      saveWeeklyGoal();
                    }
                  }}
                />
                <button
                  className="btn btnPrimary"
                  type="button"
                  onClick={saveWeeklyGoal}
                  disabled={savingGoal}
                >
                  {savingGoal ? 'Saving...' : 'Save'}
                </button>
              </div>
            )}
            <div className="dashGoalProgress">
              <div className="progressBar">
                <div
                  className="progressFill"
                  style={{ width: `${goalProgress}%` }}
                />
              </div>
              <p className="dashGoalPercent">{goalProgress}% complete</p>
            </div>
            {goalMessage && <p className="inlineStatus">{goalMessage}</p>}
          </section>

          <section className="card dashProjectCard">
            <div className="cardHeader">
              <h2 className="cardTitle">Recent Projects</h2>
              <Link to="/projects" className="btn btnSecondary">
                View all
              </Link>
            </div>
            {loading && <p className="inlineStatus">Loading projects…</p>}
            {error && <p className="inlineError">{error}</p>}
            {!loading && !error && summary.recent_projects.length === 0 && (
              <div className="emptyState">
                <p className="emptyTitle">No projects yet</p>
                <p className="emptySubtitle">
                  Projects assigned to you will appear here.
                </p>
              </div>
            )}
            {!loading && !error && summary.recent_projects.length > 0 && (
              <div className="projectList">
                {summary.recent_projects.map((project) => {
                  const percent = project.completion_percent || 0;
                  const totalTasks = project.total_tasks || 0;
                  const status = getStatus(percent, totalTasks);
                  const badgeClass = status.toLowerCase().replace(' ', '-');
                  return (
                    <Link to="/projects" className="projectItem" key={project.id}>
                      <div className="projectItemContent">
                        <p className="projectTitle">{project.name}</p>
                        <p className="projectMeta">
                          {project.description || 'No description yet'}
                        </p>
                      </div>
                      <div className="projectItemRight">
                        <div className="projectItemProgress">
                          <div className="projectItemProgressBar">
                            <div
                              className="projectItemProgressFill"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                          <span className="projectItemProgressText">{percent}%</span>
                        </div>
                        <span className={`projectStatus ${badgeClass}`}>
                          {status}
                        </span>
                      </div>
                    </Link>
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
