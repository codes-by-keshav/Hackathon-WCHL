console.log('Server starting...');
console.log('Requiring app module...');
const app = require('./src/app');
console.log('✅ App module required successfully.');

const mongoose = require('mongoose');
require('dotenv').config();

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/quant-safe-social-media';

const { scheduleImageCleanup } = require('./src/jobs/imageCleanup');

// Enhanced MongoDB connection with proper options
console.log('Connecting to MongoDB...');
console.log(`MongoDB URI: ${MONGODB_URI.replace(/\/\/.*@/, '//***:***@')}`);

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(MONGODB_URI, {
            // FIXED: Increased timeouts and better connection options
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 30000, // Increased from 5000 to 30000
            socketTimeoutMS: 45000,
            connectTimeoutMS: 30000, // Added connection timeout
            heartbeatFrequencyMS: 10000, // Added heartbeat frequency
            maxIdleTimeMS: 30000, // Added max idle time
        });

        console.log(`✅ Connected to MongoDB: ${conn.connection.host}:${conn.connection.port}`);
        console.log(`📊 Database Name: ${conn.connection.name}`);
        console.log(`🔄 Connection State: ${mongoose.connection.readyState}`);

        // Test the connection by performing a simple operation
        await mongoose.connection.db.admin().ping();
        console.log('🏓 MongoDB ping successful');

        return conn;
        
    } catch (error) {
        console.error('❌ MongoDB connection error:', error.message);
        console.log('💡 Troubleshooting tips:');
        console.log('   - Ensure MongoDB service is running: sudo systemctl start mongod');
        console.log('   - Check if port 27017 is available: sudo netstat -tlnp | grep 27017');
        console.log('   - Verify MongoDB is installed correctly');
        console.log('   - Try connecting with: mongosh or mongo command');

        // Don't exit immediately in development
        if (process.env.NODE_ENV === 'production') {
            process.exit(1);
        } else {
            console.log('🔧 Development mode: Starting server without MongoDB...');
            return null;
        }
    }
};

// MongoDB connection event handlers
mongoose.connection.on('connected', () => {
    console.log('📦 Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
    console.error('❌ Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
    console.log('📦 Mongoose disconnected from MongoDB');
});

mongoose.connection.on('reconnected', () => {
    console.log('🔄 Mongoose reconnected to MongoDB');
});

// FIXED: Start server function
const startServer = () => {
    app.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
        console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`🔐 PQC Service URL: ${process.env.PQC_SERVICE_URL || 'http://localhost:5001'}`);
        console.log(`🌐 Health check: http://localhost:${PORT}/api/health`);
        console.log(`🌐 Test endpoint: http://localhost:${PORT}/api/auth/test`);
    });
};

// Connect to MongoDB and start server
connectDB().then((connection) => {
    if (connection || process.env.NODE_ENV !== 'production') {
        startServer();
        
        // Start image cleanup scheduler only if we have a connection
        if (connection) {
            scheduleImageCleanup();
        }
    }
}).catch((error) => {
    console.error('❌ Failed to start server:', error);
    if (process.env.NODE_ENV !== 'production') {
        console.log('🔧 Starting server anyway for development...');
        startServer();
    }
});

// Graceful shutdown
const gracefulShutdown = (signal) => {
    console.log(`🛑 ${signal} received. Shutting down gracefully...`);
    if (mongoose.connection.readyState === 1) {
        mongoose.connection.close(() => {
            console.log('📦 MongoDB connection closed.');
            process.exit(0);
        });
    } else {
        process.exit(0);
    }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    console.error('💥 Uncaught Exception:', err);
    gracefulShutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
    gracefulShutdown('UNHANDLED_REJECTION');
});