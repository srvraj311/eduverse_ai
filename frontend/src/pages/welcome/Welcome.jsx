import { useState } from "react";
import { Tab, Tabs, Button, Form, Modal, Alert, Spinner } from "react-bootstrap";
import { FcGoogle } from "react-icons/fc";
import { useNavigate } from "react-router-dom";
import { login, signup } from "../../api";
import "./welcome.scss";
import { FaUserGraduate, FaRocket, FaChartLine } from "react-icons/fa";

const Welcome = () => {
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const clearForm = () => {
    setName("");
    setEmail("");
    setPassword("");
    setError(null);
  };

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Email and Password are required!");
      return;
    }
    setLoading(true);
    try {
      const data = await login(email, password);
      console.log("Login Success:", data);
      localStorage.setItem("username", email);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async () => {
    if (!name || !email || !password) {
      setError("All fields are required!");
      return;
    }
    setLoading(true);
    try {
      const data = await signup(name, email, password);
      console.log("Signup Success:", data);
      setActiveTab("login");
      clearForm();
    } catch (err) {
      setError(err.message || "Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="welcome-container">
      {/* Background Section */}
      <div className="hero-section">
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <h1>Welcome to Eduverse.ai</h1>
          <p>
            Empower your learning with personalized AI-driven learning paths. 
            Designed to adapt to your needs and help you grow.
          </p>
          <Button variant="primary" size="lg" onClick={() => setShowModal(true)}>
            Get Started
          </Button>
        </div>
      </div>

      {/* Features Section */}
      <div className="features-section">
        <h2>Why Choose Eduverse.ai?</h2>
        <div className="features">
          <div className="feature-card">
            <FaUserGraduate className="icon" />
            <h3>🎯 Personalized Learning</h3>
            <p>Get a custom learning path based on your goals and interests.</p>
          </div>
          <div className="feature-card">
            <FaRocket className="icon" />
            <h3>🚀 AI-Powered Recommendations</h3>
            <p>Leverage AI to suggest the best resources and learning material.</p>
          </div>
          <div className="feature-card">
            <FaChartLine className="icon" />
            <h3>📊 Progress Tracking</h3>
            <p>Track your learning journey and achieve your goals efficiently.</p>
          </div>
        </div>
      </div>

      {/* Modal Section */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>{activeTab === "login" ? "Login to Eduverse.ai" : "Create an Account"}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          <Tabs activeKey={activeTab} onSelect={(k) => { setActiveTab(k); clearForm(); }} className="mb-3">

            {/* Login Tab */}
            <Tab eventKey="login" title="Login">
              <Form>
                <Form.Group className="mb-3">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    placeholder="Enter email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Password</Form.Label>
                  <Form.Control
                    type="password"
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </Form.Group>
                <Button
                  variant="primary"
                  className="w-100 mb-2"
                  onClick={handleLogin}
                  disabled={loading}
                >
                  {loading ? <Spinner size="sm" animation="border" /> : "Login"}
                </Button>
                <Button variant="outline-dark" className="w-100">
                  <FcGoogle className="me-2" /> Sign in with Google
                </Button>
              </Form>
            </Tab>

            {/* Signup Tab */}
            <Tab eventKey="signup" title="Sign Up">
              <Form>
                <Form.Group className="mb-3">
                  <Form.Label>Name</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    placeholder="Enter email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Password</Form.Label>
                  <Form.Control
                    type="password"
                    placeholder="Create password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </Form.Group>
                <Button
                  variant="success"
                  className="w-100 mb-2"
                  onClick={handleSignup}
                  disabled={loading}
                >
                  {loading ? <Spinner size="sm" animation="border" /> : "Sign Up"}
                </Button>
                <Button variant="outline-dark" className="w-100">
                  <FcGoogle className="me-2" /> Sign up with Google
                </Button>
              </Form>
            </Tab>
          </Tabs>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default Welcome;
