const cron = require('node-cron');
const PostController = require('../controllers/posts');

// Run cleanup every week on Sunday at 3 AM
const scheduleImageCleanup = () => {
    cron.schedule('0 3 * * 0', async () => {
        console.log('🧹 Starting scheduled image cleanup...');
        try {
            const result = await PostController.cleanupUnusedImages();
            console.log(`✅ Scheduled cleanup completed:`, result);
        } catch (error) {
            console.error('❌ Scheduled cleanup failed:', error);
        }
    });

    console.log('⏰ Image cleanup job scheduled (every Sunday at 3 AM)');
};

// Manual cleanup endpoint for admins
const runManualCleanup = async () => {
    console.log('🧹 Running manual image cleanup...');
    return await PostController.cleanupUnusedImages();
};

module.exports = {
    scheduleImageCleanup,
    runManualCleanup
};