import React, { useState, useContext } from "react";
import { AuthContext } from "./AuthContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import ErrorModal from "./ErrorModal";
import "../styles/login.css";

const Login = () => {
  const { setUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await axios.post(
        "https://task-manager-ht8a.onrender.com/api/login",
        formData,
        { withCredentials: true }
      );
      setUser({ token: res.data.accessToken, role: res.data.role });
      navigate("/dashboard");
    } catch (err) {
      console.error("Login error:", err.message);
      setError(err.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="login-container">
      <div className="header">
        <h1 className="title">Login</h1>
        <button className="back-button" onClick={() => navigate("/signup")}>
          Sign Up
        </button>
      </div>
      <div className="form-container">
        <form className="login-form" onSubmit={handleSubmit}>
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
          <button className="submit-button" type="submit">
            Login
          </button>
        </form>
      </div>
      <ErrorModal message={error} onClose={() => setError("")} />
    </div>
  );
};

export default Login;
