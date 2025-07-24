const Post = require('../models/Post');
const User = require('../models/User');

class PostController {
    async createPost(req, res) {
        try {
            const { content, userFeeling, mediaUrls = [] } = req.body;
            const userId = req.user.userId;
            const username = req.user.username;

            if (!content || !userFeeling) {
                return res.status(400).json({ error: 'Content and user feeling are required' });
            }

            const post = new Post({
                userId,
                username,
                content,
                mediaUrls,
                userFeeling,
                // AI analysis would be done here in production
                aiAnalysis: {
                    fakeNewsPercentage: Math.floor(Math.random() * 20), // Placeholder
                    botProbability: Math.floor(Math.random() * 10),
                    toxicityScore: Math.floor(Math.random() * 15),
                    sentimentScore: Math.floor(Math.random() * 40) + 60,
                    emotionalTone: 'positive',
                    confidenceLevel: 85,
                    flaggedContent: false,
                    lastAnalyzed: new Date()
                }
            });

            await post.save();
            res.status(201).json({ success: true, post });
        } catch (error) {
            console.error('Create post error:', error);
            res.status(500).json({ error: 'Failed to create post' });
        }
    }

    async getAllPosts(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const skip = (page - 1) * limit;

            const posts = await Post.find({ isActive: true })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit);

            res.json({ success: true, posts, page, limit });
        } catch (error) {
            console.error('Get posts error:', error);
            res.status(500).json({ error: 'Failed to get posts' });
        }
    }

    async getPostById(req, res) {
        try {
            const post = await Post.findById(req.params.id);
            if (!post) {
                return res.status(404).json({ error: 'Post not found' });
            }
            res.json({ success: true, post });
        } catch (error) {
            console.error('Get post error:', error);
            res.status(500).json({ error: 'Failed to get post' });
        }
    }

    async updatePost(req, res) {
        try {
            const post = await Post.findById(req.params.id);
            if (!post) {
                return res.status(404).json({ error: 'Post not found' });
            }

            if (post.userId.toString() !== req.user.userId) {
                return res.status(403).json({ error: 'Not authorized to update this post' });
            }

            const updatedPost = await Post.findByIdAndUpdate(
                req.params.id,
                req.body,
                { new: true, runValidators: true }
            );

            res.json({ success: true, post: updatedPost });
        } catch (error) {
            console.error('Update post error:', error);
            res.status(500).json({ error: 'Failed to update post' });
        }
    }

    async deletePost(req, res) {
        try {
            const post = await Post.findById(req.params.id);
            if (!post) {
                return res.status(404).json({ error: 'Post not found' });
            }

            if (post.userId.toString() !== req.user.userId) {
                return res.status(403).json({ error: 'Not authorized to delete this post' });
            }

            await Post.findByIdAndUpdate(req.params.id, { isActive: false });
            res.json({ success: true, message: 'Post deleted successfully' });
        } catch (error) {
            console.error('Delete post error:', error);
            res.status(500).json({ error: 'Failed to delete post' });
        }
    }

    async likePost(req, res) {
        try {
            const post = await Post.findByIdAndUpdate(
                req.params.id,
                { $inc: { 'engagement.likes': 1 } },
                { new: true }
            );

            if (!post) {
                return res.status(404).json({ error: 'Post not found' });
            }

            res.json({ success: true, likes: post.engagement.likes });
        } catch (error) {
            console.error('Like post error:', error);
            res.status(500).json({ error: 'Failed to like post' });
        }
    }

    async addComment(req, res) {
        try {
            const { content } = req.body;
            if (!content) {
                return res.status(400).json({ error: 'Comment content is required' });
            }

            const post = await Post.findByIdAndUpdate(
                req.params.id,
                { $inc: { 'engagement.comments': 1 } },
                { new: true }
            );

            if (!post) {
                return res.status(404).json({ error: 'Post not found' });
            }

            // In a full implementation, you'd save the comment to a separate collection
            res.json({ success: true, message: 'Comment added successfully' });
        } catch (error) {
            console.error('Add comment error:', error);
            res.status(500).json({ error: 'Failed to add comment' });
        }
    }
}

module.exports = new PostController();