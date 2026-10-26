import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Flame, Target, Trophy } from "lucide-react";
import { api } from "../api";

const fmt = (iso) => new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });

export default function Results() {
  const [results, setResults] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.quizResults().then((d) => setResults(d.results)).catch((e) => setError(e.message));
  }, []);

  // Scores are over answered questions only (a 2/3 on a half-finished quiz counts as 2 of 3).
  const stats = useMemo(() => {
    const scored = results?.filter((r) => r.answered > 0) ?? [];
    if (!scored.length) return null;
    const avg = scored.reduce((s, r) => s + r.score / r.answered, 0) / scored.length;
    const best = Math.max(...scored.map((r) => r.score / r.answered));
    return { count: scored.length, avg: Math.round(avg * 100), best: Math.round(best * 100) };
  }, [results]);

  return (
    <div className="page">
      <header className="page-head">
        <h1>Results</h1>
        <p className="muted">Every quiz you've taken, including ones you left unfinished.</p>
      </header>
      {error && <div className="inline-error">{error}</div>}
      {results === null && !error && <div className="skeleton" />}
      {results?.length === 0 && (
        <div className="empty-card glass">
          <Trophy size={32} />
          <h3>No quizzes taken yet</h3>
          <p className="muted">Ask the tutor to quiz you on anything.</p>
          <Link className="btn" to="/">Take a quiz</Link>
        </div>
      )}
      {stats && (
        <div className="stats">
          <div className="stat glass hue-blue"><Target size={20} /><strong>{stats.count}</strong><span>Quizzes</span></div>
          <div className="stat glass hue-purple"><Flame size={20} /><strong>{stats.avg}%</strong><span>Average</span></div>
          <div className="stat glass hue-green"><Trophy size={20} /><strong>{stats.best}%</strong><span>Best</span></div>
        </div>
      )}
      <ul className="results">
        {results?.map((r) => {
          const pct = r.answered ? Math.round((100 * r.score) / r.answered) : 0;
          return (
            <li key={r.id} className="glass">
              <div>
                <strong>{r.title}</strong>
                <span className="small muted">
                  {fmt(r.ts)} · {r.answered}/{r.total} answered{r.finished ? "" : " · in progress"}
                </span>
              </div>
              <div className="bar"><i className={pct >= 70 ? "good" : pct >= 40 ? "mid" : "low"} style={{ width: `${pct}%` }} /></div>
              <span className="score">{r.score}/{r.answered}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
