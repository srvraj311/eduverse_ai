import { useState } from "react";
import { ArrowRight, Check, Flag, Play, RotateCcw, Trophy, X } from "lucide-react";
import { api } from "../api";

const LETTERS = ["A", "B", "C", "D"];

function ScoreRing({ score, total }) {
  const pct = total ? score / total : 0;
  const r = 44;
  const c = 2 * Math.PI * r;
  return (
    <div className="ring">
      <svg viewBox="0 0 100 100" width="112" height="112">
        <circle cx="50" cy="50" r={r} className="ring-bg" />
        <circle cx="50" cy="50" r={r} className="ring-fg" strokeDasharray={c} strokeDashoffset={c * (1 - pct)} />
      </svg>
      <div className="ring-text">
        <strong>{score}</strong>
        <span>/ {total}</span>
      </div>
    </div>
  );
}

function verdict(pct) {
  if (pct === 1) return "Perfect score. Flawless!";
  if (pct >= 0.8) return "Excellent work!";
  if (pct >= 0.6) return "Good job, almost there.";
  if (pct >= 0.4) return "Decent start. Review and retry.";
  return "Keep going, every attempt teaches you something.";
}

/**
 * Answers are saved to the server after every click, so a half-finished quiz still shows up in Results
 * and is scored over the questions actually answered (e.g. 2/3).
 */
export default function QuizCard({ id, quiz, result, onResult, onNewQuiz }) {
  const total = quiz.questions.length;
  const initial = result?.answers ?? Array(total).fill(null);
  const [answers, setAnswers] = useState(initial);
  const [step, setStep] = useState(() => {
    const first = initial.findIndex((a) => a === null || a === undefined);
    return first === -1 ? 0 : first;
  });
  const [done, setDone] = useState(!!result?.finished);
  const [error, setError] = useState("");

  const answeredCount = answers.filter((a) => a !== null && a !== undefined).length;
  const score = answers.reduce((n, a, i) => n + (a !== null && a === quiz.questions[i].answer_index ? 1 : 0), 0);

  const save = async (next, finished) => {
    setError("");
    try {
      onResult?.(await api.submitQuiz(id, next, finished));
    } catch (e) {
      setError(`Couldn't save your progress: ${e.message}`);
    }
  };

  const q = quiz.questions[step];
  const picked = answers[step];
  const answered = picked !== null && picked !== undefined;

  const choose = (i) => {
    if (answered) return;
    const next = answers.map((v, idx) => (idx === step ? i : v));
    setAnswers(next);
    save(next, next.every((a) => a !== null));
  };

  const finish = () => {
    setDone(true);
    save(answers, true);
  };

  const retry = () => {
    const blank = Array(total).fill(null);
    setAnswers(blank);
    setStep(0);
    setDone(false);
  };

  const resume = () => {
    setStep(Math.max(0, answers.findIndex((a) => a === null || a === undefined)));
    setDone(false);
  };

  if (done) {
    const pct = answeredCount ? score / answeredCount : 0;
    return (
      <div className="card quiz">
        <div className="quiz-head">
          <span className="chip chip-purple"><Trophy size={14} /> Results</span>
          <h3>{quiz.title}</h3>
        </div>
        <div className="quiz-summary">
          <ScoreRing score={score} total={answeredCount} />
          <div>
            <h4>{answeredCount ? verdict(pct) : "No answers yet"}</h4>
            <p className="muted">
              {answeredCount
                ? `You got ${score} of ${answeredCount} answered correct (${Math.round(pct * 100)}%).`
                : "Answer a question to get a score."}
            </p>
            {answeredCount < total && (
              <p className="muted small">Scored on {answeredCount} of {total} questions. Unanswered ones aren't counted.</p>
            )}
            <div className="row gap wrap">
              {answeredCount < total && <button className="btn" onClick={resume}><Play size={15} /> Continue quiz</button>}
              <button className="btn btn-ghost" onClick={retry}><RotateCcw size={15} /> Retry</button>
              {onNewQuiz && <button className="btn btn-ghost" onClick={() => onNewQuiz(quiz.topic || quiz.title)}>Harder quiz <ArrowRight size={15} /></button>}
            </div>
          </div>
        </div>
        <div className="review">
          {quiz.questions.map((qq, qi) => {
            const mine = answers[qi];
            const skipped = mine === null || mine === undefined;
            const ok = !skipped && mine === qq.answer_index;
            return (
              <details key={qi} className={skipped ? "skip" : ok ? "ok" : "bad"}>
                <summary>
                  {skipped ? <span className="dash">–</span> : ok ? <Check size={16} /> : <X size={16} />}
                  <span>{qq.question}</span>
                </summary>
                <p><b>Correct:</b> {qq.options[qq.answer_index]}</p>
                {!ok && <p><b>You chose:</b> {skipped ? "Not answered" : qq.options[mine]}</p>}
                {qq.explanation && <p className="muted">{qq.explanation}</p>}
              </details>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="card quiz">
      <div className="quiz-head">
        <span className="chip chip-blue">Quiz · {quiz.difficulty}</span>
        <h3>{quiz.title}</h3>
        <div className="progress"><i style={{ width: `${(answeredCount / total) * 100}%` }} /></div>
        <span className="muted small">Question {step + 1} of {total} · {answeredCount} answered</span>
      </div>
      <p className="quiz-q">{q.question}</p>
      <div className="options">
        {q.options.map((opt, i) => {
          const state = !answered ? "" : i === q.answer_index ? "correct" : i === picked ? "wrong" : "dim";
          return (
            <button key={i} className={`option ${state}`} onClick={() => choose(i)} disabled={answered}>
              <span className="letter">{answered && state === "correct" ? <Check size={14} /> : answered && state === "wrong" ? <X size={14} /> : LETTERS[i]}</span>
              <span>{opt}</span>
            </button>
          );
        })}
      </div>
      {answered && (
        <div className={`explain ${picked === q.answer_index ? "ok" : "bad"}`}>
          <strong>{picked === q.answer_index ? "Correct!" : "Not quite."}</strong> {q.explanation}
        </div>
      )}
      {error && <div className="inline-error">{error}</div>}
      <div className="row between wrap gap">
        <div className="row gap">
          {step > 0 && <button className="btn btn-ghost btn-sm" onClick={() => setStep(step - 1)}>Back</button>}
          {answeredCount > 0 && answeredCount < total && (
            <button className="btn btn-ghost btn-sm" onClick={finish}><Flag size={14} /> Finish now ({score}/{answeredCount})</button>
          )}
        </div>
        <div className="row gap">
          {step < total - 1 && (answered || true) && (
            <button className={`btn ${answered ? "" : "btn-ghost"}`} onClick={() => setStep(step + 1)}>{answered ? "Next" : "Skip"} <ArrowRight size={15} /></button>
          )}
          {step === total - 1 && answeredCount > 0 && (
            <button className="btn" onClick={finish}>See results <Trophy size={15} /></button>
          )}
        </div>
      </div>
    </div>
  );
}
