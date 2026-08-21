import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';

// Auth Pages
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';

// Student Pages
import { Dashboard as StudentDashboard } from './pages/student/Dashboard';
import { NewRequest } from './pages/student/NewRequest';

// Staff Pages
import { Dashboard as StaffDashboard } from './pages/staff/Dashboard';

// Admin Pages
import { Dashboard as AdminDashboard } from './pages/admin/Dashboard';
import { DocumentTypes } from './pages/admin/DocumentTypes';
import { Users as AdminUsers } from './pages/admin/Users';

// Shared Pages
import { RequestDetails } from './pages/shared/RequestDetails';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            {/* Student Routes */}
            <Route path="student" element={<ProtectedRoute allowedRoles={['STUDENT']}><StudentDashboard /></ProtectedRoute>} />
            <Route path="student/requests" element={<ProtectedRoute allowedRoles={['STUDENT']}><StudentDashboard /></ProtectedRoute>} />
            <Route path="student/requests/new" element={<ProtectedRoute allowedRoles={['STUDENT']}><NewRequest /></ProtectedRoute>} />
            <Route path="student/requests/:id" element={<ProtectedRoute allowedRoles={['STUDENT']}><RequestDetails /></ProtectedRoute>} />
            <Route path="student/profile" element={<ProtectedRoute allowedRoles={['STUDENT']}><div>Profile Settings</div></ProtectedRoute>} />

            {/* Staff Routes */}
            <Route path="staff" element={<ProtectedRoute allowedRoles={['STAFF']}><StaffDashboard /></ProtectedRoute>} />
            <Route path="staff/requests" element={<ProtectedRoute allowedRoles={['STAFF']}><StaffDashboard /></ProtectedRoute>} />
            <Route path="staff/requests/:id" element={<ProtectedRoute allowedRoles={['STAFF']}><RequestDetails /></ProtectedRoute>} />

            {/* Admin Routes */}
            <Route path="admin" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminDashboard /></ProtectedRoute>} />
            <Route path="admin/users" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminUsers /></ProtectedRoute>} />
            <Route path="admin/documents" element={<ProtectedRoute allowedRoles={['ADMIN']}><DocumentTypes /></ProtectedRoute>} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
