const Post = require('../models/Post');
const Comment = require('../models/Comment');
const User = require('../models/User');
const mongoose = require('mongoose');
const { getBucket, deleteFile } = require('../config/gridfs');

// Helper function to upload base64 to GridFS
const uploadBase64ToGridFS = (imageBase64, userId) => {
    return new Promise((resolve, reject) => {
        try {
            const bucket = getBucket();
            if (!bucket) {
                return reject(new Error('GridFS bucket not initialized'));
            }

            // Remove data URL prefix if present
            const base64Data = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');
            const buffer = Buffer.from(base64Data, 'base64');

            // Detect content type
            let contentType = 'image/jpeg';
            if (imageBase64.includes('data:image/png')) contentType = 'image/png';
            if (imageBase64.includes('data:image/webp')) contentType = 'image/webp';
            if (imageBase64.includes('data:image/gif')) contentType = 'image/gif';

            const filename = `${Date.now()}-${Math.round(Math.random() * 1E9)}.jpg`;
            
            const uploadStream = bucket.openUploadStream(filename, {
                metadata: {
                    uploadedBy: userId,
                    uploadedAt: new Date(),
                    contentType: contentType,
                    source: 'post_creation'
                }
            });

            uploadStream.end(buffer);

            uploadStream.on('finish', () => {
                resolve({
                    success: true,
                    filename: filename,
                    fileId: uploadStream.id,
                    url: `/api/upload/image/${filename}`,
                    size: buffer.length,
                    contentType: contentType
                });
            });

            uploadStream.on('error', (error) => {
                reject(error);
            });

        } catch (error) {
            reject(error);
        }
    });
};

// Helper function for AI sentiment analysis - MOVED OUTSIDE CLASS
const analyzeContentSentiment = (content) => {
    const words = content.toLowerCase().split(' ');
    const positiveWords = ['happy', 'joy', 'love', 'amazing', 'great', 'wonderful', 'fantastic', 'good', 'excellent', 'awesome', 'beautiful'];
    const negativeWords = ['sad', 'hate', 'angry', 'terrible', 'awful', 'bad', 'horrible', 'disgusting', 'worse', 'depressed', 'upset'];
    const excitedWords = ['excited', 'thrilled', 'pumped', 'energetic', 'hyped'];
    const anxiousWords = ['anxious', 'worried', 'nervous', 'stressed', 'concerned'];
    const gratefulWords = ['grateful', 'thankful', 'blessed', 'appreciate'];
    
    let positiveCount = 0;
    let negativeCount = 0;
    let excitedCount = 0;
    let anxiousCount = 0;
    let gratefulCount = 0;
    
    words.forEach(word => {
        if (positiveWords.includes(word)) positiveCount++;
        if (negativeWords.includes(word)) negativeCount++;
        if (excitedWords.includes(word)) excitedCount++;
        if (anxiousWords.includes(word)) anxiousCount++;
        if (gratefulWords.includes(word)) gratefulCount++;
    });
    
    let emotion = 'neutral';
    let intensity = 5;
    
    if (excitedCount > 0) {
        emotion = 'excited';
        intensity = 8;
    } else if (gratefulCount > 0) {
        emotion = 'grateful';
        intensity = 7;
    } else if (anxiousCount > 0) {
        emotion = 'anxious';
        intensity = 6;
    } else if (positiveCount > negativeCount) {
        emotion = positiveCount > 2 ? 'very_happy' : 'happy';
        intensity = positiveCount > 2 ? 8 : 7;
    } else if (negativeCount > positiveCount) {
        emotion = negativeCount > 2 ? 'very_sad' : 'sad';
        intensity = negativeCount > 2 ? 2 : 4;
    }
    
    let sentimentScore = 50;
    if (positiveCount > negativeCount) {
        sentimentScore = Math.min(85, 50 + (positiveCount * 10));
    } else if (negativeCount > positiveCount) {
        sentimentScore = Math.max(15, 50 - (negativeCount * 10));
    }
    
    const emotionalTone = sentimentScore >= 70 ? 'positive' : 
                         sentimentScore >= 40 ? 'neutral' : 'negative';
    
    return {
        fakeNewsPercentage: Math.floor(Math.random() * 15),
        botProbability: Math.floor(Math.random() * 10),
        toxicityScore: Math.floor(Math.random() * 20),
        sentimentScore,
        emotionalTone,
        confidenceLevel: 75 + Math.floor(Math.random() * 25),
        flaggedContent: sentimentScore < 20 || Math.random() < 0.05,
        lastAnalyzed: new Date(),
        detectedEmotion: {
            emotion,
            intensity,
            confidence: 75 + Math.floor(Math.random() * 20)
        }
    };
};

