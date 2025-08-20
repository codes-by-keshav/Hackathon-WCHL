const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();

// FIXED: Simplified security middleware
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: false // Disable CSP for development
}));

// FIXED: Simplified CORS configuration
app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        // Allow all localhost origins for development
        if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
            return callback(null, true);
        }
        
        // Allow IC domains
        if (origin.includes('.ic0.app') || origin.includes('.raw.ic0.app')) {
            return callback(null, true);
        }
        
        // Allow extensions
        if (origin.startsWith('chrome-extension://') || origin.startsWith('moz-extension://')) {
            return callback(null, true);
        }
        
        // For production, add your specific domains here
        callback(null, true); // Allow all for development
    },
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// FIXED: Increased rate limiting for development
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // Much higher limit for development
    skip: (req) => {
        // Skip rate limiting for health checks and test endpoints
        return req.path === '/api/health' || req.path.includes('/test');
    },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// FIXED: Simplified logging middleware
app.use((req, res, next) => {
    console.log(`📥 ${req.method} ${req.path} - ${new Date().toISOString()}`);
    console.log(`🔗 Origin: ${req.headers.origin || 'none'}`);
    next();
});

// FIXED: Add immediate health check before routes
app.get('/api/health', (req, res) => {
    console.log('🏥 Health check endpoint hit');
    res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        service: 'Quantum Safe Social Media Backend',
        mongodb: require('mongoose').connection.readyState === 1 ? 'connected' : 'disconnected'
    });
});

// Routes with better error handling
console.log('Loading auth routes...');
try {
    const authRoutes = require('./routes/auth');
    app.use('/api/auth', authRoutes);
    console.log('✅ Auth routes loaded.');
} catch (error) {
    console.error('❌ Error loading auth routes:', error.message);
    // Don't throw error, continue loading other routes
}

console.log('Loading user routes...');
try {
    const userRoutes = require('./routes/user');
    app.use('/api/users', userRoutes);
    console.log('✅ User routes loaded.');
} catch (error) {
    console.error('❌ Error loading user routes:', error.message);
}

console.log('Loading post routes...');
try {
    const postRoutes = require('./routes/posts');
    app.use('/api/posts', postRoutes);
    console.log('✅ Post routes loaded.');
} catch (error) {
    console.error('❌ Error loading post routes:', error.message);
}

console.log('Loading upload routes...');
try {
    const uploadRoutes = require('./routes/upload');
    app.use('/api/upload', uploadRoutes);
    console.log('✅ Upload routes loaded.');
} catch (error) {
    console.error('❌ Error loading upload routes:', error.message);
}

// FIXED: Add test endpoint for debugging
app.get('/api/test', (req, res) => {
    console.log('🧪 Test endpoint hit!');
    res.json({ 
        success: true, 
        message: 'Server is working!',
        timestamp: new Date().toISOString()
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('❌ Server error:', err.stack);
    res.status(500).json({ 
        error: 'Something went wrong!',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
});

// 404 handler
app.use((req, res) => {
    console.log(`❌ 404 - Route not found: ${req.method} ${req.path}`);
    res.status(404).json({ 
        error: 'Route not found',
        path: req.path,
        method: req.method
    });
});

module.exports = app;