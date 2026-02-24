import Navbar from '../components/Navbar';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import API from '../api/api';
export default function Reports() {
    const storedUser = localStorage.getItem('user');
    const user = storedUser ? JSON.parse(storedUser) : null;
    const isAdmin = user?.role === 'admin';

    const [report, setReport] = useState(null);
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        async function fetchReports() {
            try {
                const res = await API.get('reports/');
                const list = res.data || [];
                setReports(list);
                if (list.length > 0) {
                    setReport(list[0]);
                }
            } catch (err) {
                setError('Could not load reports.');
            }
        }

        fetchReports();
        const interval = setInterval(fetchReports, 30000);
        return () => clearInterval(interval);
    }, []);

    async function generateReport() {
        setLoading(true);
        setError('');
        try {
            const res = await API.post('reports/create/');
            const created = res.data;
            setReports((prev) => [created, ...prev]);
            setReport(created);
        } catch (err) {
            setError('Could not generate report.');
        } finally {
            setLoading(false);
        }
    }


    async function downloadPdf() {
        if (!report) return;
        const [{ jsPDF }, { default: autoTable }] = await Promise.all([
            import('jspdf'),
            import('jspdf-autotable'),
        ]);
        const doc = new jsPDF({ unit: 'pt', format: 'a4' });
        const approvedCount =
            report.status_counts?.find((s) => s.status === 'approved')?.count ?? 0;
        const summaryBody = [
            ['Total logs', String(report.total_logs ?? 0)],
            ['Total hours', String(report.total_hours ?? 0)],
            ['Approved', String(approvedCount)],
        ];

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(20);
        doc.text('WorkHub Report', 40, 50);

        autoTable(doc, {
            startY: 70,
            head: [['Metric', 'Value']],
            body: summaryBody,
            styles: { font: 'helvetica', fontSize: 10 },
            headStyles: { fillColor: [17, 24, 39] },
        });

        autoTable(doc, {
            startY: doc.lastAutoTable.finalY + 18,
            head: [['Status', 'Count']],
            body: (report.status_counts || []).map((row) => [
                String(row.status ?? ''),
                String(row.count ?? 0),
            ]),
            styles: { font: 'helvetica', fontSize: 10 },
            headStyles: { fillColor: [17, 24, 39] },
        });

        autoTable(doc, {
            startY: doc.lastAutoTable.finalY + 18,
            head: [['Project', 'Hours', 'Logs']],
            body: (report.by_project || []).map((row) => [
                String(row.project__name || 'Unassigned'),
                String(row.hours ?? 0),
                String(row.count ?? 0),
            ]),
            styles: { font: 'helvetica', fontSize: 10 },
            headStyles: { fillColor: [17, 24, 39] },
        });

        autoTable(doc, {
            startY: doc.lastAutoTable.finalY + 18,
            head: [['Date', 'Hours', 'Logs']],
            body: (report.by_date || []).map((row) => [
                String(row.date ?? ''),
                String(row.hours ?? 0),
                String(row.count ?? 0),
            ]),
            styles: { font: 'helvetica', fontSize: 10 },
            headStyles: { fillColor: [17, 24, 39] },
        });

        const datePart = new Date().toISOString().slice(0, 10);
        doc.save(`workhub-report-${datePart}.pdf`);
    }

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
                    <p className="dashSubtitle">Overview of staff work activity</p>
                    {loading && <p className="inlineStatus">Generating report...</p>}
                    {error && <p className="inlineError">{error}</p>}

                    {!report && !loading && !error && (
                        <div className="emptyState">
                            <p className="emptyTitle">No reports generated</p>
                            <p className="emptySubtitle">
                                Reports will appear here once an admin generates them.
                            </p>
                        </div>
                    )}

                    {reports.length > 0 && (
                        <div className="reportHistory">
                            <p className="reportTableTitle">Saved reports</p>
                            <div className="reportHistoryList">
                                {reports.map((item) => (
                                    <button
                                        key={item.id}
                                        type="button"
                                        className={`reportHistoryItem ${report?.id === item.id ? 'isActive' : ''}`}
                                        onClick={() => setReport(item)}
                                    >
                                        {new Date(item.created_at).toLocaleString()}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {report && (
                        <div className="reportGrid">
                            <div className="reportCard">
                                <p className="reportLabel">Total logs</p>
                                <p className="reportValue">{report.total_logs}</p>
                            </div>
                            <div className="reportCard">
                                <p className="reportLabel">Total hours</p>
                                <p className="reportValue">{report.total_hours}</p>
                            </div>
                            <div className="reportCard">
                                <p className="reportLabel">Approved</p>
                                <p className="reportValue">
                                    {report.status_counts.find((s) => s.status === 'approved')?.count || 0}
                                </p>
                            </div>
                        </div>
                    )}

                    {report && (
                        <div className="reportTables">
                            <div className="reportTable">
                                <p className="reportTableTitle">Hours by project</p>
                                {report.by_project.map((row) => (
                                    <div className="reportRow" key={row.project__name || 'none'}>
                                        <span>{row.project__name || 'Unassigned'}</span>
                                        <span>{row.hours || 0} hrs</span>
                                        <span>{row.count} logs</span>
                                    </div>
                                ))}
                            </div>
                            <div className="reportTable">
                                <p className="reportTableTitle">Logs by date</p>
                                {report.by_date.map((row) => (
                                    <div className="reportRow" key={row.date}>
                                        <span>{row.date}</span>
                                        <span>{row.hours || 0} hrs</span>
                                        <span>{row.count} logs</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="reportActions">
                        {isAdmin && (
                            <button
                                className="btn btnPrimary reportsGenerateBtn"
                                type="button"
                                onClick={generateReport}
                                disabled={loading}
                            >
                                Generate Reports
                            </button>
                        )}
                        {report && (
                            <button
                                className="btn btnSecondary"
                                type="button"
                                onClick={downloadPdf}
                            >
                                Download PDF
                            </button>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}
