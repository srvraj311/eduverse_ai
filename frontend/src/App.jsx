import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./auth.jsx";
import Background from "./components/Background.jsx";
import Shell from "./pages/Shell.jsx";
import Auth from "./pages/Auth.jsx";
import Chat from "./pages/Chat.jsx";

const Plans = lazy(() => import("./pages/Plans.jsx"));
const Results = lazy(() => import("./pages/Results.jsx"));
const Profile = lazy(() => import("./pages/Profile.jsx"));

export default function App() {
  const { user, loading } = useAuth();
  return (
    <>
      <Background />
      {loading ? (
        <div className="splash"><div className="orb" /></div>
      ) : (
        <Suspense fallback={<div className="splash"><div className="orb" /></div>}>
          <Routes>
            <Route path="/welcome" element={user ? <Navigate to="/" replace /> : <Auth />} />
            <Route element={user ? <Shell /> : <Navigate to="/welcome" replace />}>
              <Route index element={<Chat />} />
              <Route path="plans" element={<Plans />} />
              <Route path="results" element={<Results />} />
              <Route path="profile" element={<Profile />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      )}
    </>
  );
}
