import React from 'react';

const Profile = () => {
  const handleLogout = () => {
    localStorage.removeItem('userToken'); // Clear token on logout
    window.location.href = '/login'; // Redirect to login page
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
      <div className="bg-gray-800 p-8 rounded-lg shadow-lg text-center">
        <h2 className="text-3xl font-bold mb-4">Welcome to Your Profile</h2>
        <p className="mb-6">This is your profile page where you can manage your account.</p>
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
