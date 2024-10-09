import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Profile from '../pages/Profile';

// Fake authentication function (replace with actual logic)
const isAuthenticated = () => {
  return localStorage.getItem('userToken') !== null;
};

const PrivateRoutes = () => {
  return (
    <Routes>
      <Route
        path="/profile"
        element={isAuthenticated() ? <Profile /> : <Navigate to="/login" replace />}
      />
    </Routes>
  );
};

export default PrivateRoutes;
