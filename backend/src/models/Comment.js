const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
    postId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post',
        required: true
    },
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
        maxlength: 500
    },
    isActive: {
        type: Boolean,
        default: true
    },
    
    // AI Analysis for future ML integration
    aiAnalysis: {
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
        spamProbability: {
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
        }
    }
}, {
    timestamps: true
});

// Indexes for performance
commentSchema.index({ postId: 1 });
commentSchema.index({ userId: 1 });
commentSchema.index({ createdAt: -1 });
commentSchema.index({ 'aiAnalysis.toxicityScore': 1 });
commentSchema.index({ 'moderationStatus.status': 1 });

module.exports = mongoose.model('Comment', commentSchema);