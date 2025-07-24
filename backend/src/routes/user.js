const express = require('express');
const userController = require('../controllers/user');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get user analytics - put this BEFORE the /:id route to avoid conflicts
router.get('/analytics', authenticateToken, userController.getUserAnalytics);

// Get user profile
router.get('/profile', authenticateToken, userController.getProfile);

// Update user profile
router.put('/profile', authenticateToken, userController.updateProfile);

// Update mental health metrics
router.patch('/mental-health', authenticateToken, userController.updateMentalHealth);

// Get user by ID (public route for viewing other users) - put this LAST
router.get('/:id', userController.getUserById);

router.get('/health', (req, res) => {
    res.json({ status: 'User service is healthy' });
});

module.exports = router;