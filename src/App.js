import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Link, useLocation } from 'react-router-dom';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import {
  ChevronsLeft,
  ClipboardList,
  Compass,
  FileSpreadsheet,
  FlaskConical,
  Home,
  Info,
  LayoutDashboard,
  LineChart,
  LogIn,
  Mail,
  Menu,
  PenLine,
  User,
  X,
} from 'lucide-react';
import store, { persistor } from './redux/store';
import PublicRoutes from './routes/PublicRoutes';
import PrivateRoutes from './routes/PrivateRoutes';
import PollingBadge from './components/PollingBadge';
import { Toaster } from 'react-hot-toast';
import { privateRoutes } from './routes/PrivateRoutes';
import { publicRoutes } from './routes/PublicRoutes';

/** Lucide icon per route path (sidebar + collapsed rail). */
const NAV_ICON_BY_PATH = {
  '/': Home,
  '/about': Info,
  '/explore': Compass,
  '/contact': Mail,
  '/login': LogIn,
  '/profile': User,
  '/simulator-v3': FlaskConical,
  '/my-orders': ClipboardList,
  '/ret-orders': LayoutDashboard,
  '/dashboard': LineChart,
  '/csv-logs': FileSpreadsheet,
  '/manual-order': PenLine,
};

function AppShell() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const unsubscribe = store.subscribe(() => {
      const authState = store.getState().auth;
      setIsAuthenticated(authState.isAuthenticated);
    });

    const authState = store.getState().auth;
    setIsAuthenticated(authState.isAuthenticated);

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname]);

  const navItems = isAuthenticated ? privateRoutes : publicRoutes;

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Mobile top bar */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between gap-2 border-b border-gray-800 bg-gray-900 px-3 py-2">
        <button
          type="button"
          onClick={() => setMobileNavOpen(true)}
          className="rounded-lg p-2 text-white hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-yellow-500/50"
          aria-label="Open menu"
        >
          <Menu className="h-6 w-6" strokeWidth={2} />
        </button>
        <Link to="/" className="flex min-w-0 flex-1 items-center justify-center gap-2">
          <img src="the-bear-logo.png" alt="" className="h-8 w-auto shrink-0" />
          <span className="truncate text-lg font-bold">The Bear</span>
        </Link>
        <div className="shrink-0">
          <PollingBadge />
        </div>
      </header>

      {/* Mobile overlay */}
      {mobileNavOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          aria-label="Close menu"
          onClick={() => setMobileNavOpen(false)}
        />
      )}

      {/* Left sidebar */}
      <aside
        className={[
          'fixed inset-y-0 left-0 z-50 flex w-56 flex-col border-r border-gray-800 bg-gray-900 transition-transform duration-300 md:transition-[width] md:duration-300',
          mobileNavOpen ? 'translate-x-0' : '-translate-x-full',
          'md:translate-x-0',
          collapsed ? 'md:w-16' : 'md:w-56',
        ].join(' ')}
      >
        <div className={`flex items-center gap-2 border-b border-gray-800 py-3 ${collapsed ? 'md:justify-center md:px-0' : 'px-4'} justify-between px-4`}>
          <Link
            to="/"
            className={`flex min-w-0 items-center gap-2 ${collapsed ? 'md:hidden' : ''}`}
            onClick={() => setMobileNavOpen(false)}
          >
            <img src="the-bear-logo.png" alt="" className="h-9 w-auto shrink-0" />
            <span className="truncate text-xl font-bold">The Bear</span>
          </Link>
          <Link
            to="/"
            className={`hidden ${collapsed ? 'md:flex' : ''} md:items-center md:justify-center`}
            onClick={() => setMobileNavOpen(false)}
            title="Home"
          >
            <img src="the-bear-logo.png" alt="The Bear" className="h-9 w-auto" />
          </Link>
          <button
            type="button"
            onClick={() => setMobileNavOpen(false)}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-800 hover:text-white md:hidden"
            aria-label="Close menu"
          >
            <X className="h-6 w-6" strokeWidth={2} />
          </button>
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            className="hidden rounded-lg p-1.5 text-gray-400 hover:bg-gray-800 hover:text-white md:inline-flex"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-expanded={!collapsed}
          >
            <ChevronsLeft
              className={`h-5 w-5 transition-transform ${collapsed ? 'rotate-180' : ''}`}
              strokeWidth={2}
            />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-3">
          <ul className="space-y-1 px-2">
            {navItems.map((item) => {
              const Icon = NAV_ICON_BY_PATH[item.path] || Home;
              const active = location.pathname === item.path;
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    title={collapsed ? item.name : undefined}
                    onClick={() => setMobileNavOpen(false)}
                    className={[
                      'flex items-center rounded-lg text-sm font-medium text-gray-200 transition-colors hover:bg-gray-800 hover:text-yellow-500',
                      collapsed ? 'md:justify-center md:px-0 md:py-2.5' : 'gap-3 px-3 py-2.5',
                      active ? 'bg-gray-800 text-yellow-500' : '',
                    ].join(' ')}
                  >
                    <Icon className="h-5 w-5 shrink-0 opacity-90" strokeWidth={2} aria-hidden />
                    <span className={`truncate ${collapsed ? 'md:hidden' : ''}`}>{item.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className={`hidden border-t border-gray-800 py-3 md:block ${collapsed ? 'px-2' : 'px-4'}`}>
          <PollingBadge />
        </div>
      </aside>

      <main
        className={[
          'min-h-screen bg-gray-900 pt-[3.25rem] transition-[padding] duration-300 md:pt-0',
          collapsed ? 'md:pl-16' : 'md:pl-56',
        ].join(' ')}
      >
        <PublicRoutes />
        <PrivateRoutes />
      </main>
    </div>
  );
}

function App() {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
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
          <AppShell />
        </Router>
      </PersistGate>
    </Provider>
  );
}

export default App;
