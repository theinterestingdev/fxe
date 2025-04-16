import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { uploadProject } from "../api/api";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Projects = () => {
  const navigate = useNavigate();
  const [newProject, setNewProject] = useState({
    title: "",
    description: "",
    videoLink: "",
    liveLink: "",
  });
  const [videoPreview, setVideoPreview] = useState(null);
  const [videoThumbnail, setVideoThumbnail] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const videoInputRef = useRef(null);
  const videoRef = useRef(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewProject({ ...newProject, [name]: value });
  };

  // Function to capture a thumbnail from the uploaded video
  const captureThumbnail = () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    
    // Set video to 25% of its duration to get a good thumbnail
    video.currentTime = video.duration * 0.25;
    
    // Create a canvas and draw the video frame
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Convert canvas to data URL
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
    setVideoThumbnail(dataUrl);
    
    return dataUrl;
  };

  const uploadThumbnail = async (thumbnailDataUrl) => {
    try {
      // Convert data URL to blob
      const res = await fetch(thumbnailDataUrl);
      const blob = await res.blob();
      
      // Create file from blob
      const file = new File([blob], "thumbnail.jpg", { type: "image/jpeg" });
      
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);
      
      const response = await axios.post(
        `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`,
        formData
      );
      
      return response.data.secure_url;
    } catch (error) {
      console.error("Error uploading thumbnail:", error);
      return null;
    }
  };

  const handleVideoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('video/')) {
      alert('Please upload a valid video file');
      return;
    }

    // Create video preview
    const videoURL = URL.createObjectURL(file);
    setVideoPreview(videoURL);

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);
      formData.append("resource_type", "video");

      const response = await axios.post(
        `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/video/upload`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      // Update project with Cloudinary video URL
      setNewProject(prev => ({
        ...prev,
        videoLink: response.data.secure_url
      }));
    } catch (error) {
      console.error("Error uploading video:", error);
      alert('Video upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate all required fields
    if (!newProject.title || !newProject.description || !newProject.videoLink) {
      alert('Please fill in all required fields and upload a video');
      return;
    }

    setIsUploading(true);
    try {
      // Get the thumbnail URL if available
      let thumbnailUrl = null;
      if (videoThumbnail) {
        thumbnailUrl = await uploadThumbnail(videoThumbnail);
      }

      // Create project data with thumbnail
      const projectData = {
        ...newProject,
        thumbnailUrl,
        screenshots: thumbnailUrl ? [thumbnailUrl] : []
      };

      await uploadProject(projectData);
      setUploadSuccess(true);
      
      // Reset form after 2 seconds
      setTimeout(() => {
        setNewProject({
          title: "",
          description: "",
          videoLink: "",
          liveLink: "",
        });
        setVideoPreview(null);
        setVideoThumbnail(null);
        setUploadSuccess(false);
        if (videoInputRef.current) {
          videoInputRef.current.value = '';
        }
        
        // Navigate to the Community page to see the uploaded project
        navigate("/community");
      }, 2000);
    } catch (error) {
      console.error("Error uploading project:", error);
      alert('Failed to upload project');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 text-center">Upload Your Project</h1>

        <div className="max-w-2xl mx-auto bg-gray-800 rounded-xl shadow-2xl p-8">
          {uploadSuccess ? (
            <div className="text-center py-8">
              <div className="text-green-400 text-5xl mb-4">✓</div>
              <h2 className="text-2xl font-bold mb-2">Project Uploaded Successfully!</h2>
              <p className="text-gray-300">Redirecting to Community page...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Video Upload Section */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Project Video (Required)
                </label>
                <input
                  type="file"
                  ref={videoInputRef}
                  accept="video/*"
                  onChange={handleVideoUpload}
                  className="w-full text-sm text-gray-300 
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-full file:border-0
                    file:text-sm file:font-semibold
                    file:bg-blue-500 file:text-white
                    hover:file:bg-blue-600"
                />
                
                {isUploading && (
                  <div className="mt-4 text-center text-blue-300">
                    Uploading video... Please wait
                  </div>
                )}

                {videoPreview && (
                  <div className="mt-4 relative">
                    <video 
                      ref={videoRef}
                      src={videoPreview} 
                      controls 
                      className="w-full rounded-lg shadow-lg"
                      onLoadedMetadata={() => {
                        // Capture thumbnail once video metadata is loaded
                        const thumbnail = captureThumbnail();
                        console.log("Captured thumbnail");
                      }}
                    />
                    
                    {videoThumbnail && (
                      <div className="mt-3">
                        <p className="text-sm text-gray-400 mb-2">Video Thumbnail:</p>
                        <img 
                          src={videoThumbnail} 
                          alt="Video thumbnail" 
                          className="w-full max-h-32 object-cover rounded-lg"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Project Details Inputs */}
              <input
                type="text"
                name="title"
                placeholder="Project Title *"
                value={newProject.title}
                onChange={handleInputChange}
                className="w-full bg-gray-700 text-white rounded-lg p-3 border border-gray-600 focus:ring-2 focus:ring-blue-500"
                required
              />
              
              <textarea
                name="description"
                placeholder="Project Description *"
                value={newProject.description}
                onChange={handleInputChange}
                className="w-full bg-gray-700 text-white rounded-lg p-3 border border-gray-600 focus:ring-2 focus:ring-blue-500"
                rows="4"
                required
              />
              
              <input
                type="text"
                name="liveLink"
                placeholder="Live Project Link (Optional)"
                value={newProject.liveLink}
                onChange={handleInputChange}
                className="w-full bg-gray-700 text-white rounded-lg p-3 border border-gray-600 focus:ring-2 focus:ring-blue-500"
              />

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isUploading}
                className={`w-full py-3 rounded-lg transition duration-300 ${
                  isUploading 
                    ? 'bg-gray-600 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {isUploading ? 'Uploading...' : 'Upload Project'}
              </button>
            </form>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default Projects;