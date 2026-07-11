import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
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
import { useAuthStore } from './store/useAuthStore';

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
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
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
  );
}
