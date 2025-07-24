const axios = require('axios');

// Simulate exactly what your pqcService.js does
class TestPQCService {
    constructor() {
        this.pqcServiceUrl = 'http://127.0.0.1:5001'; // Make sure this matches your pqcService.js
    }

    async validateKyberPublicKey(publicKey) {
        try {
            console.log('🔍 Calling PQC service for Kyber validation...');
            console.log('🔍 URL:', `${this.pqcServiceUrl}/kyber/validate-key`);
            console.log('🔍 PublicKey length:', publicKey.length);
            
            const response = await axios.post(`${this.pqcServiceUrl}/kyber/validate-key`, {
                publicKey
            });
            
            console.log('🔍 Raw response:', response.data);
            console.log('🔍 response.data.valid:', response.data.valid);
            console.log('🔍 Returning:', response.data.valid);
            
            return response.data.valid;
        } catch (error) {
            console.error('❌ Kyber key validation failed:', error.message);
            if (error.response) {
                console.error('❌ Response status:', error.response.status);
                console.error('❌ Response data:', error.response.data);
            }
            return false;
        }
    }

    async validateDilithiumPublicKey(publicKey) {
        try {
            console.log('🔍 Calling PQC service for Dilithium validation...');
            console.log('🔍 URL:', `${this.pqcServiceUrl}/dilithium/validate-key`);
            console.log('🔍 PublicKey length:', publicKey.length);
            
            const response = await axios.post(`${this.pqcServiceUrl}/dilithium/validate-key`, {
                publicKey
            });
            
            console.log('🔍 Raw response:', response.data);
            console.log('🔍 response.data.valid:', response.data.valid);
            console.log('🔍 Returning:', response.data.valid);
            
            return response.data.valid;
        } catch (error) {
            console.error('❌ Dilithium key validation failed:', error.message);
            if (error.response) {
                console.error('❌ Response status:', error.response.status);
                console.error('❌ Response data:', error.response.data);
            }
            return false;
        }
    }
}

async function testBackendPQCValidation() {
    console.log('🚀 Testing Backend PQC Service Validation');
    console.log('='.repeat(50));
    
    const PQC_URL = 'http://127.0.0.1:5001';
    const testPQC = new TestPQCService();
    
    try {
        // Generate keys
        console.log('🔑 Generating test keys...');
        const kyberResponse = await axios.post(`${PQC_URL}/generate-kyber-keypair`);
        const dilithiumResponse = await axios.post(`${PQC_URL}/generate-dilithium-keypair`);
        
        const kyberKey = kyberResponse.data.data.publicKey;
        const dilithiumKey = dilithiumResponse.data.data.publicKey;
        
        console.log('✅ Keys generated successfully');
        
        // Test validation like backend does
        console.log('\n🧪 Testing Kyber validation...');
        const isValidKyber = await testPQC.validateKyberPublicKey(kyberKey);
        console.log('🎯 Final Kyber result:', isValidKyber);
        
        console.log('\n🧪 Testing Dilithium validation...');
        const isValidDilithium = await testPQC.validateDilithiumPublicKey(dilithiumKey);
        console.log('🎯 Final Dilithium result:', isValidDilithium);
        
        console.log('\n🎯 FINAL VALIDATION RESULTS:');
        console.log('  Kyber valid:', isValidKyber);
        console.log('  Dilithium valid:', isValidDilithium);
        console.log('  Both valid:', isValidKyber && isValidDilithium);
        
        if (!isValidKyber || !isValidDilithium) {
            console.log('🔥 THIS IS WHY REGISTRATION FAILS!');
            console.log('Your backend auth controller gets false from validation');
        } else {
            console.log('✅ Validation should pass - there must be another issue');
        }
        
    } catch (error) {
        console.error('💥 Test failed:', error.message);
    }
}

testBackendPQCValidation();