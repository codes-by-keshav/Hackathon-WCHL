// Background script for quantum-safe social media extension

const API_BASE_URL = 'http://localhost:5000/api';

// Listen for messages from popup and content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('🎯 Background received message:', request.action);

    switch (request.action) {
        case 'ping':
            sendResponse({ status: 'pong' });
            break;

        case 'register':
            console.log('🚀 Starting registration handler...');
            handleRegistration(request)
                .then(result => {
                    console.log('✅ Registration completed:', result);
                    sendResponse(result);
                })
                .catch(error => {
                    console.error('❌ Registration failed:', error);
                    sendResponse({ error: error.message });
                });
            return true; // Keep message channel open for async response

        case 'login':
            handleLogin(request.data)
                .then(result => sendResponse(result))
                .catch(error => sendResponse({ error: error.message }));
            return true;

        case 'checkAuth':
            checkAuthentication()
                .then(result => sendResponse(result))
                .catch(error => sendResponse({ isAuthenticated: false }));
            return true;

        case 'getCurrentUser':
            getCurrentUser()
                .then(result => sendResponse(result))
                .catch(error => sendResponse({ user: null }));
            return true;

        case 'logout':
            handleLogout()
                .then(result => sendResponse(result))
                .catch(error => sendResponse({ success: false, error: error.message }));
            return true;
    }
});

async function handleRegistration(request) {
    try {
        console.log('🔍 Full request object:', JSON.stringify(request, null, 2));
        console.log('🔍 request.data:', request.data);
        
        const { username, email, kyberPublicKey, dilithiumPublicKey, privateKeys } = request.data;
        console.log('📝 Handling registration for:', request.data.username);

        // STEP 1: First validate and test private key storage (before backend registration)
        console.log('🔐 Step 1: Testing private key encryption/storage...');
        try {
            const testEncryption = await encryptPrivateKeys({
                kyber: privateKeys.kyberPrivateKey,
                dilithium: privateKeys.dilithiumPrivateKey
            });
            console.log('✅ Private key encryption test successful');
            
            // Test decryption as well
            const testDecryption = await decryptPrivateKeys(testEncryption);
            console.log('✅ Private key decryption test successful');
        } catch (encryptionError) {
            console.error('❌ Private key encryption test failed:', encryptionError);
            throw new Error('Private key storage test failed: ' + encryptionError.message);
        }

        // STEP 2: Prepare registration data - ONLY send public keys to backend
        console.log('🔍 Step 2: Preparing backend registration...');
        const registrationData = {
            username: username,
            email: email,
            kyberPublicKey: kyberPublicKey,
            dilithiumPublicKey: dilithiumPublicKey
        };

        // EXPLICIT CHECK - Make sure no private key data leaks
        const payloadString = JSON.stringify(registrationData);
        if (payloadString.includes('private') || payloadString.includes('Private')) {
            console.error('🚨 PRIVATE KEY DETECTED IN PAYLOAD!');
            console.error('🚨 Payload:', payloadString);
            throw new Error('Private key data detected in registration payload');
        }

        console.log('📤 Clean payload confirmed:', JSON.stringify(registrationData, null, 2));
        console.log('📊 Registration data keys:', Object.keys(registrationData));
        console.log('📏 Kyber key length:', registrationData.kyberPublicKey?.length);
        console.log('📏 Dilithium key length:', registrationData.dilithiumPublicKey?.length);

        // STEP 3: Register with backend
        console.log('📡 Step 3: Registering with backend...');
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(registrationData)
        });

        console.log('📡 Backend response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Backend error response:', errorText);
            console.error('❌ Sent payload was:', JSON.stringify(registrationData, null, 2));
            throw new Error(`Backend registration failed: ${response.status} - ${errorText}`);
        }
        
        const result = await response.json();
        console.log('📥 Backend response data:', result);

        if (!result.success) {
            throw new Error(result.error || 'Backend registration failed');
        }

        console.log('✅ User registered successfully with backend');
        console.log('👤 User ID:', result.user._id);

        // STEP 4: Store private keys locally AFTER successful backend registration
        console.log('🔐 Step 4: Storing private keys locally...');
        try {
            await storePrivateKeys(result.user._id, {
                kyber: privateKeys.kyberPrivateKey,
                dilithium: privateKeys.dilithiumPrivateKey
            });
            console.log('✅ Private keys stored successfully');
        } catch (storageError) {
            console.error('❌ Private key storage failed after backend registration:', storageError);
            // Note: Backend user is already created, but we couldn't store keys locally
            throw new Error('Registration completed on server but failed to store private keys locally: ' + storageError.message);
        }
        
        // STEP 5: Store user session data
        console.log('📝 Step 5: Storing user session...');
        await chrome.storage.local.set({
            currentUser: result.user,
            isAuthenticated: true
        });
        
        console.log('🎉 Registration completed successfully!');
        return { 
            success: true, 
            user: result.user,
            message: 'Registration completed successfully' 
        };
        
    } catch (error) {
        console.error('❌ Registration failed:', error);
        
        // Check if it's a network error
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            throw new Error('Cannot connect to server. Make sure the backend is running on http://localhost:5000');
        }
        
        throw new Error(error.message || 'Registration failed');
    }
}

