import React from 'react';
import { motion } from 'framer-motion';

const About = () => {
  return (
    <div className="min-h-screen bg-gray-900">
      {/* Hero Section */}
      <section className="relative h-screen bg-cover bg-center" style={{ backgroundImage: 'url(/path-to-your-background-image.jpg)' }}>
        <div className="absolute inset-0 bg-black opacity-60"></div>
        <div className="relative z-10 flex flex-col items-center justify-center h-full text-white text-center">
          <motion.h1 
            className="text-6xl font-bold mb-4"
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
          >
            About The Bear
          </motion.h1>
          <motion.p 
            className="text-xl max-w-2xl"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
          >
            At The Bear, our mission is to connect people with nature, encouraging exploration and adventure while providing the tools to make outdoor experiences truly unforgettable.
          </motion.p>
        </div>
      </section>

{/* Call to Action */}
<section className="py-16 bg-gray-900 text-white text-center">
  <h2 className="text-4xl font-bold mb-6">Join the Adventure!</h2>
  <p className="max-w-xl mx-auto text-lg mb-8">
    Start your journey with <strong>The Bear</strong> today. Explore the outdoors like never before, and join a community passionate about adventure and nature.
  </p>
  
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
      className="absolute inset-0 w-full h-full bg-gradient-to-r from-yellow-500 to-yellow-600"
      whileHover={{ x: 0 }}
      animate={{ x: [0, 100, 0] }}
      transition={{ duration: 1.5, ease: 'easeInOut', repeat: Infinity }}
    ></motion.div>

    {/* Glowing Border Effect */}
    <div className="absolute inset-0 w-full h-full border-2 border-yellow-500 rounded-lg opacity-0 hover:opacity-100 transition-opacity duration-300"></div>

    {/* Text Content */}
    <div className="relative z-10 flex items-center justify-center space-x-2">
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


      {/* Mission Section */}
      <section className="py-16 text-center bg-gray-900 text-white">
        <h2 className="text-4xl font-bold mb-8">Our Mission</h2>
        <p className="max-w-4xl mx-auto text-lg">
          We believe in empowering individuals to explore the wilderness, whether you're a seasoned adventurer or a curious beginner. With features designed for safety, exploration, and education, we aim to make nature accessible for all.
        </p>
      </section>

      {/* Core Values Section */}
      <section className="py-16 bg-white">
        <h2 className="text-3xl font-bold text-center mb-12">Our Core Values</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-12 max-w-7xl mx-auto">
          <motion.div
            className="flex flex-col items-center"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.3 }}
          >
            <div className="w-24 h-24 bg-yellow-500 rounded-full flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-white" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.25-12.75V10l3 3" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-2">Adventure</h3>
            <p className="text-center">Explore new trails, hike the unexplored, and find serenity in the wild.</p>
          </motion.div>

          <motion.div
            className="flex flex-col items-center"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.3 }}
          >
            <div className="w-24 h-24 bg-blue-500 rounded-full flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-white" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.25-12.75V10l3 3" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-2">Community</h3>
            <p className="text-center">Connect with fellow adventurers and share your experiences with our vibrant community.</p>
          </motion.div>

          <motion.div
            className="flex flex-col items-center"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.3 }}
          >
            <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-white" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.25-12.75V10l3 3" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-2">Sustainability</h3>
            <p className="text-center">Preserve and protect the environment with eco-friendly adventure tips and guides.</p>
          </motion.div>
        </div>
      </section>

      {/* Meet the Team Section */}
      <section className="py-16 bg-gray-100 text-center">
        <h2 className="text-3xl font-bold mb-12">Meet Our Team</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-12 max-w-7xl mx-auto">
          <div className="bg-white p-6 shadow-lg rounded-lg">
            <img src="/path-to-team-member1.jpg" alt="Team Member" className="w-32 h-32 rounded-full mx-auto mb-4" />
            <h3 className="text-xl font-bold">Alex Johnson</h3>
            <p className="text-gray-600">Founder & Lead Explorer</p>
          </div>

          <div className="bg-white p-6 shadow-lg rounded-lg">
            <img src="/path-to-team-member2.jpg" alt="Team Member" className="w-32 h-32 rounded-full mx-auto mb-4" />
            <h3 className="text-xl font-bold">Samantha Lee</h3>
            <p className="text-gray-600">Community Manager</p>
          </div>

          <div className="bg-white p-6 shadow-lg rounded-lg">
            <img src="/path-to-team-member3.jpg" alt="Team Member" className="w-32 h-32 rounded-full mx-auto mb-4" />
            <h3 className="text-xl font-bold">David Miller</h3>
            <p className="text-gray-600">Sustainability Expert</p>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 bg-gray-900 text-white text-center">
        <h2 className="text-4xl font-bold mb-6">Join the Adventure!</h2>
        <p className="max-w-xl mx-auto text-lg mb-8">Start your journey with **The Bear** today. Explore the outdoors like never before, and join a community passionate about adventure and nature.</p>
        <a href="/explore" className="px-6 py-3 bg-yellow-500 text-gray-900 font-bold rounded-lg hover:bg-yellow-400 transition duration-300">
          Explore Now
        </a>
      </section>
    </div>
  );
};

export default About;
