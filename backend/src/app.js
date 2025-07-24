const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();

// Security middleware
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(cors({
    origin: [
        'http://localhost:3000',
        'chrome-extension://*',
        'moz-extension://*',
        'http://localhost:5000'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 500, // Increased limit for development
    skip: (req) => {
        // Skip rate limiting for health checks
        return req.path === '/api/health';
    }
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
    console.log(`📥 ${req.method} ${req.path} - ${new Date().toISOString()}`);
    console.log(`🔗 Origin: ${req.headers.origin || 'none'}`);
    console.log(`🎯 User-Agent: ${req.headers['user-agent']?.substring(0, 50) || 'none'}`);
    next();
});

// Routes
console.log('Loading auth routes...');
try {
    const authRoutes = require('./routes/auth');
    app.use('/api/auth', authRoutes);
    console.log('✅ Auth routes loaded.');
} catch (error) {
    console.error('❌ Error loading auth routes:', error.message);
    throw error;
}

console.log('Loading user routes...');
try {
    const userRoutes = require('./routes/user');
    app.use('/api/users', userRoutes);
    console.log('✅ User routes loaded.');
} catch (error) {
    console.error('❌ Error loading user routes:', error.message);
    throw error;
}

console.log('Loading post routes...');
try {
    const postRoutes = require('./routes/posts');
    app.use('/api/posts', postRoutes);
    console.log('✅ Post routes loaded.');
} catch (error) {
    console.error('❌ Error loading post routes:', error.message);
    throw error;
}

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        service: 'Quantum Safe Social Media Backend'
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        error: 'Something went wrong!',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
});

// 404 handler - FIXED: Remove the problematic '*' pattern
app.use((req, res) => {
    console.log(`❌ 404 - Route not found: ${req.method} ${req.path}`);
    res.status(404).json({ error: 'Route not found' });
});

module.exports = app;