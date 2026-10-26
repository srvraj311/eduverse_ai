import { useState } from "react";
import { BookmarkCheck, BookmarkPlus, CheckCircle2, ChevronDown, Circle, Clock, Dumbbell, Search, Trash2, CirclePlay } from "lucide-react";

const HUES = ["blue", "purple", "green", "orange", "pink", "teal"];
const yt = (q) => `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;
const web = (q) => `https://www.google.com/search?q=${encodeURIComponent(q)}`;

/**
 * Renders a study plan as a timeline.
 * - `completed` + `onToggle` make topics checkable (saved plans)
 * - `onSave`/`saved` shows the save button (chat cards)
 */
export default function PlanView({ plan, completed, onToggle, onSave, saved, onDelete, progress }) {
  const [open, setOpen] = useState(0);
  const [saving, setSaving] = useState(false);
  const checkable = !!onToggle;
  const done = completed?.length ?? 0;

  const save = async () => {
    setSaving(true);
    try {
      await onSave();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card plan">
      <div className="plan-head">
        <div>
          <span className="chip chip-green">Study plan{plan.course_duration ? ` · ${plan.course_duration}` : ""}</span>
          <h3>{plan.name}</h3>
          {plan.summary && <p className="muted">{plan.summary}</p>}
        </div>
        <div className="row gap">
          {onSave && (
            <button className={`btn ${saved ? "btn-ghost" : ""}`} onClick={save} disabled={saved || saving}>
              {saved ? <BookmarkCheck size={16} /> : <BookmarkPlus size={16} />} {saved ? "Saved" : saving ? "Saving…" : "Save plan"}
            </button>
          )}
          {onDelete && (
            <button className="btn btn-ghost danger" onClick={onDelete} aria-label="Delete plan"><Trash2 size={16} /></button>
          )}
        </div>
      </div>

      {checkable && (
        <div className="plan-progress">
          <div className="progress"><i style={{ width: `${progress ?? 0}%` }} /></div>
          <span className="small muted">{done}/{plan.topics.length} topics · {progress ?? 0}%</span>
        </div>
      )}

      <ol className="timeline">
        {plan.topics.map((t, i) => {
          const isDone = completed?.includes(i);
          const hue = HUES[i % HUES.length];
          const expanded = open === i;
          return (
            <li key={i} className={`topic hue-${hue} ${isDone ? "is-done" : ""}`}>
              <div className="node">
                {checkable ? (
                  <button onClick={() => onToggle(i, !isDone)} aria-label={isDone ? "Mark incomplete" : "Mark complete"}>
                    {isDone ? <CheckCircle2 size={22} /> : <Circle size={22} />}
                  </button>
                ) : (
                  <span>{i + 1}</span>
                )}
              </div>
              <div className="topic-body">
                <button className="topic-title" onClick={() => setOpen(expanded ? -1 : i)} aria-expanded={expanded}>
                  <div>
                    <strong>{t.name}</strong>
                    {t.time_required && <span className="small muted"><Clock size={12} /> {t.time_required}</span>}
                  </div>
                  <ChevronDown size={18} className={expanded ? "flip" : ""} />
                </button>
                {expanded && (
                  <div className="topic-detail">
                    <p>{t.description}</p>
                    {t.subtopics?.length > 0 && (
                      <ul className="subtopics">
                        {t.subtopics.map((s, si) => (
                          <li key={si}><b>{s.name}</b>{s.description ? ` - ${s.description}` : ""}</li>
                        ))}
                      </ul>
                    )}
                    {t.exercise && (
                      <div className="exercise"><Dumbbell size={15} /> <span><b>Practice:</b> {t.exercise}</span></div>
                    )}
                    <div className="row gap wrap">
                      {t.youtube_query && (
                        <a className="pill pill-red" href={yt(t.youtube_query)} target="_blank" rel="noopener noreferrer"><CirclePlay size={14} /> Watch</a>
                      )}
                      {t.reading_query && (
                        <a className="pill pill-blue" href={web(t.reading_query)} target="_blank" rel="noopener noreferrer"><Search size={14} /> Read</a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
