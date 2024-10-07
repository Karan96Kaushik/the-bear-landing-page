import React from 'react';
import { motion } from 'framer-motion';

const Hero = () => {
  return (
    <motion.div 
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
        Welcome to The Bear
      </motion.h1>
      <motion.p 
        className="text-xl text-center mb-6 max-w-lg"
        initial={{ y: 50 }}
        animate={{ y: 0 }}
        transition={{ duration: 1 }}
      >
        Embrace the wild. Connect with nature like never before. Adventure is waiting for you!
      </motion.p>
      {/* Call to Action */}
      <section className="py-16 bg-gray-900 text-white text-center">
        <h2 className="text-4xl font-bold mb-6">Join the Adventure!</h2>
        <p className="max-w-xl mx-auto text-lg mb-8">
          Start your journey with <strong>The Bear</strong> today. Explore the outdoors like never before, and join a community passionate about adventure and nature.
        </p>
        
        <motion.a
          href="/explore"
          className="relative inline-block px-6 py-3 text-gray-900 font-bold rounded-lg overflow-hidden z-[100]"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          initial={{ background: 'linear-gradient(90deg, #F59E0B, #D97706)' }}
          transition={{ duration: 0.4 }}
        >
          {/* Animated Gradient Background */}
          <motion.div
            className="absolute inset-0 w-full h-full bg-gradient-to-r from-yellow-500 to-yellow-600"
            whileHover={{ x: 0 }}
            animate={{ x: [0, 100, 0] }}
            transition={{ duration: 1.5, ease: 'easeInOut', repeat: Infinity }}
          ></motion.div>

          {/* Glowing Border Effect */}
          <div className="absolute inset-0 w-full h-full border-2 border-yellow-500 rounded-lg opacity-0 hover:opacity-100 transition-opacity duration-300"></div>

          {/* Text Content */}
          <div className="relative flex items-center justify-center space-x-2">
            <span className="z-10">Explore Now</span>
            
            {/* Animated Arrow */}
            <motion.div
              className="z-10"
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
      </section>

      <div className="absolute inset-0 opacity-20 bg-bear-pattern bg-cover bg-center"></div>
    </motion.div>
  );
};

export default Hero;
