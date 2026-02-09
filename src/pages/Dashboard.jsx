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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError('');
      try {
        const [projectsRes, logsRes] = await Promise.all([
          API.get('projects/my/'),
          API.get('logs/my/'),
        ]);
        setProjects(projectsRes.data || []);
        setLogs(logsRes.data || []);
      } catch (err) {
        setError('Could not load dashboard data. Please try again.');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

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
          <div className="sidebarNote">
            <p className="sidebarNoteTitle">Next review</p>
            <p className="sidebarNoteValue">Fri, 10:00 AM</p>
          </div>
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
