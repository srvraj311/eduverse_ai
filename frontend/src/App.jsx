import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import Dashboard from "./pages/Dashboard/Dashboard";
import ChatScreen from "./pages/Dashboard/ChatScreen/ChatScreen"; // Example nested route
import Welcome from "./pages/welcome/Welcome";
import "./App.scss";
import Header from "./pages/Header/Header";

const isAuthenticated = () => {
  return !!localStorage.getItem("token"); // Check if token exists
};

// Protected Route Component
const ProtectedRoute = ({ element }) => {
  return isAuthenticated() ? element : <Navigate to="/welcome" replace />;
};

const App = () => {
  return (
    <>
      <Header />
      <Router>
        <Routes>
          {/* Redirect root based on authentication */}
          <Route path="/" element={isAuthenticated() ? <Navigate to="/dashboard" replace /> : <Navigate to="/welcome" replace />} />

          {/* Welcome route for sign-in or login */}
          <Route path="/welcome" element={<Welcome />} />

          {/* Protected Dashboard route */}
          <Route path="/dashboard" element={<ProtectedRoute element={<Dashboard />} />}>
            <Route index element={<ChatScreen />} />
            {/* Add more nested routes here if needed */}
          </Route>
          {/* Add other routes here if needed */}
        </Routes>
      </Router>
    </>
  );
};

export default App;