import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { loginUser } from '../api/auth'; // Import the API helper

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await loginUser({ email, password });
      console.log(response);
      // Redirect or do something with the response
    } catch (err) {
      setError('Invalid email or password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      {/* Background Image */}
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: 'url(/path-to-login-background.jpg)' }}>
        <div className="absolute inset-0 bg-black opacity-60"></div>
      </div>

      {/* Login Form */}
      <motion.div 
        className="relative z-10 bg-white p-8 rounded-lg shadow-lg max-w-md w-full"
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-900">Login to The Bear</h2>

        {/* Error Message */}
        {error && <div className="bg-red-100 text-red-600 p-2 rounded-lg mb-4">{error}</div>}

        {/* Login Form */}
        <form onSubmit={handleLogin}>
          {/* Email Input */}
          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-bold text-gray-700">Email</label>
            <input 
              type="email" 
              id="email" 
              className="w-full p-3 mt-1 border rounded-lg focus:outline-none focus:border-yellow-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {/* Password Input */}
          <div className="mb-4">
            <label htmlFor="password" className="block text-sm font-bold text-gray-700">Password</label>
            <input 
              type="password" 
              id="password" 
              className="w-full p-3 mt-1 border rounded-lg focus:outline-none focus:border-yellow-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {/* Submit Button */}
          <motion.button
            type="submit"
            className={`w-full py-3 mt-4 bg-yellow-500 text-white font-bold rounded-lg hover:bg-yellow-600 transition duration-300 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            whileHover={{ scale: isLoading ? 1 : 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={isLoading}
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </motion.button>
        </form>

        {/* Social Login Options */}
        <div className="flex justify-between items-center mt-6">
          <button className="text-gray-600 hover:text-gray-900 font-bold">
            Login with Google
          </button>
          <button className="text-gray-600 hover:text-gray-900 font-bold">
            Login with Facebook
          </button>
        </div>

        {/* Link to Signup */}
        <div className="mt-6 text-center">
          <a href="/signup" className="text-yellow-500 hover:underline">Don’t have an account? Sign Up</a>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
