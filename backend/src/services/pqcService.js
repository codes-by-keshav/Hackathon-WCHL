const axios = require('axios');

class PQCService {
    constructor() {
        // Use IPv4 explicitly instead of localhost
        this.pqcServiceUrl = 'http://127.0.0.1:5001';
    }

    async generateKyberKeyPair() {
        try {
            const response = await axios.post(`${this.pqcServiceUrl}/generate-kyber-keypair`);
            return response.data;
        } catch (error) {
            console.error('Kyber key generation failed:', error);
            throw new Error('Failed to generate Kyber key pair');
        }
    }

    async generateDilithiumKeyPair() {
        try {
            const response = await axios.post(`${this.pqcServiceUrl}/generate-dilithium-keypair`);
            return response.data;
        } catch (error) {
            console.error('Dilithium key generation failed:', error);
            throw new Error('Failed to generate Dilithium key pair');
        }
    }

    async validateKyberPublicKey(publicKey) {
        try {
            console.log('🔍 Validating Kyber key with PQC service...');
            console.log('🔍 PQC Service URL:', this.pqcServiceUrl);
            console.log('🔍 Kyber key length:', publicKey?.length);
            console.log('🔍 Kyber key sample:', publicKey?.substring(0, 50) + '...');

            // Test if PQC service is accessible first
            try {
                const healthResponse = await axios.get(`${this.pqcServiceUrl}/health`, { timeout: 5000 });
                console.log('🔍 PQC service health:', healthResponse.data);
            } catch (healthError) {
                console.error('❌ PQC service health check failed:', healthError.message);
                throw new Error('PQC service is not accessible');
            }

            const response = await axios.post(`${this.pqcServiceUrl}/kyber/validate-key`, {
                publicKey
            }, { timeout: 10000 });
            
            console.log('🔍 Kyber validation response:', response.data);
            return response.data.valid;
        } catch (error) {
            console.error('❌ Kyber key validation failed:', error.message);
            if (error.response) {
                console.error('❌ Response status:', error.response.status);
                console.error('❌ Response data:', error.response.data);
            }
            if (error.code === 'ECONNREFUSED') {
                console.error('❌ PQC service is not running on', this.pqcServiceUrl);
            }
            return false;
        }
    }

    async validateDilithiumPublicKey(publicKey) {
        try {
            console.log('🔍 Validating Dilithium key with PQC service...');
            console.log('🔍 Dilithium key length:', publicKey?.length);
            console.log('🔍 Dilithium key sample:', publicKey?.substring(0, 50) + '...');

            const response = await axios.post(`${this.pqcServiceUrl}/dilithium/validate-key`, {
                publicKey
            }, { timeout: 10000 });
            
            console.log('🔍 Dilithium validation response:', response.data);
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

    async encryptWithKyber(plaintext, publicKey) {
        try {
            const response = await axios.post(`${this.pqcServiceUrl}/kyber/encrypt`, {
                plaintext,
                publicKey
            });
            return response.data.ciphertext;
        } catch (error) {
            console.error('Kyber encryption failed:', error);
            throw new Error('Failed to encrypt with Kyber');
        }
    }

    async decryptWithKyber(ciphertext, privateKey) {
        try {
            const response = await axios.post(`${this.pqcServiceUrl}/kyber/decrypt`, {
                ciphertext,
                privateKey
            });
            return response.data.plaintext;
        } catch (error) {
            console.error('Kyber decryption failed:', error);
            throw new Error('Failed to decrypt with Kyber');
        }
    }

    async signWithDilithium(message, privateKey) {
        try {
            const response = await axios.post(`${this.pqcServiceUrl}/dilithium-sign`, {
                message,
                privateKey
            });
            return response.data.data;
        } catch (error) {
            console.error('Dilithium signing failed:', error);
            throw new Error('Failed to sign with Dilithium');
        }
    }

    async verifyDilithiumSignature(message, signature, publicKey) {
        try {
            const response = await axios.post(`${this.pqcServiceUrl}/dilithium-verify`, {
                message,
                signature,
                publicKey
            });
            return response.data.data;
        } catch (error) {
            console.error('Dilithium verification failed:', error);
            return false;
        }
    }
}

module.exports = new PQCService();