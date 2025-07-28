/**
 * File Upload Middleware
 * 
 * Handles file uploads for the e-commerce API using multer.
 * Supports product images, user profile pictures, and review images.
 * Includes file validation, size limits, and storage configuration.
 */

const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { ApplicationError } = require('./errorHandler');

// Ensure upload directories exist
const ensureDirectoryExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

// Create upload directories
const uploadDir = process.env.UPLOAD_PATH || './uploads';
const productImagesDir = path.join(uploadDir, 'products');
const userImagesDir = path.join(uploadDir, 'users');
const reviewImagesDir = path.join(uploadDir, 'reviews');

ensureDirectoryExists(uploadDir);
ensureDirectoryExists(productImagesDir);
ensureDirectoryExists(userImagesDir);
ensureDirectoryExists(reviewImagesDir);

/**
 * Storage configuration for different file types
 */
const createStorage = (destination) => {
  return multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, destination);
    },
    filename: (req, file, cb) => {
      // Generate unique filename
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const extension = path.extname(file.originalname).toLowerCase();
      const filename = file.fieldname + '-' + uniqueSuffix + extension;
      cb(null, filename);
    }
  });
};

/**
 * File filter function to validate file types
 */
const createFileFilter = (allowedTypes = ['jpg', 'jpeg', 'png', 'webp']) => {
  return (req, file, cb) => {
    // Check file type
    const extension = path.extname(file.originalname).toLowerCase().substring(1);
    const mimeType = file.mimetype;
    
    // Allowed extensions
    const allowedExtensions = allowedTypes;
    
    // Allowed MIME types
    const allowedMimeTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp'
    ];
    
    if (allowedExtensions.includes(extension) && allowedMimeTypes.includes(mimeType)) {
      cb(null, true);
    } else {
      cb(new ApplicationError(
        `Invalid file type. Allowed types: ${allowedExtensions.join(', ')}`,
        400,
        'INVALID_FILE_TYPE'
      ), false);
    }
  };
};

/**
 * Product images upload configuration
 */
const productImageUpload = multer({
  storage: createStorage(productImagesDir),
  fileFilter: createFileFilter(['jpg', 'jpeg', 'png', 'webp']),
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB
    files: 5 // Maximum 5 files
  }
});

/**
 * User profile picture upload configuration
 */
const userImageUpload = multer({
  storage: createStorage(userImagesDir),
  fileFilter: createFileFilter(['jpg', 'jpeg', 'png', 'webp']),
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB
    files: 1 // Single file only
  }
});

/**
 * Review images upload configuration
 */
const reviewImageUpload = multer({
  storage: createStorage(reviewImagesDir),
  fileFilter: createFileFilter(['jpg', 'jpeg', 'png', 'webp']),
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB
    files: 5 // Maximum 5 files
  }
});

/**
 * Generic upload configuration
 */
const genericUpload = multer({
  storage: createStorage(uploadDir),
  fileFilter: createFileFilter(),
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB
    files: 10 // Maximum 10 files
  }
});

/**
 * Middleware to handle product image uploads
 */
const uploadProductImages = (req, res, next) => {
  const upload = productImageUpload.array('images', 5);
  
  upload(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return next(new ApplicationError(
            'File size too large. Maximum size is 5MB per file.',
            400,
            'FILE_TOO_LARGE'
          ));
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
          return next(new ApplicationError(
            'Too many files. Maximum 5 files allowed.',
            400,
            'TOO_MANY_FILES'
          ));
        }
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
          return next(new ApplicationError(
            'Unexpected file field. Use "images" field name.',
            400,
            'UNEXPECTED_FILE'
          ));
        }
      }
      return next(err);
    }
    
    // Process uploaded files
    if (req.files && req.files.length > 0) {
      req.uploadedImages = req.files.map(file => ({
        url: `/uploads/products/${file.filename}`,
        alt: req.body.alt || '',
        filename: file.filename,
        originalName: file.originalname,
        size: file.size
      }));
    }
    
    next();
  });
};

