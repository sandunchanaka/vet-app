const UserRepository = require('../repositories/UserRepository');
const logger = require('../utils/logger');
const { ValidationError, NotFoundError, ConflictError } = require('../utils/errors');

/**
 * User Service - Business logic for user operations
 */
class UserService {
  constructor(prisma) {
    this.userRepository = new UserRepository(prisma);
  }

  /**
   * Create a new user
   * @param {Object} userData - User data
   * @param {string} createdBy - ID of user creating this user
   * @returns {Promise<Object>} Created user
   */
  async createUser(userData, createdBy) {
    try {
      // Validate required fields
      this.validateUserData(userData);

      // Check if user already exists
      const existingUser = await this.userRepository.findByEmail(userData.email);
      if (existingUser) {
        throw new ConflictError('User with this email already exists');
      }

      // Create user
      const user = await this.userRepository.createUser({
        ...userData,
        createdById: createdBy,
      });

      // Remove sensitive data
      delete user.passwordHash;
      
      logger.info('User created successfully', { userId: user.id, email: user.email });
      return user;
    } catch (error) {
      logger.error('Error creating user:', error);
      throw error;
    }
  }

  /**
   * Get user by ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} User data
   */
  async getUserById(userId) {
    try {
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new NotFoundError('User not found');
      }

      // Remove sensitive data
      delete user.passwordHash;
      return user;
    } catch (error) {
      logger.error('Error getting user by ID:', error);
      throw error;
    }
  }

  /**
   * Get all users with pagination and filtering
   * @param {Object} filters - Filter criteria
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Users with pagination
   */
  async getUsers(filters = {}, options = {}) {
    try {
      const result = await this.userRepository.findAll(filters, options);
      
      // Remove sensitive data from all users
      result.data = result.data.map(user => {
        delete user.passwordHash;
        return user;
      });

      return result;
    } catch (error) {
      logger.error('Error getting users:', error);
      throw error;
    }
  }

  /**
   * Update user
   * @param {string} userId - User ID
   * @param {Object} updateData - Update data
   * @param {string} updatedBy - ID of user making the update
   * @returns {Promise<Object>} Updated user
   */
  async updateUser(userId, updateData, updatedBy) {
    try {
      // Check if user exists
      const existingUser = await this.userRepository.findById(userId);
      if (!existingUser) {
        throw new NotFoundError('User not found');
      }

      // Validate update data
      this.validateUpdateData(updateData);

      // Check email uniqueness if email is being updated
      if (updateData.email && updateData.email !== existingUser.email) {
        const emailExists = await this.userRepository.findByEmail(updateData.email);
        if (emailExists) {
          throw new ConflictError('Email already exists');
        }
      }

      // Update user
      const updatedUser = await this.userRepository.updateById(userId, {
        ...updateData,
        updatedById: updatedBy,
      });

      // Remove sensitive data
      delete updatedUser.passwordHash;
      
      logger.info('User updated successfully', { userId, updatedBy });
      return updatedUser;
    } catch (error) {
      logger.error('Error updating user:', error);
      throw error;
    }
  }

  /**
   * Delete user (soft delete)
   * @param {string} userId - User ID
   * @param {string} deletedBy - ID of user performing the deletion
   * @returns {Promise<Object>} Deleted user
   */
  async deleteUser(userId, deletedBy) {
    try {
      // Check if user exists
      const existingUser = await this.userRepository.findById(userId);
      if (!existingUser) {
        throw new NotFoundError('User not found');
      }

      // Soft delete user
      const deletedUser = await this.userRepository.softDeleteById(userId);
      
      logger.info('User deleted successfully', { userId, deletedBy });
      return deletedUser;
    } catch (error) {
      logger.error('Error deleting user:', error);
      throw error;
    }
  }

  /**
   * Change user password
   * @param {string} userId - User ID
   * @param {string} currentPassword - Current password
   * @param {string} newPassword - New password
   * @returns {Promise<Object>} Success message
   */
  async changePassword(userId, currentPassword, newPassword) {
    try {
      // Verify current password
      const isCurrentPasswordValid = await this.userRepository.verifyPassword(userId, currentPassword);
      if (!isCurrentPasswordValid) {
        throw new ValidationError('Current password is incorrect');
      }

      // Validate new password
      this.validatePassword(newPassword);

      // Update password
      await this.userRepository.updatePassword(userId, newPassword);
      
      logger.info('Password changed successfully', { userId });
      return { message: 'Password changed successfully' };
    } catch (error) {
      logger.error('Error changing password:', error);
      throw error;
    }
  }

  /**
   * Toggle user active status
   * @param {string} userId - User ID
   * @param {boolean} isActive - Active status
   * @param {string} updatedBy - ID of user making the update
   * @returns {Promise<Object>} Updated user
   */
  async toggleUserStatus(userId, isActive, updatedBy) {
    try {
      const updatedUser = await this.userRepository.updateById(userId, {
        isActive,
        updatedById: updatedBy,
      });

      logger.info('User status updated', { userId, isActive, updatedBy });
      return updatedUser;
    } catch (error) {
      logger.error('Error toggling user status:', error);
      throw error;
    }
  }

  /**
   * Get user statistics
   * @returns {Promise<Object>} User statistics
   */
  async getUserStats() {
    try {
      return await this.userRepository.getUserStats();
    } catch (error) {
      logger.error('Error getting user stats:', error);
      throw error;
    }
  }

  /**
   * Validate user data
   * @param {Object} userData - User data
   * @throws {ValidationError} If validation fails
   */
  validateUserData(userData) {
    const requiredFields = ['firstName', 'lastName', 'email', 'password', 'userTypeId'];
    
    for (const field of requiredFields) {
      if (!userData[field]) {
        throw new ValidationError(`${field} is required`);
      }
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userData.email)) {
      throw new ValidationError('Invalid email format');
    }

    // Validate password strength
    this.validatePassword(userData.password);
  }

  /**
   * Validate update data
   * @param {Object} updateData - Update data
   * @throws {ValidationError} If validation fails
   */
  validateUpdateData(updateData) {
    if (updateData.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(updateData.email)) {
        throw new ValidationError('Invalid email format');
      }
    }
  }

  /**
   * Validate password strength
   * @param {string} password - Password to validate
   * @throws {ValidationError} If password is weak
   */
  validatePassword(password) {
    if (password.length < 8) {
      throw new ValidationError('Password must be at least 8 characters long');
    }

    if (!/(?=.*[a-z])/.test(password)) {
      throw new ValidationError('Password must contain at least one lowercase letter');
    }

    if (!/(?=.*[A-Z])/.test(password)) {
      throw new ValidationError('Password must contain at least one uppercase letter');
    }

    if (!/(?=.*\d)/.test(password)) {
      throw new ValidationError('Password must contain at least one number');
    }
  }
}

module.exports = UserService;
