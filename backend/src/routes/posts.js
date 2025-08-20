const express = require('express');
const router = express.Router();
const PostController = require('../controllers/posts');
const authMiddleware = require('../middleware/auth');

console.log('📝 Setting up post routes...');

// Apply auth middleware to all post routes
router.use(authMiddleware);

// Post routes
// ...existing code...
// Post routes
router.post('/', PostController.createPost);
router.get('/', PostController.getAllPosts);
router.get('/:id', PostController.getPostById);
router.get('/:id/like-status', PostController.getPostLikeStatus); // New route for like status
router.get('/view/:id', PostController.getPostForView);
router.put('/:id', PostController.updatePost);
router.delete('/:id', PostController.deletePost);
router.post('/:id/like', PostController.likePost);
router.post('/:id/share', PostController.sharePost);
router.get('/:id/comments', PostController.getPostComments);
router.post('/:id/comment', PostController.addComment);
// ...existing code...

console.log('✅ Post routes configured with auth middleware');

module.exports = router;