/**
 * Middleware to handle user profile picture upload
 */
const uploadUserImage = (req, res, next) => {
  const upload = userImageUpload.single('profilePicture');
  
  upload(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return next(new ApplicationError(
            'File size too large. Maximum size is 5MB.',
            400,
            'FILE_TOO_LARGE'
          ));
        }
      }
      return next(err);
    }
    
    // Process uploaded file
    if (req.file) {
      req.uploadedImage = {
        url: `/uploads/users/${req.file.filename}`,
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size
      };
    }
    
    next();
  });
};

/**
 * Middleware to handle review image uploads
 */
const uploadReviewImages = (req, res, next) => {
  const upload = reviewImageUpload.array('images', 5);
  
  upload(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return next(new ApplicationError(
            'File size too large. Maximum size is 5MB per file.',
            400,
            'FILE_TOO_LARGE'
          ));
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
          return next(new ApplicationError(
            'Too many files. Maximum 5 files allowed.',
            400,
            'TOO_MANY_FILES'
          ));
        }
      }
      return next(err);
    }
    
    // Process uploaded files
    if (req.files && req.files.length > 0) {
      req.uploadedImages = req.files.map(file => ({
        url: `/uploads/reviews/${file.filename}`,
        alt: req.body.alt || '',
        filename: file.filename,
        originalName: file.originalname,
        size: file.size
      }));
    }
    
    next();
  });
};

/**
 * Utility function to delete uploaded file
 */
const deleteFile = (filePath) => {
  try {
    const fullPath = path.join(__dirname, '..', filePath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
};

/**
 * Utility function to delete multiple files
 */
const deleteFiles = (filePaths) => {
  const results = [];
  filePaths.forEach(filePath => {
    results.push(deleteFile(filePath));
  });
  return results;
};

/**
 * Middleware to clean up uploaded files on error
 */
const cleanupOnError = (req, res, next) => {
  const originalSend = res.send;
  
  res.send = function(data) {
    // Check if response is an error (status >= 400)
    if (res.statusCode >= 400) {
      // Clean up uploaded files
      if (req.files && req.files.length > 0) {
        req.files.forEach(file => {
          deleteFile(file.path);
        });
      }
      
      if (req.file) {
        deleteFile(req.file.path);
      }
    }
    
    originalSend.call(this, data);
  };
  
  next();
};

/**
 * Get file URL helper
 */
const getFileUrl = (filename, type = 'products') => {
  if (!filename) return null;
  return `/uploads/${type}/${filename}`;
};

/**
 * Validate image dimensions (optional middleware)
 */
const validateImageDimensions = (minWidth = 100, minHeight = 100, maxWidth = 2000, maxHeight = 2000) => {
  return async (req, res, next) => {
    try {
      if (!req.files && !req.file) {
        return next();
      }
      
      const sharp = require('sharp'); // Optional dependency
      const files = req.files || [req.file];
      
      for (const file of files) {
        if (file) {
          const metadata = await sharp(file.path).metadata();
          
          if (metadata.width < minWidth || metadata.height < minHeight) {
            deleteFile(file.path);
            return next(new ApplicationError(
              `Image dimensions too small. Minimum: ${minWidth}x${minHeight}px`,
              400,
              'IMAGE_TOO_SMALL'
            ));
          }
          
          if (metadata.width > maxWidth || metadata.height > maxHeight) {
            deleteFile(file.path);
            return next(new ApplicationError(
              `Image dimensions too large. Maximum: ${maxWidth}x${maxHeight}px`,
              400,
              'IMAGE_TOO_LARGE'
            ));
          }
        }
      }
      
      next();
    } catch (error) {
      // If sharp is not available, skip validation
      next();
    }
  };
};

module.exports = {
  uploadProductImages,
  uploadUserImage,
  uploadReviewImages,
  genericUpload,
  deleteFile,
  deleteFiles,
  cleanupOnError,
  getFileUrl,
  validateImageDimensions
};