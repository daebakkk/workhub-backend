import WorkLogForm from '../components/WorkLogForm';
import Navbar from '../components/Navbar';

function Dashboard() {
  return (
    <div className="dashPage">
      <header className="topBar">
        <h1 className="dashTitle">Dashboard</h1>
        <Navbar />
      </header>
      <main className="dashMain">
        <p className="dashSubtitle">
          Log your work and track your progress
        </p>
        <div className="emptyState">
          <p className="emptyTitle">No work logs yet</p>
          <p className="emptySubtitle">
            When you start adding logs, they will appear here.
          </p>
        </div>
        <section className="card">
          <h2 className="cardTitle">Add Work Log</h2>
          <WorkLogForm />
        </section>
      </main>

    </div>
  );
}

export default Dashboard;
