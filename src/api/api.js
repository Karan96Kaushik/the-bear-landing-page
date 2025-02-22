import axios from 'axios';
import { getToken } from './auth';
import { logout } from '../redux/actions/authActions';

// Base URL for API
const API_URL =  '/api';

// New function to handle unauthorized errors
const handleUnauthorizedError = () => {
  // You can add additional logic here, such as clearing the token or redirecting to login
  logout()
  throw new Error('Unauthorized. Please log in again.');
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

    const response = await axios.get(`${API_URL}${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      timeout: 300000
    });

    return response.data;
  } catch (error) {
    if (error.response && error.response.status === 401) {
      handleUnauthorizedError();
    }
    console.log(error)
    throw new Error( error?.message);
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
      handleUnauthorizedError();
    }
    throw error;
  }
};

// You can add more API functions here as needed
