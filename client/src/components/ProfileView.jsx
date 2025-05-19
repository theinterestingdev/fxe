import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { getProfile, createOrUpdateProfile } from '../api/api'; // Import API functions

const ProfileView = () => {
  const [skills, setSkills] = useState([]);
  const [expertiseLevel, setExpertiseLevel] = useState('');
  const [portfolio, setPortfolio] = useState([]);
  const [bio, setBio] = useState('');
  const [verified, setVerified] = useState(false);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await getProfile();
        const { skills, expertiseLevel, portfolio, bio, verified } = response.profile;
        setSkills(skills);
        setExpertiseLevel(expertiseLevel);
        setPortfolio(portfolio);
        setBio(bio);
        setVerified(verified);
      } catch (error) {
        console.error('Error fetching profile:', error);
        setError('Failed to fetch profile. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const updatedProfile = { skills, expertiseLevel, portfolio, bio, verified: false }; // Set verified to false after update
      await createOrUpdateProfile(updatedProfile);
      setVerified(false); // Mark profile as unverified after update
      setEditing(false);
      alert('Profile updated successfully! It will be reviewed by the admin.');
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Failed to update profile. Please try again.');
    }
  };

  
  const handlePortfolioClick = (url) => {
    window.open(url, '_blank');
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <motion.div
      className="min-h-screen flex items-center justify-center bg-gray-900 text-white p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        className="w-full max-w-3xl bg-gray-800 rounded-xl shadow-lg p-8"
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        <h1 className="text-2xl font-semibold text-center mb-6">Your Profile</h1>
        <div className="flex justify-between items-center mb-6">
          <p className="text-lg">
            Verification Status:{' '}
            <span
              className={`font-semibold ${
                verified ? 'text-green-500' : 'text-red-500'
              }`}
            >
              {verified ? 'Verified' : 'Unverified'}
            </span>
          </p>
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition duration-300"
            >
              Edit Profile
            </button>
          )}
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Skills */}
          <div>
            <label className="block text-sm font-medium mb-2">Skills</label>
            <input
              type="text"
              value={skills.join(', ')}
              onChange={(e) => setSkills(e.target.value.split(', '))}
              disabled={!editing}
              className="w-full bg-gray-700 text-white rounded-lg p-3 border border-gray-600 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Expertise Level */}
          <div>
            <label className="block text-sm font-medium mb-2">Expertise Level</label>
            <select
              value={expertiseLevel}
              onChange={(e) => setExpertiseLevel(e.target.value)}
              disabled={!editing}
              className="w-full bg-gray-700 text-white rounded-lg p-3 border border-gray-600 focus:ring-2 focus:ring-blue-500"
            >
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Expert">Expert</option>
            </select>
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm font-medium mb-2">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              disabled={!editing}
              className="w-full h-24 bg-gray-700 text-white rounded-lg p-3 border border-gray-600 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Portfolio */}
          <div>
            <label className="block text-sm font-medium mb-2">Portfolio</label>
            <div className="space-y-2">
              {portfolio.map((url, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-2"
                >
                  <button
                    type="button"
                    onClick={() => handlePortfolioClick(url)}
                    className="text-blue-500 hover:underline"
                  >
                    Portfolio {index + 1}
                  </button>
                </div>
              ))}
            </div>
            {editing && (
              <input
                type="text"
                value={portfolio.join(', ')}
                onChange={(e) => setPortfolio(e.target.value.split(', '))}
                className="w-full bg-gray-700 text-white rounded-lg p-3 border border-gray-600 focus:ring-2 focus:ring-blue-500 mt-2"
                placeholder="Enter portfolio links separated by commas"
              />
            )}
          </div>

          {/* Edit/Save Button */}
          {editing && (
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="px-6 py-2 bg-gray-700 text-white font-semibold rounded-lg hover:bg-gray-600 transition duration-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition duration-300"
              >
                Save
              </button>
            </div>
          )}
        </form>
        {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
      </motion.div>
    </motion.div>
  );
};

export default ProfileView;