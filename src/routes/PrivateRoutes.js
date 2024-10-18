import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Profile from '../pages/Profile';
import Dashboard from '../pages/Dashboard';
import Orders from '../pages/Orders';
import Simulator from '../pages/Simulator';

const routes = [
  { path: '/profile', Component: Profile, name: 'Profile' },
  { path: '/dashboard', Component: Dashboard, name: 'Dashboard' },
  { path: '/orders', Component: Orders, name: 'Orders' },
  { path: '/simulator', Component: Simulator, name: 'Simulator' }
];

const PrivateRoutes = () => {
  const isAuthenticated = useSelector(state => state.auth.isAuthenticated);

  return (
    <Routes>
      {routes.map(({ path, Component }) => (
        <Route
          key={path}
          path={path}
          element={isAuthenticated ? <Component /> : <Navigate to="/login" replace />}
        />
      ))}
    </Routes>
  );
};

export {routes as privateRoutes}
export default PrivateRoutes;
