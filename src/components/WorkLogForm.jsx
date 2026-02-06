import { useEffect, useState } from "react";
import API from "../api/api";

function WorkLogForm({ onSubmitted }) {
  const [title, setTitle] = useState("");
  const [hours, setHours] = useState("");
  const [date, setDate] = useState("");
  const [projectId, setProjectId] = useState("");

  const [projects, setProjects] = useState([]);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingProjects, setLoadingProjects] = useState(true);

  useEffect(() => {
    async function fetchProjects() {
      try {
        const res = await API.get("projects/my/");
        setProjects(res.data);
      } catch (err) {
        setError("");
      } finally {
        setLoadingProjects(false);
      }
    }

    fetchProjects();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const payload = {
        title,
        hours,
        date,
        project: projectId || null
      };

      await API.post("logs/submit/", payload);

      setTitle("");
      setHours("");
      setDate("");
      setProjectId("");

      if (onSubmitted) onSubmitted();
    } catch (err) {
      const data = err.response?.data;
      setError(data?.detail || "Failed to submit log");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && <p style={{ color: "red" }}>{error}</p>}

      <input
        placeholder="What did you work on?"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
      />
      <br />

      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        required
      />
      <br />

      <input
        type="number"
        step="0.5"
        placeholder="Hours spent"
        value={hours}
        onChange={(e) => setHours(e.target.value)}
        required
      />
      <br />

      {loadingProjects ? (
        <p>Loading projects…</p>
      ) : (
        <select
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
        >
          <option value="">Select a project</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      )}

      <br />

      <button disabled={loading || loadingProjects}>
        {loading ? "Submitting..." : "Add Log"}
      </button>

      {!loadingProjects && projects.length === 0 && (
        <p style={{ marginTop: 10 }}>
          You have no assigned projects yet. Please contact an admin.
        </p>
      )}
    </form>
  );
}

export default WorkLogForm;
