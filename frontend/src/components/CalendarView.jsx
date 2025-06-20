import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "./AuthContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import ErrorModal from "./ErrorModal";
import "../styles/calenderView.css";

const CalenderView = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) {
      console.log("CalenderView: No user, redirecting to login");
      navigate("/login");
      return;
    }

    const fetchTasks = async () => {
      try {
        const headers = { Authorization: `Bearer ${user.token}` };
        const res = await axios.get(
          "https://task-manager-20l8.onrender.com/api/tasks",
          {
            headers,
          }
        );
        setTasks(res.data.filter((task) => task.dueDate)); // Only tasks with due dates
        console.log("CalenderView: Fetched tasks", { count: res.data.length });
      } catch (err) {
        console.error("CalenderView: Fetch error:", err.message);
        setError("Failed to load tasks");
      }
    };
    fetchTasks();
  }, [user, navigate]);

  const groupedTasks = tasks.reduce((acc, task) => {
    const date = task.dueDate
      ? new Date(task.dueDate).toLocaleDateString()
      : "No Due Date";
    if (!acc[date]) acc[date] = [];
    acc[date].push(task);
    return acc;
  }, {});

  return (
    <div className="calendar-view-container">
      <div className="header">
        <h1 className="title">Calendar View</h1>
        <button className="back-button" onClick={() => navigate("/dashboard")}>
          Back to Dashboard
        </button>
      </div>
      <div className="tasks-section">
        {Object.keys(groupedTasks).length === 0 ? (
          <p className="no-data">No tasks with due dates found.</p>
        ) : (
          Object.keys(groupedTasks)
            .sort((a, b) =>
              a === "No Due Date" ? 1 : new Date(a) - new Date(b)
            )
            .map((date) => (
              <div key={date} className="date-group">
                <h2 className="date-title">{date}</h2>
                <ul className="tasks-list">
                  {groupedTasks[date].map((task) => (
                    <li key={task._id} className="task-item">
                      <button
                        className="task-link"
                        onClick={() => navigate(`/kanban?taskId=${task._id}`)}
                      >
                        {task.title} ({task.status})
                      </button>
                      <span className="task-project">
                        Project: {task.projectId?.name || "None"}
                      </span>
                      <span className="task-assignee">
                        Assigned To: {task.assignedTo?.name || "Unassigned"}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))
        )}
      </div>
      <ErrorModal message={error} onClose={() => setError("")} />
    </div>
  );
};

export default CalenderView;
