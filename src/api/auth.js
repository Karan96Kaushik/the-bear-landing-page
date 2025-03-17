import axios from 'axios';

// Base URL for API
const API_URL =  '/api/';

/**
 * Login user API call
 * @param {Object} credentials - The user's login credentials (email, password)
 * @returns {Promise} - Resolves with the user token and data or error
 */
export const loginUser = async (credentials) => {
  try {
    const response = await axios.post(`${API_URL}/login`, credentials);

    const { accessToken, user, refreshToken } = response.data;
    localStorage.setItem('thebearToken', accessToken);
    localStorage.setItem('thebearRefreshToken', refreshToken);

    return {
      token: accessToken,
      user: user
    };
  } catch (error) {
    throw new Error('Login failed. Please check your credentials.');
  }
};

/**
 * Get token from localStorage
 * @returns {string | null} - The user's token or null if not logged in
 */
export const getToken = () => {
  return localStorage.getItem('thebearToken');
};

/**
 * Logout the user
 * Removes token from storage
 */
export const logoutUser = () => {
  localStorage.removeItem('thebearToken');
};

/**
 * Get refresh token from localStorage
 * @returns {string | null} - The user's refresh token or null if not logged in
 */
export const getRefreshToken = () => {
  return localStorage.getItem('thebearRefreshToken');
};

/**
 * Set refresh token in localStorage
 * @param {string} token - The refresh token to set
 */
export const setRefreshToken = (token) => {
  localStorage.setItem('thebearRefreshToken', token);
};

/**
 * Set token in localStorage
 * @param {string} token - The token to set
 */
export const setToken = (token) => {
  localStorage.setItem('thebearToken', token);
};
