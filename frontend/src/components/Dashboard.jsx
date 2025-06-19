import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "./AuthContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import ErrorModal from "./ErrorModal";

const Dashboard = () => {
  const { user, setUser } = useContext(AuthContext); // Added setUser
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [activities, setActivities] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      if (!isMounted) return;

      setLoading(true);
      try {
        if (!user) {
          const token = localStorage.getItem("token");
          if (token) {
            try {
              const headers = { Authorization: `Bearer ${token}` };
              const res = await axios.get(
                "http://localhost:5000/api/auth/verify",
                { headers }
              );
              // Rely on AuthContext to set user
            } catch (err) {
              console.log(
                "Dashboard: Token verification failed, redirecting to login"
              );
              if (isMounted) navigate("/login");
              return;
            }
          } else {
            console.log("Dashboard: No token, redirecting to login");
            if (isMounted) navigate("/login");
            return;
          }
        }

        if (user && isMounted) {
          const headers = { Authorization: `Bearer ${user.token}` };
          const [projectsRes, tasksRes, activitiesRes] = await Promise.all([
            axios.get("http://localhost:5000/api/projects", { headers }),
            axios.get("http://localhost:5000/api/tasks", { headers }),
            axios.get("http://localhost:5000/api/activity", { headers }),
          ]);
          console.log("Projects data:", projectsRes.data); // Debug project structure
          const filteredProjects =
            user.role === "admin"
              ? projectsRes.data
              : projectsRes.data.filter((project) =>
                  project.members?.includes(user.id)
                );
          const filteredTasks =
            user.role === "admin"
              ? tasksRes.data
              : tasksRes.data.filter(
                  (task) => !task.assignedTo || task.assignedTo._id === user.id
                );
          if (isMounted) {
            setProjects(filteredProjects);
            setTasks(filteredTasks);
            setActivities(activitiesRes.data.slice(0, 5));
            console.log("Filtered projects:", filteredProjects);
          }
        }
      } catch (err) {
        console.error("Dashboard: Fetch error:", err.message);
        if (isMounted) setError("Failed to load dashboard data");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [user, navigate]); // Only re-run on user or navigate change

  const handleLogout = async () => {
    try {
      await axios.post(
        "http://localhost:5000/api/logout",
        {},
        { withCredentials: true }
      );
      setUser(null); // Now defined
      localStorage.removeItem("token");
      navigate("/login");
    } catch (err) {
      console.error("Dashboard: Logout error:", err.message);
      setError("Failed to logout");
    }
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <p className="loading-message">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="header">
        <h1 className="title">Dashboard</h1>
        <button className="logout-button" onClick={handleLogout}>
          Logout
        </button>
      </div>
      <div className="actions">
        <button className="action-button" onClick={() => navigate("/kanban")}>
          View Kanban Board
        </button>
        <button
          className="action-button"
          onClick={() => navigate("/analytics")}
        >
          View Analytics Dashboard
        </button>
        {user && user.role === "admin" && (
          <>
            <button
              className="action-button"
              onClick={() => navigate("/add-task")}
            >
              Add Task
            </button>
            <button
              className="action-button"
              onClick={() => navigate("/create-project")}
            >
              Create Project
            </button>
          </>
        )}
        <button className="action-button" onClick={() => navigate("/profile")}>
          View Profile
        </button>
        <button className="action-button" onClick={() => navigate("/activity")}>
          View Activity Log
        </button>
        <button className="action-button" onClick={() => navigate("/calendar")}>
          View Calendar
        </button>
      </div>
      <div className="projects-section">
        <h2 className="section-title">Your Projects</h2>
        {projects.length === 0 ? (
          <p className="no-data">No projects found.</p>
        ) : (
          <ul className="projects-list">
            {projects.map((project) => (
              <li key={project._id} className="project-item">
                <button
                  className="project-link"
                  onClick={() => navigate(`/kanban?projectId=${project._id}`)}
                >
                  {project.name}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="tasks-section">
        <h2 className="section-title">
          {user && user.role === "admin" ? "All Tasks" : "Assigned Tasks"}
        </h2>
        {tasks.length === 0 ? (
          <p className="no-data">No tasks found.</p>
        ) : (
          <ul className="tasks-list">
            {tasks.slice(0, 5).map((task) => (
              <li key={task._id} className="task-item">
                <div className="task-details">
                  <span className="task-title">{task.title}</span>
                  <span className="task-status">Status: {task.status}</span>
                  <span className="task-project">
                    Project: {task.projectId?.name || "None"}
                  </span>
                  <span className="task-assignee">
                    Assigned To: {task.assignedTo?.name || "Unassigned"}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="activities-section">
        <h2 className="section-title">Recent Activity</h2>
        {activities.length === 0 ? (
          <p className="no-data">No recent activity.</p>
        ) : (
          <ul className="activities-list">
            {activities.map((activity) => (
              <li key={activity._id} className="activity-item">
                <span className="activity-action">{activity.action}</span>
                <span className="activity-timestamp">
                  {new Date(activity.timestamp).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
      <ErrorModal message={error} onClose={() => setError("")} />
    </div>
  );
};

export default Dashboard;
