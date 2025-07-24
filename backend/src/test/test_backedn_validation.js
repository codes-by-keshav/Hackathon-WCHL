const axios = require('axios');

const BACKEND_URL = 'http://127.0.0.1:5000/api';
const PQC_URL = 'http://127.0.0.1:5001';

async function testBackendValidationLogic() {
    console.log('🔍 DEBUGGING BACKEND VALIDATION LOGIC');
    console.log('='.repeat(50));
    
    try {
        // Generate a key
        const kyberResponse = await axios.post(`${PQC_URL}/generate-kyber-keypair`);
        const kyberKey = kyberResponse.data.data.publicKey;
        
        console.log('🔑 Generated key:', kyberKey.substring(0, 50) + '...');
        
        // Test if backend can validate this key manually
        console.log('\n🧪 Testing manual key validation calls...');
        
        // Check if backend tries to call PQC service for validation
        const testCalls = [
            { url: `${BACKEND_URL}/auth/validate-kyber`, data: { publicKey: kyberKey } },
            { url: `${BACKEND_URL}/validate-kyber`, data: { publicKey: kyberKey } },
            { url: `${BACKEND_URL}/pqc/validate-kyber`, data: { publicKey: kyberKey } },
            { url: `${BACKEND_URL}/kyber/validate`, data: { publicKey: kyberKey } }
        ];
        
        for (const test of testCalls) {
            try {
                const response = await axios.post(test.url, test.data);
                console.log(`✅ ${test.url} worked:`, response.data);
            } catch (error) {
                console.log(`❌ ${test.url} failed:`, error.response?.status, error.response?.data?.error || 'Route not found');
            }
        }
        
        // Check if your backend logs show what's happening
        console.log('\n💡 SOLUTION HINT:');
        console.log('Your backend auth registration is calling some key validation that fails.');
        console.log('Check your backend console logs when you run registration.');
        console.log('The validation error is happening inside your backend registration route.');
        
    } catch (error) {
        console.error('💥 Test failed:', error.message);
    }
}

testBackendValidationLogic();