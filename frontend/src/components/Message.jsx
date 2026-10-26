import { memo, useState } from "react";
import { AlertTriangle, Check, Copy, RotateCcw, ShieldAlert, ShieldCheck } from "lucide-react";
import Markdown from "./Markdown.jsx";
import QuizCard from "./QuizCard.jsx";
import PlanView from "./PlanView.jsx";
import { api } from "../api";

function Typing({ label }) {
  return (
    <div className="typing">
      <span /><span /><span />
      {label && <em>{label}</em>}
    </div>
  );
}

function Message({ m, isLast, onRetry, onSend, patchMessage }) {
  const [copied, setCopied] = useState(false);

  if (m.role === "user") {
    return (
      <div className="msg user">
        <div className="bubble">{m.content}</div>
      </div>
    );
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(m.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };

  const savePlan = async () => {
    await api.savePlan(m.id);
    patchMessage(m.id, { saved: true });
  };

  let body = null;
  if (m.type === "quiz") {
    body = (
      <QuizCard
        id={m.id}
        quiz={m.content}
        result={m.result}
        onResult={(result) => patchMessage(m.id, { result })}
        onNewQuiz={(topic) => onSend(`Make a harder quiz on ${topic}`, "quiz")}
      />
    );
  } else if (m.type === "plan") {
    body = <PlanView plan={m.content} saved={m.saved} onSave={savePlan} />;
  } else if (m.content) {
    body = <Markdown>{m.content}</Markdown>;
  }

  return (
    <div className="msg assistant">
      <div className="avatar" aria-hidden="true" />
      <div className="msg-main">
        {body}
        {m.streaming && !m.content && m.type === "text" && <Typing label={m.status} />}
        {m.streaming && m.content && m.type === "text" && <span className="caret" />}
        {m.error && (
          <div className="error-bar">
            <AlertTriangle size={16} />
            <span>{m.error}</span>
            {isLast && onRetry && (
              <button onClick={onRetry}><RotateCcw size={14} /> Retry</button>
            )}
          </div>
        )}
        {m.checking && <div className="verify checking"><ShieldCheck size={14} /> Fact-checking…</div>}
        {m.review?.verdict === "ok" && <div className="verify ok"><ShieldCheck size={14} /> Fact-checked</div>}
        {m.review?.verdict === "uncertain" && (
          <div className="verify warn">
            <ShieldAlert size={16} />
            <div>
              <strong>Worth double-checking</strong>
              <ul>{m.review.notes.map((n, i) => <li key={i}>{n}</li>)}</ul>
            </div>
          </div>
        )}
        {!m.streaming && m.type === "text" && m.content && (
          <div className="msg-actions">
            <button onClick={copy} aria-label="Copy answer">
              {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? "Copied" : "Copy"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default memo(Message);
