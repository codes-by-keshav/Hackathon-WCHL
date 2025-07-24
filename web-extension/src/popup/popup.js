document.addEventListener('DOMContentLoaded', function () {
    console.log('Popup script loaded');

    // Get DOM elements
    const loginTab = document.getElementById('loginTab');
    const registerTab = document.getElementById('registerTab');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');

    // Check if all elements exist
    if (!loginTab || !registerTab || !loginForm || !registerForm || !loginBtn || !registerBtn) {
        console.error('Required DOM elements not found');
        return;
    }

    // Tab switching functionality
    loginTab.addEventListener('click', () => switchTab('login'));
    registerTab.addEventListener('click', () => switchTab('register'));

    // Form submissions
    loginBtn.addEventListener('click', handleLogin);
    registerBtn.addEventListener('click', handleRegister);

    // Check authentication status on load
    checkAuthStatus();

    function switchTab(tab) {
        if (tab === 'login') {
            loginTab.classList.add('active');
            registerTab.classList.remove('active');
            loginForm.classList.add('active');
            registerForm.classList.remove('active');
        } else {
            registerTab.classList.add('active');
            loginTab.classList.remove('active');
            registerForm.classList.add('active');
            loginForm.classList.remove('active');
        }

        // Clear status messages
        clearStatus();
    }

    async function checkAuthStatus() {
        try {
            const response = await chrome.runtime.sendMessage({ action: 'checkAuth' });
            if (response && response.isAuthenticated) {
                showLoggedInState();
            }
        } catch (error) {
            console.log('Not authenticated');
        }
    }

    function showLoggedInState() {
        document.getElementById('status-text').textContent = 'Authenticated';
        document.getElementById('status-description').textContent = 'You are logged in with quantum-safe authentication';

        // Hide forms and show logout
        document.querySelector('.tabs').style.display = 'none';
        loginForm.style.display = 'none';
        registerForm.style.display = 'none';
        document.getElementById('logout-btn').classList.remove('hidden');
    }

    let isRegistering = false;
    async function handleRegister() {
        if (isRegistering) {
            console.log('⚠️ Registration already in progress, ignoring duplicate request');
            return;
        }

        isRegistering = true;
        const username = document.getElementById('registerUsername').value.trim();
        const email = document.getElementById('registerEmail').value.trim();

        console.log('🚀 Starting registration process...', { username, email });

        if (!username || !email) {
            showStatus('error', 'Please fill in all fields', 'register');
            return;
        }

        if (!isValidEmail(email)) {
            showStatus('error', 'Please enter a valid email address', 'register');
            return;
        }

        if (!isValidUsername(username)) {
            showStatus('error', 'Username must be 3-30 characters, alphanumeric and underscore only', 'register');
            return;
        }

        showLoading('register', true);
        disableButton('registerBtn', true);

        try {
            // Generate keypairs first
            console.log('🔑 Generating quantum-safe keys...');
            showStatus('info', 'Generating quantum-safe keys...', 'register');

            //generate kyber
            console.log('📡 Fetching Kyber keypair...');
            const kyberResponse = await fetch('http://localhost:5001/generate-kyber-keypair', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            console.log('📡 Kyber response status:', kyberResponse.status);

            // generate dilithium
            console.log('📡 Fetching Dilithium keypair...');
            const dilithiumResponse = await fetch('http://localhost:5001/generate-dilithium-keypair', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            console.log('📡 Dilithium response status:', dilithiumResponse.status);

            if (!kyberResponse.ok || !dilithiumResponse.ok) {
                throw new Error('Failed to generate cryptographic keys. Make sure PQC service is running.');
            }

            console.log('🔍 Parsing key responses...');
            const kyberKeys = await kyberResponse.json();
            const dilithiumKeys = await dilithiumResponse.json();

            console.log('🔑 Kyber keys generated:', kyberKeys.success ? '✅' : '❌');
            console.log('🔑 Dilithium keys generated:', dilithiumKeys.success ? '✅' : '❌');

            if (!kyberKeys.success || !dilithiumKeys.success) {
                throw new Error('Key generation failed');
            }

            // Register with backend
            console.log('📝 Registering with backend...');
            showStatus('info', 'Registering account...', 'register');

            console.log('📤 Sending registration message to background script...');
            const response = await chrome.runtime.sendMessage({
                action: 'register',
                data: {
                    username,
                    email,
                    kyberPublicKey: kyberKeys.data.publicKey,
                    dilithiumPublicKey: dilithiumKeys.data.publicKey,
                    //ye dikkat ho skti h
                    // kyberPrivateKey: kyberResult.data.privateKey,
                    // dilithiumPrivateKey: dilithiumResult.data.privateKey
                    privateKeys: {
                        kyberPrivateKey: kyberKeys.data.privateKey,
                        dilithiumPrivateKey: dilithiumKeys.data.privateKey
                    }

                }
            });

            console.log('📥 Background script response:', response);
            if (response && response.error) {
                showStatus('error', response.error, 'register');
            } else {
                showStatus('success', 'Registration successful! You can now login.', 'register');

                // Clear form
                document.getElementById('registerUsername').value = '';
                document.getElementById('registerEmail').value = '';

                // Switch to login tab after 2 seconds
                setTimeout(() => switchTab('login'), 2000);
            }
        } catch (error) {
            console.error('Registration error:', error);
            showStatus('error', 'Registration failed: ' + error.message, 'register');
        } finally {
            showLoading('register', false);
            disableButton('registerBtn', false);
            isRegistering = false;
        }
    }

    async function handleLogin() {
        const identifier = document.getElementById('loginIdentifier').value.trim();

        if (!identifier) {
            showStatus('error', 'Please enter your username or email', 'login');
            return;
        }

        showLoading('login', true);
        disableButton('loginBtn', true);

        try {
            const response = await chrome.runtime.sendMessage({
                action: 'login',
                data: { identifier }
            });

            if (response && response.error) {
                showStatus('error', response.error, 'login');
            } else if (response && response.success) {
                showStatus('success', 'Login successful!', 'login');

                // Clear form
                document.getElementById('loginIdentifier').value = '';

                // Notify content script about successful login
                try {
                    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
                    if (tabs[0]) {
                        chrome.tabs.sendMessage(tabs[0].id, {
                            action: 'loginSuccess',
                            user: response.user
                        });
                    }
                } catch (tabError) {
                    console.log('Could not notify content script:', tabError);
                }

                // Show logged in state
                setTimeout(() => {
                    showLoggedInState();
                }, 1000);
            }
        } catch (error) {
            console.error('Login error:', error);
            showStatus('error', 'Login failed: ' + error.message, 'login');
        } finally {
            showLoading('login', false);
            disableButton('loginBtn', false);
        }
    }

    async function testBackendConnection() {
        try {
            console.log('🧪 Testing backend connection...');

            // Test main health endpoint
            console.log('🧪 Testing main health endpoint...');
            const response = await fetch('http://localhost:5000/api/health', {
                method: 'GET'
            });
            console.log('🧪 Main health check status:', response.status);

            if (response.ok) {
                const result = await response.json();
                console.log('🧪 Main health response:', result);
            }

            // Test auth health endpoint
            console.log('🧪 Testing auth health endpoint...');
            const authResponse = await fetch('http://localhost:5000/api/auth/health', {
                method: 'GET'
            });
            console.log('🧪 Auth health check status:', authResponse.status);

            if (authResponse.ok) {
                const authResult = await authResponse.json();
                console.log('🧪 Auth health response:', authResult);
            }

            // Test simple test endpoint
            console.log('🧪 Testing simple test endpoint...');
            const testResponse = await fetch('http://localhost:5000/api/auth/test', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ test: 'data' })
            });
            console.log('🧪 Test endpoint status:', testResponse.status);

            if (testResponse.ok) {
                const testResult = await testResponse.json();
                console.log('🧪 Test endpoint response:', testResult);
            }

        } catch (error) {
            console.error('🧪 Backend connection test failed:', error);
        }
    }

    // Logout handler
    document.getElementById('logout-btn').addEventListener('click', async () => {
        try {
            await chrome.runtime.sendMessage({ action: 'logout' });
            location.reload(); // Refresh popup to show login forms
        } catch (error) {
            console.error('Logout error:', error);
        }
    });

    function showStatus(type, message, form) {
        const statusElement = document.getElementById(`${form}Status`);
        if (statusElement) {
            statusElement.className = `status ${type}`;
            statusElement.textContent = message;
            statusElement.style.display = 'block';
        }
    }

    function clearStatus() {
        const loginStatus = document.getElementById('loginStatus');
        const registerStatus = document.getElementById('registerStatus');
        if (loginStatus) loginStatus.style.display = 'none';
        if (registerStatus) registerStatus.style.display = 'none';
    }

    function showLoading(form, show) {
        const loadingElement = document.getElementById(`${form}Loading`);
        if (loadingElement) {
            loadingElement.style.display = show ? 'flex' : 'none';
        }
    }

    function disableButton(buttonId, disabled) {
        const button = document.getElementById(buttonId);
        if (button) {
            button.disabled = disabled;
        }
    }

    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    function isValidUsername(username) {
        const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
        return usernameRegex.test(username);
    }
});