const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const multer = require('multer');
const path = require('path');
const User = require('../models/schemas/user.schema');
const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');

// Import controllers
const getProfile = require('../controllers/user/profile.controller');

// Import validators
const updateProfileValidator = require('../validators/user/profile.validator');
const changePasswordValidator = require('../validators/user/password.validator');

// Configure multer for user uploads (e.g., profile pictures)
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, path.join(__dirname, '../uploads/users'));
  },
  filename: function(req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Not an image! Please upload an image.'), false);
    }
  },
  limits: {
    fileSize: 2 * 1024 * 1024 // 2MB limit
  }
});

// Get user profile
router.get('/profile', authenticate, getProfile);

// Update user profile
router.put('/profile',
  authenticate,
  upload.single('profilePicture'),
  updateProfileValidator,
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Fields that can be updated
      const updatableFields = ['username', 'phone', 'address'];
      
      // Update allowed fields
      updatableFields.forEach(field => {
        if (req.body[field] !== undefined) {
          user[field] = req.body[field];
        }
      });

      // Handle profile picture upload
      if (req.file) {
        user.profilePicture = `/uploads/users/${req.file.filename}`;
      }

      await user.save();

      // Return updated user without sensitive information
      const updatedUser = await User.findById(user._id)
        .select('-password -resetPasswordToken -resetPasswordExpire');

      res.json(updatedUser);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Change password
router.put('/change-password',
  authenticate,
  changePasswordValidator,
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { currentPassword, newPassword } = req.body;

      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Check current password
      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) {
        return res.status(401).json({ message: 'Current password is incorrect' });
      }

      // Update password
      user.password = newPassword;
      await user.save();

      res.json({ message: 'Password updated successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

module.exports = router; 