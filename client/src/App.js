import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './components/Auth/Login';
import Dashboard from './components/Dashboard/Dashboard';
import AdminDashboard from './components/Admin/AdminDashboard';
import UserLocationLogs from './components/Admin/UserLocationLogs';
import ProtectedRoute from './components/Layout/ProtectedRoute';

function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route
                        path="/dashboard"
                        element={
                            // <ProtectedRoute>
                            <Dashboard />
                            // </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/admin"
                        element={
                            // <ProtectedRoute>
                            <AdminDashboard />
                            // </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/admin/users/:userId/logs"
                        element={
                            // <ProtectedRoute>
                            <UserLocationLogs />
                            // </ProtectedRoute>
                        }
                    />
                    <Route path="/" element={<Navigate to="/dashboard" />} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}

export default App;