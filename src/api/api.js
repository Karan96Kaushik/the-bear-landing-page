import axios from 'axios';
import { getToken } from './auth';

// Base URL for API
const API_URL = 'http://localhost:9000';

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

// You can add more API functions here as needed

