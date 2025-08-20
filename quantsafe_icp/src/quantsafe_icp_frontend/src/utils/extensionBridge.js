import { ENVIRONMENT } from '../config/api.js';

class ExtensionBridge {
    constructor() {
        this.extensionId = null;
        this.isExtensionAvailable = false;
        this.authListeners = [];
        this.pendingRequests = new Map();
        this.requestCounter = 0;

        this.init();
    }

    init() {
        // Check environment and setup accordingly
        console.log(`🌍 ExtensionBridge initializing in ${ENVIRONMENT} mode`);
        console.log(`🔗 Current URL: ${window.location.href}`);
        console.log(`🔗 Hostname: ${window.location.hostname}, Port: ${window.location.port}`);

        // Always use content script communication for ICP (both local and mainnet)
        if (this.isICPEnvironment()) {
            console.log('🔌 Using content script communication for ICP');
            this.setupContentScriptCommunication();
        } else {
            // For development, try direct Chrome API first, fallback to content script
            console.log('🔌 Using direct Chrome API for development');
            this.setupDirectChromeAPI();
        }

        this.setupAuthListener();
    }

    safeAtob(str) {
        try {
            return atob(str);
        } catch (e) {
            console.warn('Failed to decode base64:', e);
            return null;
        }
    }

    isICPEnvironment() {
        const hostname = window.location.hostname;
        const port = window.location.port;

        return (
            (hostname.includes('.localhost') && port === '4943') ||
            hostname.includes('.ic0.app') ||
            hostname.includes('.raw.ic0.app') ||
            ENVIRONMENT.startsWith('icp')
        );
    }

    setupContentScriptCommunication() {
    console.log('🔌 Setting up content script communication for ICP');

    // Listen for extension ready event
    window.addEventListener('quantumSafeExtensionReady', (event) => {
        console.log('🎉 Extension ready event received:', event.detail);
        this.isExtensionAvailable = true;
        window.quantumSafeExtension = event.detail.api;
    });

    // Check if extension injected itself into the page
    const checkExtension = () => {
        if (window.quantumSafeExtension) {
            console.log('✅ Extension API found in window');
            this.isExtensionAvailable = true;
            return true;
        }
        return false;
    };

    // Check immediately
    if (checkExtension()) {
        console.log('🎉 Extension detected immediately');
    } else {
        console.log('⚠️ Extension not detected immediately - waiting for ready event');
    }

    // Listen for extension responses via content script
    window.addEventListener('quantumSafeResponse', (event) => {
        console.log('📥 ExtensionBridge received response:', event.detail);
        const { requestId, ...responseData } = event.detail;

        if (requestId && this.pendingRequests.has(requestId)) {
            const { resolve, reject } = this.pendingRequests.get(requestId);
            this.pendingRequests.delete(requestId);

            if (responseData.error) {
                reject(new Error(responseData.error));
            } else {
                resolve(responseData);
            }
        }
    });
}

    setupDirectChromeAPI() {
        console.log('🔌 Setting up direct Chrome API communication');

        try {
            if (typeof chrome !== 'undefined' && chrome.runtime) {
                // Check if extension is available
                console.log('✅ Chrome API available');
                this.isExtensionAvailable = true; // Assume available if Chrome API exists
            } else {
                console.log('Chrome API not available, falling back to content script');
                this.setupContentScriptCommunication();
            }
        } catch (error) {
            console.log('Chrome API error, falling back to content script:', error);
            this.setupContentScriptCommunication();
        }
    }

