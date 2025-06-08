const { body } = require('express-validator');

const updateProfileValidator = [
  body('username')
    .optional()
    .trim()
    .notEmpty().withMessage('Username cannot be empty')
    .isLength({ min: 3 }).withMessage('Username must be at least 3 characters long'),
  
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

module.exports = updateProfileValidator; 