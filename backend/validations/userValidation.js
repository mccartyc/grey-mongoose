const { body } = require('express-validator');

// User registration validation
exports.registerValidation = [
    body('username')
        .notEmpty().withMessage('Username is required')
        .isLength({ min: 3 }).withMessage('Username must be at least 3 characters long'),
    body('password')
        .notEmpty().withMessage('Password is required')
        .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
    body('tenantId')
        .notEmpty().withMessage('Tenant ID is required')
];

// User login validation
exports.loginValidation = [
    body('username')
        .notEmpty().withMessage('Username is required'),
    body('password')
        .notEmpty().withMessage('Password is required')
];