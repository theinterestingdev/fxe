import React, { useState } from "react";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const navLinks = ["Services", "Our Work", "About Us", "Insights", "Sign In"];

  // Function to handle link clicks
  const handleLinkClick = (item) => {
    if (item === "Sign In") {
      navigate("/signin");
    } else {
      console.log(`Clicked: ${item}`);
    }
  };

  return (
    <nav className="fixed top-0 z-[999] w-full text-white px-6 md:px-16 py-5 flex items-center justify-between">
      {/* Logo */}
      <h1
        className="text-2xl md:text-4xl font-semibold cursor-pointer"
        onClick={() => navigate("/")} // Navigate to the home page on click
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
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
