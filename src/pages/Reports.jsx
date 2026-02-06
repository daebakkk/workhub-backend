import Navbar from '../components/Navbar';
export default function Reports() {
    return (
        <div className="reportsPage">
            <header className="reportsTopBar">
                <h1 className="reportsTitle">Reports</h1>
                <Navbar />
            </header>
            <main className="reportsMain">
                <p className="repSubtitle">Overview of staff work activity</p>
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
    );
}
