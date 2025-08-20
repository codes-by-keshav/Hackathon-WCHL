console.log('🔌 Injecting Quantum Safe Extension API');

// Get environment data from script attributes
const scriptTag = document.currentScript;
const environment = scriptTag?.getAttribute('data-environment') || 'unknown';
const url = scriptTag?.getAttribute('data-url') || window.location.href;
const hostname = scriptTag?.getAttribute('data-hostname') || window.location.hostname;
const port = scriptTag?.getAttribute('data-port') || window.location.port;

console.log('🌍 Page script environment:', environment);

window.quantumSafeExtension = {
    isAvailable: true,
    version: '1.0.0',
    environment: environment,
    url: url,
    hostname: hostname,
    port: port
};

console.log('✅ Quantum Safe Extension API injected:', window.quantumSafeExtension);

// Listen for messages from the page
window.addEventListener('quantumSafeMessage', function(event) {
    console.log('📤 Page -> Content script message:', event.detail);
    
    // Relay to content script via postMessage
    window.postMessage({
        source: 'quantumSafeExtension',
        type: 'RELAY_TO_BACKGROUND',
        payload: event.detail
    }, '*');
});

// Listen for responses from content script
window.addEventListener('message', function(event) {
    if (event.source !== window || !event.data) return;
    
    if (event.data.source === 'quantumSafeExtensionResponse' && event.data.type === 'BACKGROUND_RESPONSE') {
        console.log('📥 Page received background response:', event.data);
        
        // Dispatch custom event that ExtensionBridge listens for
        window.dispatchEvent(new CustomEvent('quantumSafeResponse', {
            detail: {
                requestId: event.data.requestId,
                ...event.data.response
            }
        }));
    }
});

console.log('🎧 Extension message listeners set up for environment:', environment);

// Dispatch a ready event to let the frontend know extension is available
setTimeout(() => {
    console.log('🎉 Dispatching extension ready event');
    window.dispatchEvent(new CustomEvent('quantumSafeExtensionReady', {
        detail: {
            api: window.quantumSafeExtension,
            isAvailable: true
        }
    }));
}, 100);