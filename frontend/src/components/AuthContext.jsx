import React, { createContext, useState, useEffect } from "react";
import jwt_decode from "jwt-decode"; // ✅ Replaces 'jsonwebtoken'

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const restoreAuth = () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const decoded = jwt_decode(token);
          const role = localStorage.getItem("role") || "user";
          setUser({ id: decoded.id, role, token });
        } catch (err) {
          console.error("AuthContext: Token decoding failed:", err);
          localStorage.removeItem("token");
          localStorage.removeItem("role");
        }
      }
      setLoading(false);
    };
    restoreAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const res = await fetch(
        "https://task-manager-20l8.onrender.com/api/login",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        }
      );
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("token", data.accessToken);
        localStorage.setItem("role", data.role);
        const decoded = jwt_decode(data.accessToken);
        setUser({
          id: decoded.id,
          role: data.role,
          token: data.accessToken,
        });
        return true;
      }
      return false;
    } catch (err) {
      console.error("AuthContext: Login error:", err);
      return false;
    }
  };

  const logout = async () => {
    const token = user?.token;

    try {
      if (token) {
        const res = await fetch(
          "https://task-manager-20l8.onrender.com/api/logout",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!res.ok) {
          const errorData = await res.json();
          console.warn("Logout failed:", errorData.message || res.statusText);
        }
      } else {
        console.warn("No token available for logout.");
      }
    } catch (err) {
      console.error("AuthContext: Logout error:", err.message || err);
    } finally {
      setUser(null);
      localStorage.removeItem("token");
      localStorage.removeItem("role");
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <AuthContext.Provider value={{ user, setUser, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
