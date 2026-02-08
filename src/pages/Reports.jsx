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


    function downloadPdf() {
        if (!report) return;
        const escapeHtml = (value) =>
            String(value ?? '')
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;');

        const statusRows = report.status_counts
            .map((row) => `<tr><td>${escapeHtml(row.status)}</td><td>${escapeHtml(row.count)}</td></tr>`)
            .join('');

        const projectRows = report.by_project
            .map((row) => `<tr><td>${escapeHtml(row.project__name || 'No project')}</td><td>${escapeHtml(row.hours || 0)}</td><td>${escapeHtml(row.count)}</td></tr>`)
            .join('');

        const dateRows = report.by_date
            .map((row) => `<tr><td>${escapeHtml(row.date)}</td><td>${escapeHtml(row.hours || 0)}</td><td>${escapeHtml(row.count)}</td></tr>`)
            .join('');

        const html = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>WorkHub Report</title>
    <style>
      body { font-family: Arial, sans-serif; padding: 24px; color: #0f172a; }
      h1 { margin: 0 0 12px; font-size: 22px; }
      .summary { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; margin: 16px 0 24px; }
      .card { border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px; }
      .label { font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; color: #475569; }
      .value { font-size: 18px; font-weight: 700; margin-top: 6px; }
      table { width: 100%; border-collapse: collapse; margin: 12px 0 24px; }
      th, td { text-align: left; padding: 8px; border-bottom: 1px solid #e2e8f0; font-size: 13px; }
      th { font-size: 12px; text-transform: uppercase; color: #475569; letter-spacing: 0.08em; }
    </style>
  </head>
  <body>
    <h1>WorkHub Report</h1>
    <div class="summary">
      <div class="card"><div class="label">Total logs</div><div class="value">${escapeHtml(report.total_logs)}</div></div>
      <div class="card"><div class="label">Total hours</div><div class="value">${escapeHtml(report.total_hours)}</div></div>
      <div class="card"><div class="label">Approved</div><div class="value">${escapeHtml(report.status_counts.find((s) => s.status === 'approved')?.count || 0)}</div></div>
    </div>
    <h2>Status breakdown</h2>
    <table>
      <thead><tr><th>Status</th><th>Count</th></tr></thead>
      <tbody>${statusRows}</tbody>
    </table>
    <h2>Hours by project</h2>
    <table>
      <thead><tr><th>Project</th><th>Hours</th><th>Logs</th></tr></thead>
      <tbody>${projectRows}</tbody>
    </table>
    <h2>Logs by date</h2>
    <table>
      <thead><tr><th>Date</th><th>Hours</th><th>Logs</th></tr></thead>
      <tbody>${dateRows}</tbody>
    </table>
  </body>
</html>`;

        const win = window.open('', '_blank');
        if (!win) return;
        win.document.open();
        win.document.write(html);
        win.document.close();
        win.focus();
        win.print();
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
                                        <span>{row.project__name || 'No project'}</span>
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
