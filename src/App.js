import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Link } from 'react-router-dom';
import PublicRoutes from './routes/PublicRoutes';
import PrivateRoutes from './routes/PrivateRoutes';
import MobileMenu from './components/MobileMenu';

function App() {
  const [navbar, setNavbar] = useState(false);

  const changeBackground = () => {
    if (window.scrollY >= 80) {
      setNavbar(true);
    } else {
      setNavbar(false);
    }
  };

  useEffect(() => {
    window.addEventListener('scroll', changeBackground);
    return () => {
      window.removeEventListener('scroll', changeBackground);
    };
  }, []);

  return (
    <Router>
      {/* Navbar */}
      <header className={`fixed w-full z-50 transition-all duration-300 ${navbar ? 'bg-gray-900 shadow-lg' : 'bg-transparent'}`}>
        <nav className="flex justify-between items-center max-w-7xl mx-auto p-4">
          <Link to="/" className="flex items-center space-x-2">
            <img src="the-bear-logo.png" alt="The Bear Logo" className="w-7 h-10" />
            <h1 className="text-2xl font-bold text-white">The Bear</h1>
          </Link>
          <ul className="hidden md:flex space-x-6">
            {['Home', 'About', 'Explore', 'Contact', 'Profile'].map((item) => (
              <li key={item}>
                <Link
                  to={item === 'Home' ? '/' : `/${item.toLowerCase()}`}
                  className="text-white hover:text-yellow-500 transition duration-300 font-medium"
                >
                  {item}
                </Link>
              </li>
            ))}
          </ul>
          <div className="md:hidden">
            <MobileMenu />
          </div>
        </nav>
      </header>

      {/* Public and Private Routes */}
      <main className="">
        <PublicRoutes />
        <PrivateRoutes />
      </main>
    </Router>
  );
}

export default App;
