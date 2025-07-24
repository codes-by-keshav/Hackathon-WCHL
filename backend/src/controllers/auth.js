const User = require('../models/User');
const pqcService = require('../services/pqcService');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

class AuthController {
    async checkAvailability(req, res) {
        try {
            const { username, email } = req.body;

            const existingUser = await User.findOne({
                $or: [
                    { username: username },
                    { email: email }
                ]
            });

            if (existingUser) {
                return res.status(409).json({
                    available: false,
                    message: existingUser.username === username
                        ? 'Username already taken'
                        : 'Email already registered'
                });
            }

            res.json({ available: true });
        } catch (error) {
            console.error('Check availability error:', error);
            res.status(500).json({ error: 'Failed to check availability' });
        }
    }

    async register(req, res) {
        try {
            const { username, email, kyberPublicKey, dilithiumPublicKey } = req.body;

            console.log('🔍 Registration request received:', { username, email });
            console.log('🔍 Key lengths:', { 
                kyber: kyberPublicKey?.length, 
                dilithium: dilithiumPublicKey?.length 
            });

            // Check if user already exists
            const existingUser = await User.findOne({
                $or: [{ username }, { email }]
            });

            if (existingUser) {
                console.log('❌ User already exists:', existingUser.username);
                return res.status(400).json({ 
                    success: false, 
                    error: 'Username or email already exists' 
                });
            }

            console.log('🔍 Validating PQC keys...');
            
            // Validate PQC keys
            const isValidKyber = await pqcService.validateKyberPublicKey(kyberPublicKey);
            console.log('🔍 Kyber validation result:', isValidKyber);
            
            const isValidDilithium = await pqcService.validateDilithiumPublicKey(dilithiumPublicKey);
            console.log('🔍 Dilithium validation result:', isValidDilithium);

            if (!isValidKyber || !isValidDilithium) {
                console.log('❌ Key validation failed:', { kyber: isValidKyber, dilithium: isValidDilithium });
                return res.status(400).json({ 
                    success: false, 
                    error: 'Invalid post-quantum cryptographic keys' 
                });
            }

            console.log('✅ Keys validated successfully');

            // Create new user
            const user = new User({
                username,
                email,
                kyberPublicKey,
                dilithiumPublicKey,
                isActive: true
            });

            await user.save();
            console.log('✅ User saved successfully:', user._id);

            res.status(201).json({
                success: true,
                message: 'User registered successfully',
                user: {
                    _id: user._id,
                    username: user.username,
                    email: user.email
                }
            });

        } catch (error) {
            console.error('❌ Registration error:', error);
            res.status(500).json({ error: 'Registration failed' });
        }
    }

    async loginChallenge(req, res) {
        try {
            const { identifier } = req.body;
            console.log('🔍 Login challenge request for:', identifier);

            // Find user by username or email
            const user = await User.findOne({
                $or: [
                    { username: identifier },
                    { email: identifier }
                ]
            });

            if (!user || !user.isActive) {
                console.log('❌ User not found:', identifier);
                return res.status(404).json({
                    success: false,
                    error: 'User not found'
                });
            }

            console.log('✅ User found:', user.username, 'ID:', user._id);

            // Generate challenge
            const challenge = crypto.randomBytes(32).toString('hex');
            const challengeId = crypto.randomBytes(16).toString('hex');
            const challengeExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

            console.log('🔑 Generated challenge:', { challengeId, challenge: challenge.substring(0, 20) + '...' });

            // Store challenge temporarily
            user.loginChallenge = challenge;
            user.challengeId = challengeId;
            user.challengeExpiry = challengeExpiry;
            await user.save();

            console.log('✅ Challenge stored successfully');

            res.json({
                success: true,
                challenge,
                challengeId,
                userId: user._id,
                expiresAt: challengeExpiry
            });

        } catch (error) {
            console.error('❌ Login challenge error:', error);
            res.status(500).json({ success: false, error: 'Failed to generate login challenge' });
        }
    }

    async verifyChallenge(req, res) {
        try {
            const { userId, challengeId, signature } = req.body;
            console.log('🔍 Challenge verification request:', { userId, challengeId, signatureLength: signature?.length });

            const user = await User.findById(userId);
            if (!user) {
                console.log('❌ User not found for verification:', userId);
                return res.status(404).json({ 
                    success: false, 
                    error: 'User not found' 
                });
            }

            console.log('✅ User found for verification:', user.username);

            // Check if challenge is still valid
            if (new Date() > user.challengeExpiry) {
                console.log('❌ Challenge expired for user:', user.username);
                return res.status(401).json({ 
                    success: false, 
                    error: 'Challenge expired' 
                });
            }

            // Verify challenge
            if (challengeId !== user.challengeId) {
                console.log('❌ Invalid challenge ID for user:', user.username);
                return res.status(401).json({ 
                    success: false, 
                    error: 'Invalid challenge ID' 
                });
            }

            console.log('🔍 Verifying Dilithium signature...');
            console.log('🔍 Challenge to verify:', user.loginChallenge?.substring(0, 20) + '...');
            console.log('🔍 Signature length:', signature?.length);
            console.log('🔍 Public key length:', user.dilithiumPublicKey?.length);

            // FIXED: Use the stored challenge directly (it's already in plain text)
            const isValidSignature = await pqcService.verifyDilithiumSignature(
                user.loginChallenge, // FIXED: Use user.loginChallenge instead of undefined decryptedChallenge
                signature,
                user.dilithiumPublicKey
            );

            console.log('🔍 Signature verification result:', isValidSignature);

            if (!isValidSignature) {
                console.log('❌ Invalid signature for user:', user.username);
                return res.status(401).json({ 
                    success: false, 
                    error: 'Invalid signature' 
                });
            }

            console.log('✅ Signature verified successfully for user:', user.username);

            // Clear challenge
            user.loginChallenge = null;
            user.challengeId = null;
            user.challengeExpiry = null;
            user.lastLogin = new Date();
            await user.save();

            console.log('✅ Challenge cleared and login recorded');

            // Generate JWT token
            const token = jwt.sign(
                { userId: user._id, username: user.username },
                process.env.JWT_SECRET || 'quantum-safe-secret',
                { expiresIn: '24h' }
            );

            console.log('✅ JWT token generated for user:', user.username);

            res.json({
                success: true,
                token,
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email,
                    mentalHealthMetrics: user.mentalHealthMetrics
                }
            });

        } catch (error) {
            console.error('❌ Challenge verification error:', error);
            res.status(500).json({ error: 'Authentication failed' });
        }
    }

    async refreshToken(req, res) {
        try {
            const { token } = req.body;

            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'quantum-safe-secret');
            const user = await User.findById(decoded.userId);

            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }

            const newToken = jwt.sign(
                { userId: user._id, username: user.username },
                process.env.JWT_SECRET || 'quantum-safe-secret',
                { expiresIn: '24h' }
            );

            res.json({ token: newToken });
        } catch (error) {
            res.status(401).json({ error: 'Invalid token' });
        }
    }

    async logout(req, res) {
        try {
            // In a production environment, you might want to blacklist the token
            res.json({ success: true, message: 'Logged out successfully' });
        } catch (error) {
            res.status(500).json({ error: 'Logout failed' });
        }
    }
}

module.exports = new AuthController();