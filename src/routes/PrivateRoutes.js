import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Profile from '../pages/Profile';
import Dashboard from '../pages/Dashboard';
import Orders from '../pages/Orders';
import Simulator from '../pages/Simulator';
import SimulatorV2 from '../pages/SimulatorV2';
import StockChartPage from '../pages/StockChartPage';
import MyOrdersPage from '../pages/MyOrdersPage';
import RetOrders from '../components/RetOrders';

const routes = [
  { path: '/profile', Component: Profile, name: 'Profile' },
  { path: '/dashboard', Component: Dashboard, name: 'Dashboard' },
  { path: '/orders', Component: Orders, name: 'Orders' },
  { path: '/simulator', Component: Simulator, name: 'Simulator' },
  { path: '/simulator-v2', Component: SimulatorV2, name: 'Simulator V2' },
  { path: '/stock-chart', Component: StockChartPage, name: 'Stock Chart' },
  { path: '/my-orders', Component: MyOrdersPage, name: 'My Orders' },
  { path: '/ret-orders', Component: RetOrders, name: 'Retrospective Orders' }
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
