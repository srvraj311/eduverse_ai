import { useState } from "react";
import { Check, LogOut, Moon, Sun } from "lucide-react";
import { api } from "../api";
import { useAuth } from "../auth.jsx";

const ROLES = ["Student", "Teacher", "Professional", "Self-learner"];
const AGES = ["Under 10", "10-14", "15-17", "18-25", "26-40", "40+"];
const LANGS = ["English", "Hindi", "Spanish", "French", "German", "Portuguese", "Arabic", "Bengali", "Tamil", "Japanese", "Chinese"];

function currentTheme() {
  return document.documentElement.dataset.theme || (matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");
}

export default function Profile() {
  const { user, setUser, logout } = useAuth();
  const [prefs, setPrefs] = useState(user.preferences);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [theme, setTheme] = useState(currentTheme);

  const set = (k) => (e) => {
    setSaved(false);
    setPrefs((p) => ({ ...p, [k]: k === "timeValue" ? Number(e.target.value) : e.target.value }));
  };

  const save = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await api.savePreferences(prefs);
      setUser((u) => ({ ...u, preferences: res }));
      setSaved(true);
    } catch (err) {
      setError(err.message);
    }
  };

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem("theme", next); } catch { /* private mode */ }
    setTheme(next);
  };

  return (
    <div className="page">
      <header className="page-head">
        <h1>Profile</h1>
        <p className="muted">These settings shape how your tutor explains things.</p>
      </header>

      <section className="glass panel profile-card">
        <span className="me-avatar xl">{user.name?.[0]?.toUpperCase()}</span>
        <div>
          <h2>{user.name}</h2>
          <p className="muted">{user.username}</p>
        </div>
      </section>

      <form className="glass panel form" onSubmit={save}>
        <h3>Learning preferences</h3>
        <div className="grid2">
          <label>I am a
            <select value={prefs.userRole} onChange={set("userRole")}>{ROLES.map((r) => <option key={r}>{r}</option>)}</select>
          </label>
          <label>Age group
            <select value={prefs.ageGroup} onChange={set("ageGroup")}>{AGES.map((r) => <option key={r}>{r}</option>)}</select>
          </label>
          <label>Language
            <select value={prefs.language} onChange={set("language")}>{LANGS.map((r) => <option key={r}>{r}</option>)}</select>
          </label>
          <label>Daily study time: <b>{prefs.timeValue} h</b>
            <input type="range" min="0.5" max="8" step="0.5" value={prefs.timeValue} onChange={set("timeValue")} />
          </label>
        </div>
        {error && <div className="inline-error">{error}</div>}
        <div className="row gap">
          <button className="btn">Save changes</button>
          {saved && <span className="ok-text"><Check size={16} /> Saved</span>}
        </div>
      </form>

      <section className="glass panel row between">
        <div>
          <h3>Appearance</h3>
          <p className="muted small">Switch between light and dark.</p>
        </div>
        <button className="btn btn-ghost" onClick={toggleTheme}>{theme === "dark" ? <Sun size={16} /> : <Moon size={16} />} {theme === "dark" ? "Light" : "Dark"}</button>
      </section>

      <button className="btn btn-ghost danger" onClick={logout}><LogOut size={16} /> Sign out</button>
    </div>
  );
}
