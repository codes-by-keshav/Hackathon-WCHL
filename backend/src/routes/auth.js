const express = require('express');
const authController = require('../controllers/auth');
const pqcService = require('../services/pqcService');
const { validateRegistration, validateLoginChallenge, validateChallengeVerification } = require('../middleware/validation');

const router = express.Router();

router.use((req, res, next) => {
    console.log(`🔐 Auth route: ${req.method} ${req.path}`);
    next();
});

// Test endpoint for debugging
router.post('/test', (req, res) => {
    console.log('🧪 Test endpoint hit!');
    console.log('🧪 Request body:', req.body);
    res.json({ success: true, message: 'Test endpoint working' });
});

// Test PQC service connectivity
router.get('/test-pqc', async (req, res) => {
    try {
        console.log('🧪 Testing PQC service connectivity...');
        
        // Test health endpoint
        const healthResponse = await require('axios').get('http://localhost:5001/health');
        console.log('🧪 PQC Health:', healthResponse.data);
        
        // Test with a sample key (generate one first)
        const kyberResponse = await require('axios').post('http://localhost:5001/generate-kyber-keypair');
        const sampleKyberKey = kyberResponse.data.data.publicKey;
        
        const validationResponse = await require('axios').post('http://localhost:5001/kyber/validate-key', {
            publicKey: sampleKyberKey
        });
        
        console.log('🧪 Sample key validation:', validationResponse.data);
        
        res.json({ 
            success: true, 
            pqcHealth: healthResponse.data,
            sampleValidation: validationResponse.data
        });
    } catch (error) {
        console.error('🧪 PQC test failed:', error.message);
        res.status(500).json({ 
            success: false, 
            error: error.message,
            details: error.response?.data
        });
    }
});

// Register new user
router.post('/register', validateRegistration, authController.register);

// Check if username/email exists
router.post('/check-availability', authController.checkAvailability);

// Get login challenge
router.post('/login-challenge', validateLoginChallenge, authController.loginChallenge);

// Verify login challenge
router.post('/verify-challenge', validateChallengeVerification, authController.verifyChallenge);

// Refresh auth token
router.post('/refresh', authController.refreshToken);

// Logout
router.post('/logout', authController.logout);

// Health check for auth service
router.get('/health', (req, res) => {
    res.json({ status: 'Auth service is healthy' });
});

module.exports = router;