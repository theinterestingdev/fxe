import React, { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext({
  isLoggedIn: false,
  userId: "",
  userEmail: "",
  isLoading: true,
  setAuth: () => {},
  logout: () => {},
});

export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userId, setUserId] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/auth/check-auth", {
        credentials: "include",
      });

      if (!response.ok) throw new Error("Failed to check authentication status");

      const data = await response.json();

      if (data.user) {
        setIsLoggedIn(true);
        setUserId(data.user.id);
        setUserEmail(data.user.email);
        
      } else {
        setIsLoggedIn(false);
        setUserId("");
        setUserEmail("");
        
      }
    } catch (error) {
      setIsLoggedIn(false);
      setUserId("");
      setUserEmail("");
      
    } finally {
      setIsLoading(false);
      
    }
  };

  useEffect(() => {
    
    checkAuth();
  }, []);

  const setAuth = (id, email) => {
    setIsLoggedIn(true);
    setUserId(id);
    setUserEmail(email);
    
  };

  const logout = async () => {
    try {
      await fetch("http://localhost:5000/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      setIsLoggedIn(false);
      setUserId("");
      setUserEmail("");
      
    } catch (error) {
      
    }
  };

  return (
    <AuthContext.Provider
      value={{ isLoggedIn, userId, userEmail, isLoading, setAuth, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);