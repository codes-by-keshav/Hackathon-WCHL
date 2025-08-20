const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 3,
        maxlength: 30
        // Don't add index: true here since unique: true already creates an index
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
        // Don't add index: true here since unique: true already creates an index
    },
    kyberPublicKey: {
        type: String,
        required: true
    },
    dilithiumPublicKey: {
        type: String,
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    loginChallenge: {
        type: String,
        default: null
    },
    challengeId: {
        type: String,
        default: null
    },
    challengeExpiry: {
        type: Date,
        default: null
    },
    lastLogin: {
        type: Date,
        default: null
    },
    mentalHealthMetrics: {
        stressLevel: { type: Number, default: 5, min: 0, max: 10 },
        moodScore: { type: Number, default: 5, min: 0, max: 10 },
        sleepQuality: { type: Number, default: 5, min: 0, max: 10 },
        socialInteraction: { type: Number, default: 5, min: 0, max: 10 },
        lastAssessment: { type: Date, default: Date.now }
    },
    behaviorAnalytics: {
        totalPosts: { type: Number, default: 0 },
        totalLikes: { type: Number, default: 0 },
        totalComments: { type: Number, default: 0 },
        avgPostSentiment: { type: Number, default: 50, min: 0, max: 100 }
    }
}, {
    timestamps: true
});

// Virtual for account age in days
userSchema.virtual('accountAge').get(function() {
    return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24));
});

// Method to update behavior analytics
userSchema.methods.updateBehaviorAnalytics = function(type, value = 1) {
    switch(type) {
        case 'post':
            this.behaviorAnalytics.totalPosts += value;
            break;
        case 'like':
            this.behaviorAnalytics.totalLikes += value;
            break;
        case 'comment':
            this.behaviorAnalytics.totalComments += value;
            break;
    }
    return this.save();
};

// Static method to find active users
userSchema.statics.findActive = function() {
    return this.find({ isActive: true });
};

// Remove any duplicate index definitions if they exist
// Don't use both unique: true and manual index creation
// userSchema.index({ username: 1 }); // Remove this line if present
// userSchema.index({ email: 1 }); // Remove this line if present

module.exports = mongoose.model('User', userSchema);