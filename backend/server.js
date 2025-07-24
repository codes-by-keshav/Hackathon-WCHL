console.log('Server starting...');
console.log('Requiring app module...');
const app = require('./src/app');
console.log('✅ App module required successfully.');

const mongoose = require('mongoose');
require('dotenv').config();

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/quant-safe-social-media';

// Enhanced MongoDB connection with proper options
console.log('Connecting to MongoDB...');
console.log(`MongoDB URI: ${MONGODB_URI.replace(/\/\/.*@/, '//***:***@')}`);

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(MONGODB_URI, {
            // Use only supported connection options
            maxPoolSize: 10, // Maintain up to 10 socket connections
            serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
            socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
            // Remove these unsupported options:
            // bufferMaxEntries: 0, 
            // bufferCommands: false,
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
        console.log('   - Ensure MongoDB service is running');
        console.log('   - Check if port 27017 is available');
        console.log('   - Verify MongoDB is installed correctly');
        console.log('   - Try connecting with: mongosh or mongo command');
        process.exit(1);
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

// Connect to MongoDB and start server
connectDB().then(() => {
    // Start server only after successful DB connection
    app.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
        console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`🔐 PQC Service URL: ${process.env.PQC_SERVICE_URL || 'http://localhost:5001'}`);
        console.log(`🌐 Health check: http://localhost:${PORT}/api/health`);
    });
});

// Graceful shutdown
const gracefulShutdown = (signal) => {
    console.log(`🛑 ${signal} received. Shutting down gracefully...`);
    mongoose.connection.close(() => {
        console.log('📦 MongoDB connection closed.');
        process.exit(0);
    });
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