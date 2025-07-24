const express = require('express');
const postController = require('../controllers/posts');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Create new post
router.post('/', authenticateToken, postController.createPost);

// Get all posts (feed)
router.get('/', postController.getAllPosts);

// Get post by ID
router.get('/:id', postController.getPostById);

// Update post
router.put('/:id', authenticateToken, postController.updatePost);

// Delete post
router.delete('/:id', authenticateToken, postController.deletePost);

// Like/unlike post
router.post('/:id/like', authenticateToken, postController.likePost);

// Add comment to post
router.post('/:id/comment', authenticateToken, postController.addComment);

router.get('/health', (req, res) => {
    res.json({ status: 'Posts service is healthy' });
});

module.exports = router;