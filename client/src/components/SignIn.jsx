  import React, { useState } from "react";
  import { motion } from "framer-motion";
  import { useNavigate } from "react-router-dom";
  import { login, verifyLoginOTP } from "../api/api"; // Import updated API functions

  const SignIn = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [otp, setOtp] = useState("");
    const [otpSent, setOtpSent] = useState(false);
    const navigate = useNavigate();

    const handleGetOtp = async () => {
      try {
        // Call login API to get OTP
        await login(email, password);
        setOtpSent(true);
        alert("OTP sent to your email!");
      } catch (error) {
        alert(error.response?.data?.message || "Failed to send OTP");
      }
    };

    const handleSignIn = async (e) => {
      e.preventDefault();
      try {
        const response = await verifyLoginOTP(email, otp);
        console.log('Sign In Response:', response);
        alert("Sign in successful!");
        localStorage.setItem("token", response.token);
        navigate("/dashboard");
      } catch (error) {
        console.error('Sign In Error:', error);
        alert(error.response?.data?.message || "Failed to sign in");
      }
    };
    return (
      <div className="flex flex-col md:flex-row w-full h-screen bg-black justify-center">
        <div className="w-full md:w-1/2 flex items-center justify-center p-6">
          <motion.div
            className="bg-white rounded-3xl p-8 shadow-lg w-full max-w-md relative"
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <button
              onClick={() => navigate("/")}
              className="absolute top-4 right-4 bg-black text-white p-2 rounded-full hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              aria-label="Home"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 cursor-pointer"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
            </button>

            <h1 className="text-2xl font-semibold text-center mb-6 text-gray-800">
              Sign In
            </h1>
            <form className="space-y-6" onSubmit={handleSignIn}>
              <motion.div
                className="space-y-2"
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <label htmlFor="email" className="block text-gray-700 font-medium">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  className="w-full p-3 rounded-full text-black border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </motion.div>
              <motion.div
                className="space-y-2"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                <label htmlFor="password" className="block text-gray-700 font-medium">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  className="w-full text-black p-3 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </motion.div>
              {otpSent && (
                <motion.div
                  className="space-y-2"
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <label htmlFor="otp" className="block text-gray-700 font-medium">
                    OTP
                  </label>
                  <input
                    id="otp"
                    type="text"
                    className="w-full text-black p-3 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Enter OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    required
                  />
                </motion.div>
              )}
              <motion.button
                type="button"
                className="w-full bg-black text-white p-3 rounded-full hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleGetOtp}
              >
                Get OTP
              </motion.button>
              {otpSent && (
                <motion.button
                  type="submit"
                  className="w-full bg-black text-white p-3 rounded-full hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Sign In
                </motion.button>
              )}
            </form>
            <p className="mt-6 text-center text-sm text-gray-600">
              Don't have an account?{" "}
              <a href="/signup" className="text-indigo-500 hover:underline">
                Sign up
              </a>
            </p>
          </motion.div>
        </div>

        {/* Right Side: Video */}
        <div className="hidden md:block md:w-1/2">
          <video
            className="w-full h-full object-cover rounded-md"
            src="/motion_graphics.mp4"
            autoPlay
            loop
            muted
          ></video>
        </div>
      </div>
    );
  };

  export default SignIn;