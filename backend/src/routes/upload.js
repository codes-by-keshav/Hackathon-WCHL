const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { upload, getBucket } = require('../config/gridfs');
const mongoose = require('mongoose');

console.log('📸 Setting up upload routes...');

// Upload image endpoint
router.post('/image', authMiddleware, upload.single('image'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ 
                success: false, 
                error: 'No image file provided' 
            });
        }

        console.log('✅ Image uploaded successfully:', req.file.filename);

        res.json({
            success: true,
            file: {
                id: req.file.id,
                filename: req.file.filename,
                originalName: req.file.originalname,
                size: req.file.size,
                contentType: req.file.contentType,
                uploadDate: req.file.uploadDate,
                url: `/api/upload/image/${req.file.filename}`
            }
        });
    } catch (error) {
        console.error('❌ Image upload error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to upload image' 
        });
    }
});

// Upload base64 image endpoint (for backward compatibility)
router.post('/base64', authMiddleware, (req, res) => {
    try {
        const { imageBase64, filename } = req.body;

        if (!imageBase64) {
            return res.status(400).json({ 
                success: false, 
                error: 'No image data provided' 
            });
        }

        // Remove data URL prefix if present
        const base64Data = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');

        // Detect content type from base64 header
        let contentType = 'image/jpeg'; // default
        if (imageBase64.includes('data:image/png')) contentType = 'image/png';
        if (imageBase64.includes('data:image/webp')) contentType = 'image/webp';
        if (imageBase64.includes('data:image/gif')) contentType = 'image/gif';

        const bucket = getBucket();
        if (!bucket) {
            throw new Error('GridFS bucket not initialized');
        }

        const uploadFilename = filename || `${Date.now()}-${Math.round(Math.random() * 1E9)}.jpg`;
        
        const uploadStream = bucket.openUploadStream(uploadFilename, {
            metadata: {
                uploadedBy: req.user?.userId,
                uploadedAt: new Date(),
                contentType: contentType,
                source: 'base64'
            }
        });

        uploadStream.end(buffer);

        uploadStream.on('finish', () => {
            console.log('✅ Base64 image uploaded successfully:', uploadFilename);
            res.json({
                success: true,
                file: {
                    id: uploadStream.id,
                    filename: uploadFilename,
                    size: buffer.length,
                    contentType: contentType,
                    url: `/api/upload/image/${uploadFilename}`
                }
            });
        });

        uploadStream.on('error', (error) => {
            console.error('❌ Base64 upload error:', error);
            res.status(500).json({ 
                success: false, 
                error: 'Failed to upload image' 
            });
        });

    } catch (error) {
        console.error('❌ Base64 upload error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to upload image' 
        });
    }
});

// Get image endpoint
router.get('/image/:filename', (req, res) => {
    try {
        const bucket = getBucket();
        if (!bucket) {
            return res.status(500).json({ error: 'GridFS bucket not initialized' });
        }

        const downloadStream = bucket.openDownloadStreamByName(req.params.filename);

        downloadStream.on('data', (chunk) => {
            res.write(chunk);
        });

        downloadStream.on('error', (error) => {
            console.error('❌ Image download error:', error);
            res.status(404).json({ error: 'Image not found' });
        });

        downloadStream.on('end', () => {
            res.end();
        });

        // Set appropriate headers
        downloadStream.on('file', (file) => {
            res.set({
                'Content-Type': file.metadata?.contentType || 'image/jpeg',
                'Cache-Control': 'public, max-age=31536000' // Cache for 1 year
            });
        });

    } catch (error) {
        console.error('❌ Image retrieval error:', error);
        res.status(500).json({ error: 'Failed to retrieve image' });
    }
});

// Delete image endpoint
router.delete('/image/:filename', authMiddleware, async (req, res) => {
    try {
        const bucket = getBucket();
        if (!bucket) {
            return res.status(500).json({ error: 'GridFS bucket not initialized' });
        }

        const files = await bucket.find({ filename: req.params.filename }).toArray();
        
        if (!files || files.length === 0) {
            return res.status(404).json({ error: 'Image not found' });
        }

        // Check if user owns the image or is admin
        const file = files[0];
        if (file.metadata?.uploadedBy !== req.user.userId) {
            return res.status(403).json({ error: 'Not authorized to delete this image' });
        }

        await bucket.delete(file._id);
        
        console.log('✅ Image deleted successfully:', req.params.filename);
        res.json({ success: true, message: 'Image deleted successfully' });

    } catch (error) {
        console.error('❌ Image deletion error:', error);
        res.status(500).json({ error: 'Failed to delete image' });
    }
});

console.log('✅ Upload routes configured');

module.exports = router;