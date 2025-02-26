import React, { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext({
  isLoggedIn: false,
  userEmail: "",
  setAuth: () => {},
  logout: () => {},
});

export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  const login = (email) => {
    console.log("Setting authentication state for email:", email); // Debugging
    setIsLoggedIn(true);
    setUserEmail(email);
  };

  const checkAuth = async () => {
    try {
      console.log('Calling checkAuth...'); // Debugging
      const response = await fetch('http://localhost:5000/api/auth/check-auth', {
        credentials: 'include', // Include cookies in the request
      });

      console.log('checkAuth response status:', response.status); // Debugging

      if (!response.ok) {
        throw new Error('Failed to check authentication status');
      }

      const data = await response.json();
      console.log('checkAuth response data:', data); // Debugging

      if (data.user) {
        setIsLoggedIn(true);
        setUserEmail(data.user.email);
      } else {
        setIsLoggedIn(false);
        setUserEmail("");
      }
    } catch (error) {
      console.error('Error checking auth:', error);
      setIsLoggedIn(false);
      setUserEmail("");
    }
  };

  useEffect(() => {
    checkAuth(); // Call checkAuth to verify authentication status
  }, []); // Empty dependency array to run only once on mount

  const setAuth = (email, token) => {
    setIsLoggedIn(true);
    setUserEmail(email);
  };

  const logout = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/auth/logout', {
        method: 'POST',
        credentials: 'include', // Include cookies in the request
      });

      if (!response.ok) {
        throw new Error('Failed to logout');
      }

      setIsLoggedIn(false);
      setUserEmail("");
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, userEmail,login,setAuth, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};