const { body } = require('express-validator');

// User registration validation
exports.registerValidation = [
    body('email')
        .notEmpty().withMessage('Email is required')
        .isLength({ min: 3 }).withMessage('Email must be a valid email'),
    body('password')
        .notEmpty().withMessage('Password is required')
        .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
    body('tenantId')
        .notEmpty().withMessage('Tenant ID is required')
];

// User login validation
exports.loginValidation = [
    body('email')
        .notEmpty().withMessage('Email is required'),
    body('password')
        .notEmpty().withMessage('Password is required')
];