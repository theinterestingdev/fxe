import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { fetchUnverifiedProfiles, verifyProfile } from '../api/api'; // Import API functions

const AdminDashboard = () => {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        const response = await fetchUnverifiedProfiles();
        if (response.profiles) {
          setProfiles(response.profiles);
        } else {
          setError('No profiles found');
        }
      } catch (error) {
        console.error('Error fetching unverified profiles:', error);
        setError('Failed to fetch profiles. Please try again.');
        navigate('/admin/login'); // Redirect to login if there's an error
      } finally {
        setLoading(false);
      }
    };

    fetchProfiles();
  }, [navigate]);

  const handleVerifyProfile = async (userId) => {
    try {
      await verifyProfile(userId);
      setProfiles(profiles.filter((profile) => profile.userId._id !== userId));
    } catch (error) {
      console.error('Error verifying profile:', error);
      setError('Failed to verify profile. Please try again.');
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/admin/login');
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <motion.div
      className="min-h-screen bg-gray-900 text-white p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
        <button 
          onClick={handleLogout} 
          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition duration-300"
        >
          Logout
        </button>
      </div>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <div className="space-y-4">
        {profiles.length === 0 ? (
          <p>No unverified profiles found.</p>
        ) : (
          profiles.map((profile) => (
            <motion.div
              key={profile.userId._id}
              className="bg-gray-800 rounded-lg p-4 shadow-lg"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <h2 className="text-xl font-semibold">{profile.userId.email}</h2>
              <p className="text-gray-400">{profile.bio}</p>
              <div className="mt-4">
                <h3 className="text-lg font-semibold">Skills</h3>
                <ul className="list-disc list-inside">
                  {profile.skills.map((skill, index) => (
                    <li key={index} className="text-gray-400">{skill}</li>
                  ))}
                </ul>
              </div>
              <div className="mt-4">
                <h3 className="text-lg font-semibold">Expertise Level</h3>
                <p className="text-gray-400">{profile.expertiseLevel}</p>
              </div>
              <div className="mt-4">
                <h3 className="text-lg font-semibold">Portfolio</h3>
                <ul className="list-disc list-inside">
                  {profile.portfolio.map((item, index) => (
                    <li key={index} className="text-gray-400">
                      <a href={item} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                        Portfolio Item {index + 1}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-4">
                <button
                  onClick={() => handleVerifyProfile(profile.userId._id)}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition duration-300"
                >
                  Verify Profile
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  );
};

export default AdminDashboard;