const User = require('../models/User');

class UserController {
    async getProfile(req, res) {
        try {
            console.log('📋 Getting profile for user:', req.user.userId);
            
            // Handle development user
            if (req.user.userId === 'dev_user_123') {
                return res.json({
                    success: true,
                    user: {
                        _id: 'dev_user_123',
                        username: 'dev_user',
                        email: 'dev@quantsafe.com',
                        isActive: true,
                        mentalHealthMetrics: {
                            stressLevel: 3,
                            moodScore: 7,
                            sleepQuality: 6,
                            socialInteraction: 8
                        },
                        behaviorAnalytics: {
                            totalPosts: 0,
                            totalLikes: 0,
                            totalComments: 0,
                            avgPostSentiment: 50
                        },
                        createdAt: new Date(),
                        updatedAt: new Date()
                    }
                });
            }

            const user = await User.findById(req.user.userId).select('-loginChallenge -challengeId');
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
            console.log('📝 Updating profile for user:', req.user.userId);
            
            // Handle development user
            if (req.user.userId === 'dev_user_123') {
                return res.json({
                    success: true,
                    user: {
                        _id: 'dev_user_123',
                        username: 'dev_user',
                        email: 'dev@quantsafe.com',
                        ...req.body, // Include any updates from request
                        updatedAt: new Date()
                    }
                });
            }

            const updates = req.body;
            const user = await User.findByIdAndUpdate(
                req.user.userId,
                updates,
                { new: true, runValidators: true }
            ).select('-loginChallenge -challengeId');
            
            res.json({ success: true, user });
        } catch (error) {
            console.error('Update profile error:', error);
            res.status(500).json({ error: 'Failed to update profile' });
        }
    }

    async getUserById(req, res) {
        try {
            console.log('👤 Getting user by ID:', req.params.id);
            
            // Handle development user lookup
            if (req.params.id === 'dev_user_123') {
                return res.json({
                    success: true,
                    user: {
                        _id: 'dev_user_123',
                        username: 'dev_user',
                        email: 'dev@quantsafe.com',
                        isActive: true,
                        createdAt: new Date()
                    }
                });
            }

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
            console.log('🧠 Updating mental health for user:', req.user.userId);
            
            // Handle development user
            if (req.user.userId === 'dev_user_123') {
                const { mentalHealthMetrics } = req.body;
                return res.json({
                    success: true,
                    mentalHealthMetrics: {
                        ...mentalHealthMetrics,
                        lastAssessment: new Date()
                    }
                });
            }

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
            console.log('📊 Getting analytics for user:', req.user.userId);
            
            // Handle development user
            if (req.user.userId === 'dev_user_123') {
                return res.json({
                    success: true,
                    analytics: {
                        totalPosts: 0,
                        totalLikes: 0,
                        totalComments: 0,
                        avgPostSentiment: 50,
                        stressLevel: 3,
                        moodScore: 7,
                        sleepQuality: 6,
                        socialInteraction: 8,
                        lastAssessment: new Date()
                    }
                });
            }

            // Use the authenticated user's ID instead of route parameter
            const user = await User.findById(req.user.userId).select('behaviorAnalytics mentalHealthMetrics');
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }
            res.json({ 
                success: true, 
                analytics: { 
                    ...user.behaviorAnalytics.toObject(), 
                    ...user.mentalHealthMetrics.toObject() 
                } 
            });
        } catch (error) {
            console.error('Get analytics error:', error);
            res.status(500).json({ error: 'Failed to get analytics' });
        }
    }
}

module.exports = new UserController();