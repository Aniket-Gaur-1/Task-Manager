import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "./AuthContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import io from "socket.io-client";
import ErrorModal from "./ErrorModal";

const socket = io("https://task-manager-ht8a.onrender.com");

const ProjectsList = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) {
      console.log("ProjectsList: No user, redirecting to login");
      navigate("/login");
      return;
    }
    const fetchProjects = async () => {
      try {
        const headers = { Authorization: `Bearer ${user.token}` };
        const res = await axios.get(
          "https://task-manager-ht8a.onrender.com/api/projects",
          {
            headers,
          }
        );
        setProjects(res.data);
        console.log("ProjectsList: Fetched projects", {
          count: res.data.length,
        });
      } catch (err) {
        console.error("ProjectsList: Fetch error:", err.message);
        setError("Failed to load projects");
      }
    };
    fetchProjects();

    socket.on("projectCreated", (project) => {
      if (project.createdBy === user.id) {
        setProjects((prev) => [...prev, project]);
        console.log("ProjectsList: Project created via socket", { project });
      }
    });

    socket.on("projectUpdated", (project) => {
      if (project.createdBy === user.id) {
        setProjects((prev) =>
          prev.map((p) => (p._id === project._id ? project : p))
        );
        console.log("ProjectsList: Project updated via socket", { project });
      }
    });

    return () => {
      socket.off("projectCreated");
      socket.off("projectUpdated");
    };
  }, [user, navigate]);

  return (
    <div style={{ padding: "20px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "20px",
        }}
      >
        <h1>Projects</h1>
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
        <h2>Project List</h2>
        {projects.length === 0 ? (
          <p>No projects found.</p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0 }}>
            {projects.map((project) => (
              <li
                key={project._id}
                style={{
                  padding: "5px 0",
                  borderBottom: "1px solid #eee",
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <span>
                  {project.name} - {project.description || "No description"}
                </span>
                <div style={{ display: "flex", gap: "10px" }}>
                  {user.role === "admin" && (
                    <button
                      onClick={() => navigate(`/edit-project/${project._id}`)}
                      style={{
                        padding: "5px",
                        background: "#6f42c1",
                        color: "#fff",
                        border: "none",
                        borderRadius: "3px",
                      }}
                    >
                      Edit
                    </button>
                  )}
                  <button
                    onClick={() => navigate(`/kanban?projectId=${project._id}`)}
                    style={{
                      padding: "5px",
                      background: "#17a2b8",
                      color: "#fff",
                      border: "none",
                      borderRadius: "3px",
                    }}
                  >
                    View Tasks
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      <ErrorModal message={error} onClose={() => setError("")} />
    </div>
  );
};

export default ProjectsList;
