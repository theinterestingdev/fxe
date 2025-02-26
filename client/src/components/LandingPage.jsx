import React from 'react';
import { motion } from 'framer-motion';

const LandingPage = ({ isLoading }) => {
  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* Background Image */}
      <motion.img
        className="w-full h-screen object-cover"
        src="./testing (2).jpg"
        alt="Team"
        initial={{ scale: 1.2 }}
        animate={!isLoading ? { scale: 1 } : {}}
        transition={{ duration: 1.5, ease: 'easeOut' }}
        loading="lazy"
      />

      {/* Overlay Gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/80"></div>

      {/* Main Content */}
      <motion.div
        initial="hidden"
        animate={!isLoading ? "visible" : "hidden"}
        variants={{
          hidden: { opacity: 0 },
          visible: { opacity: 1, transition: { staggerChildren: 0.3 } },
        }}
        className="absolute bottom-24 left-1/2 transform -translate-x-1/2 text-white text-center px-4"
      >
        <motion.h1
          variants={{
            hidden: { opacity: 0, x: 80 },
            visible: { opacity: 1, x: 0 },
          }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          className="ml-3 text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-wide leading-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-300"
        >
          Connect. Collaborate. Succeed.
        </motion.h1>

        <motion.button
          variants={{
            hidden: { opacity: 0, x: 50 },
            visible: { opacity: 1, x: 0 },
          }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          transition={{ duration: 1.2, ease: 'easeOut', delay: 0.4 }}
          className="relative md:mt-53 px-6 py-3 w-3/4 md:w-1/3 lg:w-1/4 mt-64 rounded-full text-lg font-medium bg-gradient-to-r from-black to-zinc-400 shadow-lg overflow-hidden"
        >
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-white cursor-pointer"
            animate={!isLoading ? { opacity: [0, 1, 0] } : {}}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          />
          Get Started
        </motion.button>
      </motion.div>

      {/* Testimonial 1 */}
      <motion.div
        initial={{ opacity: 0, x: -50, y: -50 }}
        animate={!isLoading ? { opacity: 1, x: 0, y: 0 } : {}}
        transition={{ duration: 1.2, ease: 'easeOut' }}
        whileHover={{ scale: 1.05 }}
        className="absolute top-16 left-6 md:top-24 md:left-12 text-white rounded-md shadow-lg p-4 md:p-6 max-w-xs md:max-w-sm"
      >
        <motion.p
          initial={{ opacity: 0 }}
          animate={!isLoading ? { opacity: 1 } : {}}
          transition={{ duration: 1.2, delay: 0.5 }}
          className="text-center text-sm md:text-lg font-medium"
        >
          “This platform helped me connect with amazing professionals!”
        </motion.p>
      </motion.div>

      {/* Testimonial 2 */}
      <motion.div
        initial={{ opacity: 0, x: 50, y: 50 }}
        animate={!isLoading ? { opacity: 1, x: 0, y: 0 } : {}}
        transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
        whileHover={{ scale: 1.05 }}
        className="absolute bottom-3 right-7 md:bottom-16 md:right-10 text-white rounded-md shadow-lg p-4 md:p-6 max-w-xs md:max-w-sm"
      >
        <motion.p
          initial={{ opacity: 0 }}
          animate={!isLoading ? { opacity: 1 } : {}}
          transition={{ duration: 1.2, delay: 0.8 }}
          className="text-sm md:text-lg text-center mt-6 font-medium"
        >
          “A game-changer for skill exchange and collaboratio
ns.”
        </motion.p>
      </motion.div>
    </div>
  );
};

export default LandingPage;