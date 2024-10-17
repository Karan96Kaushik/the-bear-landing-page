import axios from 'axios';
import { getToken } from './auth';

// Base URL for API
const API_URL =  '/api';

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
      }
    });

    return response.data;
  } catch (error) {
    if (error.response && error.response.status === 401) {
      throw new Error('Unauthorized. Please log in again.');
    }
    throw new Error('Failed to fetch data. Please try again later.');
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
      }
    });

    return response.data;
  } catch (error) {
    if (error.response && error.response.status === 401) {
      throw new Error('Unauthorized. Please log in again.');
    }
    throw error;
  }
};

// You can add more API functions here as needed
