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

    // Create and inject external script file instead of inline script
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL('injected/page-script.js');
    script.setAttribute('data-environment', environment);
    script.setAttribute('data-url', window.location.href);
    script.setAttribute('data-hostname', window.location.hostname);
    script.setAttribute('data-port', window.location.port);
    
    // Inject at document_start to ensure it runs early
    (document.head || document.documentElement).appendChild(script);
    script.onload = function() {
        script.remove();
        console.log('✅ Quantum Safe page script injected successfully');
    };

    // FIXED: Listen for messages from the injected script
    window.addEventListener('message', function(event) {
        if (event.source !== window || !event.data) return;
        
        if (event.data.source === 'quantumSafeExtension' && event.data.type === 'RELAY_TO_BACKGROUND') {
            console.log('📨 Content script relaying to background:', event.data.payload);
            
            chrome.runtime.sendMessage(event.data.payload, function(response) {
                console.log('📥 Background response received:', response);
                
                // Send response back to page
                window.postMessage({
                    source: 'quantumSafeExtensionResponse',
                    type: 'BACKGROUND_RESPONSE',
                    requestId: event.data.payload.requestId,
                    response: response
                }, '*');
            });
        }
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