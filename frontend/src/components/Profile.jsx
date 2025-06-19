import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "./AuthContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import ErrorModal from "./ErrorModal";
import "../styles/profile.css";

const Profile = () => {
  const { user, setUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!user) {
      console.log("Profile: No user, redirecting to login");
      navigate("/login");
      return;
    }

    const fetchUser = async () => {
      try {
        const headers = { Authorization: `Bearer ${user.token}` };
        const res = await axios.get(
          `http://localhost:5000/api/users/${user.id}`,
          { headers }
        );
        setFormData({
          name: res.data.name,
          email: res.data.email,
          password: "",
        });
        console.log("Profile: Fetched user", res.data);
      } catch (err) {
        console.error("Profile: Fetch error:", err.message);
        setError("Failed to load user data");
      }
    };
    fetchUser();
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      const headers = { Authorization: `Bearer ${user.token}` };
      const updateData = { name: formData.name };
      if (formData.password) updateData.password = formData.password;
      const res = await axios.put(
        `http://localhost:5000/api/users/${user.id}`,
        updateData,
        { headers }
      );
      setUser({ ...user, role: res.data.role });
      setSuccess("Profile updated successfully");
      console.log("Profile: Profile updated", res.data);
    } catch (err) {
      console.error("Profile: Update error:", err.message);
      setError(err.response?.data?.message || "Failed to update profile");
    }
  };

  return (
    <div className="profile-container">
      <div className="header">
        <h1 className="title">User Profile</h1>
        <button className="back-button" onClick={() => navigate("/dashboard")}>
          Back to Dashboard
        </button>
      </div>
      <div className="form-container">
        <form className="profile-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              className="input-field"
              type="email"
              value={formData.email}
              disabled
            />
          </div>
          <div className="form-group">
            <label className="form-label">Name</label>
            <input
              className="input-field"
              name="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="Name"
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">New Password (optional)</label>
            <input
              className="input-field"
              type="password"
              name="password"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              placeholder="New Password"
            />
          </div>
          <button className="submit-button" type="submit">
            Update Profile
          </button>
        </form>
      </div>
      <ErrorModal message={error} onClose={() => setError("")} />
      {success && <div className="success-message">{success}</div>}
    </div>
  );
};

export default Profile;
