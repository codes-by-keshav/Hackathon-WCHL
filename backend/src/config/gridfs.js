const mongoose = require('mongoose');
const multer = require('multer');
const { GridFsStorage } = require('multer-gridfs-storage');
const GridFSBucket = require('mongodb').GridFSBucket;

let bucket;

// Initialize GridFS bucket when MongoDB connects
mongoose.connection.once('open', () => {
    bucket = new GridFSBucket(mongoose.connection.db, {
        bucketName: 'uploads'
    });
    console.log('✅ GridFS bucket initialized');
});

// Create storage engine
const storage = new GridFsStorage({
    url: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/quant-safe-social-media',
    file: (req, file) => {
        return new Promise((resolve, reject) => {
            const filename = `${Date.now()}-${Math.round(Math.random() * 1E9)}-${file.originalname}`;
            const fileInfo = {
                filename: filename,
                bucketName: 'uploads',
                metadata: {
                    uploadedBy: req.user?.userId,
                    uploadedAt: new Date(),
                    originalName: file.originalname,
                    contentType: file.mimetype
                }
            };
            resolve(fileInfo);
        });
    }
});

const upload = multer({ 
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        // Accept only image files
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'), false);
        }
    }
});

// Helper function to get bucket
const getBucket = () => bucket;

// Helper function to delete file
const deleteFile = (filename) => {
    return new Promise((resolve, reject) => {
        if (!bucket) {
            return reject(new Error('GridFS bucket not initialized'));
        }

        bucket.find({ filename }).toArray((err, files) => {
            if (err) return reject(err);
            if (!files || files.length === 0) {
                return resolve(false); // File not found
            }

            bucket.delete(files[0]._id, (err) => {
                if (err) return reject(err);
                resolve(true);
            });
        });
    });
};

module.exports = {
    upload,
    getBucket,
    deleteFile
};