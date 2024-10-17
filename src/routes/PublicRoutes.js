import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from '../pages/Home';
import About from '../pages/About';
import Explore from '../pages/Explore';
import Contact from '../pages/Contact';
import Login from '../pages/Login';
import Orders from '../pages/Orders';

const publicRoutes = [
  { path: '/', Component: Home, name: 'Home' },
  { path: '/about', Component: About, name: 'About' },
  { path: '/explore', Component: Explore, name: 'Explore' },
  { path: '/contact', Component: Contact, name: 'Contact' },
  { path: '/login', Component: Login, name: 'Login' }
];

const PublicRoutes = () => {
  return (
    <Routes>
      {publicRoutes.map(({ path, Component }) => (
        <Route key={path} path={path} element={<Component />} />
      ))}
    </Routes>
  );
};

export {publicRoutes as publicRoutes}
export default PublicRoutes;
