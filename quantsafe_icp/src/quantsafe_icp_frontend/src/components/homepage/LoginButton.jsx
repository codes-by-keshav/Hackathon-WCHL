import React, { useState } from 'react';
import Button from '../common/Button';
import LoadingSpinner from '../common/LoadingSpinner';
import extensionBridge from '../../utils/extensionBridge';

const LoginButton = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [identifier, setIdentifier] = useState('');
  const [error, setError] = useState('');
  const [loginSuccess, setLoginSuccess] = useState(false);

  const handleLogin = async () => {
    // Check if extension is available
    if (!extensionBridge.isExtensionAvailable) {
      extensionBridge.showInstallationPrompt();
      return;
    }
    
    // Show login form
    setShowLoginForm(true);
  };

  const submitLogin = async (e) => {
    e.preventDefault();
    
    if (!identifier.trim()) {
      setError('Please enter your username or email');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const result = await extensionBridge.login(identifier);
      
      if (result.success) {
        console.log('🎉 Login successful in component');
        setLoginSuccess(true);
        
        // Show success message briefly, then close
        setTimeout(() => {
          setShowLoginForm(false);
          setIdentifier('');
          setLoginSuccess(false);
        }, 2000);
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const closeForm = () => {
    setShowLoginForm(false);
    setError('');
    setIdentifier('');
    setLoginSuccess(false);
  };

  if (showLoginForm) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
        <div className="relative bg-gradient-to-br from-black via-gray-900 to-black p-8 rounded-none border-2 border-cyan-400 max-w-md w-full mx-4 cyber-dialog">
          {/* Cyber corner decorations */}
          <div className="absolute top-0 left-0 w-6 h-6 border-l-2 border-t-2 border-cyan-400"></div>
          <div className="absolute top-0 right-0 w-6 h-6 border-r-2 border-t-2 border-cyan-400"></div>
          <div className="absolute bottom-0 left-0 w-6 h-6 border-l-2 border-b-2 border-cyan-400"></div>
          <div className="absolute bottom-0 right-0 w-6 h-6 border-r-2 border-b-2 border-cyan-400"></div>
          
          {/* Animated border effect */}
          <div className="absolute inset-0 border border-cyan-400 opacity-20 animate-pulse"></div>
          
          <div className="relative z-10">
            {loginSuccess ? (
              // Success State
              <div className="text-center">
                <div className="text-6xl text-green-400 mb-4">✅</div>
                <h2 className="text-3xl font-bold text-green-400 mb-3 neon-text" style={{ fontFamily: 'var(--font-heading)' }}>
                  Login Successful!
                </h2>
                <div className="w-16 h-0.5 bg-gradient-to-r from-transparent via-green-400 to-transparent mx-auto mb-4"></div>
                <p className="text-gray-400 text-sm" style={{ fontFamily: 'var(--font-body)' }}>
                  Welcome back! Redirecting to your dashboard...
                </p>
                <div className="mt-6">
                  <div className="w-8 h-8 border-2 border-green-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
                </div>
              </div>
            ) : (
              // Login Form
              <>
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-cyan-400 mb-3 neon-text" style={{ fontFamily: 'var(--font-heading)' }}>
                    🔐 Quantum Login
                  </h2>
                  <div className="w-16 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent mx-auto mb-4"></div>
                  <p className="text-gray-400 text-sm" style={{ fontFamily: 'var(--font-body)' }}>
                    Access your quantum-secured digital identity
                  </p>
                </div>

                <form onSubmit={submitLogin} className="space-y-6">
                  <div className="relative">
                    <label className="block text-cyan-300 text-sm font-medium mb-2 uppercase tracking-wider" style={{ fontFamily: 'var(--font-body)' }}>
                      Username or Email
                    </label>
                    <input
                      type="text"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      className="w-full p-4 bg-black border border-gray-600 focus:border-cyan-400 text-white transition-all duration-300 cyber-input"
                      placeholder="Enter your credentials"
                      disabled={isLoading}
                      style={{ fontFamily: 'var(--font-body)' }}
                    />
                    <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-cyan-400 transition-all duration-300 input-underline"></div>
                  </div>

                  {error && (
                    <div className="relative p-4 bg-red-900 bg-opacity-50 border border-red-500 text-red-200 text-sm cyber-alert">
                      <div className="absolute top-0 left-0 w-full h-0.5 bg-red-500 animate-pulse"></div>
                      {error}
                    </div>
                  )}

                  <div className="flex gap-4 pt-4">
                    <button
                      type="button"
                      onClick={closeForm}
                      className="flex-1 py-3 px-6 bg-transparent border border-gray-600 hover:border-gray-400 text-gray-300 hover:text-white transition-all duration-300 cyber-button-secondary"
                      disabled={isLoading}
                      style={{ fontFamily: 'var(--font-body)' }}
                    >
                      CANCEL
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="flex-1 py-3 px-6 bg-transparent border-2 border-cyan-400 text-cyan-400 hover:bg-cyan-400 hover:text-black transition-all duration-300 cyber-button-primary relative overflow-hidden"
                      style={{ fontFamily: 'var(--font-body)' }}
                    >
                      <span className="relative z-10">
                        {isLoading ? (
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                            AUTHENTICATING
                          </div>
                        ) : (
                          '🔑 QUANTUM LOGIN'
                        )}
                      </span>
                    </button>
                  </div>
                </form>

                <div className="mt-6 text-center">
                  <p className="text-xs text-gray-500 uppercase tracking-wider" style={{ fontFamily: 'var(--font-body)' }}>
                    Protected by Post-Quantum Cryptography
                  </p>
                  <div className="flex justify-center gap-2 mt-2 text-xs text-cyan-400">
                    <span>KYBER</span>
                    <span>•</span>
                    <span>DILITHIUM</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <Button
      onClick={handleLogin}
      disabled={isLoading}
      variant="cyber"
      size="lg"
      icon={<img src="/img/enter.png" alt="Login" className="w-5 h-5" />}
    >
      {isLoading ? (
        <>
          <LoadingSpinner size="sm" />
          AUTHENTICATING
        </>
      ) : (
        'QUANTUM LOGIN'
      )}
    </Button>
  );
};

export default LoginButton;