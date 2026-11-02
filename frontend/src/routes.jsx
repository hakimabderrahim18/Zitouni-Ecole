import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Chat from './pages/Chat';
import AdminDashboard from './pages/AdminDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import StudentDashboard from './pages/StudentDashboard';
import ParentDashboard from './pages/ParentDashboard';
import GeneralSupervisorDashboard from './pages/GeneralSupervisorDashboard';
import PedagogicalSupervisorDashboard from './pages/PedagogicalSupervisorDashboard';
import ReceptionistDashboard from './pages/ReceptionistDashboard';
import FeedPage from './pages/FeedPage';
import SplashScreen from './components/SplashScreen';
import { useAuthStore } from './store/useAuthStore';
import { useSchoolStore } from './store/useSchoolStore';

// Protective Route Wrapper
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user } = useAuthStore();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default function AppRoutes() {
  const location = useLocation();
  const [showSplash, setShowSplash] = useState(() => {
    // Only show splash screen once per session, and only if on landing/splash
    const seen = sessionStorage.getItem('hibr_splash_seen');
    return !seen && (window.location.pathname === '/' || window.location.pathname === '/splash');
  });

  const { fetchSettings } = useSchoolStore();

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSplashFinish = useCallback(() => {
    try {
      sessionStorage.setItem('hibr_splash_seen', 'true');
    } catch (e) {}
    setShowSplash(false);
  }, []);

  return (
    <>
      {showSplash && <SplashScreen onFinish={handleSplashFinish} />}

      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/splash" element={<SplashScreen onFinish={handleSplashFinish} />} />
        <Route path="/login" element={<Login />} />

        {/* Protected Routes */}
        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <Chat />
            </ProtectedRoute>
          }
        />
        <Route
          path="/feed"
          element={
            <ProtectedRoute>
              <FeedPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/admin/*"
          element={
            <ProtectedRoute allowedRoles={['admin', 'school']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/teacher/*"
          element={
            <ProtectedRoute allowedRoles={['teacher']}>
              <TeacherDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/student/*"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <StudentDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/parent/*"
          element={
            <ProtectedRoute allowedRoles={['parent']}>
              <ParentDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/general-supervisor/*"
          element={
            <ProtectedRoute allowedRoles={['general_supervisor']}>
              <GeneralSupervisorDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/pedagogical-supervisor/*"
          element={
            <ProtectedRoute allowedRoles={['pedagogical_supervisor']}>
              <PedagogicalSupervisorDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/receptionist/*"
          element={
            <ProtectedRoute allowedRoles={['receptionist']}>
              <ReceptionistDashboard />
            </ProtectedRoute>
          }
        />

        {/* Fallback to landing */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