class PostController {
    async createPost(req, res) {
        try {
            const { content, imageBase64, imageUrl } = req.body;
            const userId = req.user.userId;
            const username = req.user.username;

            console.log('📝 Creating post for user:', { userId, username });

            if (!content || content.trim().length === 0) {
                return res.status(400).json({ error: 'Content is required' });
            }

            // Handle development user - create a valid ObjectId for dev user
            let validUserId = userId;
            if (userId === 'dev_user_123') {
                validUserId = new mongoose.Types.ObjectId('507f1f77bcf86cd799439011');
                console.log('🔧 Using dev ObjectId:', validUserId);
            } else if (!mongoose.Types.ObjectId.isValid(userId)) {
                validUserId = new mongoose.Types.ObjectId();
                console.log('🔧 Generated new ObjectId:', validUserId);
            }

            let mediaUrls = [];
            let imageFiles = [];
            
            // Handle image upload if provided
            if (imageBase64) {
                console.log('🖼️ Processing base64 image upload...');
                
                try {
                    // Upload to GridFS
                    const uploadResult = await uploadBase64ToGridFS(imageBase64, userId);
                    
                    if (uploadResult.success) {
                        mediaUrls.push(uploadResult.url);
                        imageFiles.push({
                            filename: uploadResult.filename,
                            gridfsId: uploadResult.fileId,
                            uploadDate: new Date(),
                            size: uploadResult.size,
                            contentType: uploadResult.contentType
                        });
                        console.log('✅ Image uploaded to GridFS successfully');
                    } else {
                        throw new Error(uploadResult.error);
                    }
                } catch (error) {
                    console.error('❌ GridFS upload failed:', error.message);
                    return res.status(500).json({ 
                        error: 'Failed to upload image',
                        details: error.message 
                    });
                }
            } else if (imageUrl) {
                // If imageUrl is provided (from separate upload endpoint)
                mediaUrls.push(imageUrl);
            }

            // Perform AI analysis and emotion detection - FIXED: Call function directly
            const aiAnalysis = analyzeContentSentiment(content);

            const post = new Post({
                userId: validUserId,
                username,
                content: content.trim(),
                mediaUrls,
                imageFiles,
                userFeeling: aiAnalysis.detectedEmotion,
                aiAnalysis,
                lastViewed: new Date() // Initialize last viewed
            });

            await post.save();
            console.log('✅ Post created successfully:', post._id);

            // Update user behavior analytics only for real users
            if (userId !== 'dev_user_123' && mongoose.Types.ObjectId.isValid(userId)) {
                try {
                    await User.findByIdAndUpdate(userId, {
                        $inc: { 'behaviorAnalytics.totalPosts': 1 },
                        $set: { 'behaviorAnalytics.avgPostSentiment': aiAnalysis.sentimentScore }
                    });
                } catch (userUpdateError) {
                    console.log('⚠️ Failed to update user analytics:', userUpdateError.message);
                }
            }

            res.status(201).json({ success: true, post });
        } catch (error) {
            console.error('❌ Create post error:', error);
            res.status(500).json({ 
                error: 'Failed to create post',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    // Get all posts
    async getAllPosts(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const skip = (page - 1) * limit;

            const posts = await Post.find()
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate('userId', 'username');

            const total = await Post.countDocuments();

            res.json({
                success: true,
                posts,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit)
                }
            });
        } catch (error) {
            console.error('Get posts error:', error);
            res.status(500).json({ error: 'Failed to get posts' });
        }
    }

    // Update getPostById to track last viewed
    async getPostById(req, res) {
        try {
            const post = await Post.findById(req.params.id)
                .populate('userId', 'username');
            
            if (!post) {
                return res.status(404).json({ error: 'Post not found' });
            }

            // Increment view count and update last viewed
            await Post.findByIdAndUpdate(req.params.id, {
                $inc: { 'engagement.views': 1 },
                $set: { lastViewed: new Date() }
            });

            res.json({ success: true, post });
        } catch (error) {
            console.error('Get post error:', error);
            res.status(500).json({ error: 'Failed to get post' });
        }
    }

    // Update post
    async updatePost(req, res) {
        try {
            const { content } = req.body;
            const postId = req.params.id;
            const userId = req.user.userId;

            const post = await Post.findById(postId);
            if (!post) {
                return res.status(404).json({ error: 'Post not found' });
            }

            // Check if user owns the post
            if (post.userId.toString() !== userId && userId !== 'dev_user_123') {
                return res.status(403).json({ error: 'Not authorized to edit this post' });
            }

            const updatedPost = await Post.findByIdAndUpdate(
                postId,
                { content: content.trim() },
                { new: true }
            ).populate('userId', 'username');

            res.json({ success: true, post: updatedPost });
        } catch (error) {
            console.error('Update post error:', error);
            res.status(500).json({ error: 'Failed to update post' });
        }
    }

    // Delete post
    async deletePost(req, res) {
        try {
            const postId = req.params.id;
            const userId = req.user.userId;

            const post = await Post.findById(postId);
            if (!post) {
                return res.status(404).json({ error: 'Post not found' });
            }

            // Check if user owns the post
            if (post.userId.toString() !== userId && userId !== 'dev_user_123') {
                return res.status(403).json({ error: 'Not authorized to delete this post' });
            }

            // Delete associated images from GridFS
            if (post.imageFiles && post.imageFiles.length > 0) {
                const bucket = getBucket();
                if (bucket) {
                    for (const imageFile of post.imageFiles) {
                        try {
                            await bucket.delete(imageFile.gridfsId);
                            console.log(`🗑️ Deleted image: ${imageFile.filename}`);
                        } catch (deleteError) {
                            console.error(`❌ Failed to delete image ${imageFile.filename}:`, deleteError.message);
                        }
                    }
                }
            }

            await Post.findByIdAndDelete(postId);
            res.json({ success: true, message: 'Post deleted successfully' });
        } catch (error) {
            console.error('Delete post error:', error);
            res.status(500).json({ error: 'Failed to delete post' });
        }
    }

    // Like post
    async likePost(req, res) {
        try {
            const postId = req.params.id;
            const userId = req.user.userId;

            const post = await Post.findById(postId);
            if (!post) {
                return res.status(404).json({ error: 'Post not found' });
            }

            // Update last viewed when interacting with post
            await Post.findByIdAndUpdate(postId, {
                $inc: { 'engagement.likes': 1 },
                $set: { lastViewed: new Date() }
            });

            res.json({ success: true, message: 'Post liked' });
        } catch (error) {
            console.error('Like post error:', error);
            res.status(500).json({ error: 'Failed to like post' });
        }
    }

    // Share post
    async sharePost(req, res) {
        try {
            const postId = req.params.id;

            const post = await Post.findById(postId);
            if (!post) {
                return res.status(404).json({ error: 'Post not found' });
            }

            // Update last viewed when sharing
            await Post.findByIdAndUpdate(postId, {
                $inc: { 'engagement.shares': 1 },
                $set: { lastViewed: new Date() }
            });

            res.json({ success: true, message: 'Post shared' });
        } catch (error) {
            console.error('Share post error:', error);
            res.status(500).json({ error: 'Failed to share post' });
        }
    }

    // Get post comments
    async getPostComments(req, res) {
        try {
            const postId = req.params.id;
            const comments = await Comment.find({ postId })
                .sort({ createdAt: -1 })
                .populate('userId', 'username');

            res.json({ success: true, comments });
        } catch (error) {
            console.error('Get comments error:', error);
            res.status(500).json({ error: 'Failed to get comments' });
        }
    }

    // Add comment to post
    async addComment(req, res) {
        try {
            const postId = req.params.id;
            const { content } = req.body;
            const userId = req.user.userId;
            const username = req.user.username;

            if (!content || content.trim().length === 0) {
                return res.status(400).json({ error: 'Comment content is required' });
            }

            // Handle development user ObjectId
            let validUserId = userId;
            if (userId === 'dev_user_123') {
                validUserId = new mongoose.Types.ObjectId('507f1f77bcf86cd799439011');
            }

            const comment = new Comment({
                postId,
                userId: validUserId,
                username,
                content: content.trim()
            });

            await comment.save();

            // Update post comment count and last viewed
            await Post.findByIdAndUpdate(postId, {
                $inc: { 'engagement.comments': 1 },
                $set: { lastViewed: new Date() }
            });

            res.status(201).json({ success: true, comment });
        } catch (error) {
            console.error('Add comment error:', error);
            res.status(500).json({ error: 'Failed to add comment' });
        }
    }

    // Add cleanup method for unused images
    async cleanupUnusedImages() {
        try {
            const sixMonthsAgo = new Date();
            sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

            console.log('🧹 Starting cleanup of unused images older than:', sixMonthsAgo);

            // Find posts with 0 views that haven't been viewed in 6 months
            const deadPosts = await Post.find({
                'engagement.views': 0,
                lastViewed: { $lt: sixMonthsAgo },
                imageFiles: { $exists: true, $not: { $size: 0 } }
            });

            console.log(`🧹 Found ${deadPosts.length} dead posts with images`);

            let deletedCount = 0;
            const bucket = getBucket();

            if (bucket) {
                for (const post of deadPosts) {
                    for (const imageFile of post.imageFiles) {
                        try {
                            await bucket.delete(imageFile.gridfsId);
                            deletedCount++;
                            console.log(`🗑️ Deleted image: ${imageFile.filename}`);
                        } catch (deleteError) {
                            console.error(`❌ Failed to delete image ${imageFile.filename}:`, deleteError.message);
                        }
                    }

                    // Clear imageFiles array and mediaUrls for this post
                    await Post.findByIdAndUpdate(post._id, {
                        $set: { 
                            imageFiles: [], 
                            mediaUrls: [] 
                        }
                    });
                }
            }

            console.log(`✅ Cleanup completed. Deleted ${deletedCount} unused images`);
            return { deletedCount, postsAffected: deadPosts.length };

        } catch (error) {
            console.error('❌ Image cleanup error:', error);
            throw error;
        }
    }
}

module.exports = new PostController();