import Navbar from '../components/Navbar';
import { Link } from 'react-router-dom';
export default function Reports() {
    return (
        <div className="dashPage">
            <header className="topBar">
                <h1 className="dashTitle">Reports</h1>
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
                        <Link to="/reports" className="sidebarLink isActive">
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
                    <p className="dashSubtitle">Overview of staff work activity</p>
                    <div className="emptyState">
                        <p className="emptyTitle">No reports available</p>
                        <p className="emptySubtitle">
                            Reports will appear here once staff start logging their work.
                        </p>
                    </div>
                    <button className="btn btnPrimary reportsGenerateBtn" type="button">
                        Generate Reports
                    </button>
                </main>
            </div>
        </div>
    );
}
