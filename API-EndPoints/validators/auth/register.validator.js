const { body } = require('express-validator');

const registerValidator = [
  body('username')
    .trim()
    .notEmpty().withMessage('Username is required')
    .isLength({ min: 3 }).withMessage('Username must be at least 3 characters long'),
  
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please enter a valid email')
    .normalizeEmail(),
  
  body('password')
    .trim()
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  
  body('phone')
    .optional()
    .trim()
    .matches(/^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/)
    .withMessage('Please enter a valid phone number'),
  
  body('address.street')
    .optional()
    .trim()
    .notEmpty().withMessage('Street address cannot be empty'),
  
  body('address.city')
    .optional()
    .trim()
    .notEmpty().withMessage('City cannot be empty'),
  
  body('address.state')
    .optional()
    .trim()
    .notEmpty().withMessage('State cannot be empty'),
  
  body('address.zipCode')
    .optional()
    .trim()
    .matches(/^[0-9]{5}(-[0-9]{4})?$/).withMessage('Please enter a valid ZIP code'),
  
  body('address.country')
    .optional()
    .trim()
    .notEmpty().withMessage('Country cannot be empty')
];

module.exports = registerValidator; 