    setupAuthListener() {
        // Listen for authentication events from extension (direct Chrome API)
        if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
            chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
                if (message.type === 'AUTH_STATE_CHANGED') {
                    console.log('🔄 Auth state change received (direct):', message.data);
                    this.notifyAuthListeners(message.data);
                }
            });
        }

        // Listen for auth change events from content script
        window.addEventListener('quantumSafeAuthChange', (event) => {
            console.log('🔄 Auth change event received from content script:', event.detail);

            if (event.detail.type === 'login') {
                this.notifyAuthListeners({
                    isAuthenticated: true,
                    user: event.detail.user
                });
            } else if (event.detail.type === 'logout') {
                this.notifyAuthListeners({
                    isAuthenticated: false,
                    user: null
                });
            }
        });

        // Listen for extension responses via content script
        window.addEventListener('quantumSafeResponse', (event) => {
            const { requestId, ...responseData } = event.detail;

            if (requestId && this.pendingRequests.has(requestId)) {
                const { resolve, reject } = this.pendingRequests.get(requestId);
                this.pendingRequests.delete(requestId);

                if (responseData.error) {
                    reject(new Error(responseData.error));
                } else {
                    resolve(responseData);
                }
            }
        });
    }

    onAuthStateChange(callback) {
        this.authListeners.push(callback);
        return () => {
            this.authListeners = this.authListeners.filter(cb => cb !== callback);
        };
    }

    notifyAuthListeners(authData) {
        console.log('📢 Notifying auth listeners:', authData);
        this.authListeners.forEach(callback => {
            try {
                callback(authData);
            } catch (error) {
                console.error('❌ Auth listener error:', error);
            }
        });
    }

    async sendMessage(message) {
        // For ICP environments, always use content script
        if (this.isICPEnvironment()) {
            return this.sendMessageViaContentScript(message);
        }

        // Try direct Chrome API first (for development)
        if (typeof chrome !== 'undefined' && chrome.runtime) {
            return new Promise((resolve, reject) => {
                try {
                    chrome.runtime.sendMessage(message, (response) => {
                        if (chrome.runtime.lastError) {
                            console.log('Direct Chrome API failed, trying content script');
                            this.sendMessageViaContentScript(message).then(resolve).catch(reject);
                        } else {
                            resolve(response);
                        }
                    });
                } catch (error) {
                    console.log('Chrome API error, using content script:', error);
                    this.sendMessageViaContentScript(message).then(resolve).catch(reject);
                }
            });
        } else {
            // Use content script communication
            return this.sendMessageViaContentScript(message);
        }
    }

    async sendMessageViaContentScript(message) {
        return new Promise((resolve, reject) => {
            // For development/testing, always allow message sending
            if (!this.isExtensionAvailable && !window.quantumSafeExtension) {
                console.log('⚠️ Extension not available, using fallback for message:', message.action);
                
                // Handle specific actions with fallbacks
                if (message.action === 'getAuthToken') {
                    resolve({ token: this.getFallbackToken() });
                    return;
                } else if (message.action === 'checkAuth') {
                    const token = localStorage.getItem('auth_token');
                    resolve({ isAuthenticated: !!token });
                    return;
                } else {
                    reject(new Error('Quantum Safe extension is not installed or available'));
                    return;
                }
            }

            const requestId = `req_${++this.requestCounter}_${Date.now()}`;
            this.pendingRequests.set(requestId, { resolve, reject });

            // Set timeout for request
            setTimeout(() => {
                if (this.pendingRequests.has(requestId)) {
                    this.pendingRequests.delete(requestId);
                    reject(new Error('Request timeout'));
                }
            }, 10000); // Reduced timeout to 10 seconds

            console.log('📤 Sending message via content script:', { ...message, requestId });

            // Send message via content script
            window.dispatchEvent(new CustomEvent('quantumSafeMessage', {
                detail: {
                    ...message,
                    requestId
                }
            }));
        });
    }

    async getAuthToken() {
        try {
            console.log('🔑 Getting auth token...');

            // Check localStorage first for existing token
            const storedToken = localStorage.getItem('auth_token');
            if (storedToken) {
                console.log('🔍 Found stored token, validating...');

                // Validate token is not expired
                try {
                    const payload = JSON.parse(atob(storedToken.split('.')[1]));
                    const now = Math.floor(Date.now() / 1000);

                    if (payload.exp && payload.exp > now) {
                        console.log('✅ Stored token is valid');
                        return storedToken;
                    } else {
                        console.log('⚠️ Stored token expired');
                        localStorage.removeItem('auth_token');
                    }
                } catch (parseError) {
                    console.log('⚠️ Invalid stored token format');
                    localStorage.removeItem('auth_token');
                }
            }

            // Try to get token from extension if available
            if (this.isExtensionAvailable || window.quantumSafeExtension) {
                console.log('✅ Extension available, requesting auth token');
                try {
                    const response = await this.sendMessage({
                        action: 'getAuthToken'
                    });

                    if (response && response.token) {
                        console.log('✅ Got auth token from extension');
                        localStorage.setItem('auth_token', response.token);
                        return response.token;
                    }
                } catch (extensionError) {
                    console.log('⚠️ Extension failed to provide token:', extensionError.message);
                }
            } else {
                console.log('Extension not available, using fallback token');
            }

            // Fallback for development
            console.log('⚠️ Using fallback development token');
            return this.getFallbackToken();

        } catch (error) {
            console.error('❌ Error getting auth token:', error);
            return this.getFallbackToken();
        }
    }

    getFallbackToken() {
        // Create a more realistic JWT-like token for development
        const mockPayload = {
            userId: 'dev_user_123',
            username: 'dev_user',
            email: 'dev@quantsafe.com',
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
        };

        // Create a simple mock JWT (for development only)
        const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
        const payload = btoa(JSON.stringify(mockPayload));
        const signature = btoa('mock_signature_for_development');

        const mockJWT = `${header}.${payload}.${signature}`;

        // Store it for consistency
        localStorage.setItem('auth_token', mockJWT);
        localStorage.setItem('user_data', JSON.stringify({
            userId: 'dev_user_123',
            username: 'dev_user',
            email: 'dev@quantsafe.com'
        }));

        console.log('🔑 Generated fallback JWT token for development');
        console.log('🔑 Fallback token:', mockJWT.substring(0, 50) + '...');
        return mockJWT;
    }

    async register(userData) {
        try {
            const response = await this.sendMessage({
                action: 'register',
                data: userData
            });

            if (response.error) {
                throw new Error(response.error);
            }

            return response;
        } catch (error) {
            console.error('Registration failed:', error);
            throw error;
        }
    }

    async login(identifier) {
        try {
            const response = await this.sendMessage({
                action: 'login',
                data: { identifier }
            });

            if (response.error) {
                throw new Error(response.error);
            }

            // If login is successful, notify the frontend immediately
            if (response.success) {
                console.log('✅ Login successful, notifying listeners');

                // Store token for fallback use
                if (response.token) {
                    localStorage.setItem('auth_token', response.token);
                }

                this.notifyAuthListeners({
                    isAuthenticated: true,
                    user: response.user
                });
            }

            return response;
        } catch (error) {
            console.error('Login failed:', error);
            throw error;
        }
    }

    async isLoggedIn() {
        try {
            // Always check localStorage first
            const fallbackToken = localStorage.getItem('auth_token');
            if (fallbackToken) {
                // Validate token expiry
                try {
                    const payload = JSON.parse(atob(fallbackToken.split('.')[1]));
                    const now = Math.floor(Date.now() / 1000);
                    if (payload.exp && payload.exp > now) {
                        return true;
                    } else {
                        localStorage.removeItem('auth_token');
                    }
                } catch (e) {
                    localStorage.removeItem('auth_token');
                }
            }

            // Try extension if available
            if (this.isExtensionAvailable || window.quantumSafeExtension) {
                const response = await this.sendMessage({ action: 'checkAuth' });
                return response.isAuthenticated || false;
            }

            return false;
        } catch (error) {
            console.warn('Failed to check auth status:', error);
            return false;
        }
    }

    async getCurrentUser() {
        try {
            // Check localStorage first
            const userData = localStorage.getItem('user_data');
            if (userData) {
                return JSON.parse(userData);
            }

            // Try extension if available
            if (this.isExtensionAvailable || window.quantumSafeExtension) {
                const response = await this.sendMessage({ action: 'getCurrentUser' });
                return response.user || null;
            }

            // Return fallback user data
            return {
                username: 'dev_user',
                email: 'dev@quantsafe.com',
                userId: 'dev_user_123'
            };
        } catch (error) {
            console.warn('Failed to get current user:', error);
            return {
                username: 'dev_user',
                email: 'dev@quantsafe.com',
                userId: 'dev_user_123'
            };
        }
    }

    async logout() {
        try {
            if (this.isExtensionAvailable || window.quantumSafeExtension) {
                await this.sendMessage({ action: 'logout' });
            }

            // Clear local storage
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user_data');

            // Notify frontend of logout
            this.notifyAuthListeners({
                isAuthenticated: false,
                user: null
            });
        } catch (error) {
            console.error('Logout failed:', error);
            // Still clear local storage and notify
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user_data');
            this.notifyAuthListeners({
                isAuthenticated: false,
                user: null
            });
        }
    }

    showInstallationPrompt() {
        // Only show if not in development mode with fallback
        if (process.env.NODE_ENV === 'development') {
            console.log('🔧 Development mode - skipping installation prompt');
            return;
        }

        // Check if modal already exists
        if (document.getElementById('quantum-extension-modal')) {
            return;
        }

        const modal = document.createElement('div');
        modal.id = 'quantum-extension-modal';
        modal.innerHTML = `
            <div style="
                position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
                background: rgba(0,0,0,0.9); z-index: 10000; 
                display: flex; align-items: center; justify-content: center;
            ">
                <div style="
                    background: linear-gradient(135deg, #0a0a0a 0%, #111111 50%, #0a0a0a 100%);
                    padding: 40px; border: 2px solid #06b6d4; text-align: center;
                    color: white; max-width: 500px; position: relative;
                    clip-path: polygon(0 0, calc(100% - 20px) 0, 100% 100%, 20px 100%);
                    font-family: 'Exo 2', sans-serif;
                ">
                    <h2 style="
                        color: #06b6d4; margin-bottom: 20px; font-size: 2rem;
                        text-shadow: 0 0 10px rgba(6, 182, 212, 0.5);
                    ">🔐 Extension Required</h2>
                    
                    <p style="margin-bottom: 25px; line-height: 1.6; color: #a0a0a0;">
                        To access Quantum Safe Social Media, you need our 
                        Post-Quantum Cryptography browser extension for secure authentication.
                    </p>
                    
                    <div style="display: flex; gap: 15px; justify-content: center; margin-top: 30px;">
                        <button onclick="document.getElementById('quantum-extension-modal').remove()" style="
                            padding: 12px 24px; background: transparent; 
                            border: 1px solid #666; color: #a0a0a0;
                            cursor: pointer; transition: all 0.3s ease;
                        ">
                            Cancel
                        </button>
                        <button onclick="window.open('chrome://extensions/'); document.getElementById('quantum-extension-modal').remove()" style="
                            padding: 12px 24px; background: #06b6d4; 
                            border: none; color: white;
                            cursor: pointer; transition: all 0.3s ease;
                        ">
                            Install Extension
                        </button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }
}

export default new ExtensionBridge();