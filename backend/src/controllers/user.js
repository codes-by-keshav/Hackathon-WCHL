const User = require('../models/User');

class UserController {
    async getProfile(req, res) {
        try {
            const user = await User.findById(req.user.userId).select('-currentChallenge -challengeId');
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }
            res.json({ success: true, user });
        } catch (error) {
            console.error('Get profile error:', error);
            res.status(500).json({ error: 'Failed to get profile' });
        }
    }

    async updateProfile(req, res) {
        try {
            const updates = req.body;
            const user = await User.findByIdAndUpdate(
                req.user.userId,
                updates,
                { new: true, runValidators: true }
            ).select('-currentChallenge -challengeId');
            
            res.json({ success: true, user });
        } catch (error) {
            console.error('Update profile error:', error);
            res.status(500).json({ error: 'Failed to update profile' });
        }
    }

    async getUserById(req, res) {
        try {
            const user = await User.findById(req.params.id).select('username email createdAt isActive');
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }
            res.json({ success: true, user });
        } catch (error) {
            console.error('Get user error:', error);
            res.status(500).json({ error: 'Failed to get user' });
        }
    }

    async updateMentalHealth(req, res) {
        try {
            const { mentalHealthMetrics } = req.body;
            const user = await User.findByIdAndUpdate(
                req.user.userId,
                { 
                    mentalHealthMetrics: {
                        ...mentalHealthMetrics,
                        lastAssessment: new Date()
                    }
                },
                { new: true }
            );
            res.json({ success: true, mentalHealthMetrics: user.mentalHealthMetrics });
        } catch (error) {
            console.error('Update mental health error:', error);
            res.status(500).json({ error: 'Failed to update mental health metrics' });
        }
    }

    async getUserAnalytics(req, res) {
        try {
            // Use the authenticated user's ID instead of route parameter
            const user = await User.findById(req.user.userId).select('behaviorAnalytics mentalHealthMetrics');
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }
            res.json({ success: true, analytics: { ...user.behaviorAnalytics, ...user.mentalHealthMetrics } });
        } catch (error) {
            console.error('Get analytics error:', error);
            res.status(500).json({ error: 'Failed to get analytics' });
        }
    }
}

module.exports = new UserController();