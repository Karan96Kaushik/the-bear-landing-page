import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Link } from 'react-router-dom';
import { Provider } from 'react-redux';
import store from './redux/store';
import PublicRoutes from './routes/PublicRoutes';
import PrivateRoutes from './routes/PrivateRoutes';
import MobileMenu from './components/MobileMenu';
import { Toaster } from 'react-hot-toast';
import { privateRoutes } from './routes/PrivateRoutes';
import { publicRoutes } from './routes/PublicRoutes';

function App() {
  const [navbar, setNavbar] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  

  useEffect(() => {
    const unsubscribe = store.subscribe(() => {
      const authState = store.getState().auth;
      setIsAuthenticated(authState.isAuthenticated);
    });

    // Initial check
    const authState = store.getState().auth;
    setIsAuthenticated(authState.isAuthenticated);

    window.addEventListener('scroll', changeBackground);
    return () => {
      unsubscribe();
      window.removeEventListener('scroll', changeBackground);
    };
  }, []);

  const changeBackground = () => {
    if (window.scrollY >= 80) {
      setNavbar(true);
    } else {
      setNavbar(false);
    }
  };

  return (
    <Provider store={store}>
      <Toaster
        position="bottom-left"
        duration={10000}
        toastOptions={{
          success: {
            style: {
              background: 'green',
            },
          },
          error: {
            style: {
              background: '#e15549',
            },
          },
          loading: {
            style: {
              background: 'yellow',
            },
          },
        }}
      />
      <Router>
        {/* Navbar */}
        <header className={`fixed w-full z-50 transition-all duration-300 ${navbar ? 'bg-gray-900 shadow-lg' : 'bg-transparent'}`}>
          <nav className="flex justify-between items-center max-w-7xl mx-auto p-4">
            <Link to="/" className="flex items-center space-x-2">
              <img src="the-bear-logo.png" alt="The Bear Logo" className="w-7 h-10" />
              <h1 className="text-2xl font-bold text-white">The Bear</h1>
            </Link>
            <ul className="hidden md:flex space-x-6">
              {(isAuthenticated ? privateRoutes : publicRoutes).map((item) => (
                <li key={item}>
                  <Link
                    to={item.path}
                    className="text-white hover:text-yellow-500 transition duration-300 font-medium"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="md:hidden">
              <MobileMenu />
            </div>
          </nav>
        </header>

        {/* Public and Private Routes */}
        <main className="dark:bg-gray-900 dark:text-white">
          <PublicRoutes />
          <PrivateRoutes />
        </main>
      </Router>
    </Provider>
  );
}

export default App;