async function handleLogin(data) {
    try {
        console.log('Handling login for:', data.identifier);

        // Step 1: Get challenge from server
        const challengeResponse = await fetch(`${API_BASE_URL}/auth/login-challenge`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ identifier: data.identifier })
        });
        if (!challengeResponse.ok) {
            const errorText = await challengeResponse.text();
            throw new Error(`Challenge request failed: ${challengeResponse.status} - ${errorText}`);
        }

        const challengeResult = await challengeResponse.json();

        if (!challengeResult.success) {
            throw new Error(challengeResult.error || 'Failed to get login challenge');
        }

        // Step 2: Get stored private keys
        const privateKeys = await getStoredPrivateKeys(challengeResult.userId);
        if (!privateKeys) {
            throw new Error('No private keys found. Please register first.');
        }

        // Step 3: Sign the challenge using PQC service
        const signResponse = await fetch('http://localhost:5001/dilithium-sign', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                privateKey: privateKeys.dilithium,
                message: challengeResult.challenge
            })
        });

        if (!signResponse.ok) {
            throw new Error('Failed to sign challenge. Make sure PQC service is running.');
        }

        const signResult = await signResponse.json();
        if (!signResult.success) {
            throw new Error('Failed to sign challenge');
        }

        // Step 4: Verify login
        const verificationResponse = await fetch(`${API_BASE_URL}/auth/verify-challenge`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userId: challengeResult.userId,
                challengeId: challengeResult.challengeId,
                signature: signResult.data
            })
        });

        if (!verificationResponse.ok) {
            const errorText = await verificationResponse.text();
            throw new Error(`Verification failed: ${verificationResponse.status} - ${errorText}`);
        }

        const verificationResult = await verificationResponse.json();

        if (verificationResult.success) {
            // Store auth token
            await chrome.storage.local.set({
                authToken: verificationResult.token,
                currentUser: verificationResult.user,
                isAuthenticated: true
            });

            console.log('Login successful for user:', verificationResult.user.username);

            await notifyContentScriptOfLogin(verificationResult.user, verificationResult.token);

            return { success: true, user: verificationResult.user, token: verificationResult.token };
        } else {
            throw new Error(verificationResult.error || 'Login verification failed');
        }
    } catch (error) {
        console.error('Login failed:', error);

        // Check if it's a network error
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            throw new Error('Cannot connect to server. Make sure the backend is running.');
        }

        throw new Error(error.message || 'Login failed');
    }
}

async function checkAuthentication() {
    try {
        const result = await chrome.storage.local.get(['authToken', 'isAuthenticated']);
        return { isAuthenticated: !!result.isAuthenticated && !!result.authToken };
    } catch (error) {
        return { isAuthenticated: false };
    }
}

async function getCurrentUser() {
    try {
        const result = await chrome.storage.local.get(['currentUser', 'isAuthenticated']);
        if (result.isAuthenticated && result.currentUser) {
            return { user: result.currentUser };
        }
        return { user: null };
    } catch (error) {
        return { user: null };
    }
}

async function handleLogout() {
    try {
        await chrome.storage.local.remove(['authToken', 'currentUser', 'isAuthenticated']);
        console.log('User logged out successfully');
        return { success: true };
    } catch (error) {
        console.error('Logout failed:', error);
        throw new Error('Logout failed: ' + error.message);
    }
}

async function storePrivateKeys(userId, privateKeys) {
    try {
        console.log('💾 Storing private keys for user:', userId);
        const encryptedKeys = await encryptPrivateKeys(privateKeys);
        await chrome.storage.local.set({
            [`privateKeys_${userId}`]: encryptedKeys
        });
        console.log('✅ Private keys stored successfully');
    } catch (error) {
        console.error('❌ Failed to store private keys:', error);
        throw error;
    }
}


async function getStoredPrivateKeys(userId) {
    try {
        console.log('Retrieving private keys for user:', userId);

        const result = await chrome.storage.local.get([`privateKeys_${userId}`]);
        const encryptedKeys = result[`privateKeys_${userId}`];

        if (!encryptedKeys) {
            console.log('No private keys found for user:', userId);
            return null;
        }

        const decryptedKeys = await decryptPrivateKeys(encryptedKeys);
        console.log('Private keys retrieved successfully for user:', userId);
        return decryptedKeys;
    } catch (error) {
        console.error('Failed to retrieve private keys:', error);
        return null;
    }
}

