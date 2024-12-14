const express = require('express');
const { register, login } = require('../controllers/authController');
const { registerValidation, loginValidation } = require('../validations/userValidation');
const { validationResult } = require('express-validator');

const router = express.Router();

// Middleware for validation errors
const validate = (validations) => [
    validations,
    (req, res, next) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      next();
    },
  ];
  
  // Register route
  router.post('/register', validate(registerValidation), register);
  
  // Login route
  router.post('/login', validate(loginValidation), login);
  
  module.exports = router;