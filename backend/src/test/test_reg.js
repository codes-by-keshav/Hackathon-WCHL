const axios = require('axios');

const BACKEND_URL = 'http://127.0.0.1:5000/api';
const PQC_URL = 'http://127.0.0.1:5001';

async function focusedTest(testName, testFunction) {
    console.log(`\n🎯 ${testName}`);
    console.log('='.repeat(60));
    try {
        const result = await testFunction();
        console.log(`✅ PASSED: ${testName}`);
        return result;
    } catch (error) {
        console.log(`❌ FAILED: ${testName}`);
        console.error('💥 Error:', error.message);
        if (error.response) {
            console.error('📡 HTTP Status:', error.response.status);
            console.error('📋 Response Data:', JSON.stringify(error.response.data, null, 2));
        }
        throw error;
    }
}

// Test 1: Generate keys and examine structure
async function testKeyGeneration() {
    console.log('🔑 Generating test keys...');
    
    const kyberResponse = await axios.post(`${PQC_URL}/generate-kyber-keypair`);
    const dilithiumResponse = await axios.post(`${PQC_URL}/generate-dilithium-keypair`);
    
    const keys = {
        kyber: kyberResponse.data.data,
        dilithium: dilithiumResponse.data.data
    };
    
    console.log('📊 Key Structure Analysis:');
    console.log('  Kyber Public Key Length:', keys.kyber.publicKey.length);
    console.log('  Kyber Private Key Length:', keys.kyber.privateKey.length);
    console.log('  Dilithium Public Key Length:', keys.dilithium.publicKey.length);
    console.log('  Dilithium Private Key Length:', keys.dilithium.privateKey.length);
    
    return keys;
}

// Test 2: Simulate exact extension payload structure
async function testExtensionPayloadStructure(keys) {
    console.log('📦 Testing EXACT extension payload structure...');
    
    // This mimics exactly what your popup.js sends
    const extensionPayload = {
        action: 'register',
        data: {
            username: 'testuser123',
            email: 'test@example.com',
            kyberPublicKey: keys.kyber.publicKey,
            dilithiumPublicKey: keys.dilithium.publicKey,
            privateKeys: {
                kyberPrivateKey: keys.kyber.privateKey,
                dilithiumPrivateKey: keys.dilithium.privateKey
            }
        }
    };
    
    console.log('📋 Extension Payload Structure:');
    console.log('  - action:', extensionPayload.action);
    console.log('  - data.username:', extensionPayload.data.username);
    console.log('  - data.email:', extensionPayload.data.email);
    console.log('  - data.kyberPublicKey length:', extensionPayload.data.kyberPublicKey.length);
    console.log('  - data.dilithiumPublicKey length:', extensionPayload.data.dilithiumPublicKey.length);
    console.log('  - data.privateKeys exists:', !!extensionPayload.data.privateKeys);
    console.log('  - data.privateKeys.kyberPrivateKey length:', extensionPayload.data.privateKeys.kyberPrivateKey.length);
    console.log('  - data.privateKeys.dilithiumPrivateKey length:', extensionPayload.data.privateKeys.dilithiumPrivateKey.length);
    
    return extensionPayload;
}

// Test 3: Simulate background script data extraction
async function testBackgroundScriptExtraction(extensionPayload) {
    console.log('⚙️ Simulating background.js data extraction...');
    
    // This mimics your background.js handleRegistration function
    const request = extensionPayload; // This is what chrome.runtime.sendMessage sends
    
    console.log('🔍 Background Script Receives:');
    console.log('  - request.action:', request.action);
    console.log('  - request.data exists:', !!request.data);
    
    // This is the exact line from your background.js
    const { username, email, kyberPublicKey, dilithiumPublicKey, privateKeys } = request.data;
    
    console.log('🔍 Destructured Variables:');
    console.log('  - username:', username);
    console.log('  - email:', email);
    console.log('  - kyberPublicKey length:', kyberPublicKey?.length);
    console.log('  - dilithiumPublicKey length:', dilithiumPublicKey?.length);
    console.log('  - privateKeys exists:', !!privateKeys);
    
    // This is what gets sent to backend
    const registrationData = {
        username,
        email,
        kyberPublicKey,
        dilithiumPublicKey
    };
    
    console.log('📤 Payload to Backend:');
    console.log('  - Keys in payload:', Object.keys(registrationData));
    console.log('  - Contains privateKeys?', 'privateKeys' in registrationData);
    console.log('  - Contains private in JSON?', JSON.stringify(registrationData).includes('private'));
    
    return { registrationData, privateKeys };
}

// Test 4: Test backend registration with clean payload
async function testBackendWithCleanPayload(registrationData) {
    console.log('🌐 Testing backend with CLEAN payload (no private keys)...');
    
    console.log('📋 Clean Payload:', JSON.stringify(registrationData, null, 2));
    
    try {
        const response = await axios.post(`${BACKEND_URL}/auth/register`, registrationData);
        console.log('✅ Backend accepted clean payload');
        console.log('📋 Response:', response.data);
        return response.data;
    } catch (error) {
        console.error('❌ Backend rejected clean payload');
        throw error;
    }
}

