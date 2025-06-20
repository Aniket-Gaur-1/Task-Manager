import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "./AuthContext";
import { useNavigate, Outlet, useLocation } from "react-router-dom";
import axios from "axios";
import "../styles/layout.css";

const Layout = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [deadlines, setDeadlines] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) {
      console.log("Layout: No user, redirecting to login");
      navigate("/login");
      return;
    }

    const fetchDeadlines = async () => {
      try {
        const headers = { Authorization: `Bearer ${user.token}` };
        const res = await axios.get(
          "https://task-manager-20l8.onrender.com/api/projects",
          {
            headers,
          }
        );
        // Assuming projects have a dueDate field for simplicity
        const projectDeadlines = res.data.map((project) => ({
          name: project.name,
          dueDate: project.dueDate || "No Due Date",
        }));
        setDeadlines(projectDeadlines);
      } catch (err) {
        console.error("Layout: Fetch deadlines error:", err.message);
        setError("Failed to load deadlines");
      }
    };
    fetchDeadlines();
  }, [user, navigate]);

  const handleLogout = () => {
    // Assume logout logic here
    navigate("/login");
  };

  const activeView = location.pathname.split("/").pop() || "kanban";

  return (
    <div className="layout-container">
      <aside className="sidebar">
        <div className="sidebar-header">
          <span className="user-name">
            {user?.name || "Guest"} ({user?.email || ""})
          </span>
        </div>
        <nav className="sidebar-nav">
          <button
            className={`nav-item ${activeView === "dashboard" ? "active" : ""}`}
            onClick={() => navigate("/dashboard")}
          >
            Dashboard
          </button>

          <div className="nav-section">
            <span className="section-title">Deadlines</span>
            {deadlines.map((deadline, index) => (
              <button
                key={index}
                className="nav-item"
                onClick={() => navigate(`/projects/${deadline.name}`)}
              >
                {deadline.name} ({deadline.dueDate})
              </button>
            ))}
          </div>
          <button className="nav-item" onClick={handleLogout}>
            Logout
          </button>
        </nav>
      </aside>
      <div className="main-content">
        <header className="top-bar">
          <div className="project-info">
            <span className="project-name">Task Manager</span>
          </div>
          <div className="view-options">
            <button
              className={`view-button ${
                activeView === "kanban" ? "active" : ""
              }`}
              onClick={() => navigate("/kanban")}
            >
              Kanban
            </button>
            <button
              className={`view-button ${
                activeView === "calendar" ? "active" : ""
              }`}
              onClick={() => navigate("/calendar")}
            >
              Calendar
            </button>
          </div>
        </header>
        <main className="content-area">
          <Outlet />
        </main>
      </div>
      {error && <div className="error-message">{error}</div>}
    </div>
  );
};

export default Layout;
