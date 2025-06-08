const { body } = require('express-validator');
const registerValidator = require('./register.validator');

const registerAdminValidator = [
  ...registerValidator,
  body('adminKey')
    .trim()
    .notEmpty().withMessage('Admin key is required')
];

module.exports = registerAdminValidator; 