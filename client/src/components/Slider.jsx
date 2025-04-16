import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

const slides = [
  {
    id: 1,
    title: "Elevate Your Creativity",
    note: "Join our exclusive community of innovators and creators",
    color: "from-purple-600 via-indigo-700 to-blue-800",
    img: "/1.webp",
    buttonText: "Join Now",
  },
  {
    id: 2,
    title: "Showcase Your Masterpieces",
    note: "Present your best work to a global audience",
    color: "from-amber-500 via-orange-600 to-red-700",
    img: "/2.webp",
    buttonText: "View Gallery",
  },
  {
    id: 3,
    title: "Connect & Collaborate",
    note: "Find the perfect partners for your next project",
    color: "from-emerald-500 via-teal-600 to-cyan-700",
    img: "/3.webp",
    buttonText: "Network Now",
  },
];

// Preload images
const preloadImages = () => {
  slides.forEach(slide => {
    const img = new Image();
    img.src = slide.img;
  });
};

const Slider = () => {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isHovered, setIsHovered] = useState(false);
  const [loadedImages, setLoadedImages] = useState({});
  const timeoutRef = useRef(null);

  // Preload images on component mount
  useEffect(() => {
    preloadImages();
    
    // Track loaded images
    const handleImageLoad = (id) => {
      setLoadedImages(prev => ({ ...prev, [id]: true }));
    };

    slides.forEach(slide => {
      const img = new Image();
      img.src = slide.img;
      img.onload = () => handleImageLoad(slide.id);
    });

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Auto-advance slides
  useEffect(() => {
    if (isHovered) return;
    
    timeoutRef.current = setTimeout(() => {
      setDirection(1);
      setIndex((prev) => (prev + 1) % slides.length);
    }, 6000);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [index, isHovered]);

  const nextSlide = () => {
    setDirection(1);
    setIndex((prev) => (prev + 1) % slides.length);
    resetTimer();
  };

  const prevSlide = () => {
    setDirection(-1);
    setIndex((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
    resetTimer();
  };

  const goToSlide = (i) => {
    setDirection(i > index ? 1 : -1);
    setIndex(i);
    resetTimer();
  };

  const resetTimer = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  const slideVariants = {
    enter: (direction) => ({
      x: direction > 0 ? "100%" : "-100%",
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction) => ({
      x: direction > 0 ? "-100%" : "100%",
      opacity: 0,
    }),
  };

  const textVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } },
  };

  return (
    <div
      className={`relative w-full h-screen flex items-center justify-center overflow-hidden transition-all duration-1000 bg-gradient-to-br ${slides[index].color}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Enhanced glass overlay with gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent z-0"></div>

      <div className="z-10 flex flex-col md:flex-row items-center justify-center w-full max-w-7xl px-8 gap-12">
        {/* Text Section */}
        <motion.div 
          className="text-center md:text-left w-full md:w-1/2 space-y-6"
          initial="hidden"
          animate="visible"
          variants={textVariants}
          key={`text-${slides[index].id}`}
        >
          <motion.h2
            className="text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight tracking-tight drop-shadow-xl"
          >
            {slides[index].title}
          </motion.h2>
          <motion.p
            className="text-xl md:text-2xl text-gray-100 font-light max-w-lg leading-relaxed"
          >
            {slides[index].note}
          </motion.p>
          <motion.div
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <button className="bg-white/90 hover:bg-white text-gray-900 px-8 py-4 rounded-full font-semibold text-lg shadow-xl hover:shadow-2xl transition-all duration-300">
              {slides[index].buttonText}
              <span className="ml-2">→</span>
            </button>
          </motion.div>
        </motion.div>

        {/* Image Section */}
        <div className="w-full md:w-1/2 h-[350px] md:h-[450px] lg:h-[550px] relative rounded-2xl overflow-hidden shadow-2xl">
          <AnimatePresence custom={direction} mode="wait">
            <motion.div
              key={slides[index].id}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: "spring", stiffness: 300, damping: 30 },
                opacity: { duration: 0.4 }
              }}
              className="absolute inset-0"
            >
              {!loadedImages[slides[index].id] ? (
                <div className={`w-full h-full bg-gradient-to-br ${slides[index].color.split(' ')[0]} ${slides[index].color.split(' ')[2]}`} />
              ) : (
                <img
                  src={slides[index].img}
                  alt={slides[index].title}
                  className="w-full h-full object-cover object-center"
                  loading="lazy"
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Navigation Dots */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-3 z-20">
        {slides.map((slide, i) => (
          <button
            key={slide.id}
            onClick={() => goToSlide(i)}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${i === index ? 'bg-white w-6' : 'bg-white/50 hover:bg-white/70'}`}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>

      {/* Enhanced Nav Buttons */}
      <button
        onClick={prevSlide}
        className="absolute left-6 md:left-12 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 backdrop-blur-md p-4 rounded-full z-20 shadow-lg transition-all duration-300 group"
        aria-label="Previous slide"
      >
        <svg
          className="w-6 h-6 text-white group-hover:scale-110 transition-transform"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <button
        onClick={nextSlide}
        className="absolute right-6 md:right-12 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 backdrop-blur-md p-4 rounded-full z-20 shadow-lg transition-all duration-300 group"
        aria-label="Next slide"
      >
        <svg
          className="w-6 h-6 text-white group-hover:scale-110 transition-transform"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
};

export default Slider;