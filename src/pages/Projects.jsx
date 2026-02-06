import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import API from '../api/api';

function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchProjects() {
      try {
        const res = await API.get('projects/my/');
        setProjects(res.data || []);
      } catch (err) {
        setError('Could not load projects. Please try again.');
      } finally {
        setLoading(false);
      }
    }

    fetchProjects();
  }, []);

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
          <section className="projectBoard">
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
                  <div className="projectProgress">
                    <div
                      className="projectProgressFill"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <p className="projectProgressText">
                    {percent}% complete • {project.completed_tasks || 0}/{totalTasks} tasks
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
