import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "./AuthContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import ErrorModal from "./ErrorModal";
import "../styles/analyticsDashboard.css";

const AnalyticsDashboard = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      console.log("AnalyticsDashboard: No user, redirecting to login");
      navigate("/login");
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        const headers = { Authorization: `Bearer ${user.token}` };
        const [tasksRes, projectsRes] = await Promise.all([
          axios.get("https://task-manager-g1g8.onrender.com/api/tasks", {
            headers,
          }),
          axios.get("https://task-manager-g1g8.onrender.com/api/projects", {
            headers,
          }),
        ]);
        console.log("AnalyticsDashboard: Fetched data", {
          tasks: tasksRes.data.length,
          projects: projectsRes.data.length,
        });

        // Filter tasks for members to show only assigned tasks
        const filteredTasks =
          user.role === "admin"
            ? tasksRes.data
            : tasksRes.data.filter((task) => task.assignedTo?._id === user.id);

        setTasks(filteredTasks);
        setProjects(projectsRes.data);
      } catch (err) {
        console.error("AnalyticsDashboard: Fetch error:", {
          message: err.message,
          response: err.response?.data,
          status: err.response?.status,
        });
        setError("Failed to load analytics data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user, navigate]);

  const taskStatusCounts = {
    "To Do": tasks.filter((task) => task.status === "To Do").length,
    "In Progress": tasks.filter((task) => task.status === "In Progress").length,
    Done: tasks.filter((task) => task.status === "Done").length,
  };

  const projectCompletionRates = projects.map((project) => {
    const projectTasks = tasks.filter(
      (task) => task.projectId?._id === project._id
    );
    const totalTasks = projectTasks.length;
    const completedTasks = projectTasks.filter(
      (task) => task.status === "Done"
    ).length;
    return {
      name: project.name,
      completionRate:
        totalTasks > 0 ? ((completedTasks / totalTasks) * 100).toFixed(2) : 0,
      totalTasks,
      completedTasks,
    };
  });

  return (
    <div className="analytics-dashboard-container">
      <div className="header">
        <h1 className="title">Analytics Dashboard</h1>
        <button className="back-button" onClick={() => navigate("/dashboard")}>
          Back to Dashboard
        </button>
      </div>
      {loading ? (
        <div className="loading-message">Loading analytics...</div>
      ) : (
        <>
          <div className="task-status-section">
            <h2 className="section-title">Task Status Distribution</h2>
            <div className="status-counts">
              <p className="status-item">To Do: {taskStatusCounts["To Do"]}</p>
              <p className="status-item">
                In Progress: {taskStatusCounts["In Progress"]}
              </p>
              <p className="status-item">Done: {taskStatusCounts["Done"]}</p>
            </div>
          </div>
          <div className="project-completion-section">
            <h2 className="section-title">Project Completion Rates</h2>
            {projectCompletionRates.length === 0 ? (
              <p className="no-data">No projects found.</p>
            ) : (
              <ul className="project-rates-list">
                {projectCompletionRates.map((project) => (
                  <li key={project.name} className="project-rate-item">
                    <span className="project-name">{project.name}</span>
                    <span className="completion-rate">
                      Completion Rate: {project.completionRate}%
                    </span>
                    <span className="task-stats">
                      ({project.completedTasks}/{project.totalTasks} tasks
                      completed)
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
      <ErrorModal message={error} onClose={() => setError("")} />
    </div>
  );
};

export default AnalyticsDashboard;
