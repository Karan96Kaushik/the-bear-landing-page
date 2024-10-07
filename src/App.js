import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Hero from './components/Hero';
import Features from './components/Features';
import Footer from './components/Footer';
import About from './pages/About';
import Explore from './pages/Explore';
import Contact from './pages/Contact';
import MobileMenu from './components/MobileMenu';
import Login from './pages/Login';

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
      <header className={`fixed w-full z-50 transition-all duration-300 ${navbar ? 'bg-gray-900 shadow-lg' : 'bg-transparent'}`}>
        <nav className="flex justify-between items-center max-w-7xl mx-auto p-4">
          <h1 className="text-2xl font-bold text-white">The Bear</h1>
          <ul className="hidden md:flex space-x-6">
            <li><Link to="/" className="text-white hover:text-yellow-500 transition duration-300">Home</Link></li>
            <li><Link to="/about" className="text-white hover:text-yellow-500 transition duration-300">About</Link></li>
            <li><Link to="/explore" className="text-white hover:text-yellow-500 transition duration-300">Explore</Link></li>
            <li><Link to="/contact" className="text-white hover:text-yellow-500 transition duration-300">Contact</Link></li>
          </ul>
          <div className="md:hidden">
            <MobileMenu />
          </div>
        </nav>
      </header>

      <Routes>
        <Route path="/" element={<><Hero /><Features /><Footer /></>} />
        <Route path="/about" element={<About />} />
        <Route path="/explore" element={<Explore />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </Router>
  );
}

export default App;
