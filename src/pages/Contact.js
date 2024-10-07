import React, { useState } from 'react';

const Contact = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    alert(`Thank you, ${name}! We'll get back to you soon.`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-600">
      <div className="max-w-4xl p-8 bg-white rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold mb-6 text-center">Contact Us</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <input 
            type="text" 
            placeholder="Your Name" 
            className="w-full p-4 border border-gray-300 rounded-lg"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required 
          />
          <input 
            type="email" 
            placeholder="Your Email" 
            className="w-full p-4 border border-gray-300 rounded-lg"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required 
          />
          <textarea 
            placeholder="Your Message" 
            className="w-full p-4 border border-gray-300 rounded-lg" 
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required 
          />
          <button className="w-full p-4 bg-yellow-500 text-white rounded-lg hover:bg-yellow-400 transition duration-300" type="submit">
            Send Message
          </button>
        </form>
      </div>
    </div>
  );
};

export default Contact;
