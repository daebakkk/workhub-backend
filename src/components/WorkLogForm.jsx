import { useEffect, useState } from "react";
import API from "../api/api";

function WorkLogForm({ onSubmitted }) {
  const [title, setTitle] = useState("");
  const [hours, setHours] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [projectId, setProjectId] = useState("");
  const [taskId, setTaskId] = useState("");
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingTasks, setLoadingTasks] = useState(false);

  useEffect(() => {
    API.get("projects/my/")
      .then((res) => setProjects(res.data || []))
      .catch(() => {})
      .finally(() => setLoadingProjects(false));
  }, []);

  useEffect(() => {
    if (!projectId) { setTasks([]); setTaskId(""); return; }
    setLoadingTasks(true);
    API.get(`projects/${projectId}/tasks/`)
      .then((res) => setTasks(res.data || []))
      .catch(() => setError("Failed to load tasks"))
      .finally(() => setLoadingTasks(false));
  }, [projectId]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await API.post("logs/submit/", {
        title, hours, date,
        project: projectId || null,
        task: taskId || null,
      });
      setTitle(""); setHours(""); setDate(new Date().toISOString().slice(0, 10));
      setProjectId(""); setTaskId("");
      if (onSubmitted) onSubmitted();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to submit log");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="wlForm" onSubmit={handleSubmit}>
      {error && <p className="inlineError">{error}</p>}

      <div className="wlFormGrid">
        <input
          className="wlInput wlInputFull"
          placeholder="What did you work on?"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <input
          className="wlInput"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />
        <input
          className="wlInput"
          type="number"
          step="0.5"
          min="0.5"
          placeholder="Hours spent"
          value={hours}
          onChange={(e) => setHours(e.target.value)}
          required
        />
        {loadingProjects ? (
          <div className="wlInput wlInputPlaceholder">Loading projects…</div>
        ) : (
          <select
            className="wlInput wlSelect"
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
          >
            <option value="">Select a project</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        )}
        {projectId && (
          loadingTasks ? (
            <div className="wlInput wlInputPlaceholder">Loading tasks…</div>
          ) : (
            <select
              className="wlInput wlSelect"
              value={taskId}
              onChange={(e) => setTaskId(e.target.value)}
            >
              <option value="">Link a task (optional)</option>
              {tasks.map((t) => (
                <option key={t.id} value={t.id}>{t.title}</option>
              ))}
            </select>
          )
        )}
      </div>

      {!loadingProjects && projects.length === 0 && (
        <p className="wlNoProjects">No assigned projects yet — contact an admin.</p>
      )}

      <button
        className="btn btnPrimary wlSubmitBtn"
        type="submit"
        disabled={loading || loadingProjects || loadingTasks}
      >
        {loading ? "Saving…" : "Save log"}
      </button>
    </form>
  );
}

export default WorkLogForm;
