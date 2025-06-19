import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "./AuthContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import ErrorModal from "./ErrorModal";
import "../styles/activityLog.css";

const ActivityLog = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [activities, setActivities] = useState([]);
  const [page, setPage] = useState(1);
  const [error, setError] = useState("");
  const activitiesPerPage = 20;

  useEffect(() => {
    if (!user) {
      console.log("ActivityLog: No user, redirecting to login");
      navigate("/login");
      return;
    }

    const fetchActivities = async () => {
      try {
        const headers = { Authorization: `Bearer ${user.token}` };
        const res = await axios.get("http://localhost:5000/api/activity", {
          headers,
        });
        setActivities(res.data);
        console.log("ActivityLog: Fetched activities", {
          count: res.data.length,
        });
      } catch (err) {
        console.error("ActivityLog: Fetch error:", err.message);
        setError("Failed to load activities");
      }
    };
    fetchActivities();
  }, [user, navigate]);

  const paginatedActivities = activities.slice(
    (page - 1) * activitiesPerPage,
    page * activitiesPerPage
  );
  const totalPages = Math.ceil(activities.length / activitiesPerPage);

  return (
    <div className="activity-log-container">
      <div className="header">
        <h1 className="title">Activity Log</h1>
        <button className="back-button" onClick={() => navigate("/dashboard")}>
          Back to Dashboard
        </button>
      </div>
      <div className="activities-section">
        {activities.length === 0 ? (
          <p className="no-data">No activities found.</p>
        ) : (
          <ul className="activities-list">
            {paginatedActivities.map((activity) => (
              <li key={activity._id} className="activity-item">
                <span className="activity-action">{activity.action}</span>
                <span className="activity-timestamp">
                  {new Date(activity.timestamp).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="pagination">
        <button
          className="pagination-button"
          onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
          disabled={page === 1}
        >
          Previous
        </button>
        <span className="page-info">
          Page {page} of {totalPages}
        </span>
        <button
          className="pagination-button"
          onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
          disabled={page === totalPages}
        >
          Next
        </button>
      </div>
      <ErrorModal message={error} onClose={() => setError("")} />
    </div>
  );
};

export default ActivityLog;
