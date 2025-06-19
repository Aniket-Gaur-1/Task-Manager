import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "./AuthContext";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import ErrorModal from "./ErrorModal";
import "../styles/dashboard.css";

const EditProject = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const { id } = useParams();
  const [formData, setFormData] = useState({ name: "", description: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!user || user.role !== "admin") {
      console.log("EditProject: Unauthorized, redirecting to dashboard");
      navigate("/dashboard");
      return;
    }
    const fetchProject = async () => {
      try {
        const headers = { Authorization: `Bearer ${user.token}` };
        const res = await axios.get(
          `https://task-manager-ht8a.onrender.com/api/projects/${id}`,
          { headers }
        );
        setFormData({
          name: res.data.name,
          description: res.data.description || "",
        });
        console.log("EditProject: Fetched project", { id });
      } catch (err) {
        console.error("EditProject: Fetch error:", err.message);
        setError("Failed to load project");
      }
    };
    fetchProject();
  }, [user, navigate, id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      const headers = { Authorization: `Bearer ${user.token}` };
      await axios.put(
        `https://task-manager-ht8a.onrender.com/api/projects/${id}`,
        formData,
        {
          headers,
        }
      );
      setSuccess("Project updated successfully");
      setTimeout(() => navigate("/projects"), 2000);
    } catch (err) {
      console.error("EditProject: Update error:", err.message);
      setError("Failed to update project");
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "20px",
        }}
      >
        <h1>Edit Project</h1>
        <button
          onClick={() => navigate("/dashboard")}
          style={{
            padding: "8px",
            background: "#007bff",
            color: "#fff",
            border: "none",
            borderRadius: "3px",
          }}
        >
          Back to Dashboard
        </button>
      </div>
      <div
        style={{
          padding: "10px",
          border: "1px solid #ccc",
          borderRadius: "5px",
        }}
      >
        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: "10px" }}
        >
          <input
            name="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Project Name"
            style={{
              padding: "8px",
              border: "1px solid #ccc",
              borderRadius: "3px",
            }}
            required
          />
          <textarea
            name="description"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            placeholder="Description"
            style={{
              padding: "8px",
              border: "1px solid #ccc",
              borderRadius: "3px",
            }}
          />
          <button
            type="submit"
            style={{
              padding: "8px",
              background: "#007bff",
              color: "#fff",
              border: "none",
              borderRadius: "3px",
            }}
          >
            Update Project
          </button>
        </form>
      </div>
      <ErrorModal message={error} onClose={() => setError("")} />
      {success && (
        <div
          style={{
            position: "fixed",
            top: "20px",
            right: "20px",
            padding: "10px",
            background: "#28a745",
            color: "#fff",
            borderRadius: "3px",
          }}
        >
          {success}
        </div>
      )}
    </div>
  );
};

export default EditProject;
