import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "./AuthContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import ErrorModal from "./ErrorModal";

const KanbanBoard = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) {
      console.log("KanbanBoard: No user, redirecting to login");
      navigate("/login");
      return;
    }

    const fetchTasks = async () => {
      try {
        const headers = { Authorization: `Bearer ${user.token}` };
        const res = await axios.get("http://localhost:5000/api/tasks", {
          headers,
        });
        const filteredTasks =
          user.role === "admin"
            ? res.data
            : res.data.filter(
                (task) => !task.assignedTo || task.assignedTo._id === user.id
              );
        setTasks(filteredTasks);
      } catch (err) {
        console.error("KanbanBoard: Fetch error:", err.message);
        setError("Failed to load tasks");
      }
    };
    fetchTasks();
  }, [user, navigate]);

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      const headers = { Authorization: `Bearer ${user.token}` };
      await axios.put(
        `http://localhost:5000/api/tasks/${taskId}`,
        { status: newStatus },
        { headers }
      );
      // Refresh tasks after update
      const res = await axios.get("http://localhost:5000/api/tasks", {
        headers,
      });
      const filteredTasks =
        user.role === "admin"
          ? res.data
          : res.data.filter(
              (task) => !task.assignedTo || task.assignedTo._id === user.id
            );
      setTasks(filteredTasks);
    } catch (err) {
      console.error("KanbanBoard: Update status error:", err.message);
      setError("Failed to update task status");
    }
  };

  const columns = {
    "To-Do": tasks.filter((task) => task.status === "To Do"),
    "On Progress": tasks.filter((task) => task.status === "In Progress"),
    "In Review": tasks.filter((task) => task.status === "In Review"),
    Completed: tasks.filter((task) => task.status === "Done"),
  };

  return (
    <div className="kanban-board">
      <div className="kanban-columns">
        {Object.keys(columns).map((column) => (
          <div key={column} className="kanban-column">
            <h2 className="column-title">{column}</h2>
            <div className="task-cards">
              {columns[column].map((task) => (
                <div key={task._id} className="task-card">
                  <span className="task-title">{task.title}</span>
                  <span className="task-progress">
                    Status:
                    <select
                      value={task.status}
                      onChange={(e) =>
                        handleStatusChange(task._id, e.target.value)
                      }
                      className="status-select"
                    >
                      <option value="To Do">To Do</option>
                      <option value="In Progress">In Progress</option>
                      <option value="In Review">In Review</option>
                      <option value="Done">Done</option>
                    </select>
                  </span>
                  <span className="task-assignee">
                    Assignee: {task.assignedTo?.name || "Unassigned"}
                  </span>
                  <span className="task-deadline">
                    Deadline: {task.dueDate || "N/A"}
                  </span>
                </div>
              ))}
              <button className="add-task-button">+ Add new</button>
            </div>
          </div>
        ))}
      </div>
      <ErrorModal message={error} onClose={() => setError("")} />
    </div>
  );
};

export default KanbanBoard;
