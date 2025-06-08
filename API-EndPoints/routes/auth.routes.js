const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/schemas/user.schema');
const { authenticate } = require('../middleware/auth.middleware');
const multer = require('multer');

// Import controllers
const registerController = require('../controllers/auth/register.controller');
const loginController = require('../controllers/auth/login.controller');
const registerAdminController = require('../controllers/auth/register-admin.controller');

// Import validators
const registerValidator = require('../validators/auth/register.validator');
const loginValidator = require('../validators/auth/login.validator');
const registerAdminValidator = require('../validators/auth/register-admin.validator');

// Configure multer for form data
const upload = multer();

// Register route
router.post('/register', 
  upload.none(), // Handle form data
  registerValidator,
  registerController
);

// Admin registration route
router.post('/register-admin',
  upload.none(),
  registerAdminValidator,
  registerAdminController
);

// Login route
router.post('/login',
  upload.none(), // Handle form data
  loginValidator,
  loginController
);

// Forgot password route
router.post('/forgot-password',
  upload.none(),
  [
    body('email')
      .trim()
      .notEmpty().withMessage('Email is required')
      .isEmail().withMessage('Please enter a valid email')
      .normalizeEmail()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email } = req.body;
      const user = await User.findOne({ email });

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Generate reset token
      const resetToken = jwt.sign(
        { id: user._id },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      // Save reset token to user
      user.resetPasswordToken = resetToken;
      user.resetPasswordExpire = Date.now() + 3600000; // 1 hour
      await user.save();

      // TODO: Send reset email
      
      res.json({ message: 'Password reset link sent to email' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Reset password route
router.put('/reset-password',
  upload.none(),
  [
    body('token').notEmpty().withMessage('Token is required'),
    body('password')
      .trim()
      .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { token, password } = req.body;

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Find user
      const user = await User.findOne({
        _id: decoded.id,
        resetPasswordToken: token,
        resetPasswordExpire: { $gt: Date.now() }
      });

      if (!user) {
        return res.status(400).json({ message: 'Invalid or expired reset token' });
      }

      // Update password
      user.password = password;
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();

      res.json({ message: 'Password reset successful' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

module.exports = router; 