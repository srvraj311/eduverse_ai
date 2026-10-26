import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Route } from "lucide-react";
import { api } from "../api";
import PlanView from "../components/PlanView.jsx";

function Ring({ value }) {
  const r = 20;
  const c = 2 * Math.PI * r;
  return (
    <div className="mini-ring">
      <svg viewBox="0 0 48 48" width="52" height="52">
        <circle cx="24" cy="24" r={r} className="ring-bg" />
        <circle cx="24" cy="24" r={r} className="ring-fg" strokeDasharray={c} strokeDashoffset={c * (1 - value / 100)} />
      </svg>
      <span>{value}%</span>
    </div>
  );
}

export default function Plans() {
  const [plans, setPlans] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.plans().then((d) => setPlans(d.plans)).catch((e) => setError(e.message));
  }, []);

  const replace = (updated) => setPlans((ps) => ps.map((p) => (p.id === updated.id ? updated : p)));

  const toggle = async (p, index, done) => {
    // optimistic update, reconcile with the server
    const completed = done ? [...new Set([...p.completed, index])] : p.completed.filter((i) => i !== index);
    replace({ ...p, completed, progress: Math.round((100 * completed.length) / p.plan.topics.length) });
    try {
      replace(await api.togglePlanTopic(p.id, index, done));
    } catch (e) {
      setError(e.message);
      replace(p);
    }
  };

  const remove = async (p) => {
    if (!confirm(`Delete "${p.name}"?`)) return;
    await api.deletePlan(p.id);
    setPlans((ps) => ps.filter((x) => x.id !== p.id));
  };

  return (
    <div className="page">
      <header className="page-head">
        <h1>My plans</h1>
        <p className="muted">Tick off topics as you learn. Your progress is saved.</p>
      </header>
      {error && <div className="inline-error">{error}</div>}
      {plans === null && !error && <div className="skeleton" />}
      {plans?.length === 0 && (
        <div className="empty-card glass">
          <Route size={32} />
          <h3>No saved plans yet</h3>
          <p className="muted">Ask the tutor for a study plan, then tap <b>Save plan</b> to track it here.</p>
          <Link className="btn" to="/">Create a plan</Link>
        </div>
      )}
      {plans?.length > 1 && (
        <div className="overview">
          {plans.map((p) => (
            <a key={p.id} href={`#plan-${p.id}`} className="glass overview-item">
              <Ring value={p.progress} />
              <div>
                <strong>{p.name}</strong>
                <span className="small muted">{p.completed.length}/{p.plan.topics.length} topics done</span>
              </div>
            </a>
          ))}
        </div>
      )}
      <div className="stack">
        {plans?.map((p) => (
          <div key={p.id} id={`plan-${p.id}`}>
            <PlanView plan={p.plan} completed={p.completed} progress={p.progress} onToggle={(i, d) => toggle(p, i, d)} onDelete={() => remove(p)} />
          </div>
        ))}
      </div>
    </div>
  );
}
