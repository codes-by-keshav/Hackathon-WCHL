const axios = require('axios');

const BACKEND_URL = 'http://127.0.0.1:5000/api';
const PQC_URL = 'http://127.0.0.1:5001';

async function debugKeyValidation() {
    console.log('🔍 DEBUGGING KEY VALIDATION ISSUE');
    console.log('='.repeat(50));
    
    try {
        // Step 1: Generate keys and inspect them
        console.log('🔑 Generating fresh keys...');
        const kyberResponse = await axios.post(`${PQC_URL}/generate-kyber-keypair`);
        const dilithiumResponse = await axios.post(`${PQC_URL}/generate-dilithium-keypair`);
        
        const kyberKeys = kyberResponse.data.data;
        const dilithiumKeys = dilithiumResponse.data.data;
        
        console.log('📊 Generated Key Analysis:');
        console.log('  Kyber Public Key:');
        console.log('    - Length:', kyberKeys.publicKey.length);
        console.log('    - First 50 chars:', kyberKeys.publicKey.substring(0, 50));
        console.log('    - Last 50 chars:', kyberKeys.publicKey.substring(kyberKeys.publicKey.length - 50));
        console.log('    - Is Base64?', /^[A-Za-z0-9+/]*={0,2}$/.test(kyberKeys.publicKey));
        
        console.log('  Dilithium Public Key:');
        console.log('    - Length:', dilithiumKeys.publicKey.length);
        console.log('    - First 50 chars:', dilithiumKeys.publicKey.substring(0, 50));
        console.log('    - Last 50 chars:', dilithiumKeys.publicKey.substring(dilithiumKeys.publicKey.length - 50));
        console.log('    - Is Base64?', /^[A-Za-z0-9+/]*={0,2}$/.test(dilithiumKeys.publicKey));
        
        // Step 2: Test key validation endpoints on PQC service
        console.log('\n🧪 Testing PQC service key validation...');
        
        try {
            const kyberValidation = await axios.post(`${PQC_URL}/kyber/validate-key`, {
                publicKey: kyberKeys.publicKey
            });
            console.log('✅ Kyber key validation on PQC service:', kyberValidation.data);
        } catch (error) {
            console.log('❌ Kyber key validation failed on PQC service:', error.response?.data);
        }
        
        try {
            const dilithiumValidation = await axios.post(`${PQC_URL}/dilithium/validate-key`, {
                publicKey: dilithiumKeys.publicKey
            });
            console.log('✅ Dilithium key validation on PQC service:', dilithiumValidation.data);
        } catch (error) {
            console.log('❌ Dilithium key validation failed on PQC service:', error.response?.data);
        }
        
        // Step 3: Test minimal registration with just username/email
        console.log('\n🧪 Testing minimal registration (no keys)...');
        try {
            const minimalResponse = await axios.post(`${BACKEND_URL}/auth/register`, {
                username: 'testminimal',
                email: 'minimal@example.com'
            });
            console.log('✅ Minimal registration worked:', minimalResponse.data);
        } catch (error) {
            console.log('❌ Minimal registration failed:', error.response?.data);
        }
        
        // Step 4: Test registration with empty keys
        console.log('\n🧪 Testing registration with empty keys...');
        try {
            const emptyKeysResponse = await axios.post(`${BACKEND_URL}/auth/register`, {
                username: 'testempty',
                email: 'empty@example.com',
                kyberPublicKey: '',
                dilithiumPublicKey: ''
            });
            console.log('✅ Empty keys registration worked:', emptyKeysResponse.data);
        } catch (error) {
            console.log('❌ Empty keys registration failed:', error.response?.data);
        }
        
        // Step 5: Test registration with fake simple keys
        console.log('\n🧪 Testing registration with fake simple keys...');
        try {
            const fakeKeysResponse = await axios.post(`${BACKEND_URL}/auth/register`, {
                username: 'testfake',
                email: 'fake@example.com',
                kyberPublicKey: 'dGVzdGtleQ==', // "testkey" in base64
                dilithiumPublicKey: 'dGVzdGtleTI=' // "testkey2" in base64
            });
            console.log('✅ Fake keys registration worked:', fakeKeysResponse.data);
        } catch (error) {
            console.log('❌ Fake keys registration failed:', error.response?.data);
        }
        
        // Step 6: Test registration with real keys
        console.log('\n🧪 Testing registration with REAL keys...');
        try {
            const realKeysResponse = await axios.post(`${BACKEND_URL}/auth/register`, {
                username: 'testreal',
                email: 'real@example.com',
                kyberPublicKey: kyberKeys.publicKey,
                dilithiumPublicKey: dilithiumKeys.publicKey
            });
            console.log('✅ Real keys registration worked:', realKeysResponse.data);
        } catch (error) {
            console.log('❌ Real keys registration failed:', error.response?.data);
            
            // Let's analyze the error more
            console.log('\n🔍 Detailed Error Analysis:');
            console.log('  - Status:', error.response?.status);
            console.log('  - Error message:', error.response?.data?.error);
            console.log('  - Full response:', JSON.stringify(error.response?.data, null, 2));
        }
        
        // Step 7: Check if backend has key validation endpoint
        console.log('\n🧪 Testing if backend has key validation...');
        try {
            const backendValidation = await axios.post(`${BACKEND_URL}/auth/validate-keys`, {
                kyberPublicKey: kyberKeys.publicKey,
                dilithiumPublicKey: dilithiumKeys.publicKey
            });
            console.log('✅ Backend key validation worked:', backendValidation.data);
        } catch (error) {
            console.log('❌ Backend key validation failed (might not exist):', error.response?.data);
        }
        
    } catch (error) {
        console.error('💥 Debug test failed:', error.message);
    }
}

debugKeyValidation();