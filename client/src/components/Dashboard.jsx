import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { checkProfileExists } from "../api/api";

const Dashboard = () => {
  const navigate = useNavigate();
  const { isLoggedIn, userEmail, isLoading } = useAuth(); // Get isLoading from useAuth
  const [loading, setLoading] = useState(true);

  // Derive username only after userEmail is available
  const username = userEmail ? userEmail.split("@")[0] : "User";

  useEffect(() => {
    const checkProfile = async () => {
      try {
        // Wait for AuthProvider to finish loading
        if (isLoading) return;

        // Redirect if not logged in
        if (!isLoggedIn) {
          navigate("/signin");
          return;
        }

        // Check if profile exists
        const profileResponse = await checkProfileExists();
        if (!profileResponse.exists) {
          navigate("/profile-setup");
        } else {
          setLoading(false); // Profile exists, stop loading
        }
      } catch (error) {
        console.error("Error checking profile:", error);
        navigate("/signin");
      }
    };

    checkProfile();
  }, [isLoggedIn, isLoading, navigate]); // Add isLoading as a dependency

  // Show loading state if AuthProvider is still loading or the profile check is in progress
  if (isLoading || loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-black text-white">
        <p className="text-xl">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-black text-white">
      <h1 className="text-4xl font-bold mb-4">Dashboard</h1>
      <p className="text-lg">Welcome, {username}!</p>

      <button
        onClick={() => navigate("/")}
        className="mt-6 px-6 py-3 bg-white text-black font-semibold rounded-lg shadow-md hover:bg-gray-200 transition duration-300"
      >
        Return to Home
      </button>
    </div>
  );
};

export default Dashboard;