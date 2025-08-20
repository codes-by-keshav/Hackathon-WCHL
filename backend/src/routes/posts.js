const express = require('express');
const router = express.Router();
const PostController = require('../controllers/posts');
const authMiddleware = require('../middleware/auth');

console.log('📝 Setting up post routes...');

// Apply auth middleware to all post routes
router.use(authMiddleware);

// Post routes
router.post('/', PostController.createPost);
router.get('/', PostController.getAllPosts);
router.get('/:id', PostController.getPostById);
router.put('/:id', PostController.updatePost);
router.delete('/:id', PostController.deletePost);
router.post('/:id/like', PostController.likePost);
router.post('/:id/share', PostController.sharePost);
router.get('/:id/comments', PostController.getPostComments);
router.post('/:id/comment', PostController.addComment);

console.log('✅ Post routes configured with auth middleware');

module.exports = router;