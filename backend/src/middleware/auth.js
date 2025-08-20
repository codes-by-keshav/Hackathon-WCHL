const jwt = require('jsonwebtoken');
const User = require('../models/User');
const mongoose = require('mongoose');

const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        console.log('🔐 Auth middleware - checking token...');
        
        if (!authHeader) {
            console.log('❌ No authorization header');
            return res.status(401).json({ error: 'Authorization header required' });
        }

        if (!authHeader.startsWith('Bearer ')) {
            console.log('❌ Invalid auth header format:', authHeader.substring(0, 20));
            return res.status(401).json({ error: 'Bearer token required' });
        }

        const token = authHeader.substring(7);
        console.log('🔑 Token received:', token.substring(0, 30) + '...');

        let decoded;
        
        // For development, handle both real JWTs and mock tokens
        if (process.env.NODE_ENV === 'development' || !process.env.JWT_SECRET) {
            console.log('🔧 Development mode - flexible token handling');
            
            try {
                // Try to decode as JWT first
                const payloadPart = token.split('.')[1];
                if (payloadPart) {
                    decoded = JSON.parse(Buffer.from(payloadPart, 'base64').toString());
                    console.log('✅ Token decoded successfully:', { userId: decoded.userId, username: decoded.username });
                } else {
                    throw new Error('Invalid token format');
                }
            } catch (decodeError) {
                console.log('⚠️ JWT decode failed, using fallback auth');
                // Fallback for development
                decoded = {
                    userId: 'dev_user_123',
                    username: 'dev_user',
                    email: 'dev@quantsafe.com'
                };
            }
        } else {
            // Production mode - strict JWT verification
            try {
                decoded = jwt.verify(token, process.env.JWT_SECRET);
            } catch (jwtError) {
                console.log('❌ JWT verification failed:', jwtError.message);
                return res.status(401).json({ error: 'Invalid token' });
            }
        }

        // Handle development user - convert to valid ObjectId for database operations
        let userId = decoded.userId || decoded.id;
        if (userId === 'dev_user_123') {
            // Use a consistent ObjectId for development user
            userId = '507f1f77bcf86cd799439011';
        }

        // Set user in request
        req.user = {
            userId: userId,
            originalUserId: decoded.userId || decoded.id, // Keep original for logic checks
            username: decoded.username || 'dev_user',
            email: decoded.email || 'dev@quantsafe.com'
        };

        console.log('✅ Authentication successful for user:', req.user.username);
        next();
    } catch (error) {
        console.error('❌ Auth middleware error:', error);
        res.status(500).json({ error: 'Authentication error' });
    }
};

module.exports = authMiddleware;