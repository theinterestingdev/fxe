import React, { useState, useRef, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const { isLoggedIn, userEmail, logout } = useAuth();
  const navLinks = ["Services", "Our Work", "About Us", "Insights"];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLinkClick = (item) => {
    if (item === "Sign In" && !isLoggedIn) {
      navigate("/signin");
    } else {
      console.log(`Clicked: ${item}`);
    }
  };

  const handleProfileClick = () => {
    if (isLoggedIn) {
      setDropdownOpen(!dropdownOpen);
    }
  };

  const handleDashboardClick = () => {
    navigate("/dashboard");
    setDropdownOpen(false);
  };

  const handleLogoutClick = () => {
    logout();
    setDropdownOpen(false);
  };

  return (
    <nav className="fixed top-0 z-[999] w-full text-white px-6 md:px-16 py-5 flex items-center justify-between">
      {/* Logo */}
      <h1
        className="text-2xl md:text-4xl font-semibold cursor-pointer"
        onClick={() => navigate("/")}
      >
        FxE
      </h1>

      {/* Desktop Links */}
      <div className="hidden md:flex gap-8">
        {navLinks.map((item, index) => (
          <a
            key={index}
            className={`text-lg font-light capitalize ${
              index === navLinks.length - 1 ? "ml-8" : ""
            }`}
            onClick={() => handleLinkClick(item)}
            style={{ cursor: "pointer" }}
          >
            {item}
          </a>
        ))}
        {isLoggedIn ? (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={handleProfileClick}
              className="text-lg font-light capitalize flex items-center gap-2"
              style={{ cursor: "pointer" }}
            >
              <span>{userEmail ? userEmail.split("@")[0] : "User"}</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`h-5 w-5 transition-transform duration-200 ${
                  dropdownOpen ? "rotate-180" : ""
                }`}
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white text-black z-10">
                <button
                  onClick={handleDashboardClick}
                  className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                >
                  Dashboard
                </button>
                <button
                  onClick={handleLogoutClick}
                  className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        ) : (
          <a
            className="text-lg font-light capitalize"
            onClick={() => handleLinkClick("Sign In")}
            style={{ cursor: "pointer" }}
          >
            Sign In
          </a>
        )}
      </div>

      {/* Mobile Menu Button */}
      <button className="md:hidden z-50" onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? <X size={28} /> : <Menu size={28} />}
      </button>

      {/* Mobile Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-16 left-0 w-full bg-black text-white flex flex-col items-center space-y-6 py-6 shadow-lg"
          >
            {navLinks.map((item, index) => (
              <a
                key={index}
                className="text-lg font-light capitalize"
                onClick={() => {
                  handleLinkClick(item);
                  setIsOpen(false);
                }}
                style={{ cursor: "pointer" }}
              >
                {item}
              </a>
            ))}
            {isLoggedIn ? (
              <div className="flex flex-col items-center gap-4">
                <button
                  onClick={() => {
                    handleDashboardClick();
                    setIsOpen(false);
                  }}
                  className="text-lg font-light capitalize"
                  style={{ cursor: "pointer" }}
                >
                  Dashboard
                </button>
                <button
                  onClick={() => {
                    handleLogoutClick();
                    setIsOpen(false);
                  }}
                  className="text-lg font-light capitalize"
                  style={{ cursor: "pointer" }}
                >
                  Logout
                </button>
              </div>
            ) : (
              <a
                className="text-lg font-light capitalize"
                onClick={() => {
                  handleLinkClick("Sign In");
                  setIsOpen(false);
                }}
                style={{ cursor: "pointer" }}
              >
                Sign In
              </a>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;