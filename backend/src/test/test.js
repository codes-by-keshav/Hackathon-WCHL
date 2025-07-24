const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/quant-safe-social-media';

console.log('🧪 Testing MongoDB Connection...');
console.log(`📡 Connecting to: ${MONGODB_URI}`);

const testConnection = async () => {
    try {
        // Connect to MongoDB
        console.log('\n1️⃣ Attempting to connect...');
        const conn = await mongoose.connect(MONGODB_URI, {
            maxPoolSize: 5,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });

        console.log('✅ Connected successfully!');
        console.log(`   Host: ${conn.connection.host}`);
        console.log(`   Port: ${conn.connection.port}`);
        console.log(`   Database: ${conn.connection.name}`);
        console.log(`   Ready State: ${mongoose.connection.readyState}`);

        // Test database operations
        console.log('\n2️⃣ Testing database operations...');
        
        // Ping the database
        await mongoose.connection.db.admin().ping();
        console.log('✅ Database ping successful');

        // List collections
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log(`✅ Found ${collections.length} collections:`);
        collections.forEach(col => console.log(`   - ${col.name}`));

        // Test creating a simple document (optional)
        console.log('\n3️⃣ Testing document operations...');
        
        const testSchema = new mongoose.Schema({ test: String, timestamp: Date });
        const TestModel = mongoose.model('ConnectionTest', testSchema);
        
        // Create test document
        const testDoc = new TestModel({ 
            test: 'Connection test successful', 
            timestamp: new Date() 
        });
        
        await testDoc.save();
        console.log('✅ Test document created successfully');
        
        // Read test document
        const foundDoc = await TestModel.findOne({ test: 'Connection test successful' });
        console.log('✅ Test document retrieved:', foundDoc?.test);
        
        // Clean up test document
        await TestModel.deleteOne({ _id: testDoc._id });
        console.log('✅ Test document cleaned up');

        // Test User and Post models if they exist
        console.log('\n4️⃣ Testing application models...');
        
        try {
            const User = require('../models/User');
            const Post = require('../models/Post');
            
            console.log('✅ User model loaded successfully');
            console.log('✅ Post model loaded successfully');
            
            // Check if we can query (even if empty)
            const userCount = await User.countDocuments();
            const postCount = await Post.countDocuments();
            
            console.log(`📊 Current users: ${userCount}`);
            console.log(`📊 Current posts: ${postCount}`);
            
        } catch (modelError) {
            console.log('⚠️ Could not test application models:', modelError.message);
        }

        console.log('\n🎉 All tests passed! MongoDB connection is working properly.');

    } catch (error) {
        console.error('\n❌ Connection test failed:');
        console.error('Error:', error.message);
        
        if (error.name === 'MongooseServerSelectionError') {
            console.log('\n🔧 Troubleshooting MongoDB Connection:');
            console.log('1. Check if MongoDB service is running:');
            console.log('   Windows: sc query "MongoDB" or net start MongoDB');
            console.log('   Mac/Linux: brew services list | grep mongo');
            console.log('\n2. Test direct connection:');
            console.log('   mongosh mongodb://127.0.0.1:27017/test');
            console.log('\n3. Check if port 27017 is in use:');
            console.log('   Windows: netstat -an | findstr 27017');
            console.log('   Mac/Linux: lsof -i :27017');
        }
        
    } finally {
        // Close connection
        if (mongoose.connection.readyState !== 0) {
            await mongoose.connection.close();
            console.log('\n📦 Database connection closed');
        }
        process.exit(0);
    }
};

// Run the test
testConnection();