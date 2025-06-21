import React, { useState, useContext } from "react";
import { AuthContext } from "./AuthContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const CreateProject = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: "", description: "" });
  const [error, setError] = useState("");

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const headers = { Authorization: `Bearer ${user.token}` };
      const response = await axios.post(
        "https://task-manager-20l8.onrender.com/api/projects",
        formData,
        { headers }
      );
      console.log("Project creation response:", response.data);
      navigate("/dashboard");
    } catch (err) {
      console.error("Create project error:", err.response?.data || err.message);
      setError(err.response?.data?.message || "Failed to create project");
    }
  };

  return (
    <div className="create-project-container">
      <div className="header">
        <h1 className="title">Create Project</h1>
        <button className="back-button" onClick={() => navigate("/dashboard")}>
          Back
        </button>
      </div>
      <div className="form-container">
        <form className="project-form" onSubmit={handleSubmit}>
          <input
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Name"
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
          <button type="submit" className="submit-button">
            Create
          </button>
          {error && <div className="error-message">{error}</div>}
        </form>
      </div>
    </div>
  );
};

export default CreateProject;
