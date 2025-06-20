import React, { useState, useContext } from "react";
import { AuthContext } from "./AuthContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import ErrorModal from "./ErrorModal";
import "../styles/createProject.css";

const CreateProject = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: "", description: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      const headers = { Authorization: `Bearer ${user.token}` };
      const response = await axios.post(
        "https://task-manager-20l8.onrender.com/api/projects",
        formData,
        { headers }
      );
      console.log("CreateProject: Project created", response.data);
      setSuccess("Project created successfully");
      setTimeout(() => navigate("/dashboard"), 2000);
    } catch (err) {
      console.error("CreateProject: Submit error:", err.message);
      setError(err.response?.data?.message || "Failed to create project");
    }
  };

  return (
    <div className="create-project-container">
      <div className="header">
        <h1 className="title">Create Project</h1>
        <button className="back-button" onClick={() => navigate("/dashboard")}>
          Back to Dashboard
        </button>
      </div>
      <div className="form-container">
        <form className="project-form" onSubmit={handleSubmit}>
          <input
            className="input-field"
            name="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Project Name"
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
          <button className="submit-button" type="submit">
            Create Project
          </button>
        </form>
      </div>
      <ErrorModal message={error} onClose={() => setError("")} />
      {success && <div className="success-message">{success}</div>}
    </div>
  );
};

export default CreateProject;
