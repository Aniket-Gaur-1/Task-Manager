import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import ErrorModal from "./ErrorModal";
import "../styles/signup.css";

const Signup = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      await axios.post("http://localhost:5000/api/register", formData);
      setSuccess("Registration successful! Redirecting to login...");
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      console.error("Signup error:", err.message);
      setError(err.response?.data?.message || "Registration failed");
    }
  };

  return (
    <div className="signup-container">
      <div className="header">
        <h1 className="title">Sign Up</h1>
        <button className="back-button" onClick={() => navigate("/login")}>
          Back to Login
        </button>
      </div>
      <div className="form-container">
        <form className="signup-form" onSubmit={handleSubmit}>
          <input
            className="input-field"
            type="email"
            name="email"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            placeholder="Email"
            required
          />
          <input
            className="input-field"
            type="password"
            name="password"
            value={formData.password}
            onChange={(e) =>
              setFormData({ ...formData, password: e.target.value })
            }
            placeholder="Password"
            required
          />
          <input
            className="input-field"
            type="text"
            name="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Name"
            required
          />
          <button className="submit-button" type="submit">
            Register
          </button>
        </form>
      </div>
      <ErrorModal message={error} onClose={() => setError("")} />
      {success && <div className="success-message">{success}</div>}
    </div>
  );
};

export default Signup;
