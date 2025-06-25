const express = require('express');
const router = express.Router();
const { authenticate, isAdmin } = require('../middleware/auth.middleware');
const User = require('../models/schemas/user.schema');

router.get('/', adminController.getAllUsers);
router.patch('/:id', adminController.updateUserRole);
router.get('/admins', [authenticate, isAdmin], async (req, res) => {
  try {
    const adminUsers = await User.find({ role: 'admin' })
      .select('-password -resetPasswordToken -resetPasswordExpires')
      .sort({ createdAt: -1 });

    res.json(adminUsers);
  } catch (error) {
    console.error('Error fetching admin users:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get admin user by ID (Admin only)
router.get('/:id', [authenticate, isAdmin], async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password -resetPasswordToken -resetPasswordExpires');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'This user is not an admin' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error fetching admin user:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;