import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import axios from "axios";
import { createOrUpdateProfile, checkProfileExists } from "../api/api";

const ProfileSetup = () => {
  const [skills, setSkills] = useState([]);
  const [expertiseLevel, setExpertiseLevel] = useState("");
  const [portfolio, setPortfolio] = useState([]);
  const [bio, setBio] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingProfile, setCheckingProfile] = useState(true);
  const navigate = useNavigate();

  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  const availableSkills = [
    "React",
    "Node.js",
    "GraphQL",
    "Python",
    "Java",
    "UI/UX Design",
    "JavaScript",
    "TypeScript",
    "Docker",
    "Kubernetes",
  ];

  useEffect(() => {
    const checkProfile = async () => {
      try {
        const profileResponse = await checkProfileExists();
        if (profileResponse.exists) {
          navigate("/dashboard");
        } else {
          setCheckingProfile(false);
        }
      } catch (error) {
        console.error("Error checking profile:", error);
      }
    };

    checkProfile();
  }, [navigate]);

  const handleSkillClick = (skill) => {
    setSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const handleFileUpload = async (e) => {
    setLoading(true);
    const files = e.target.files;
    try {
      const uploadedUrls = [];
      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", uploadPreset);

        const response = await axios.post(
          `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
          formData
        );
        uploadedUrls.push(response.data.secure_url);
      }
      setPortfolio(uploadedUrls);
    } catch (error) {
      console.error("Error uploading files:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createOrUpdateProfile({ skills, expertiseLevel, portfolio, bio });
      navigate("/dashboard");
    } catch (error) {
      console.error("Error saving profile:", error);
    }
  };

  if (checkingProfile) {
    return (
      <div className="flex items-center justify-center h-screen bg-black text-white text-xl">
        Checking profile...
      </div>
    );
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
        <h1 className="text-2xl font-semibold text-center mb-6">
          Complete Your Profile
        </h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Skills */}
          <div>
            <label className="block text-sm font-medium mb-2">Skills</label>
            <div className="flex flex-wrap gap-2">
              {availableSkills.map((skill) => (
                <motion.button
                  key={skill}
                  type="button"
                  className={`px-3 py-2 text-sm font-medium rounded-lg transition ${
                    skills.includes(skill)
                      ? "bg-blue-500 text-white"
                      : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  }`}
                  onClick={() => handleSkillClick(skill)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {skill}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Expertise Level */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Expertise Level
            </label>
            <div className="flex space-x-4">
              {["Beginner", "Intermediate", "Expert"].map((level) => (
                <motion.button
                  key={level}
                  type="button"
                  className={`px-4 py-2 rounded-lg transition ${
                    expertiseLevel === level
                      ? "bg-blue-500 text-white"
                      : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  }`}
                  onClick={() => setExpertiseLevel(level)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {level}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Portfolio */}
          <div>
            <label className="block text-sm font-medium mb-2">Portfolio</label>
            <input
              type="file"
              multiple
              onChange={handleFileUpload}
              className="block w-full text-sm text-gray-300 bg-gray-700 border border-gray-600 rounded-lg cursor-pointer p-2"
              disabled={loading}
            />
            <div className="flex flex-wrap gap-3 mt-4">
              {portfolio.map((url, index) => (
                <motion.div
                  key={index}
                  className="relative w-24 h-24 rounded-lg overflow-hidden shadow-md"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <img
                    src={url}
                    alt={`Portfolio ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </motion.div>
              ))}
            </div>
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm font-medium mb-2">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full h-24 bg-gray-700 text-white rounded-lg p-3 border border-gray-600 focus:ring-2 focus:ring-blue-500"
              placeholder="Tell us about yourself..."
            ></textarea>
          </div>

          {/* Submit Button */}
          <motion.button
            type="submit"
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 rounded-lg transition"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Save Profile
          </motion.button>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default ProfileSetup;