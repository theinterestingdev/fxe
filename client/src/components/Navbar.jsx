import React, { useState, useRef, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [transparent, setTransparent] = useState(true);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoggedIn, userEmail, logout } = useAuth();
  const navLinks = ["Services", "Our Work", "About Us", "Insights"];
  
  // Check if current page is signin or signup
  const isAuthPage = location.pathname === "/signin" || location.pathname === "/signup";

  // Add scroll listener to make navbar background solid on scroll
  useEffect(() => {
    if (isAuthPage) return; // Skip effect on auth pages
    
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setTransparent(false);
      } else {
        setTransparent(true);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isAuthPage]);

  useEffect(() => {
    if (isAuthPage) return; // Skip effect on auth pages
    
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isAuthPage]);

  // Hide navbar completely on auth pages
  if (isAuthPage) {
    return null;
  }

  return (
    <nav className={`fixed top-0 z-50 w-full text-white px-4 sm:px-6 md:px-16 py-4 flex items-center justify-between transition-all duration-300 ${transparent ? 'bg-transparent' : 'bg-gray-900/95 backdrop-blur-md shadow-lg'}`}>
      {/* Logo */}
      <h1
        className="text-2xl md:text-3xl font-semibold cursor-pointer"
        onClick={() => navigate("/")}
      >
        FxE
      </h1>

      {/* Desktop Navigation */}
      <div className="hidden md:flex gap-4 lg:gap-8 items-center">
        {navLinks.map((item, index) => (
          <button
            key={index}
            className="text-base lg:text-lg font-light capitalize hover:text-cyan-400 transition-colors"
            onClick={() => navigate(`/${item.toLowerCase().replace(/\s+/g, '-')}`)}
          >
            {item}
          </button>
        ))}

        {isLoggedIn ? (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 text-base lg:text-lg font-light capitalize hover:text-cyan-400 transition-colors"
            >
              {userEmail ? userEmail.split("@")[0] : "User"}
              <svg
                className={`w-4 h-4 transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {dropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-xl overflow-hidden border border-gray-700"
              >
                <button
                  onClick={() => {
                    navigate("/dashboard");
                    setDropdownOpen(false);
                  }}
                  className="block w-full text-left px-4 py-3 hover:bg-gray-700 transition-colors"
                >
                  Dashboard
                </button>
                <button
                  onClick={() => {
                    logout();
                    setDropdownOpen(false);
                  }}
                  className="block w-full text-left px-4 py-3 hover:bg-gray-700 transition-colors"
                >
                  Logout
                </button>
              </motion.div>
            )}
          </div>
        ) : (
          <button
            onClick={() => navigate("/signin")}
            className="text-base lg:text-lg font-light capitalize hover:text-cyan-400 transition-colors"
          >
            Sign In
          </button>
        )}
      </div>

      {/* Mobile Menu Button */}
      <button
        className="md:hidden z-50 p-2 rounded-full hover:bg-gray-800 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 pt-20 bg-gray-900/98 backdrop-blur-md z-40 flex flex-col items-center space-y-4 p-6 overflow-y-auto"
          >
            {navLinks.map((item) => (
              <button
                key={item}
                className="text-xl py-3 w-full text-center border-b border-gray-800 hover:text-cyan-400 transition-colors"
                onClick={() => {
                  navigate(`/${item.toLowerCase().replace(/\s+/g, '-')}`);
                  setIsOpen(false);
                }}
              >
                {item}
              </button>
            ))}

            {isLoggedIn ? (
              <>
                <button
                  className="text-xl py-3 w-full text-center border-b border-gray-800 hover:text-cyan-400 transition-colors"
                  onClick={() => {
                    navigate("/dashboard");
                    setIsOpen(false);
                  }}
                >
                  Dashboard
                </button>
                <button
                  className="text-xl py-3 w-full text-center border-b border-gray-800 hover:text-cyan-400 transition-colors"
                  onClick={() => {
                    logout();
                    setIsOpen(false);
                  }}
                >
                  Logout
                </button>
              </>
            ) : (
              <button
                className="text-xl py-3 w-full text-center border-b border-gray-800 hover:text-cyan-400 transition-colors"
                onClick={() => {
                  navigate("/signin");
                  setIsOpen(false);
                }}
              >
                Sign In
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;