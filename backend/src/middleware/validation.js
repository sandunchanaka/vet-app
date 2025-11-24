const { validationResult } = require('express-validator');
const { ValidationError } = require('../utils/errors');
const logger = require('../utils/logger');

/**
 * Validation middleware
 * Processes validation results from express-validator
 */
const validationMiddleware = (req, res, next) => {
  try {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map(error => ({
        field: error.path || error.param,
        message: error.msg,
        value: error.value,
      }));

      logger.warn('Validation failed:', {
        errors: errorMessages,
        body: req.body,
        params: req.params,
        query: req.query,
      });

      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errorMessages,
      });
    }

    next();
  } catch (error) {
    logger.error('Validation middleware error:', error);
    next(error);
  }
};

/**
 * Custom validation middleware for specific business rules
 */
const customValidation = (validationFn) => {
  return (req, res, next) => {
    try {
      const result = validationFn(req);
      
      if (result && result.error) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          error: result.error,
        });
      }

      next();
    } catch (error) {
      logger.error('Custom validation error:', error);
      next(error);
    }
  };
};

/**
 * Sanitize input data
 * Removes potentially dangerous characters and normalizes data
 */
const sanitizeInput = (req, res, next) => {
  try {
    // Sanitize string inputs
    const sanitizeString = (str) => {
      if (typeof str !== 'string') return str;
      return str
        .trim()
        .replace(/[<>]/g, '') // Remove potential HTML tags
        .replace(/['"]/g, '') // Remove quotes
        .replace(/[;]/g, '') // Remove semicolons
        .substring(0, 1000); // Limit length
    };

    // Sanitize request body
    if (req.body) {
      Object.keys(req.body).forEach(key => {
        if (typeof req.body[key] === 'string') {
          req.body[key] = sanitizeString(req.body[key]);
        }
      });
    }

    // Sanitize query parameters
    if (req.query) {
      Object.keys(req.query).forEach(key => {
        if (typeof req.query[key] === 'string') {
          req.query[key] = sanitizeString(req.query[key]);
        }
      });
    }

    next();
  } catch (error) {
    logger.error('Input sanitization error:', error);
    next(error);
  }
};

/**
 * Validate file uploads
 */
const validateFileUpload = (options = {}) => {
  const {
    maxSize = 5 * 1024 * 1024, // 5MB default
    allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
    required = false,
  } = options;

  return (req, res, next) => {
    try {
      if (!req.file && required) {
        return res.status(400).json({
          success: false,
          message: 'File is required',
        });
      }

      if (req.file) {
        // Check file size
        if (req.file.size > maxSize) {
          return res.status(400).json({
            success: false,
            message: `File size must be less than ${maxSize / (1024 * 1024)}MB`,
          });
        }

        // Check file type
        if (!allowedTypes.includes(req.file.mimetype)) {
          return res.status(400).json({
            success: false,
            message: `File type not allowed. Allowed types: ${allowedTypes.join(', ')}`,
          });
        }
      }

      next();
    } catch (error) {
      logger.error('File validation error:', error);
      next(error);
    }
  };
};

/**
 * Validate pagination parameters
 */
const validatePagination = (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    // Validate page
    if (page < 1) {
      return res.status(400).json({
        success: false,
        message: 'Page must be a positive integer',
      });
    }

    // Validate limit
    if (limit < 1 || limit > 100) {
      return res.status(400).json({
        success: false,
        message: 'Limit must be between 1 and 100',
      });
    }

    // Set validated values
    req.pagination = {
      page,
      limit,
      offset: (page - 1) * limit,
    };

    next();
  } catch (error) {
    logger.error('Pagination validation error:', error);
    next(error);
  }
};

module.exports = {
  validationMiddleware,
  customValidation,
  sanitizeInput,
  validateFileUpload,
  validatePagination,
};
