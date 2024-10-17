import axios from 'axios';
import store from '../redux/store';
import { logout } from '../redux/actions/authActions';

const API_URL = 'http://localhost:9000';

export const verifyToken = async () => {
  const token = localStorage.getItem('thebearToken');
  if (!token) return false;

  try {
    const response = await axios.get(`${API_URL}/verify-token`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data.isValid;
  } catch (error) {
    console.error('Token verification failed:', error);
    store.dispatch(logout());
    return false;
  }
};

