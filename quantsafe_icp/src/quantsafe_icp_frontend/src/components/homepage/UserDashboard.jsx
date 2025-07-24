import React from 'react';
import Button from '../common/Button';
import extensionBridge from '../../utils/extensionBridge';

const UserDashboard = ({ user }) => {
  const handleLogout = async () => {
    try {
      await extensionBridge.logout();
      // The auth state change will be handled by the parent component
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative z-10 section-padding quantum-circuit">
      <div className="text-center max-w-4xl mx-auto element-spacing">
        
        {/* Welcome Header */}
        <div className="mb-12">
          <div className="inline-block p-6 bg-gradient-to-br from-black via-gray-900 to-black border-2 border-cyan-400 cyber-dialog">
            {/* Cyber corner decorations */}
            <div className="absolute top-0 left-0 w-6 h-6 border-l-2 border-t-2 border-cyan-400"></div>
            <div className="absolute top-0 right-0 w-6 h-6 border-r-2 border-t-2 border-cyan-400"></div>
            <div className="absolute bottom-0 left-0 w-6 h-6 border-l-2 border-b-2 border-cyan-400"></div>
            <div className="absolute bottom-0 right-0 w-6 h-6 border-r-2 border-b-2 border-cyan-400"></div>
            
            <h1 className="hero-title font-heading neon-text text-green-400">
              ✅ Login Successful!
            </h1>
            <div className="w-20 h-0.5 bg-gradient-to-r from-transparent via-green-400 to-transparent mx-auto mb-6"></div>
            <p className="hero-subtitle text-gray-300 font-light tracking-wider">
              Welcome back, <span className="text-cyan-400 font-semibold">{user?.username}</span>
            </p>
          </div>
        </div>

        {/* User Info Card */}
        <div className="bg-gradient-to-br from-black via-gray-900 to-black p-8 border border-cyan-400 cyber-dialog max-w-md mx-auto mb-8">
          <h2 className="text-2xl font-bold text-cyan-400 mb-6 neon-text">
            🔐 Quantum Profile
          </h2>
          
          <div className="space-y-4 text-left">
            <div className="flex justify-between">
              <span className="text-gray-400 uppercase tracking-wider text-sm">Username:</span>
              <span className="text-white font-semibold">{user?.username}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400 uppercase tracking-wider text-sm">Email:</span>
              <span className="text-white font-semibold">{user?.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400 uppercase tracking-wider text-sm">User ID:</span>
              <span className="text-cyan-400 font-mono text-sm">{user?.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400 uppercase tracking-wider text-sm">Security:</span>
              <span className="text-green-400 font-semibold">🛡️ Quantum-Safe</span>
            </div>
          </div>
        </div>

        {/* Status Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="feature-card">
            <div className="feature-card-content">
              <div className="text-green-400 text-4xl mb-2">🔒</div>
              <h3 className="text-lg font-semibold text-green-400 mb-2">AUTHENTICATED</h3>
              <p className="text-gray-300 text-sm">Post-quantum signature verified</p>
            </div>
          </div>
          
          <div className="feature-card">
            <div className="feature-card-content">
              <div className="text-cyan-400 text-4xl mb-2">🔑</div>
              <h3 className="text-lg font-semibold text-cyan-400 mb-2">KEYS SECURE</h3>
              <p className="text-gray-300 text-sm">Private keys stored locally</p>
            </div>
          </div>
          
          <div className="feature-card">
            <div className="feature-card-content">
              <div className="text-blue-400 text-4xl mb-2">🌐</div>
              <h3 className="text-lg font-semibold text-blue-400 mb-2">READY</h3>
              <p className="text-gray-300 text-sm">Connected to quantum network</p>
            </div>
          </div>
        </div>

        {/* Coming Soon Message */}
        <div className="bg-gradient-to-r from-transparent via-gray-800 to-transparent p-6 border-t border-b border-gray-700 mb-8">
          <h3 className="text-xl font-semibold text-yellow-400 mb-3">
            🚧 Social Feed Coming Soon
          </h3>
          <p className="text-gray-400">
            Your quantum-safe social media experience is being prepared. 
            Stay tuned for secure posts, encrypted messaging, and AI-powered content moderation.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="button-group">
          <Button
            variant="cyber"
            size="lg"
            className="border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:text-black"
            onClick={() => alert('Profile settings coming soon!')}
          >
            ⚙️ PROFILE SETTINGS
          </Button>
          
          <div className="text-gray-600 text-lg font-mono">||</div>
          
          <Button
            variant="cyber"
            size="lg"
            className="border-red-500 text-red-500 hover:bg-red-500 hover:text-black"
            onClick={handleLogout}
          >
            🚪 QUANTUM LOGOUT
          </Button>
        </div>

        {/* Security Footer */}
        <div className="mt-12 text-center">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">
            Protected by Post-Quantum Cryptography
          </p>
          <div className="flex justify-center gap-3 text-xs text-cyan-400">
            <span>KYBER-512</span>
            <span>•</span>
            <span>DILITHIUM-2</span>
            <span>•</span>
            <span>AES-256</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;