import React, { useEffect, useRef, useState, lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LocomotiveScroll from "locomotive-scroll";
import Navbar from "./components/Navbar";
import LandingPage from "./components/LandingPage";
import Slider from "./components/Slider";
import Loader from "./components/Loader";
import "locomotive-scroll/dist/locomotive-scroll.css";
import "./App.css";

// Lazy load components
const SignIn = lazy(() => import("./components/Signin"));
const SignUp = lazy(() => import("./components/SignUp"));
const Dashboard = lazy(() => import("./components/Dashboard"));

const App = () => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const preloadAssets = async () => {
      const images = ["./testing (2).jpg"]; // Add all image paths here
      await Promise.all(
        images.map((src) => {
          return new Promise((resolve, reject) => {
            const img = new Image();
            img.src = src;
            img.onload = resolve;
            img.onerror = reject;
          });
        })
      );

      // Simulate a delay for demonstration (remove in production)
      await new Promise((resolve) => setTimeout(resolve, 2000));

      setIsLoading(false); // All assets are loaded
    };

    preloadAssets();
  }, []);

  const LocomotiveScrollWrapper = ({ children }) => {
    const scrollRef = useRef(null);

    useEffect(() => {
      if (!isLoading) {
        const scroll = new LocomotiveScroll({
          el: scrollRef.current,
          smooth: true,
          lerp: 0.08,
          multiplier: 1.2,
        });

        return () => {
          if (scroll) scroll.destroy();
        };
      }
    }, [isLoading]);

    return (
      <div ref={scrollRef} className="w-full h-screen bg-zinc-900 text-white">
        {children}
      </div>
    );
  };

  return (
    <Router>
      {/* AuthProvider is now in index.jsx, so it's removed here */}
      {isLoading ? (
        <Loader /> // Show loader while assets are loading
      ) : (
        <Routes>
          {/* Home Route */}
          <Route
            path="/"
            element={
              <LocomotiveScrollWrapper>
                <Navbar />
                <LandingPage isLoading={isLoading} />
                <Slider />
              </LocomotiveScrollWrapper>
            }
          />

          {/* Auth Routes */}
          <Route
            path="/signin"
            element={
              <Suspense fallback={<Loader />}>
                <LocomotiveScrollWrapper>
                  <SignIn />
                </LocomotiveScrollWrapper>
              </Suspense>
            }
          />
          <Route
            path="/signup"
            element={
              <Suspense fallback={<Loader />}>
                <LocomotiveScrollWrapper>
                  <SignUp />
                </LocomotiveScrollWrapper>
              </Suspense>
            }
          />

          {/* Dashboard Route */}
          <Route
            path="/dashboard"
            element={
              <Suspense fallback={<Loader />}>
                <LocomotiveScrollWrapper>
                  <Dashboard />
                </LocomotiveScrollWrapper>
              </Suspense>
            }
          />
        </Routes>
      )}
    </Router>
  );
};

export default App;