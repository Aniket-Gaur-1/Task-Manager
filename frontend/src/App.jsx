import React, { useContext } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import CalendarView from "./components/CalendarView";
import Dashboard from "./components/Dashboard";
import Login from "./components/Login";
import Profile from "./components/Profile";
import Signup from "./components/Signup";
import ActivityLog from "./components/ActivityLog";
import { AuthProvider, AuthContext } from "./components/AuthContext";

import EditProject from "./components/EditProject";
import AddTask from "./components/AddTask";
import CreateProject from "./components/CreateProject";
import KanbanBoard from "./components/KanbanBoard";
import AnalyticsDashboard from "./components/AnalyticsDashboard";
import ProjectsList from "./components/ProjectsList";
import EditTask from "./components/EditTask";
import Layout from "./components/Layout";

// ✅ Admin route wrapper
const AdminRoute = ({ children }) => {
  const { user } = useContext(AuthContext);
  return user && user.role === "admin" ? (
    children
  ) : (
    <Navigate to="/dashboard" />
  );
};

const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route element={<Layout />}>
            <Route path="/kanban" element={<KanbanBoard />} />
            <Route path="/calendar" element={<CalendarView />} />
            <Route
              path="/list"
              element={<div className="content">Project List View</div>}
            />
            <Route
              path="/timeline"
              element={<div className="content">Timeline View</div>}
            />
            <Route
              path="/projects/:projectName"
              element={<div className="content">Project Details</div>}
            />
          </Route>
          <Route path="/analytics" element={<AnalyticsDashboard />} />
          <Route path="/activity" element={<ActivityLog />} />
          <Route path="/profile" element={<Profile />} />
          <Route
            path="/add-task"
            element={
              <AdminRoute>
                <AddTask />
              </AdminRoute>
            }
          />
          <Route
            path="/create-project"
            element={
              <AdminRoute>
                <CreateProject />
              </AdminRoute>
            }
          />
          <Route
            path="/edit-task/:id"
            element={
              <AdminRoute>
                <EditTask />
              </AdminRoute>
            }
          />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
