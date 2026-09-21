import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, requiredRole }) => {
  const { user } = useAuth();

  if (!user) {
    // Redirect to respective login based on required role
    return <Navigate to={requiredRole === 'hospital' ? '/login/hospital' : '/login/donor'} replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    // Redirect to home if user does not match the role
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
