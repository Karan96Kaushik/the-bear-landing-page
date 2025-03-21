import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from '../pages/Home';
import About from '../pages/About';
import Explore from '../pages/Explore';
import Contact from '../pages/Contact';
import Login from '../pages/Login';
import Orders from '../pages/Orders';
import { useSelector } from 'react-redux';
import { useNavigate, Navigate } from 'react-router-dom';

const publicRoutes = [
  { path: '/', Component: Home, name: 'Home', authRedirect: '/dashboard' },
  { path: '/about', Component: About, name: 'About', authRedirect: '/dashboard' },
  { path: '/explore', Component: Explore, name: 'Explore', authRedirect: '/dashboard' },
  { path: '/contact', Component: Contact, name: 'Contact', authRedirect: '/dashboard' },
  { path: '/login', Component: Login, name: 'Login', authRedirect: '/dashboard' }
];

const PublicRoutes = () => {
  const authState = useSelector(state => state.auth);
  const navigate = useNavigate();

  console.log('authState.isAuthenticated', authState.isAuthenticated);

  return (
    <Routes>
      {publicRoutes.map(({ path, Component, authRedirect }) => (
        authState.isAuthenticated ? (
          <Route key={path} path={path} element={<Navigate to={authRedirect} />} />
        ) : (
          <Route key={path} path={path} element={<Component />} />
        )
      ))}
    </Routes>
  );
};


export {publicRoutes as publicRoutes}
export default PublicRoutes;
