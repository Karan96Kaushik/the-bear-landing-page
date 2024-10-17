import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../redux/actions/authActions';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector(state => state.auth.user);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
      <div className="bg-gray-800 p-8 rounded-lg shadow-lg text-center">
        <h2 className="text-3xl font-bold mb-4">Welcome, {user?.name}</h2>
        <div className="mb-6 text-left">
          <p><strong>Email:</strong> {user?.email}</p>
          {user?.username && <p><strong>Username:</strong> {user?.username}</p>}
          {/* Add more user information fields as needed */}
        </div>
        <button 
          onClick={handleLogout} 
          className="bg-yellow-500 text-gray-900 font-bold py-2 px-4 rounded hover:bg-yellow-600 transition"
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default Profile;
