import { useCallback, useState } from "react";
import { BookOpenCheck, GraduationCap, Loader2, Route, Sparkles } from "lucide-react";
import { useAuth } from "../auth.jsx";
import GoogleButton from "../components/GoogleButton.jsx";

const FEATURES = [
  { icon: Sparkles, title: "Ask anything", text: "Clear, friendly explanations with examples, code and maths.", hue: "blue" },
  { icon: BookOpenCheck, title: "Instant quizzes", text: "Test yourself with interactive questions and feedback.", hue: "purple" },
  { icon: Route, title: "Personal study plans", text: "Week-by-week roadmaps sized to your time.", hue: "green" },
];

export default function Auth() {
  const { login, signup, loginWithGoogle } = useAuth();
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const onGoogle = useCallback(
    async (credential) => {
      setError("");
      try {
        await loginWithGoogle(credential);
      } catch (err) {
        setError(err.message);
      }
    },
    [loginWithGoogle],
  );

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (mode === "login") await login(form.email, form.password);
      else await signup(form.name, form.email, form.password);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth">
      <section className="hero">
        <span className="brand-mark big"><GraduationCap size={30} /></span>
        <h1>Learn anything.<br /><span className="grad">Your way.</span></h1>
        <p>Eduverse is your personal AI tutor: ask questions, take quizzes and follow study plans built around you.</p>
        <div className="features">
          {FEATURES.map(({ icon: Icon, title, text, hue }) => (
            <div key={title} className={`feature glass hue-${hue}`}>
              <span className="feature-icon"><Icon size={20} /></span>
              <div>
                <strong>{title}</strong>
                <p>{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <form className="auth-card glass" onSubmit={submit}>
        <div className="seg" role="tablist">
          <button type="button" role="tab" aria-selected={mode === "login"} className={mode === "login" ? "on" : ""} onClick={() => setMode("login")}>Sign in</button>
          <button type="button" role="tab" aria-selected={mode === "signup"} className={mode === "signup" ? "on" : ""} onClick={() => setMode("signup")}>Create account</button>
        </div>
        <h2>{mode === "login" ? "Welcome back" : "Start learning"}</h2>
        {mode === "signup" && (
          <label>
            Name
            <input value={form.name} onChange={set("name")} autoComplete="name" required maxLength={80} placeholder="Ada Lovelace" />
          </label>
        )}
        <label>
          Email
          <input type="email" value={form.email} onChange={set("email")} autoComplete="email" required placeholder="you@example.com" />
        </label>
        <label>
          Password
          <input type="password" value={form.password} onChange={set("password")} autoComplete={mode === "login" ? "current-password" : "new-password"} required minLength={mode === "signup" ? 6 : 1} placeholder={mode === "signup" ? "At least 6 characters" : "••••••••"} />
        </label>
        {error && <div className="inline-error" role="alert">{error}</div>}
        <button className="btn btn-lg" disabled={busy}>
          {busy ? <Loader2 size={18} className="spin" /> : mode === "login" ? "Sign in" : "Create account"}
        </button>
        <GoogleButton onCredential={onGoogle} onError={setError} />
      </form>
    </div>
  );
}
