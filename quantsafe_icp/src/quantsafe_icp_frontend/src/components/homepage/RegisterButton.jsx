import React, { useState } from 'react';
import Button from '../common/Button';
import LoadingSpinner from '../common/LoadingSpinner';
import extensionBridge from '../../utils/extensionBridge';

const RegisterButton = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: ''
  });
  const [error, setError] = useState('');

  const handleRegister = async () => {
    if (!extensionBridge.isExtensionAvailable) {
      extensionBridge.showInstallationPrompt();
      return;
    }
    
    setShowRegisterForm(true);
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const submitRegistration = async (e) => {
    e.preventDefault();
    
    if (!formData.username.trim() || !formData.email.trim()) {
      setError('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const result = await extensionBridge.register(formData);
      
      if (result.success) {
        alert('Registration successful! You can now login with your quantum-secured account.');
        setShowRegisterForm(false);
        setFormData({ username: '', email: '' });
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const closeForm = () => {
    setShowRegisterForm(false);
    setError('');
    setFormData({ username: '', email: '' });
  };

  if (showRegisterForm) {
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
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-cyan-400 mb-3 neon-text" style={{ fontFamily: 'var(--font-heading)' }}>
                🚀 Quantum Register
              </h2>
              <div className="w-16 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent mx-auto mb-4"></div>
              <p className="text-gray-400 text-sm" style={{ fontFamily: 'var(--font-body)' }}>
                Join the future of secure social networking
              </p>
            </div>

            <form onSubmit={submitRegistration} className="space-y-6">
              <div className="relative">
                <label className="block text-cyan-300 text-sm font-medium mb-2 uppercase tracking-wider" style={{ fontFamily: 'var(--font-body)' }}>
                  Username
                </label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  className="w-full p-4 bg-black border border-gray-600 focus:border-cyan-400 text-white transition-all duration-300 cyber-input"
                  placeholder="Choose your identity"
                  disabled={isLoading}
                  style={{ fontFamily: 'var(--font-body)' }}
                />
              </div>

              <div className="relative">
                <label className="block text-cyan-300 text-sm font-medium mb-2 uppercase tracking-wider" style={{ fontFamily: 'var(--font-body)' }}>
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full p-4 bg-black border border-gray-600 focus:border-cyan-400 text-white transition-all duration-300 cyber-input"
                  placeholder="Your secure contact"
                  disabled={isLoading}
                  style={{ fontFamily: 'var(--font-body)' }}
                />
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
                  className="flex-1 py-3 px-6 bg-transparent border border-gray-600 hover:border-gray-400 text-gray-300 hover:text-white transition-all duration-300"
                  disabled={isLoading}
                  style={{ fontFamily: 'var(--font-body)' }}
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 py-3 px-6 bg-transparent border-2 border-cyan-400 text-cyan-400 hover:bg-cyan-400 hover:text-black transition-all duration-300 relative overflow-hidden"
                  style={{ fontFamily: 'var(--font-body)' }}
                >
                  <span className="relative z-10">
                    {isLoading ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                        CREATING
                      </div>
                    ) : (
                      '🚀 CREATE ACCOUNT'
                    )}
                  </span>
                </button>
              </div>
            </form>

            <div className="mt-6 text-center">
              <p className="text-xs text-gray-500 uppercase tracking-wider" style={{ fontFamily: 'var(--font-body)' }}>
                Quantum keys generated locally
              </p>
              <div className="flex justify-center gap-2 mt-2 text-xs text-cyan-400">
                <span>SECURE</span>
                <span>•</span>
                <span>PRIVATE</span>
                <span>•</span>
                <span>QUANTUM-SAFE</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Button
      onClick={handleRegister}
      disabled={isLoading}
      variant="cyber"
      size="lg"
      icon={<img src="/img/add-user.png" alt="Register" className="w-5 h-5" />}
    >
      {isLoading ? (
        <>
          <LoadingSpinner size="sm" />
          INITIALIZING
        </>
      ) : (
        'QUANTUM REGISTER'
      )}
    </Button>
  );
};

export default RegisterButton;