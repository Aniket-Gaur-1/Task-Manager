import React, { createContext, useState, useEffect } from "react";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const id = localStorage.getItem("id");
    const role = localStorage.getItem("role");

    if (token && id && role) {
      setUser({ id, role, token });
    }

    setLoading(false);
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
        const { accessToken, id, role } = data;

        localStorage.setItem("token", accessToken);
        localStorage.setItem("id", id);
        localStorage.setItem("role", role);

        setUser({ id, role, token: accessToken });
        return true;
      }

      return false;
    } catch (err) {
      console.error("AuthContext: Login error:", err);
      return false;
    }
  };

  const logout = async () => {
    try {
      const token = user?.token;

      if (token) {
        await fetch("https://task-manager-20l8.onrender.com/api/logout", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }
    } catch (err) {
      console.error("AuthContext: Logout error:", err.message || err);
    } finally {
      setUser(null);
      localStorage.removeItem("token");
      localStorage.removeItem("id");
      localStorage.removeItem("role");
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <AuthContext.Provider value={{ user, setUser, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
