import { NavLink, Outlet } from "react-router-dom";
import { GraduationCap, MessageCircle, Route, Trophy, UserRound } from "lucide-react";
import { useAuth } from "../auth.jsx";
import { ChatProvider } from "../chat.jsx";

const NAV = [
  { to: "/", label: "Tutor", icon: MessageCircle, end: true },
  { to: "/plans", label: "My plans", icon: Route },
  { to: "/results", label: "Results", icon: Trophy },
  { to: "/profile", label: "Profile", icon: UserRound },
];

export default function Shell() {
  const { user } = useAuth();
  return (
    <ChatProvider>
      <div className="shell">
        <nav className="sidebar glass" aria-label="Main">
          <div className="brand">
            <span className="brand-mark"><GraduationCap size={20} /></span>
            <span className="brand-name">Eduverse<b>.ai</b></span>
          </div>
          <ul>
            {NAV.map(({ to, label, icon: Icon, end }) => (
              <li key={to}>
                <NavLink to={to} end={end} className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
                  <Icon size={20} />
                  <span>{label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
          <NavLink to="/profile" className="me">
            <span className="me-avatar">{user.name?.[0]?.toUpperCase() ?? "U"}</span>
            <span className="me-text">
              <strong>{user.name}</strong>
              <small>{user.username}</small>
            </span>
          </NavLink>
        </nav>
        <main className="content">
          <Outlet />
        </main>
      </div>
    </ChatProvider>
  );
}
