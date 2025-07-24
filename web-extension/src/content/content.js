(function() {
    'use strict';

    console.log('Quantum Safe content script loaded on:', window.location.href);

    // Better ICP environment detection
    const detectEnvironment = () => {
        const hostname = window.location.hostname;
        const port = window.location.port;
        
        // Check for ICP local development (any subdomain of localhost:4943)
        if (hostname.includes('.localhost') && port === '4943') {
            return 'icp-local';
        }
        
        // Check for ICP mainnet
        if (hostname.includes('.ic0.app') || hostname.includes('.raw.ic0.app')) {
            return 'icp-mainnet';
        }
        
        return 'other';
    };

    const environment = detectEnvironment();
    console.log('🌍 Content script environment detected:', environment);

    // Inject extension availability and communication logic into page
    const script = document.createElement('script');
    script.textContent = `
        console.log('🔌 Injecting Quantum Safe Extension API on: ${window.location.href}');
        
        window.quantumSafeExtension = {
            isAvailable: true,
            version: '1.0.0',
            environment: '${environment}',
            url: window.location.href,
            hostname: window.location.hostname,
            port: window.location.port
        };

        console.log('✅ Quantum Safe Extension API injected:', window.quantumSafeExtension);

        // Listen for messages from the page
        window.addEventListener('quantumSafeMessage', function(event) {
            console.log('📤 Content script relaying message to background:', event.detail);
            
            window.postMessage({
                source: 'quantumSafeExtension',
                payload: event.detail
            }, '*');
        });
        
        console.log('🎧 Extension message listeners set up for environment: ${environment}');
        
        // Dispatch a ready event to let the frontend know extension is available
        setTimeout(() => {
            window.dispatchEvent(new CustomEvent('quantumSafeExtensionReady', {
                detail: window.quantumSafeExtension
            }));
        }, 100);
    `;
    document.documentElement.appendChild(script);
    script.remove();

    // Relay messages between page and background script
    window.addEventListener('message', function(event) {
        if (event.source !== window || !event.data || event.data.source !== 'quantumSafeExtension') return;

        console.log('📨 Content script relaying to background:', event.data.payload);
        
        chrome.runtime.sendMessage(event.data.payload, function(response) {
            console.log('📥 Background response received:', response);
            window.dispatchEvent(new CustomEvent('quantumSafeResponse', {
                detail: { ...response, requestId: event.data.payload.requestId }
            }));
        });
    });

    // Handle auth state changes
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        console.log('📨 Content script received message:', request.action);
        
        if (request.action === 'ping') {
            console.log('🏓 Ping received, responding...');
            sendResponse({ success: true });
            return true;
        } else if (request.action === 'loginSuccess') {
            console.log('✅ Login success event received, dispatching to frontend...');
            window.dispatchEvent(new CustomEvent('quantumSafeAuthChange', {
                detail: {
                    type: 'login',
                    user: request.user,
                    token: request.token
                }
            }));
            sendResponse({ success: true });
            return true;
        } else if (request.action === 'logout') {
            console.log('🚪 Logout event received, dispatching to frontend...');
            window.dispatchEvent(new CustomEvent('quantumSafeAuthChange', {
                detail: { type: 'logout' }
            }));
            sendResponse({ success: true });
            return true;
        }
        
        return false;
    });

    // Add visual indicator for quantum security
    function addQuantumIndicator() {
        // Check if indicator already exists
        if (document.getElementById('quantum-safe-indicator')) {
            return;
        }

        const style = document.createElement('style');
        style.textContent = `
            @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.7; }
            }

            #quantum-safe-indicator {
                position: fixed;
                top: 10px;
                right: 10px;
                background: linear-gradient(45deg, #00d4ff, #0099cc);
                color: white;
                padding: 8px 12px;
                border-radius: 20px;
                font-size: 12px;
                font-weight: bold;
                z-index: 10000;
                box-shadow: 0 2px 10px rgba(0, 212, 255, 0.3);
                animation: pulse 2s infinite;
                pointer-events: none;
            }
        `;
        document.head.appendChild(style);

        const indicator = document.createElement('div');
        indicator.id = 'quantum-safe-indicator';
        indicator.textContent = `🔐 Quantum Secured (${environment})`;
        document.body.appendChild(indicator);
        
        console.log('✅ Quantum indicator added for environment:', environment);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', addQuantumIndicator);
    } else {
        addQuantumIndicator();
    }
})();