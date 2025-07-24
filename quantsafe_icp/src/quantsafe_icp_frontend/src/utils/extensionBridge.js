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
        });
        
        // Check if extension injected itself into the page
        const checkExtension = () => {
            if (window.quantumSafeExtension && window.quantumSafeExtension.isAvailable) {
                this.isExtensionAvailable = true;
                console.log('✅ Quantum Safe Extension detected via content script:', window.quantumSafeExtension);
                return true;
            }
            return false;
        };

        // Check immediately
        if (checkExtension()) return;

        // Check periodically for a few seconds
        let attempts = 0;
        const maxAttempts = 20; // Increased attempts
        const checkInterval = setInterval(() => {
            attempts++;
            console.log(`🔍 Checking for extension... attempt ${attempts}/${maxAttempts}`);
            
            if (checkExtension() || attempts >= maxAttempts) {
                clearInterval(checkInterval);
                if (!this.isExtensionAvailable) {
                    console.log('❌ Quantum Safe Extension not detected after waiting');
                    console.log('🔗 Current URL:', window.location.href);
                    console.log('🔗 Environment:', ENVIRONMENT);
                } else {
                    console.log('✅ Extension detection successful');
                }
            }
        }, 500);

        // Setup message listener for responses
        window.addEventListener('message', (event) => {
            if (event.source !== window || !event.data || event.data.source !== 'quantumSafeExtension') {
                return;
            }

            const { requestId, ...responseData } = event.data.payload;
            
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
                this.checkExtensionAvailability();
            } else {
                console.log('Chrome API not available, falling back to content script');
                this.setupContentScriptCommunication();
            }
        } catch (error) {
            console.log('Chrome API error, falling back to content script:', error);
            this.setupContentScriptCommunication();
        }
    }

    async checkExtensionAvailability() {
        try {
            if (typeof chrome !== 'undefined' && chrome.runtime) {
                const response = await this.sendMessage({ action: 'ping' });
                this.isExtensionAvailable = !!response;
                console.log('🔌 Extension availability (direct):', this.isExtensionAvailable);
            }
        } catch (error) {
            console.warn('Direct Chrome API failed, trying content script:', error);
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
            if (!this.isExtensionAvailable && !window.quantumSafeExtension) {
                console.error('❌ Extension not available for message:', message);
                console.log('🔗 Current URL:', window.location.href);
                console.log('🔗 Environment:', ENVIRONMENT);
                reject(new Error('Quantum Safe extension is not installed or available'));
                return;
            }

            const requestId = `req_${++this.requestCounter}_${Date.now()}`;
            this.pendingRequests.set(requestId, { resolve, reject });

            // Set timeout for request
            setTimeout(() => {
                if (this.pendingRequests.has(requestId)) {
                    this.pendingRequests.delete(requestId);
                    reject(new Error('Request timeout'));
                }
            }, 30000); // 30 second timeout

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

    async register(userData) {
        try {
            if (!this.isExtensionAvailable && !window.quantumSafeExtension) {
                this.showInstallationPrompt();
                throw new Error('Quantum Safe extension is required for registration. Please install the extension first.');
            }

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
            if (!this.isExtensionAvailable && !window.quantumSafeExtension) {
                this.showInstallationPrompt();
                throw new Error('Quantum Safe extension is required for login. Please install the extension first.');
            }

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
            if (!this.isExtensionAvailable && !window.quantumSafeExtension) {
                return false;
            }

            const response = await this.sendMessage({ action: 'checkAuth' });
            return response.isAuthenticated || false;
        } catch (error) {
            console.warn('Failed to check auth status:', error);
            return false;
        }
    }

    async getCurrentUser() {
        try {
            if (!this.isExtensionAvailable && !window.quantumSafeExtension) {
                return null;
            }

            const response = await this.sendMessage({ action: 'getCurrentUser' });
            return response.user || null;
        } catch (error) {
            console.warn('Failed to get current user:', error);
            return null;
        }
    }

    async logout() {
        try {
            if (!this.isExtensionAvailable && !window.quantumSafeExtension) {
                return;
            }

            await this.sendMessage({ action: 'logout' });
            // Notify frontend of logout
            this.notifyAuthListeners({
                isAuthenticated: false,
                user: null
            });
        } catch (error) {
            console.error('Logout failed:', error);
            // Still notify frontend of logout even if extension call failed
            this.notifyAuthListeners({
                isAuthenticated: false,
                user: null
            });
        }
    }

    showInstallationPrompt() {
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
                    <div style="
                        position: absolute; top: 0; left: 0; width: 20px; height: 20px;
                        border-left: 2px solid #06b6d4; border-top: 2px solid #06b6d4;
                    "></div>
                    <div style="
                        position: absolute; top: 0; right: 0; width: 20px; height: 20px;
                        border-right: 2px solid #06b6d4; border-top: 2px solid #06b6d4;
                    "></div>
                    <div style="
                        position: absolute; bottom: 0; left: 0; width: 20px; height: 20px;
                        border-left: 2px solid #06b6d4; border-bottom: 2px solid #06b6d4;
                    "></div>
                    <div style="
                        position: absolute; bottom: 0; right: 0; width: 20px; height: 20px;
                        border-right: 2px solid #06b6d4; border-bottom: 2px solid #06b6d4;
                    "></div>
                    
                    <h2 style="
                        color: #06b6d4; margin-bottom: 20px; font-size: 2rem;
                        text-shadow: 0 0 10px rgba(6, 182, 212, 0.5);
                        font-family: 'Cookie', cursive;
                    ">🔐 Extension Required</h2>
                    
                    <div style="
                        width: 60px; height: 2px; 
                        background: linear-gradient(90deg, transparent, #06b6d4, transparent);
                        margin: 0 auto 20px;
                    "></div>
                    
                    <p style="margin-bottom: 25px; line-height: 1.6; color: #a0a0a0;">
                        To access Quantum Safe Social Media, you need our 
                        Post-Quantum Cryptography browser extension for secure authentication.
                    </p>
                    
                    <div style="margin-bottom: 20px; padding: 15px; background: rgba(6, 182, 212, 0.05); border: 1px solid rgba(6, 182, 212, 0.2); border-radius: 5px;">
                        <p style="color: #06b6d4; font-size: 0.9rem; margin: 0;">
                            Environment: ${ENVIRONMENT}<br>
                            URL: ${window.location.href}<br>
                            Hostname: ${window.location.hostname}<br>
                            Port: ${window.location.port}
                        </p>
                    </div>
                    
                    <div style="display: flex; gap: 15px; justify-content: center; margin-top: 30px;">
                        <button onclick="document.getElementById('quantum-extension-modal').remove()" style="
                            padding: 12px 24px; background: transparent; 
                            border: 1px solid #666; color: #a0a0a0;
                            cursor: pointer; font-family: 'Exo 2', sans-serif;
                            text-transform: uppercase; letter-spacing: 1px;
                            transition: all 0.3s ease;
                            clip-path: polygon(0 0, calc(100% - 10px) 0, 100% 100%, 10px 100%);
                        " onmouseover="this.style.borderColor='#a0a0a0'; this.style.color='white';"
                           onmouseout="this.style.borderColor='#666'; this.style.color='#a0a0a0';">
                            Cancel
                        </button>
                        <button onclick="window.open('chrome://extensions/'); document.getElementById('quantum-extension-modal').remove()" style="
                            padding: 12px 24px; background: transparent; 
                            border: 2px solid #06b6d4; color: #06b6d4;
                            cursor: pointer; font-family: 'Exo 2', sans-serif;
                            text-transform: uppercase; letter-spacing: 1px;
                            transition: all 0.3s ease; position: relative; overflow: hidden;
                            clip-path: polygon(0 0, calc(100% - 15px) 0, 100% 100%, 15px 100%);
                        " onmouseover="this.style.background='rgba(6, 182, 212, 0.1)'; this.style.boxShadow='0 0 20px rgba(6, 182, 212, 0.3)';"
                           onmouseout="this.style.background='transparent'; this.style.boxShadow='none';">
                            Install Extension
                        </button>
                    </div>
                    
                    <div style="margin-top: 20px; font-size: 0.8rem; color: #666; text-transform: uppercase; letter-spacing: 1px;">
                        Quantum-Safe • Secure • Private
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }
}

export default new ExtensionBridge();