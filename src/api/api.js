import axios from 'axios';
import { getToken, getRefreshToken, setToken, setRefreshToken } from './auth';
import { logout } from '../redux/actions/authActions';

// Base URL for API
const API_URL =  '/api';

// New function to handle unauthorized errors
const handleUnauthorizedError = () => {
  // You can add additional logic here, such as clearing the token or redirecting to login
  logout()
  throw new Error('Unauthorized. Please log in again.');
};

// Add refresh token functionality
const refreshTokens = async () => {
  try {
    const refreshToken = getRefreshToken();
    const response = await axios.post(`${API_URL}/refresh-token`, {
      refreshToken
    });
    
    const { accessToken, refreshToken: newRefreshToken } = response.data;
    setToken(accessToken);
    setRefreshToken(newRefreshToken);
    return accessToken;
  } catch (error) {
    handleUnauthorizedError();
  }
};

/**
 * Fetch data with authorization
 * @param {string} endpoint - The API endpoint to fetch data from
 * @returns {Promise} - Resolves with the fetched data or error
 */
export const fetchAuthorizedData = async (endpoint) => {
  try {
    const token = getToken();
    
    if (!token) {
      throw new Error('No authentication token found. Please log in.');
    }

    try {
      const response = await axios.get(`${API_URL}${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        timeout: 300000
      });
      return response.data;
    } catch (error) {
      if (error.response && error.response.status === 401) {
        // Try to refresh the token
        const newToken = await refreshTokens();
        // Retry the request with new token
        const retryResponse = await axios.get(`${API_URL}${endpoint}`, {
          headers: {
            'Authorization': `Bearer ${newToken}`
          },
          timeout: 300000
        });
        return retryResponse.data;
      }
      throw error;
    }
  } catch (error) {
    console.log(error);
    throw new Error(error?.message);
  }
};

/**
 * Make an authorized POST request
 * @param {string} endpoint - The API endpoint to send data to
 * @param {object} data - The data to be sent in the request body
 * @returns {Promise} - Resolves with the response data or error
 */
export const postAuthorizedData = async (endpoint, data) => {
  try {
    const token = getToken();
    
    if (!token) {
      throw new Error('No authentication token found. Please log in.');
    }

    try {
      const response = await axios.post(`${API_URL}${endpoint}`, data, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 300000
      });
      return response.data;
    } catch (error) {
      if (error.response && error.response.status === 401) {
        // Try to refresh the token
        const newToken = await refreshTokens();
        // Retry the request with new token
        const retryResponse = await axios.post(`${API_URL}${endpoint}`, data, {
          headers: {
            'Authorization': `Bearer ${newToken}`,
            'Content-Type': 'application/json'
          },
          timeout: 300000
        });
        return retryResponse.data;
      }
      throw error;
    }
  } catch (error) {
    throw error;
  }
};

// You can add more API functions here as needed
