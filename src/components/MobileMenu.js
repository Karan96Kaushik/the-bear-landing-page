import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const MobileMenu = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <button onClick={() => setIsOpen(!isOpen)} className="text-white focus:outline-none">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={isOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16m-7 6h7'} />
        </svg>
      </button>
      {isOpen && (
        <div className="absolute right-0 top-16 w-full bg-gray-900 shadow-lg z-50 text-center">
          <ul className="space-y-4 py-6">
            <li><Link to="/" onClick={() => setIsOpen(false)} className="text-white hover:text-yellow-500 transition duration-300">Home</Link></li>
            <li><Link to="/about" onClick={() => setIsOpen(false)} className="text-white hover:text-yellow-500 transition duration-300">About</Link></li>
            <li><Link to="/explore" onClick={() => setIsOpen(false)} className="text-white hover:text-yellow-500 transition duration-300">Explore</Link></li>
            <li><Link to="/contact" onClick={() => setIsOpen(false)} className="text-white hover:text-yellow-500 transition duration-300">Contact</Link></li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default MobileMenu;