// Test 5: Test backend with contaminated payload
async function testBackendWithContaminatedPayload(registrationData, privateKeys) {
    console.log('🦠 Testing backend with CONTAMINATED payload (with private keys)...');
    
    const contaminatedPayload = {
        ...registrationData,
        privateKeys: privateKeys
    };
    
    console.log('📋 Contaminated Payload Keys:', Object.keys(contaminatedPayload));
    
    try {
        const response = await axios.post(`${BACKEND_URL}/auth/register`, contaminatedPayload);
        console.log('⚠️ Backend unexpectedly accepted contaminated payload');
        console.log('📋 Response:', response.data);
        return response.data;
    } catch (error) {
        console.log('✅ Backend correctly rejected contaminated payload');
        console.log('🔍 Error details:', error.response?.data);
        
        // Check if this is our exact error
        const errorMessage = JSON.stringify(error.response?.data);
        if (errorMessage.includes('privateKeys') && errorMessage.includes('not allowed')) {
            console.log('🎯 FOUND THE EXACT ERROR! This is where it fails.');
            return { isTargetError: true, error: error.response.data };
        }
        throw error;
    }
}

// Test 6: Debug what happens if privateKeys accidentally gets into the payload
async function testAccidentalPrivateKeyContamination(keys) {
    console.log('🐛 Testing accidental private key contamination scenarios...');
    
    const scenarios = [
        {
            name: 'privateKeys in root',
            payload: {
                username: 'test1',
                email: 'test1@example.com',
                kyberPublicKey: keys.kyber.publicKey,
                dilithiumPublicKey: keys.dilithium.publicKey,
                privateKeys: keys.kyber.privateKey // Wrong structure
            }
        },
        {
            name: 'kyberPrivateKey in root',
            payload: {
                username: 'test2',
                email: 'test2@example.com',
                kyberPublicKey: keys.kyber.publicKey,
                dilithiumPublicKey: keys.dilithium.publicKey,
                kyberPrivateKey: keys.kyber.privateKey
            }
        },
        {
            name: 'nested privateKeys object',
            payload: {
                username: 'test3',
                email: 'test3@example.com',
                kyberPublicKey: keys.kyber.publicKey,
                dilithiumPublicKey: keys.dilithium.publicKey,
                privateKeys: {
                    kyberPrivateKey: keys.kyber.privateKey,
                    dilithiumPrivateKey: keys.dilithium.privateKey
                }
            }
        }
    ];
    
    for (const scenario of scenarios) {
        console.log(`\n🧪 Testing scenario: ${scenario.name}`);
        try {
            const response = await axios.post(`${BACKEND_URL}/auth/register`, scenario.payload);
            console.log(`⚠️ Scenario "${scenario.name}" unexpectedly succeeded`);
        } catch (error) {
            console.log(`✅ Scenario "${scenario.name}" correctly failed`);
            console.log('📋 Error:', error.response?.data);
            
            const errorStr = JSON.stringify(error.response?.data);
            if (errorStr.includes('privateKeys') || errorStr.includes('private')) {
                console.log('🎯 This scenario triggers our target error!');
            }
        }
    }
}

async function runFocusedTests() {
    console.log('🚀 FOCUSED PRIVATE KEY DEBUGGING');
    console.log('🎯 Goal: Find exactly where "privateKeys not allowed" error occurs');
    console.log('📅 Test time:', new Date().toISOString());
    console.log('='.repeat(80));
    
    try {
        // Generate test keys
        const keys = await focusedTest('Key Generation', testKeyGeneration);
        
        // Test extension payload structure
        const extensionPayload = await focusedTest('Extension Payload Structure', 
            () => testExtensionPayloadStructure(keys));
        
        // Test background script extraction
        const { registrationData, privateKeys } = await focusedTest('Background Script Extraction', 
            () => testBackgroundScriptExtraction(extensionPayload));
        
        // Test clean backend call
        await focusedTest('Backend with Clean Payload', 
            () => testBackendWithCleanPayload(registrationData));
        
        // Test contaminated backend call
        await focusedTest('Backend with Contaminated Payload', 
            () => testBackendWithContaminatedPayload(registrationData, privateKeys));
        
        // Test various contamination scenarios
        await focusedTest('Accidental Contamination Scenarios', 
            () => testAccidentalPrivateKeyContamination(keys));
        
        console.log('\n🎉 FOCUSED TESTS COMPLETED!');
        console.log('🔍 If we found the error, it should be clearly marked above.');
        
    } catch (error) {
        console.log('\n💥 FOCUSED TEST FAILED AT:', error.message);
        console.log('🎯 This is exactly where we need to fix the issue.');
    }
}

// Run the focused tests
runFocusedTests();