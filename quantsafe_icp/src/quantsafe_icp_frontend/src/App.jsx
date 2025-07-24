import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Homepage from './pages/Homepage';
import Dashboard from './pages/Dashboard';
import extensionBridge from './utils/extensionBridge';
import { ENVIRONMENT } from './config/api';

// import './styles/globals.css';

const App = () => {
  const [authState, setAuthState] = useState({
    isAuthenticated: false,
    user: null,
    loading: true
  });

  useEffect(() => {
    console.log(`🚀 App starting in ${ENVIRONMENT} mode`);
    
    // Check initial authentication state
    const checkInitialAuth = async () => {
      try {
        const isLoggedIn = await extensionBridge.isLoggedIn();
        setAuthState(prev => ({
          ...prev,
          isAuthenticated: isLoggedIn,
          loading: false
        }));
      } catch (error) {
        console.error('❌ Auth check failed:', error);
        setAuthState(prev => ({
          ...prev,
          loading: false
        }));
      }
    };

    checkInitialAuth();

    // Listen for auth state changes from extension
    const unsubscribe = extensionBridge.onAuthStateChange((authData) => {
      console.log('🔄 Auth state changed:', authData);
      setAuthState({
        isAuthenticated: authData.isAuthenticated,
        user: authData.user,
        loading: false
      });
    });

    return unsubscribe;
  }, []);

  if (authState.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="cyber-spinner mb-4"></div>
          <p className="text-cyan-400 font-mono">Checking quantum authentication...</p>
          <p className="text-gray-500 text-sm mt-2">Environment: {ENVIRONMENT}</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route 
          path="/" 
          element={<Homepage authState={authState} />} 
        />
        <Route 
          path="/dashboard" 
          element={<Dashboard authState={authState} />} 
        />
      </Routes>
    </Router>
  );
};

export default App;