import React, { useRef, useLayoutEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const slides = [
  { title: "Step 1", note: "Signup", color: "text-red-600", img: "/test.jpg" },
  {
    title: "Step 2",
    note: "Skills and Experience",
    color: "text-[#e9ab32]",
    img: "/experience.jpg",
  },
  {
    title: "Step 3",
    note: "Looking For ?",
    color: "text-[#598fe1]",
    img: "/looking.jpg",
  },
];

const Slider = () => {
  const container = useRef();
  const panel = useRef([]);
  const bulletsRef = useRef([]);
  const sectionsRef = useRef([]);

  useLayoutEffect(() => {
    let ctx = gsap.context(() => {
      // Animate panel background movement
      panel.current.forEach((panel) => {
        gsap.to(panel, {
          backgroundPosition: "-100px",
          duration: 3,
          scrollTrigger: {
            trigger: panel,
            toggleActions: "play reverse play reverse",
            start: "top 80%",
            end: "bottom 20%",
          },
        });
      });

      // Bullet Scaling Animation (Always Visible)
      sectionsRef.current.forEach((section, index) => {
        gsap.to(bulletsRef.current[index], {
          scale: 1.5, // Adjusted for responsiveness
          scrollTrigger: {
            trigger: section,
            start: "top center",
            end: "bottom center",
            toggleActions: "play reverse play reverse",
          },
        });
      });

    }, container);

    return () => ctx.revert();
  }, []);

  const addToRefs = (el, type) => {
    if (el) {
      if (type === "panel" && !panel.current.includes(el)) {
        panel.current.push(el);
      }
      if (type === "section" && !sectionsRef.current.includes(el)) {
        sectionsRef.current.push(el);
      }
    }
  };

  const scrollToSection = (index) => {
    sectionsRef.current[index]?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div ref={container} className="overflow-hidden bg-[#f2f2f2]">
      {/* Bullets - Always Visible & Responsive */}
      <div
        className="fixed left-4 top-1/2 transform -translate-y-1/2 
                   flex flex-col gap-6 items-center z-50 
                   md:left-8 lg:left-12 xl:left-16"
      >
        {slides.map((bullet, index) => (
          <img
            key={bullet.title}
            ref={(el) => (bulletsRef.current[index] = el)}
            src={bullet.img}
            className="w-8 h-8 md:w-12 md:h-12 rounded-full object-cover 
                       border-2 border-black transition-transform 
                       duration-500 cursor-pointer"
            alt={`Bullet ${bullet.title}`}
            onClick={() => scrollToSection(index)}
          />
        ))}
      </div>

      {/* Slides */}
      {slides.map((slide, index) => (
        <section
          key={slide.title}
          ref={(el) => addToRefs(el, "section")}
          className="h-screen flex flex-col md:flex-row items-center justify-center 
                     px-6 md:px-12 lg:px-24 xl:px-32 snap-start"
        >
          {/* Left Section - Text */}
          <div className="w-full md:w-1/3 flex flex-col items-center justify-center text-center">
            <h2 className={`${slide.color} text-lg md:text-2xl font-bold`}>
              {slide.title}
            </h2>
            <h1 className="text-xl md:text-3xl text-black">{slide.note}</h1>
          </div>

          {/* Right Section - Image */}
          <div className="w-full md:w-2/3">
            <div
              ref={(el) => addToRefs(el, "panel")}
              className="w-full h-[50vh] md:h-[75vh] rounded-xl shadow-lg"
              style={{
                backgroundImage: `url(${slide.img})`,
                backgroundPosition: "center",
                backgroundSize: "cover",
              }}
            />
          </div>
        </section>
      ))}
    </div>
  );
};

export default Slider;
