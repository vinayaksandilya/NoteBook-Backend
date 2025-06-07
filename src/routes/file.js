const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const auth = require('../middleware/auth');
const File = require('../models/file');
const s3Service = require('../services/s3Service');
const LoggingService = require('../services/loggingService');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../../public/uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Allowed file types
const allowedFileTypes = {
  'application/pdf': '.pdf'
};

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueFilename = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueFilename);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    // Check if the file type is allowed
    if (allowedFileTypes[file.mimetype]) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type: ${file.originalname}. Only PDF files are allowed.`));
    }
  }
}).single('file');

// Upload file
router.post('/upload', auth, (req, res) => {
  upload(req, res, async function(err) {
    if (err instanceof multer.MulterError) {
      // A Multer error occurred when uploading
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ 
          error: 'File size too large. Maximum size is 5MB.' 
        });
      }
      if (err.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({ 
          error: 'Multiple files are not allowed. Please upload one file at a time.' 
        });
      }
      return res.status(400).json({ error: err.message });
    } else if (err) {
      // An unknown error occurred
      return res.status(400).json({ error: err.message });
    }

    try {
      if (!req.file) {
        return res.status(400).json({ 
          error: 'No file uploaded. Please provide a file.' 
        });
      }

      // Validate file extension
      const ext = path.extname(req.file.originalname).toLowerCase();
      const allowedExtensions = Object.values(allowedFileTypes);
      if (!allowedExtensions.includes(ext)) {
        // Delete the uploaded file if it doesn't match allowed extensions
        fs.unlinkSync(req.file.path);
        return res.status(400).json({ 
          error: `Invalid file extension: ${ext}. Allowed extensions are: ${allowedExtensions.join(', ')}` 
        });
      }

      // Upload to S3
      const s3Key = `uploads/${req.file.filename}`;
      const s3Result = await s3Service.uploadFile(req.file.path, s3Key);

      // Create file record in database
      const file = await File.create({
        userId: req.user.id,
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        path: s3Key,
        url: s3Result.url
      });

      // Log file upload
      await LoggingService.logUserAction(req.user.id, 'file_upload', {
        fileId: file.id,
        filename: file.filename,
        originalName: file.original_name,
        size: file.size,
        mimeType: file.mime_type
      });

      // Delete local file after S3 upload
      fs.unlinkSync(req.file.path);

      res.status(201).json(file);
    } catch (error) {
      // If there's an error, delete the uploaded file
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      console.error('File upload error:', error);
      res.status(400).json({ error: error.message });
    }
  });
});

// Get user's files
router.get('/my-files', auth, async (req, res) => {
  try {
    const files = await File.findByUserId(req.user.id);
    
    // Generate fresh signed URLs for each file
    const filesWithUrls = await Promise.all(files.map(async (file) => {
      const url = await s3Service.getFileUrl(file.path);
      return { ...file, url };
    }));

    // Log file listing
    await LoggingService.logUserAction(req.user.id, 'file_download', {
      action: 'list_files',
      count: files.length
    });

    res.json(filesWithUrls);
  } catch (error) {
    console.error('Error fetching files:', error);
    res.status(400).json({ error: error.message });
  }
});

// Delete file
router.delete('/:fileId', auth, async (req, res) => {
  try {
    const file = await File.findById(req.params.fileId);
    
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    if (file.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to delete this file' });
    }

    // Delete file from S3
    await s3Service.deleteFile(file.path);

    // Delete file record from database
    await File.delete(file.id, req.user.id);

    // Log file deletion
    await LoggingService.logUserAction(req.user.id, 'file_delete', {
      fileId: file.id,
      filename: file.filename,
      originalName: file.original_name
    });

    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(400).json({ error: error.message });
  }
});

module.exports = router; 