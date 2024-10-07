import axios from 'axios';

// Base URL for API
const API_URL = 'http://localhost:9000';

/**
 * Login user API call
 * @param {Object} credentials - The user's login credentials (email, password)
 * @returns {Promise} - Resolves with the user token or error
 */
export const loginUser = async (credentials) => {
  try {
    const response = await axios.post(`${API_URL}/login`, credentials);

    // Save token to localStorage (or cookies)
    localStorage.setItem('userToken', response.data.token);

    return response.data;
  } catch (error) {
    // Throw error for UI to handle
    throw new Error('Login failed. Please check your credentials.');
  }
};

/**
 * Get token from localStorage
 * @returns {string | null} - The user's token or null if not logged in
 */
export const getToken = () => {
  return localStorage.getItem('userToken');
};

/**
 * Logout the user
 * Removes token from storage
 */
export const logoutUser = () => {
  localStorage.removeItem('userToken');
};
