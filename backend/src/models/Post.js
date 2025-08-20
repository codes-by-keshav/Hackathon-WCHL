const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    username: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true,
        maxlength: 2000
    },
    mediaUrls: [{
        type: String
    }],
    isActive: {
        type: Boolean,
        default: true
    },

    // AI Analysis for ML
    aiAnalysis: {
        fakeNewsPercentage: {
            type: Number,
            min: 0,
            max: 100,
            default: 0
        },
        botProbability: {
            type: Number,
            min: 0,
            max: 100,
            default: 0
        },
        toxicityScore: {
            type: Number,
            min: 0,
            max: 100,
            default: 0
        },
        sentimentScore: {
            type: Number,
            min: 0,
            max: 100,
            default: 50
        },
        emotionalTone: {
            type: String,
            enum: ['very_negative', 'negative', 'neutral', 'positive', 'very_positive'],
            default: 'neutral'
        },
        confidenceLevel: {
            type: Number,
            min: 0,
            max: 100,
            default: 0
        },
        flaggedContent: {
            type: Boolean,
            default: false
        },
        lastAnalyzed: {
            type: Date,
            default: Date.now
        }
    },

    mediaUrls: [{
        type: String
    }],
    
    // Add image metadata tracking
    imageFiles: [{
        filename: String,
        gridfsId: mongoose.Schema.Types.ObjectId,
        uploadDate: Date,
        size: Number,
        contentType: String
    }],

    // User's Feeling Rating
    userFeeling: {
        emotion: {
            type: String,
            enum: ['very_sad', 'sad', 'neutral', 'happy', 'very_happy', 'angry', 'anxious', 'excited', 'frustrated', 'grateful'],
            required: true
        },
        intensity: {
            type: Number,
            min: 1,
            max: 10,
            required: true
        },
        tags: [{
            type: String
        }],
        confidence: {
            type: Number,
            min: 0,
            max: 100,
            default: 50
        }
    },

    engagement: {
        likes: {
            type: Number,
            default: 0
        },
        comments: {
            type: Number,
            default: 0
        },
        shares: {
            type: Number,
            default: 0
        },
        views: {
            type: Number,
            default: 0
        },
        reactions: {
            happy: { type: Number, default: 0 },
            sad: { type: Number, default: 0 },
            angry: { type: Number, default: 0 },
            love: { type: Number, default: 0 },
            surprised: { type: Number, default: 0 }
        }
    },

    moderationStatus: {
        status: {
            type: String,
            enum: ['pending', 'approved', 'rejected', 'under_review'],
            default: 'pending'
        },
        moderatedBy: {
            type: String,
            default: 'ai_system'
        },
        moderatedAt: {
            type: Date,
            default: Date.now
        },
        flags: [{
            type: String,
            enum: ['fake_news', 'bot_content', 'toxic', 'spam', 'inappropriate']
        }]
    },
    lastViewed: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

postSchema.pre('findOneAndUpdate', function() {
    if (this.getUpdate().$inc && this.getUpdate().$inc['engagement.views']) {
        this.set({ lastViewed: new Date() });
    }
});

// Indexes
postSchema.index({ userId: 1 });
postSchema.index({ createdAt: -1 });
postSchema.index({ 'aiAnalysis.fakeNewsPercentage': 1 });
postSchema.index({ 'aiAnalysis.botProbability': 1 });
postSchema.index({ 'userFeeling.emotion': 1 });
postSchema.index({ 'moderationStatus.status': 1 });

module.exports = mongoose.model('Post', postSchema);