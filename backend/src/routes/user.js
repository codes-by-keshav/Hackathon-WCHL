const express = require('express');
const userController = require('../controllers/user');
const authMiddleware = require('../middleware/auth'); // Changed from named import

const router = express.Router();

console.log('👤 Setting up user routes...');

// Get user analytics - put this BEFORE the /:id route to avoid conflicts
router.get('/analytics', authMiddleware, userController.getUserAnalytics);

// Get user profile
router.get('/profile', authMiddleware, userController.getProfile);

// Update user profile
router.put('/profile', authMiddleware, userController.updateProfile);

// Update mental health metrics
router.patch('/mental-health', authMiddleware, userController.updateMentalHealth);

// Get user by ID (public route for viewing other users) - put this LAST
router.get('/:id', userController.getUserById);

router.get('/health', (req, res) => {
    res.json({ status: 'User service is healthy' });
});

console.log('✅ User routes configured with auth middleware');

module.exports = router;