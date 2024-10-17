import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { privateRoutes } from '../routes/PrivateRoutes';
import { publicRoutes } from '../routes/PublicRoutes';

const MobileMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  const isAuthenticated = useSelector(state => state.auth.isAuthenticated);
  const [routes, setRoutes] = useState([]);

  useEffect(() => {
    setRoutes(isAuthenticated ? privateRoutes : publicRoutes);
  }, [isAuthenticated]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div ref={menuRef}>
      <button onClick={() => setIsOpen(!isOpen)} className="text-white focus:outline-none">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={isOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16m-7 6h7'} />
        </svg>
      </button>
      {isOpen && (
        <div className="absolute right-0 top-16 w-full bg-gray-900 shadow-lg z-50 text-center">
          <ul className="space-y-4 py-6">
            {routes.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className="text-white hover:text-yellow-500 transition duration-300"
                >
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default MobileMenu;
