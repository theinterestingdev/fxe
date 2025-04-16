import React, { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext({
  isLoggedIn: false,
  userId: "",
  userEmail: "",
  isLoading: true,
  backendError: false,
  setAuth: () => {},
  logout: () => {},
  checkAuth: () => {},
});

export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userId, setUserId] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [backendError, setBackendError] = useState(false);

  const checkAuth = async () => {
    try {
      // Added a timeout to prevent hanging if the server is unreachable
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch("http://localhost:5000/api/auth/check-auth", {
        credentials: "include",
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      // 401 is an expected response for non-authenticated users, not an error
      if (response.status === 401) {
        setIsLoggedIn(false);
        setUserId("");
        setUserEmail("");
        setBackendError(false);
        return;
      }

      if (!response.ok) throw new Error("Failed to check authentication status");

      const data = await response.json();

      if (data.user) {
        setIsLoggedIn(true);
        setUserId(data.user.id);
        setUserEmail(data.user.email);
        setBackendError(false);
      } else {
        setIsLoggedIn(false);
        setUserId("");
        setUserEmail("");
        setBackendError(false);
      }
    } catch (error) {
      // Only log if it's not a 401
      if (!error.message.includes("401")) {
        console.error("Auth check error:", error.message);
      }
      
      setIsLoggedIn(false);
      setUserId("");
      setUserEmail("");
      // Set backend error to true only for network-related errors
      setBackendError(error.name === 'AbortError' || error.message.includes('Failed to fetch'));
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
    setBackendError(false);
  };

  const logout = async () => {
    try {
      // Only attempt to call the backend if we don't have connection issues
      if (!backendError) {
        await fetch("http://localhost:5000/api/auth/logout", {
          method: "POST",
          credentials: "include",
        });
      }
      
      setIsLoggedIn(false);
      setUserId("");
      setUserEmail("");
    } catch (error) {
      console.error("Logout error:", error);
      // Still log the user out locally even if server request fails
      setIsLoggedIn(false);
      setUserId("");
      setUserEmail("");
    }
  };

  return (
    <AuthContext.Provider
      value={{ 
        isLoggedIn, 
        userId, 
        userEmail, 
        isLoading, 
        backendError,
        setAuth, 
        logout,
        checkAuth
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);