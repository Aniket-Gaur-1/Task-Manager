import React, { createContext, useState, useEffect } from "react";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const restoreAuth = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const res = await fetch(
            "https://task-manager-20l8.onrender.com/api/auth/verify",
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          if (res.ok) {
            const data = await res.json();
            setUser(data.user);
          } else {
            localStorage.removeItem("token");
          }
        } catch (err) {
          console.error("AuthContext: Token verification failed:", err);
          localStorage.removeItem("token");
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
        localStorage.setItem("token", data.token);
        setUser(data.user);
        return true;
      }
      return false;
    } catch (err) {
      console.error("AuthContext: Login error:", err);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("token");
  };

  if (loading) {
    return <div>Loading...</div>; // Or a loading component
  }

  return (
    <AuthContext.Provider value={{ user, setUser, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