async function encryptPrivateKeys(privateKeys) {
    try {
        console.log('🔒 Encrypting private keys...');
        const encoder = new TextEncoder();
        const data = encoder.encode(JSON.stringify(privateKeys));

        // Generate a random key for encryption - MAKE IT EXTRACTABLE
        const key = await crypto.subtle.generateKey(
            { name: 'AES-GCM', length: 256 },
            true, // FIXED: Set to true to make key extractable
            ['encrypt', 'decrypt']
        );

        const iv = crypto.getRandomValues(new Uint8Array(12));
        const encrypted = await crypto.subtle.encrypt(
            { name: 'AES-GCM', iv: iv },
            key,
            data
        );

        // Now we can export the key because it's extractable
        const exportedKey = await crypto.subtle.exportKey('raw', key);
        console.log('✅ Private keys encrypted successfully');

        return {
            encrypted: Array.from(new Uint8Array(encrypted)),
            iv: Array.from(iv),
            key: Array.from(new Uint8Array(exportedKey))
        };
    } catch (error) {
        console.error('❌ Encryption failed:', error);
        throw new Error('Failed to encrypt private keys: ' + error.message);
    }
}

async function decryptPrivateKeys(encryptedData) {
    try {
        console.log('🔓 Decrypting private keys...');
        const key = await crypto.subtle.importKey(
            'raw',
            new Uint8Array(encryptedData.key),
            { name: 'AES-GCM' },
            false,
            ['decrypt']
        );

        const decrypted = await crypto.subtle.decrypt(
            { name: 'AES-GCM', iv: new Uint8Array(encryptedData.iv) },
            key,
            new Uint8Array(encryptedData.encrypted)
        );

        const decoder = new TextDecoder();
        const result = JSON.parse(decoder.decode(decrypted));
        console.log('✅ Private keys decrypted successfully');
        return result;
    } catch (error) {
        console.error('❌ Decryption failed:', error);
        throw new Error('Failed to decrypt private keys: ' + error.message);
    }
}

async function notifyContentScriptOfLogin(user, token) {
    try {
        // Get all tabs that might be running the frontend
        const tabs = await chrome.tabs.query({});
        
        // Look for tabs that might be the frontend - updated for ICP pattern
        const frontendTabs = tabs.filter(tab => 
            tab.url && (
                // ICP local development - any subdomain of localhost:4943
                (tab.url.includes('.localhost:4943') || tab.url.includes('localhost:4943')) ||
                // Vite development
                tab.url.includes('localhost:5173') ||
                tab.url.includes('127.0.0.1:5173') ||
                // Other development ports
                tab.url.includes('localhost:3000') ||
                tab.url.includes('localhost:5000') ||
                // ICP mainnet
                tab.url.includes('.ic0.app') ||
                tab.url.includes('.raw.ic0.app')
            )
        );

        console.log('🔍 Found frontend tabs:', frontendTabs.length);
        frontendTabs.forEach(tab => console.log('  - Tab:', tab.id, tab.url));

        // Send login success message to all frontend tabs
        for (const tab of frontendTabs) {
            try {
                // First, check if the content script is ready by pinging it
                await chrome.tabs.sendMessage(tab.id, { action: 'ping' });
                
                // If ping succeeds, send the actual login message
                await chrome.tabs.sendMessage(tab.id, {
                    action: 'loginSuccess',
                    user: user,
                    token: token
                });
                console.log('✅ Notified frontend tab of login success:', tab.id);
            } catch (error) {
                console.log('⚠️ Could not notify tab (content script not ready):', tab.id, error.message);
                
                // Try injecting content script if it's not there
                try {
                    await chrome.scripting.executeScript({
                        target: { tabId: tab.id },
                        files: ['src/content/content.js']
                    });
                    
                    // Wait a bit for content script to load
                    await new Promise(resolve => setTimeout(resolve, 500));
                    
                    // Try sending message again
                    await chrome.tabs.sendMessage(tab.id, {
                        action: 'loginSuccess',
                        user: user,
                        token: token
                    });
                    console.log('✅ Injected content script and notified tab:', tab.id);
                } catch (injectError) {
                    console.log('❌ Failed to inject content script:', tab.id, injectError.message);
                }
            }
        }
    } catch (error) {
        console.error('❌ Failed to notify content scripts:', error);
    }
}

// Initialize extension
chrome.runtime.onInstalled.addListener(() => {
    console.log('Quantum Safe Authenticator extension installed');

    // Clear any existing auth data on install
    chrome.storage.local.clear(() => {
        console.log('Extension storage cleared on install');
    });
});