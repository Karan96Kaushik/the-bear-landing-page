import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Profile from '../pages/Profile';
import Dashboard from '../pages/Dashboard';

const PrivateRoutes = () => {
  const isAuthenticated = useSelector(state => state.auth.isAuthenticated);

  return (
    <Routes>
      <Route
        path="/profile"
        element={isAuthenticated ? <Profile /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/dashboard"
        element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" replace />}
      />
    </Routes>
  );
};

export default PrivateRoutes;
