import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Navbar from './components/Navbar';
import LoadingScreen from './components/LoadingScreen';
import { useAuth } from './components/AuthContext';
import './App.css';


const LandingPage = React.lazy(() => import('./components/LandingPage'));
const Slider = React.lazy(() => import('./components/Slider'));
const SignIn = React.lazy(() => import('./components/SignIn'));
const SignUp = React.lazy(() => import('./components/SignUp'));
const Dashboard = React.lazy(() => import('./components/Dashboard'));
const ProfileView = React.lazy(() => import('./components/ProfileView'));
const AdminLogin = React.lazy(() => import('./components/AdminLogin'));
const AdminDashboard = React.lazy(() => import('./components/AdminDashboard'));
const Projects = React.lazy(() => import('./components/Projects'));
const Community = React.lazy(() => import('./components/Community'));
const ProfileSetup = React.lazy(() => import('./components/ProfileSetup'));

const ProtectedRoute = ({ children }) => {
  const { isLoggedIn } = useAuth();
  return isLoggedIn ? children : <Navigate to="/signin" />;
};

const AdminProtectedRoute = ({ children }) => {
  return localStorage.getItem('adminToken') ? children : <Navigate to="/admin/login" replace />;
};

const App = () => {
  return (
    <Router>
      <Navbar />
      <AnimatePresence mode="wait">
        <Suspense fallback={<LoadingScreen />}>
          <Routes>
            <Route path="/" element={
              <>
                <LandingPage />
                <Slider />
              </>
            } />
            <Route path="/signin" element={<SignIn />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/profile-setup" element={<ProtectedRoute><ProfileSetup /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><ProfileView /></ProtectedRoute>} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/dashboard" element={<AdminProtectedRoute><AdminDashboard /></AdminProtectedRoute>} />
            <Route path="/projects" element={<ProtectedRoute><Projects /></ProtectedRoute>} />
            <Route path="/community" element={<ProtectedRoute><Community /></ProtectedRoute>} />
          </Routes>
        </Suspense>
      </AnimatePresence>
    </Router>
  );
};

export default App;