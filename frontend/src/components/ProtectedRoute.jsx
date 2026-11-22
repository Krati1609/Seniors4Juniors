import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';

export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <LoadingSpinner size="lg" label="Authenticating session..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return (
      <div className="max-w-md mx-auto my-16 p-6 card-theme border rounded-2xl text-center shadow-lg">
        <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 text-crimson rounded-full flex items-center justify-center mx-auto mb-3">
          ⚠️
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Access Denied</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
          This section is restricted to {allowedRoles.join(' or ')} members. Your current role is <strong>{user.role}</strong>.
        </p>
        <Navigate to="/" replace />
      </div>
    );
  }

  return children;
}
