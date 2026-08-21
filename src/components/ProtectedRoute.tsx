import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Role } from '../types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: Role[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { currentUser, userData, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (userData && allowedRoles && !allowedRoles.includes(userData.role)) {
    // Redirect based on role if they try to access unauthorized routes
    if (userData.role === 'ADMIN') return <Navigate to="/admin" replace />;
    if (userData.role === 'STAFF') return <Navigate to="/staff" replace />;
    return <Navigate to="/student" replace />;
  }

  return <>{children}</>;
}
