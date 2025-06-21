import React, { useContext, useState, useEffect } from "react";
import { AuthContext } from "./AuthContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const AddTask = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: "To Do",
    dueDate: "",
    assignedTo: "",
    projectId: "",
  });
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const fetchUsersAndProjects = async () => {
      try {
        const headers = { Authorization: `Bearer ${user.token}` };
        const [usersRes, projectsRes] = await Promise.all([
          axios.get("https://task-manager-20l8.onrender.com/api/users/users", {
            headers,
          }),
          axios.get("https://task-manager-20l8.onrender.com/api/projects", {
            headers,
          }),
        ]);
        setUsers(usersRes.data);
        setProjects(projectsRes.data);
      } catch (err) {
        console.error(
          "AddTask: Fetch users/projects error:",
          err.response?.data || err.message
        );
        setError("Failed to load users or projects");
      }
    };
    if (user) fetchUsersAndProjects();
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const headers = { Authorization: `Bearer ${user.token}` };
      const payload = {
        title: formData.title,
        description: formData.description || "",
        status: formData.status,
        dueDate: formData.dueDate
          ? new Date(formData.dueDate).toISOString()
          : null,
        assignedTo: formData.assignedTo || null,
        projectId: formData.projectId || null,
      };
      const response = await axios.post(
        "https://task-manager-20l8.onrender.com/api/tasks",
        payload,
        { headers }
      );
      console.log("Task creation response:", response.data);
      setSuccess("Task created successfully");
      setTimeout(() => navigate("/kanban"), 1000);
    } catch (err) {
      console.error(
        "AddTask: Create task error:",
        err.response?.data || err.message
      );
      setError(err.response?.data?.message || "Failed to create task");
    }
  };

  return (
    <div className="add-task-container">
      <div className="header">
        <h1 className="title">Add Task</h1>
        <button className="back-button" onClick={() => navigate("/dashboard")}>
          Back
        </button>
      </div>
      <div className="form-container">
        <form className="task-form" onSubmit={handleSubmit}>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Task Title"
            className="input-field"
            required
          />
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Description"
            className="textarea-field"
          />
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="input-field"
          >
            <option value="To Do">To Do</option>
            <option value="In Progress">In Progress</option>
            <option value="In Review">In Review</option>
            <option value="Done">Done</option>
          </select>
          <input
            type="date"
            name="dueDate"
            value={formData.dueDate}
            onChange={handleChange}
            className="input-field"
          />
          <select
            name="assignedTo"
            value={formData.assignedTo}
            onChange={handleChange}
            className="input-field"
          >
            <option value="">Unassigned</option>
            {users.map((u) => (
              <option key={u._id} value={u._id}>
                {u.name || u.email}
              </option>
            ))}
          </select>
          <select
            name="projectId"
            value={formData.projectId}
            onChange={handleChange}
            className="input-field"
          >
            <option value="">No Project</option>
            {projects.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name}
              </option>
            ))}
          </select>
          <button type="submit" className="submit-button">
            Create Task
          </button>
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}
        </form>
      </div>
    </div>
  );
};

export default AddTask;
