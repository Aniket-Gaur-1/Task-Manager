import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "./AuthContext";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import ErrorModal from "./ErrorModal";
import "../styles/edittask.css";

const EditTask = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const { id } = useParams();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    projectId: "",
    status: "To Do",
    dueDate: "",
    assignedTo: "",
  });
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!user || user.role !== "admin") {
      console.log("EditTask: Unauthorized, redirecting to dashboard");
      navigate("/dashboard");
      return;
    }
    const fetchData = async () => {
      try {
        const headers = { Authorization: `Bearer ${user.token}` };
        const [taskRes, projectsRes, usersRes] = await Promise.all([
          axios.get(`https://task-manager-g1g8.onrender.com/api/tasks/${id}`, {
            headers,
          }),
          axios.get("https://task-manager-g1g8.onrender.com/api/projects", {
            headers,
          }),
          axios.get("https://task-manager-g1g8.onrender.com/api/users", {
            headers,
          }),
        ]);
        const task = taskRes.data;
        console.log("EditTask: Fetched task", task);
        setFormData({
          title: task.title,
          description: task.description || "",
          projectId: task.projectId?._id || "",
          status: task.status,
          dueDate: task.dueDate
            ? new Date(task.dueDate).toISOString().split("T")[0]
            : "",
          assignedTo: task.assignedTo?._id || "",
        });
        setProjects(projectsRes.data);
        setUsers(usersRes.data);
        console.log("EditTask: Fetched data", {
          taskId: id,
          projects: projectsRes.data.length,
          users: usersRes.data.length,
        });
      } catch (err) {
        console.error("EditTask: Fetch error:", err.message);
        setError("Failed to load task, projects, or users");
      }
    };
    fetchData();
  }, [user, navigate, id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      const headers = { Authorization: `Bearer ${user.token}` };
      const taskData = {
        ...formData,
        dueDate: formData.dueDate
          ? new Date(formData.dueDate).toISOString()
          : undefined,
        assignedTo: formData.assignedTo || undefined,
      };
      console.log("EditTask: Submitting task update", taskData);
      const response = await axios.put(
        `https://task-manager-g1g8.onrender.com/api/tasks/${id}`,
        taskData,
        { headers }
      );
      console.log("EditTask: Task updated", response.data);
      setSuccess("Task updated successfully");
      setTimeout(() => navigate("/kanban"), 2000);
    } catch (err) {
      console.error("EditTask: Update error:", err.message);
      setError("Failed to update task");
    }
  };

  return (
    <div className="edit-task-container">
      <div className="header">
        <h1 className="title">Edit Task</h1>
        <button className="back-button" onClick={() => navigate("/dashboard")}>
          Back to Dashboard
        </button>
      </div>
      <div className="form-container">
        <form className="task-form" onSubmit={handleSubmit}>
          <input
            className="input-field"
            name="title"
            value={formData.title}
            onChange={(e) =>
              setFormData({ ...formData, title: e.target.value })
            }
            placeholder="Task Title"
            required
          />
          <textarea
            className="textarea-field"
            name="description"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            placeholder="Description"
          />
          <select
            className="select-field"
            name="projectId"
            value={formData.projectId}
            onChange={(e) =>
              setFormData({ ...formData, projectId: e.target.value })
            }
            required
          >
            <option value="">Select Project</option>
            {projects.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name}
              </option>
            ))}
          </select>
          <select
            className="select-field"
            name="status"
            value={formData.status}
            onChange={(e) =>
              setFormData({ ...formData, status: e.target.value })
            }
          >
            <option value="To Do">To Do</option>
            <option value="In Progress">In Progress</option>
            <option value="Done">Done</option>
          </select>
          <select
            className="select-field"
            name="assignedTo"
            value={formData.assignedTo}
            onChange={(e) =>
              setFormData({ ...formData, assignedTo: e.target.value })
            }
          >
            <option value="">Unassigned</option>
            {users.map((u) => (
              <option key={u._id} value={u._id}>
                {u.name} ({u.email})
              </option>
            ))}
          </select>
          <input
            className="date-field"
            type="date"
            name="dueDate"
            value={formData.dueDate}
            onChange={(e) =>
              setFormData({ ...formData, dueDate: e.target.value })
            }
          />
          <button className="submit-button" type="submit">
            Update Task
          </button>
        </form>
      </div>
      <ErrorModal message={error} onClose={() => setError("")} />
      {success && <div className="success-message">{success}</div>}
    </div>
  );
};

export default EditTask;
