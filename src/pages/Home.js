import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const Home = () => {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Hero Section */}
      <motion.section 
        className="relative bg-gray-900 text-white h-screen flex flex-col justify-center items-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5 }}
      >
        <motion.h1 
          className="text-6xl font-bold text-center tracking-wide mb-4"
          initial={{ y: -50 }}
          animate={{ y: 0 }}
          transition={{ duration: 1 }}
        >
          Welcome to <span className="text-yellow-500">The Bear</span>
        </motion.h1>
        <motion.p 
          className="text-xl text-center mb-6 max-w-lg"
          initial={{ y: 50 }}
          animate={{ y: 0 }}
          transition={{ duration: 1 }}
        >
          Embrace the wild. Connect with nature like never before. Adventure is waiting for you!
        </motion.p>
        
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1, duration: 0.8 }}
          className="z-[100]"
        >
          <motion.a
            href="/explore"
            className="relative inline-block px-6 py-3 text-gray-900 font-bold rounded-lg overflow-hidden"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            initial={{ background: 'linear-gradient(90deg, #F59E0B, #D97706)' }}
            transition={{ duration: 0.4 }}
          >
            {/* Animated Gradient Background */}
            <motion.div
              className="absolute inset-0 w-full h-full bg-gradient-to-r from-yellow-500 to-yellow-600 "
              whileHover={{ x: 0 }}
              animate={{ x: [0, 100, 0] }}
              transition={{ duration: 1.5, ease: 'easeInOut', repeat: Infinity }}
            ></motion.div>

            {/* Glowing Border Effect */}
            <div className="absolute inset-0 w-full h-full border-2 border-yellow-500 rounded-lg opacity-0 hover:opacity-100 transition-opacity duration-300 -z-5"></div>

            {/* Text Content */}
            <div className="relative flex items-center justify-center space-x-2">
              <span>Explore Now</span>
              
              {/* Animated Arrow */}
              <motion.div
                initial={{ x: -5 }}
                animate={{ x: [0, 5, 0] }}
                transition={{ duration: 0.6, repeat: Infinity, ease: 'easeInOut' }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </motion.div>
            </div>
          </motion.a>
        </motion.div>

        <div className="absolute inset-0 opacity-20 bg-bear-pattern bg-cover bg-center"></div>
      </motion.section>

      {/* Features Section */}
      <section className="py-16 bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-12">Why Choose The Bear?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <motion.div
              className="bg-gray-900 p-6 rounded-lg shadow-lg"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <img src="/path-to-icon1.svg" alt="Feature 1" className="mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-2">Manage Projects</h3>
              <p className="text-gray-400">Easily keep track of your projects, deadlines, and teams with powerful management tools.</p>
            </motion.div>

            <motion.div
              className="bg-gray-900 p-6 rounded-lg shadow-lg"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <img src="/path-to-icon2.svg" alt="Feature 2" className="mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-2">Connect with Teams</h3>
              <p className="text-gray-400">Collaborate with your team in real-time, share documents, and ensure everyone stays on the same page.</p>
            </motion.div>

            <motion.div
              className="bg-gray-900 p-6 rounded-lg shadow-lg"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <img src="/path-to-icon3.svg" alt="Feature 3" className="mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-2">Grow Your Business</h3>
              <p className="text-gray-400">Leverage analytics and insights to grow your business and make data-driven decisions with ease.</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-16 bg-yellow-500 text-gray-900 text-center">
        <h2 className="text-4xl font-bold mb-6">Start Your Journey with The Bear Today</h2>
        <p className="text-lg mb-8">Join our growing community and take your business to the next level.</p>
        <Link to="/login">
          <motion.button
            className="bg-gray-900 hover:bg-gray-800 text-white font-bold py-3 px-8 rounded-lg text-xl transition duration-300"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Join Now
          </motion.button>
        </Link>
      </section>
    </div>
  );
};

export default Home;
