import React, { memo, useEffect, lazy, Suspense } from "react";
import { useAuth } from "./AuthContext";
import { motion, useAnimation } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { useNavigate } from 'react-router-dom';

// Lazy load the expensive 3D components
const ParticlesCanvas = lazy(() => import('./ParticlesCanvas'));

const LandingPage = memo(() => {
  // Always initialize all hooks at the top level
  const { userEmail, isLoggedIn, backendError } = useAuth();
  const navigate = useNavigate();
  const controls = useAnimation();
  const [ref, inView] = useInView({ threshold: 0.1, triggerOnce: true });
  
  // Safe username extraction with fallback
  const username = userEmail ? userEmail.split("@")[0] : "User";

  useEffect(() => {
    // Only animate if the component is in view
    if (inView) {
      controls.start("visible").catch(error => {
        console.error("Animation error:", error);
      });
    }
  }, [controls, inView]);

  // Simplified animation variants with reduced properties
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.5,
        staggerChildren: 0.15
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.5 }
    }
  };

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={controls}
      variants={containerVariants}
      className="relative w-full h-screen overflow-hidden bg-black"
    >
      {/* 3D Particle Background - Lazy loaded */}
      <div className="absolute inset-0 z-0">
        <Suspense fallback={<div className="bg-gradient-to-r from-gray-900 to-black w-full h-full" />}>
          <ParticlesCanvas />
        </Suspense>
      </div>

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col justify-center items-center text-center px-4">
        <motion.div variants={itemVariants}>
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-600 mb-6">
            Welcome{username ? `, ${username}` : ""}!
          </h1>
        </motion.div>

        <motion.p variants={itemVariants} className="text-xl md:text-2xl text-gray-300 mb-12">
          Connect. Collaborate. Create.
        </motion.p>

        <motion.div variants={itemVariants}>
          <button 
            className="relative px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-blue-600 to-cyan-500 rounded-full overflow-hidden group"
            onClick={() => navigate(isLoggedIn ? "/dashboard" : "/signin")}
          >
            <span className="relative z-10">Get Started</span>
            <span className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
          </button>
        </motion.div>
        
        {backendError && (
          <motion.div 
            variants={itemVariants}
            className="mt-6 px-4 py-2 bg-yellow-600/20 border border-yellow-600/50 rounded-md"
          >
            <p className="text-yellow-400">
              Server connection issue. Some features may be limited.
            </p>
          </motion.div>
        )}
      </div>

      {/* Floating testimonials - Simplified to improve performance */}
      <div className="hidden md:block">
        <motion.div
          variants={itemVariants}
          className="absolute top-16 left-16 bg-white/10 backdrop-blur-sm rounded-xl p-6 max-w-xs border border-white/20 shadow-lg"
        >
          <p className="text-white italic">"This platform transformed my career!"</p>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="absolute bottom-16 right-16 bg-white/10 backdrop-blur-sm rounded-xl p-6 max-w-xs border border-white/20 shadow-lg"
        >
          <p className="text-white italic">"The best community for creators"</p>
        </motion.div>
      </div>
    </motion.div>
  );
});

export default LandingPage;