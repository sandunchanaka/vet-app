const jwt = require('jsonwebtoken');
const databaseConfig = require('../config/database');
const { AuthenticationError, AuthorizationError } = require('../utils/errors');
const logger = require('../utils/logger');

/**
 * Authentication middleware
 * Verifies JWT token and attaches user to request
 */
const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthenticationError('No token provided');
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database
    const prisma = databaseConfig.getClient();
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: {
        userType: true,
      },
    });

    if (!user) {
      throw new AuthenticationError('User not found');
    }

    if (!user.isActive) {
      throw new AuthenticationError('User account is inactive');
    }

    // Attach user to request
    req.user = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      userType: user.userType,
      userTypeId: user.userTypeId,
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token',
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired',
      });
    }

    logger.error('Authentication error:', error);
    next(error);
  }
};

/**
 * Authorization middleware
 * Checks if user has required role/permission
 */
const requireRole = (requiredRoles) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        throw new AuthenticationError('Authentication required');
      }

      const userRole = req.user.userType?.name?.toLowerCase();
      const allowedRoles = Array.isArray(requiredRoles) 
        ? requiredRoles.map(role => role.toLowerCase())
        : [requiredRoles.toLowerCase()];

      if (!allowedRoles.includes(userRole)) {
        throw new AuthorizationError('Insufficient permissions');
      }

      next();
    } catch (error) {
      logger.error('Authorization error:', error);
      next(error);
    }
  };
};

/**
 * Admin only middleware
 * Restricts access to admin users only
 */
const adminOnly = requireRole(['admin']);

/**
 * Staff or admin middleware
 * Allows access to staff and admin users
 */
const staffOrAdmin = requireRole(['admin', 'staff', 'veterinarian']);

/**
 * Optional authentication middleware
 * Attaches user if token is provided, but doesn't require it
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const prisma = databaseConfig.getClient();
        const user = await prisma.user.findUnique({
          where: { id: decoded.id },
          include: { userType: true },
        });

        if (user && user.isActive) {
          req.user = {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            userType: user.userType,
            userTypeId: user.userTypeId,
          };
        }
      } catch (tokenError) {
        // Token is invalid, but we don't throw an error for optional auth
        logger.warn('Invalid token in optional auth:', tokenError.message);
      }
    }

    next();
  } catch (error) {
    logger.error('Optional authentication error:', error);
    next(error);
  }
};

module.exports = {
  authMiddleware,
  requireRole,
  adminOnly,
  staffOrAdmin,
  optionalAuth,
};
