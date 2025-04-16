import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useAnimation } from "framer-motion";
import { login, verifyLoginOTP } from "../api/api";
import { useAuth } from "./AuthContext";

const SignIn = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { setAuth, isLoggedIn } = useAuth();
  const controls = useAnimation();
  const pathRef = useRef(null);
  const animationRef = useRef(null);

  // SVG path for drawing animation
  const svgPath = "M10 80 Q 77 10 150 80 T 300 80";

  useEffect(() => {
    if (isLoggedIn) {
      navigate("/dashboard");
    }
  }, [isLoggedIn, navigate]);

  useEffect(() => {
    let animationTimeoutId;
    
    const startAnimations = async () => {
      try {
        await controls.start({
          opacity: 1,
          y: 0,
          transition: { duration: 0.8 }
        });

        startPathAnimation();
      } catch (error) {
        console.error("Animation error:", error);
        // Allow component to render even if animation fails
      }
    };

    startAnimations();

    return () => {
      // Clean up any pending animation timeouts
      if (animationTimeoutId) {
        clearTimeout(animationTimeoutId);
      }
      
      // Cancel any active animations
      if (animationRef.current) {
        try {
          animationRef.current.cancel();
        } catch (error) {
          console.error("Error canceling animation:", error);
        }
      }
    };
  }, [controls]);

  const startPathAnimation = () => {
    if (pathRef.current) {
      try {
        const length = pathRef.current.getTotalLength();
        pathRef.current.style.strokeDasharray = length;
        pathRef.current.style.strokeDashoffset = length;
        
        animationRef.current = pathRef.current.animate([
          { strokeDashoffset: length },
          { strokeDashoffset: 0 }
        ], {
          duration: 2000,
          easing: "cubic-bezier(0.65, 0, 0.35, 1)",
          fill: "forwards"
        });

        // Set up repeating animation
        animationRef.current.onfinish = () => {
          if (pathRef.current) {
            pathRef.current.style.strokeDashoffset = length;
            // Store the timeout ID for cleanup
            animationTimeoutId = setTimeout(startPathAnimation, 1000);
          }
        };
      } catch (error) {
        console.error("SVG animation error:", error);
        // Continue without animation if there's an error
      }
    }
  };

  const handleGetOtp = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await login(email, password);
      if (response.message.includes("OTP sent")) {
        setOtpSent(true);
      } else {
        throw new Error(response.message || "Failed to send OTP");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await verifyLoginOTP(email, otp);
      if (response.message.includes("success")) {
        setAuth(response.user.id, response.user.email);
        navigate("/dashboard");
      } else {
        throw new Error(response.message || "Authentication failed");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 px-4 py-16">
      <motion.div
        className="w-full max-w-md bg-white/5 backdrop-blur-lg rounded-3xl p-6 md:p-8 shadow-2xl relative border border-white/10"
        initial={{ opacity: 0, y: 50 }}
        animate={controls}
      >
        {/* Home Button - Improved with larger clickable area */}
        <button
          onClick={() => {
            navigate("/");
            window.location.href = "/"; // Force full page reload to refresh the auth state
          }}
          className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 p-3 md:p-4 rounded-full transition-all duration-300 group cursor-pointer z-10"
          aria-label="Home"
          style={{ touchAction: "manipulation" }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-7 w-7 text-white group-hover:text-cyan-400 transition-colors"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
            />
          </svg>
        </button>

        {/* Glowing Title */}
        <motion.div 
          className="relative mb-8 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600 mb-2 relative inline-block">
            Sign In
            <motion.span
              className="absolute -bottom-1 left-0 right-0 h-1 bg-gradient-to-r from-cyan-400 to-blue-600 rounded-full opacity-70 blur-sm"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 1.5, delay: 0.5 }}
            />
          </h1>
          <p className="text-white/70 mt-2">Welcome back!</p>
        </motion.div>

        {/* SVG Drawing Animation - Hidden for better layout */}
        <div className="absolute top-0 left-0 right-0 flex justify-center -translate-y-12 opacity-50 pointer-events-none overflow-hidden">
          <svg
            width="300"
            height="100"
            viewBox="0 0 300 100"
            className="w-64"
          >
            <path
              ref={pathRef}
              d={svgPath}
              stroke="url(#gradient)"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
            />
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#00C6FF" />
                <stop offset="100%" stopColor="#0072FF" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Error Message */}
        {error && (
          <motion.div
            className="mb-4 p-3 bg-red-500/20 text-red-200 rounded-lg text-sm"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {error}
          </motion.div>
        )}

        <form className="space-y-5" onSubmit={otpSent ? handleSignIn : handleGetOtp}>
          {/* Email Field */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <label className="block text-sm font-medium text-white/80 mb-2">
              Email
            </label>
            <input
              type="email"
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all placeholder-white/30"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </motion.div>

          {/* Password Field */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <label className="block text-sm font-medium text-white/80 mb-2">
              Password
            </label>
            <input
              type="password"
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all placeholder-white/30"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              minLength="6"
            />
          </motion.div>

          {/* OTP Field */}
          {otpSent && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <label className="block text-sm font-medium text-white/80 mb-2">
                OTP Code
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all placeholder-white/30"
                placeholder="123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
                disabled={loading}
              />
              <p className="text-xs text-white/50 mt-1">
                Enter the one-time password sent to your email
              </p>
            </motion.div>
          )}

          {/* Submit Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-8"
          >
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 px-4 rounded-xl font-medium text-lg transition-all ${
                loading
                  ? "bg-gray-600 text-white/50 cursor-not-allowed"
                  : "bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:shadow-lg hover:shadow-cyan-500/20 focus:outline-none"
              }`}
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <svg
                    className="animate-spin h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  <span>Processing...</span>
                </div>
              ) : otpSent ? (
                "Verify OTP"
              ) : (
                "Get OTP"
              )}
            </button>
          </motion.div>

          {/* Sign Up Link */}
          <div className="text-center mt-6">
            <p className="text-white/60 text-sm">
              Don't have an account?{" "}
              <button
                type="button"
                onClick={() => navigate("/signup")}
                className="text-cyan-400 hover:text-cyan-300 transition-colors font-medium"
              >
                Sign Up
              </button>
            </p>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default SignIn;